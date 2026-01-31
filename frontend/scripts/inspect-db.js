
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkEverything() {
    console.log('🧐 Final Database Inspection...');
    try {
        const tables = await pool.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('ALL TABLES:', JSON.stringify(tables.rows, null, 2));

        const columns = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'job_searches'
    `);
        console.log('COLUMNS IN job_searches:', JSON.stringify(columns.rows, null, 2));

    } catch (err) {
        console.error('❌ Inspection Error:', err);
    } finally {
        await pool.end();
    }
}

checkEverything();
