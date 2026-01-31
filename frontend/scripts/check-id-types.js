
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkIdTypes() {
    console.log('🔍 Checking ID types for search tables...');
    try {
        const res = await pool.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_name IN ('searches', 'job_searches')
    `);
        console.log('--- TABLES ---');
        console.log(res.rows);

        const res2 = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('searches', 'job_searches') AND column_name = 'id'
    `);
        console.log('--- COLUMNS ---');
        console.log(res2.rows);
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

checkIdTypes();
