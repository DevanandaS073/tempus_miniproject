const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const prisma = require('../prismaClient');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ─── Redis Connection (separate from queue producer) ────────────────────────
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

// ─── Job Handlers ───────────────────────────────────────────────────────────

async function handleGeneratePoster(job) {
    const { event_id, template_id } = job.data;
    console.log(`[MediaWorker] Generating poster for event ${event_id}...`);

    try {
        // Update status to show processing
        await prisma.generated_posters.updateMany({
            where: { event_id, status: 'pending' },
            data: { status: 'completed' }
        });

        // TODO: Replace with actual AI generation logic
        // 1. Fetch event details from DB
        // 2. Call OpenAI / DALL-E API
        // 3. Save the generated image to disk or cloud storage
        // 4. Update the `poster_path` in the database

        console.log(`[MediaWorker] Poster generation complete for event ${event_id}`);
        return { success: true, event_id };
    } catch (error) {
        console.error(`[MediaWorker] Poster generation failed for event ${event_id}:`, error);
        throw error; // BullMQ will retry based on the queue config
    }
}

async function handleGenerateCertificates(job) {
    const { event_id } = job.data;
    console.log(`[MediaWorker] Generating certificates for event ${event_id}...`);

    try {
        // 1. Fetch all participants who joined the event
        const participants = await prisma.event_participants.findMany({
            where: { event_id, status: 'registered' },
            include: {
                user: { select: { id: true, first_name: true, last_name: true, email: true } },
                event: { select: { title: true, event_type: true, start_date: true, end_date: true, certificate_template_id: true } }
            }
        });

        if (participants.length === 0) {
            console.log(`[MediaWorker] No participants found for event ${event_id}. Skipping.`);
            return { success: true, event_id, certificates_generated: 0 };
        }

        // 2. Determine which template to use
        const eventData = participants[0].event;
        const templateIdToUse = eventData.certificate_template_id || 1; // Fallback to 1 if none set

        const template = await prisma.certificate_templates.findUnique({
            where: { id: templateIdToUse }
        });

        if (!template) {
            console.log(`[MediaWorker] Template ${templateIdToUse} not found for event ${event_id}. Skipping.`);
            return { success: false, event_id, reason: 'Template not found' };
        }

        // 3. Generate a certificate for each participant
        let generated = 0;
        for (const participant of participants) {
            // TODO: Replace with actual AI certificate generation
            // 1. Load template
            // 2. Fill in participant name, event title, dates
            // 3. Generate PDF/image via AI
            // 4. Save to disk or cloud storage

            const certificatePath = `/certificates/event-${event_id}/cert-${participant.user.id}.pdf`;

            await prisma.generated_certificates.create({
                data: {
                    participant_id: participant.id,
                    template_id: template.id,
                    event_id: event_id,
                    certificate_path: certificatePath,
                    status: 'completed'
                }
            });
            generated++;

            // Report progress to BullMQ
            await job.updateProgress(Math.round((generated / participants.length) * 100));
        }

        console.log(`[MediaWorker] Generated ${generated} certificates for event ${event_id}`);
        return { success: true, event_id, certificates_generated: generated };
    } catch (error) {
        console.error(`[MediaWorker] Certificate generation failed for event ${event_id}:`, error);
        throw error;
    }
}

// ─── Worker Definition ──────────────────────────────────────────────────────
const mediaWorker = new Worker(
    'tempus-media',
    async (job) => {
        switch (job.name) {
            case 'generate-poster':
                return handleGeneratePoster(job);
            case 'generate-certificates':
                return handleGenerateCertificates(job);
            default:
                throw new Error(`Unknown job type: ${job.name}`);
        }
    },
    {
        connection: redisConnection,
        concurrency: 2 // Process 2 jobs simultaneously
    }
);

// ─── Worker Event Listeners ─────────────────────────────────────────────────
mediaWorker.on('completed', (job) => {
    console.log(`[MediaWorker] Job ${job.id} (${job.name}) completed successfully.`);
});

mediaWorker.on('failed', (job, err) => {
    console.error(`[MediaWorker] Job ${job?.id} (${job?.name}) failed: ${err.message}`);
});

mediaWorker.on('error', (err) => {
    console.error('[MediaWorker] Worker error:', err);
});

console.log('[MediaWorker] Media worker started and listening for jobs...');

module.exports = mediaWorker;
