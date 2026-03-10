const eventsController = require('./controllers/eventsController');

async function debugSetup() {
    const req = {
        params: { id: '1' },
        body: { template_id: 1 },
        user: { company_id: '527d6b60-4e04-4ad2-a97f-6622024eedbe' } // From earlier successful DB searches
    };

    const res = {
        status: (code) => {
            console.log(`Status set to: ${code}`);
            return res;
        },
        json: (data) => {
            console.log('Response JSON:', data);
        }
    };

    try {
        await eventsController.setupAutoCertificates(req, res);
    } catch (err) {
        console.error('UNCAUGHT ERROR:', err);
    }
}

debugSetup();
