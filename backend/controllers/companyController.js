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
            select: { id: true, name: true }
        });

        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};
