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
                role: {
                    select: {
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

module.exports = {
    getCompanyUsers
};
