const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// ─── Redis Connection ───────────────────────────────────────────────────────
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null // Required by BullMQ
});

// ─── Media Queue ────────────────────────────────────────────────────────────
// A single queue handling all AI media generation jobs (posters + certificates)
const mediaQueue = new Queue('tempus-media', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: { count: 100 },  // Keep last 100 completed jobs for debugging
        removeOnFail: { count: 50 }        // Keep last 50 failed jobs
    }
});

module.exports = { mediaQueue, redisConnection };
