const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
require('dotenv').config();

// Connect to Redis using the URL from .env
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

// We connect to the exact same queue the backend uses
const testQueue = new Queue('tempus-media', { connection: redisConnection });

async function runTest() {
    console.log('🤖 --- AUTOMATED CERTIFICATE TEST --- 🤖');
    console.log('We are going to schedule a certificate generation job for Event ID #1.');
    console.log('It will be "delayed" for exactly 5 seconds, imitating an event ending in 5 seconds.\n');

    // 1. Add the delayed job
    const job = await testQueue.add(
        'generate-certificates',
        { event_id: 1 },
        { delay: 5000 } // 5 second delay
    );

    console.log(`✅ Job ID ${job.id} successfully queued!`);
    console.log(`⏳ The queue is now sleeping for 5 seconds...`);

    // We don't want to process it here; your actively running `nodemon` server 
    // already has `mediaWorker.js` listening!

    // We just wait 6 seconds and then check the database
    setTimeout(async () => {
        console.log('\n🔔 5 seconds have passed! Your background node server should have just woken up and processed it.');
        console.log('Check your terminal running "npm run dev" or "nodemon server.js" for the [MediaWorker] logs!');
        console.log('\nYou can also look in your Postgres database (or the terminal) to verify it created a row in the `generated_certificates` table.');

        await redisConnection.quit();
        process.exit(0);
    }, 6000);
}

runTest().catch(console.error);
