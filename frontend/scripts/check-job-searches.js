
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkJobSearchesCols() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'job_searches'
    `);
        console.log('Columns in job_searches:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

checkJobSearchesCols();
