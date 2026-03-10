const prisma = require('./prismaClient');

async function main() {
    const companyId = '527d6b60-4e04-4ad2-a97f-6622024eedbe'; // The one from my last debug

    const roles = await prisma.roles.findMany({
        where: { company_id: companyId },
        select: {
            id: true,
            name: true,
            role_features: {
                select: { feature: { select: { id: true, code: true, name: true } } }
            }
        }
    });

    const result = roles.map(r => ({
        id: r.id,
        name: r.name,
        features: r.role_features.map(rf => rf.feature)
    }));

    console.log("Roles fetched:", result.length);
    console.log(JSON.stringify(result, null, 2));
}

main().finally(() => prisma.$disconnect());
