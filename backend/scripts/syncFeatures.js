const prisma = require('../prismaClient');

const foundationalFeatures = [
    // 1. Calendar & Meetings
    { code: 'calendar:view', name: 'View Calendar' },
    { code: 'meeting:create', name: 'Schedule Meetings' },
    { code: 'meeting:edit_own', name: 'Edit Own Meetings' },
    { code: 'meeting:edit_any', name: 'Edit Any Meeting' },
    { code: 'meeting:delete_own', name: 'Cancel Own Meetings' },
    { code: 'meeting:delete_any', name: 'Cancel Any Meeting' },

    // 2. Events & Operations
    { code: 'event:view', name: 'View Operations' },
    { code: 'event:join', name: 'RSVP to Events' },
    { code: 'event:create', name: 'Create Operations' },
    { code: 'event:edit', name: 'Edit Operations' },
    { code: 'event:delete', name: 'Cancel Operations' },
    { code: 'event:generate_poster', name: 'Generate AI Posters' },
    { code: 'event:generate_certificates', name: 'Generate Certificates' },

    // 3. Network & Directory
    { code: 'network:view', name: 'View Directory' },
    { code: 'network:invite_user', name: 'Send Invites' },
    { code: 'network:remove_user', name: 'Remove Users' },

    // 4. Admin Settings & Identity
    { code: 'admin:view_settings', name: 'Access Settings' },
    { code: 'role:create', name: 'Create Custom Roles' },
    { code: 'role:edit', name: 'Edit Custom Roles' },
    { code: 'role:delete', name: 'Delete Custom Roles' },
    { code: 'role:assign', name: 'Promote/Demote Users' },
    { code: 'company:update_info', name: 'Modify Identity' },

    // 5. Reports & Analytics
    { code: 'reports:personal', name: 'View Personal Stats' },
    { code: 'reports:company', name: 'View Global Stats' },
    { code: 'reports:export', name: 'Export Analytics' }
];

async function main() {
    console.log('Syncing features...');
    for (const feature of foundationalFeatures) {
        await prisma.features.upsert({
            where: { code: feature.code },
            update: { name: feature.name },
            create: { code: feature.code, name: feature.name }
        });
    }

    const dbFeatures = await prisma.features.findMany();
    console.log(`There are now ${dbFeatures.length} features in the DB.`);

    // Give all features to existing 'admin' roles
    const adminRoles = await prisma.roles.findMany({
        where: { name: 'admin' },
        include: { role_features: true }
    });

    console.log(`Found ${adminRoles.length} admin roles. Syncing their features...`);

    for (const role of adminRoles) {
        const existingFeatureIds = new Set(role.role_features.map(rf => rf.feature_id));
        const missingFeatures = dbFeatures.filter(f => !existingFeatureIds.has(f.id));

        if (missingFeatures.length > 0) {
            await prisma.role_features.createMany({
                data: missingFeatures.map(f => ({
                    role_id: role.id,
                    feature_id: f.id
                }))
            });
            console.log(`Added ${missingFeatures.length} missing features to admin role in company ${role.company_id}`);
        }
    }

    console.log('Feature sync complete.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
