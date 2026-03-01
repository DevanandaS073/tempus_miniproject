const prisma = require('./prismaClient');

async function fix() {
    const admin = await prisma.roles.create({ data: { name: 'admin' } });
    const user = await prisma.roles.create({ data: { name: 'user' } });
    console.log('Roles created:', admin.id, user.id);

    const allFeatures = await prisma.features.findMany();

    const adminLinks = allFeatures.map(f => ({ role_id: admin.id, feature_id: f.id }));
    await prisma.role_features.createMany({ data: adminLinks });

    console.log('Admin features linked');
}

fix()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    });
