const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testEndpoint() {
    // 1. Generate a dummy token to bypass auth (must match an admin user in your local db)
    // We'll use ID 1, company 527d6b60-4e04-4ad2-a97f-6622024eedbe (based on previous logs)
    const token = jwt.sign(
        {
            id: 1,
            company_id: '527d6b60-4e04-4ad2-a97f-6622024eedbe',
            features: ['event:create', 'event:view', 'event:generate_poster', 'event:generate_certificates']
        },
        process.env.JWT_SECRET || 'temporary_secret_for_tests'
    );

    try {
        console.log('Testing POST /api/events/1/media/setup-certificates');
        const res = await fetch('http://localhost:3000/api/events/1/media/setup-certificates', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ template_id: 1 })
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Response Body: ${text}`);
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

testEndpoint();
