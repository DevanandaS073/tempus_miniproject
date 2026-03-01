const prisma = require('./prismaClient');

async function enforceAdminRole() {
    try {
        console.log("Checking for 'Admin' role in database...");
        let adminRole = await prisma.roles.findFirst({
            where: { name: { equals: 'admin', mode: 'insensitive' } }
        });

        if (!adminRole) {
            console.error("No 'Admin' role found in the database. Creating a default Admin role...");
            // Find a company to attach it to, ideally the first one
            const firstCompany = await prisma.companies.findFirst();
            if (!firstCompany) throw new Error("No companies exist in the database!");

            adminRole = await prisma.roles.create({
                data: {
                    name: 'Admin',
                    company_id: firstCompany.id,
                    tier: 1
                }
            });
        }

        console.log(`Admin Role ID found: ${adminRole.id}`);

        // Update James Gunn specifically, or any user containing 'james' or 'gunn' or with company_id matching
        const users = await prisma.users.findMany({
            where: { company_id: adminRole.company_id } // Just update everyone in the first test company to Admin for testing
        });

        for (const user of users) {
            await prisma.users.update({
                where: { id: user.id },
                data: { role_id: adminRole.id }
            });
            console.log(`✅ Updated user ${user.email} -> Set Role to '${adminRole.name}'`);
        }

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

enforceAdminRole();
