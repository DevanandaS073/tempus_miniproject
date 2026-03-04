const prisma = require('../prismaClient');

async function main() {
    console.log('Seeding baseline features into the database...');

    const baseFeatures = [
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

        // 3. Network & Directory
        { code: 'network:view', name: 'View Directory' },
        { code: 'network:invite_user', name: 'Send Invites' },
        { code: 'network:remove_user', name: 'Remove Users' },

        // 4. Admin Settings & Role Management
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

    for (const feature of baseFeatures) {
        await prisma.features.upsert({
            where: { code: feature.code },
            update: {},
            create: feature,
        });
    }

    console.log('Features seeded successfully. Checking for Admin roles missing the network feature...');

    // Retroactively patch existing admins who are currently locked out of the network tab
    const networkFeature = await prisma.features.findUnique({ where: { code: 'network:view' } });

    if (networkFeature) {
        const adminRoles = await prisma.roles.findMany({ where: { name: 'admin' } });
        let counter = 0;
        for (const role of adminRoles) {
            try {
                await prisma.role_features.create({
                    data: {
                        role_id: role.id,
                        feature_id: networkFeature.id
                    }
                });
                counter++;
            } catch (e) {
                // Ignore P2002 unique constraint errors (they already have it)
            }
        }
        console.log(`Retroactively granted Network tab access to ${counter} existing Admin roles.`);
    }

    console.log('Database preparation complete.');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
