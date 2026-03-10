const prisma = require('../prismaClient');

async function ensureDefaultTemplates() {
    console.log('Checking for default templates...');

    try {
        // 1. Ensure a default poster template exists (ID 1)
        const posterTemplate = await prisma.poster_templates.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1, // Explicitly set ID to 1 as expected by the controller
                name: 'Default Modern Poster',
                event_type: 'General',
                file_path: '/templates/default_poster.png',
                is_active: true
            }
        });
        console.log(`Verified poster template: ${posterTemplate.name} (ID: ${posterTemplate.id})`);

        // 2. Ensure a default certificate template exists (ID 1)
        const certTemplate = await prisma.certificate_templates.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1, // Explicitly set ID to 1 as expected by the worker
                name: 'Default Completion Certificate',
                event_type: 'General',
                file_path: '/templates/default_cert.png',
                is_active: true
            }
        });
        console.log(`Verified certificate template: ${certTemplate.name} (ID: ${certTemplate.id})`);

        console.log('Templates are ready!');
    } catch (error) {
        console.error('Error ensuring templates:', error);
    }
}

ensureDefaultTemplates().finally(() => prisma.$disconnect());
