const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function verifySchema() {
    try {
        await client.connect();
        console.log('Connected to DB.');

        // Check for Role enum
        const enumRes = await client.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'Role';
    `);
        console.log('Enum values for Role:', enumRes.rows.map(r => r.enumlabel));

        // Check for role column in users table
        const colRes = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'role';
    `);
        console.log('Role column definition:', colRes.rows[0]);

        await client.end();
    } catch (err) {
        console.error('Verification error:', err);
    }
}

verifySchema();
