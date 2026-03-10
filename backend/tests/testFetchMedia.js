const prisma = require('./prismaClient');

async function testFetchMedia() {
    try {
        const events = await prisma.events.findMany({ take: 1 });
        if (events.length === 0) {
            console.log('No events found');
            return;
        }
        const eventId = events[0].event_id;
        const companyId = events[0].company_id;

        console.log(`Testing with event ${eventId} in company ${companyId}`);

        const event = await prisma.events.findFirst({
            where: { event_id: eventId, company_id: companyId }
        });
        console.log('Event found:', !!event);

        const posters = await prisma.generated_posters.findMany({
            where: { event_id: eventId },
            orderBy: { generated_at: 'desc' }
        });
        console.log('Posters fetched:', posters.length);

        const certificates = await prisma.generated_certificates.findMany({
            where: { event_id: eventId },
            include: {
                participant: {
                    include: {
                        user: { select: { id: true, first_name: true, last_name: true, email: true } }
                    }
                }
            },
            orderBy: { generated_at: 'desc' }
        });
        console.log('Certificates fetched:', certificates.length);

        console.log('Success, response would be:', {
            posters,
            certificates,
            has_poster: posters.length > 0,
            has_certificates: certificates.length > 0,
            poster_status: posters[0]?.status || null,
            certificates_count: certificates.length
        });
    } catch (err) {
        console.error('ERROR:', err);
    }
}

testFetchMedia().finally(() => prisma.$disconnect());
