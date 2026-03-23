require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await pool.query(
      "select column_name, data_type from information_schema.columns where table_schema = 'public' and table_name = 'events' order by ordinal_position"
    );
    console.log(JSON.stringify(result.rows, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
