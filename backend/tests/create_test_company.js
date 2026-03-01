const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['info', 'error'] });

async function main() {
    console.log('Testing Database Insert => companies table');
    const newCompany = await prisma.companies.create({
        data: {
            name: 'Tempus Works Proof of Concept',
            subdomain: 'tempus-poc-' + Date.now()
        }
    });

    console.log('✅ INSERT SUCCESSFUL:');
    console.log(newCompany);
}

main()
    .catch((e) => {
        console.error('Error inserting row:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
