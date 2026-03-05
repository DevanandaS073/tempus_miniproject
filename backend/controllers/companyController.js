const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');

exports.createCompany = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id; // From authenticateToken middleware
        console.log("Hello")

        if (!name) {
            return res.status(400).json({ error: 'Company name is required' });
        }

        // 1. Generate a URL-friendly subdomain
        const baseSubdomain = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        let subdomain = baseSubdomain;
        let counter = 1;

        while (await prisma.companies.findUnique({ where: { subdomain } })) {
            subdomain = `${baseSubdomain}-${counter}`;
            counter++;
        }

        // 2. Wrap everything in a transaction to ensure we don't end up with orphaned records
        const result = await prisma.$transaction(async (tx) => {
            // A. Create the Company
            const newCompany = await tx.companies.create({
                data: {
                    name,
                    subdomain
                }
            });

            // B. Set up RBAC for the new company
            const allFeatures = await tx.features.findMany();

            const adminRole = await tx.roles.create({
                data: {
                    name: 'admin',
                    company_id: newCompany.id,
                    role_features: {
                        create: allFeatures.map(f => ({ feature_id: f.id }))
                    }
                }
            });

            // Create default roles for future invites
            await tx.roles.createMany({
                data: [
                    { name: 'manager', company_id: newCompany.id },
                    { name: 'worker', company_id: newCompany.id }
                ]
            });

            // C. Assign the current Free Agent to this Company as an Admin
            const updatedUser = await tx.users.update({
                where: { id: userId },
                data: {
                    company_id: newCompany.id,
                    role_id: adminRole.id
                },
                include: {
                    role: {
                        include: {
                            role_features: {
                                include: { feature: true }
                            }
                        }
                    }
                }
            });

            return { company: newCompany, user: updatedUser };
        });

        // 3. Generate a fresh JWT since their company_id and permissions just changed
        const permissions = (result.user.role && result.user.role.role_features)
            ? result.user.role.role_features.map(rf => rf.feature.code)
            : [];

        const token = jwt.sign(
            {
                id: result.user.id,
                email: result.user.email,
                company_id: result.user.company_id,
                role: result.user.role?.name,
                permissions
            },
            process.env.JWT_SECRET || 'tempus-secret-key',
            { expiresIn: '12h' }
        );

        res.status(201).json({
            message: 'Company created successfully',
            company: result.company,
            token, // Provide the new token
            user: {
                id: result.user.id,
                email: result.user.email,
                first_name: result.user.first_name,
                last_name: result.user.last_name,
                company_id: result.user.company_id,
                role: result.user.role?.name,
                permissions
            }
        });

    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ error: 'Failed to create company', details: error.message, stack: error.stack });
    }
};

exports.getRoles = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        if (!companyId) return res.status(403).json({ error: 'User is not part of a company' });

        const roles = await prisma.roles.findMany({
            where: { company_id: companyId },
            select: {
                id: true,
                name: true,
                role_features: {
                    select: {
                        feature: { select: { id: true, code: true, name: true } }
                    }
                }
            }
        });

        // Flatten features for cleaner API response
        const result = roles.map(r => ({
            id: r.id,
            name: r.name,
            features: r.role_features.map(rf => rf.feature)
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

// ─── GET /api/companies/roles/:id ───────────────────────────────────────────
exports.getRoleById = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const roleId = req.params.id;

        if (!companyId) return res.status(403).json({ error: 'User is not part of a company' });

        const role = await prisma.roles.findFirst({
            where: { id: roleId, company_id: companyId },
            include: {
                role_features: {
                    include: { feature: { select: { id: true, code: true, name: true } } }
                }
            }
        });

        if (!role) return res.status(404).json({ error: 'Role not found in your company' });

        res.json({
            id: role.id,
            name: role.name,
            features: role.role_features.map(rf => rf.feature)
        });
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({ error: 'Failed to fetch role' });
    }
};

// ─── POST /api/companies/roles ──────────────────────────────────────────────
exports.createRole = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const { name, features } = req.body;

        if (!companyId) return res.status(403).json({ error: 'User is not part of a company' });
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'Role name is required' });
        }
        if (!features || !Array.isArray(features) || features.length === 0) {
            return res.status(400).json({ error: 'At least one feature must be assigned' });
        }

        // Check for duplicate role name within the same company
        const existing = await prisma.roles.findFirst({
            where: { name: name.trim().toLowerCase(), company_id: companyId }
        });
        if (existing) {
            return res.status(409).json({ error: `A role named "${name}" already exists in your company` });
        }

        // Look up the feature IDs from the provided codes
        const featureRecords = await prisma.features.findMany({
            where: { code: { in: features } }
        });

        if (featureRecords.length !== features.length) {
            const found = featureRecords.map(f => f.code);
            const invalid = features.filter(f => !found.includes(f));
            return res.status(400).json({ error: 'Invalid feature codes', invalid });
        }

        // Atomic transaction: create role + link features
        const newRole = await prisma.$transaction(async (tx) => {
            const role = await tx.roles.create({
                data: {
                    name: name.trim().toLowerCase(),
                    company_id: companyId,
                    role_features: {
                        create: featureRecords.map(f => ({ feature_id: f.id }))
                    }
                },
                include: {
                    role_features: {
                        include: { feature: { select: { id: true, code: true, name: true } } }
                    }
                }
            });
            return role;
        });

        res.status(201).json({
            id: newRole.id,
            name: newRole.name,
            features: newRole.role_features.map(rf => rf.feature)
        });
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Failed to create role', details: error.message });
    }
};

// ─── PUT /api/companies/roles/:id ───────────────────────────────────────────
exports.updateRole = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const roleId = req.params.id;
        const { name, features } = req.body;

        if (!companyId) return res.status(403).json({ error: 'User is not part of a company' });

        // Verify role exists and belongs to this company
        const existingRole = await prisma.roles.findFirst({
            where: { id: roleId, company_id: companyId }
        });
        if (!existingRole) return res.status(404).json({ error: 'Role not found in your company' });

        // Block editing of the foundational admin role
        if (existingRole.name === 'admin') {
            return res.status(403).json({ error: 'The foundational Admin role cannot be modified' });
        }

        if (!features || !Array.isArray(features) || features.length === 0) {
            return res.status(400).json({ error: 'At least one feature must be assigned' });
        }

        // Look up the feature IDs from the provided codes
        const featureRecords = await prisma.features.findMany({
            where: { code: { in: features } }
        });

        if (featureRecords.length !== features.length) {
            const found = featureRecords.map(f => f.code);
            const invalid = features.filter(f => !found.includes(f));
            return res.status(400).json({ error: 'Invalid feature codes', invalid });
        }

        // Atomic transaction: update name + wipe old features + insert new features
        const updatedRole = await prisma.$transaction(async (tx) => {
            // Update role name if provided
            if (name && typeof name === 'string' && name.trim()) {
                await tx.roles.update({
                    where: { id: roleId },
                    data: { name: name.trim().toLowerCase() }
                });
            }

            // Wipe all old feature mappings
            await tx.role_features.deleteMany({ where: { role_id: roleId } });

            // Insert new feature mappings
            await tx.role_features.createMany({
                data: featureRecords.map(f => ({ role_id: roleId, feature_id: f.id }))
            });

            // Return the updated role with features
            return tx.roles.findFirst({
                where: { id: roleId },
                include: {
                    role_features: {
                        include: { feature: { select: { id: true, code: true, name: true } } }
                    }
                }
            });
        });

        res.json({
            id: updatedRole.id,
            name: updatedRole.name,
            features: updatedRole.role_features.map(rf => rf.feature)
        });
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ error: 'Failed to update role', details: error.message });
    }
};

// ─── DELETE /api/companies/roles/:id ────────────────────────────────────────
exports.deleteRole = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const roleId = req.params.id;

        if (!companyId) return res.status(403).json({ error: 'User is not part of a company' });

        // Verify role exists and belongs to this company
        const existingRole = await prisma.roles.findFirst({
            where: { id: roleId, company_id: companyId }
        });
        if (!existingRole) return res.status(404).json({ error: 'Role not found in your company' });

        // Block deletion of the foundational admin role
        if (existingRole.name === 'admin') {
            return res.status(403).json({ error: 'The foundational Admin role cannot be deleted' });
        }

        // Check if any users are currently assigned to this role
        const usersWithRole = await prisma.users.count({
            where: { role_id: roleId, company_id: companyId }
        });
        if (usersWithRole > 0) {
            return res.status(409).json({
                error: `Cannot delete role "${existingRole.name}" — ${usersWithRole} user(s) are still assigned to it. Reassign them first.`
            });
        }

        // Atomic transaction: delete feature mappings + delete role
        await prisma.$transaction(async (tx) => {
            await tx.role_features.deleteMany({ where: { role_id: roleId } });
            await tx.roles.delete({ where: { id: roleId } });
        });

        res.json({ message: `Role "${existingRole.name}" deleted successfully` });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ error: 'Failed to delete role', details: error.message });
    }
};
