const { Pool } = require('pg');
require('dotenv').config({ path: 'frontend/.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
        res.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
        await pool.end();
    } catch (e) {
        console.error(e);
    }
}
check();
