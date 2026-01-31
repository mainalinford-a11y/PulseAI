
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixSequence() {
    console.log('🔧 Fixing Sequences and IDs...');
    try {
        // Ensure job_searches ID is SERIAL (auto-incrementing)
        // This is safer than just 'integer'
        await pool.query(`
      ALTER TABLE job_searches ALTER COLUMN id SET DATA TYPE SERIAL;
    `).catch(() => console.log('ℹ️ SERIAL might already be set or requires different syntax.'));

        // Check if the user is in the DB
        const user = await pool.query("SELECT id, email FROM users WHERE email = 'mainalinford9@gmail.com'");
        console.log('Target User ID:', user.rows[0]?.id);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

fixSequence();
