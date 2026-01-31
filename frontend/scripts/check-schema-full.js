
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    console.log('📊 Detailed Schema Check...');
    try {
        const res = await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
        res.rows.forEach(row => {
            console.log(`[${row.column_name}] Type: ${row.data_type}, Nullable: ${row.is_nullable}`);
        });
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();
