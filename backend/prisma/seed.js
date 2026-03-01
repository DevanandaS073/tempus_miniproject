const prisma = require('../prismaClient');

async function main() {
    const features = [
        { code: 'F_VIEW_DASHBOARD', name: 'View Dashboard' },
        { code: 'F_MANAGE_TEAM', name: 'Manage Team & Roles' },
        { code: 'F_VIEW_CALENDAR', name: 'View Full Calendar' },
        { code: 'F_CREATE_EVENT', name: 'Create Events' },
        { code: 'F_CREATE_MEETING', name: 'Schedule Meetings' },
        { code: 'F_DELETE_EVENT', name: 'Delete Events' },
        { code: 'F_GENERATE_POSTER', name: 'Generate Event Posters' },
        { code: 'F_ISSUE_CERTIFICATES', name: 'Issue Certificates' },
        { code: 'F_VIEW_AUTOMATION', name: 'Access Automation Tab' },
        { code: 'F_VIEW_REPORTS', name: 'Access Reports Tab' },
    ];

    console.log('--- Initializing Global RBAC Features ---');
    for (const f of features) {
        await prisma.features.upsert({
            where: { code: f.code },
            update: {},
            create: f,
        });
        console.log(`Verified feature: ${f.code}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
