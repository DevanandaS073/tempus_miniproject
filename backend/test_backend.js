
require('dotenv').config();
const express = require('express');
const prisma = require('./prismaClient');

const app = express();

app.use(express.json());
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/events', require('./routes/events'));

const PORT = 3001;

const start = async () => {
    try {
        // 1. Setup Test Data (User)
        let user = await prisma.users.findFirst({ where: { email: 'test@tempus.com' } });
        if (!user) {
            user = await prisma.users.create({
                data: {
                    name: 'Test User',
                    email: 'test@tempus.com',
                    password_hash: 'hashed_password',
                    role: 'WORKER'
                }
            });
            console.log('✅ Created Test User:', user.id);
        } else {
            console.log('ℹ️ Using Existing Test User:', user.id);
        }

        // 2. Start Server
        const server = app.listen(PORT, async () => {
            console.log(`🚀 Test Server running on port ${PORT}`);
            await runTests(user.id);
            server.close(); // Clean exit
            await prisma.$disconnect();
            process.exit(0);
        });

    } catch (e) {
        console.error('❌ Setup Error:', e);
        process.exit(1);
    }
};

const runTests = async (userId) => {
    const baseURL = `http://localhost:${PORT}`;

    // Helper for fetch
    const post = async (url, body) => {
        const res = await fetch(baseURL + url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return res.json();
    };

    const get = async (url) => {
        const res = await fetch(baseURL + url);
        return res.json();
    };

    console.log('\n--- 🧪 Testing Calendar API ---');

    // Test 1: Create Meeting
    console.log('1. Creating Meeting...');
    // Use a random future time to avoid collisions during repeated tests
    const randomOffset = Math.floor(Math.random() * 100000000);
    const start = new Date(Date.now() + randomOffset);
    const end = new Date(start.getTime() + 3600000); // +1 hour

    const meeting = await post('/api/calendar/meetings', {
        title: 'Team Sync ' + Math.floor(Math.random() * 1000),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        user_id: userId
    });
    console.log('   Response:', meeting.meeting_id ? '✅ Created' : '❌ Failed', meeting);

    // Test 2: Get Meetings
    console.log('2. Fetching Meetings...');
    const meetings = await get(`/api/calendar/meetings?user_id=${userId}`);
    console.log('   Response:', Array.isArray(meetings) ? `✅ Got ${meetings.length} meetings` : '❌ Failed', meetings);

    console.log('\n--- 🧪 Testing Events API ---');

    // Test 3: Create Event (Mocking Manager)
    console.log('3. Creating Public Event...');
    const event = await post('/api/events', {
        title: 'Tech Talk ' + Math.floor(Math.random() * 1000),
        event_type: 'Seminar',
        start_date: new Date(Date.now() + 86400000 + randomOffset).toISOString(), // +1 day
        end_date: new Date(Date.now() + 90000000 + randomOffset).toISOString(),
        created_by: userId
    });
    console.log('   Response:', event.event_id ? '✅ Created' : '❌ Failed', event);

    // Test 4: Fetching Public Events
    console.log('4. Fetching Public Events...');
    const events = await get('/api/events');
    console.log('   Response:', Array.isArray(events) ? `✅ Got ${events.length} events` : '❌ Failed', events);

    console.log('\n✅ All Tests Completed!');
};

start();
