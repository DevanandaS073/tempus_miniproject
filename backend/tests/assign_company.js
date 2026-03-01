const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching admin role...');
    const adminRole = await prisma.role.findFirst({ where: { role_name: 'admin' } });

    if (!adminRole) {
        console.log('Error: Admin role not found.');
        return;
    }

    console.log('Creating dummy company Tempus Global...');
    const company = await prisma.company.create({
        data: {
            name: 'Tempus Global Incorporated',
            subdomain: 'tempus-global'
        }
    });
    console.log('Company created successfully with ID:', company.id);

    console.log('Assigning you as the Workspace Owner...');
    const updatedUser = await prisma.user.updateMany({
        data: {
            company_id: company.id,
            role_id: adminRole.id
        }
    });

    console.log(`Success! Updated ${updatedUser.count} users.`);
    console.log('Please log out and log back in to access the Dashboard.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
