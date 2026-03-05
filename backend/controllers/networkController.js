const prisma = require('../prismaClient');

const getCompanyUsers = async (req, res) => {
    try {
        const companyId = req.user.company_id;

        if (!companyId) {
            return res.status(403).json({ error: 'User does not belong to a workspace.' });
        }

        const users = await prisma.users.findMany({
            where: {
                company_id: companyId
            },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                role_id: true,
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                created_at: true
            },
            orderBy: {
                created_at: 'asc'
            }
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching company users:', error);
        res.status(500).json({ error: 'Failed to fetch network directory.' });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        const targetUserId = parseInt(req.params.id);
        const { role_id } = req.body;

        if (!companyId) {
            return res.status(403).json({ error: 'User does not belong to a workspace.' });
        }
        if (!role_id) {
            return res.status(400).json({ error: 'role_id is required' });
        }

        // Verify target user belongs to the same company (tenant isolation)
        const targetUser = await prisma.users.findFirst({
            where: { id: targetUserId, company_id: companyId }
        });
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found in your workspace' });
        }

        // Verify the role belongs to the same company
        const targetRole = await prisma.roles.findFirst({
            where: { id: role_id, company_id: companyId }
        });
        if (!targetRole) {
            return res.status(404).json({ error: 'Role not found in your workspace' });
        }

        // Prevent demoting yourself from admin
        if (targetUserId === req.user.id) {
            return res.status(403).json({ error: 'You cannot change your own role' });
        }

        const updatedUser = await prisma.users.update({
            where: { id: targetUserId },
            data: { role_id: role_id },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                role_id: true,
                role: { select: { id: true, name: true } }
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
};

module.exports = {
    getCompanyUsers,
    updateUserRole
};
