
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixJobMatchesSchema() {
    console.log('🛠 Fixing job_matches table schema...');
    try {
        // 1. Check if user_status exists
        const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_matches' AND column_name = 'user_status'
    `);

        if (checkRes.rowCount === 0) {
            console.log('➕ Adding missing column: user_status');
            await pool.query("ALTER TABLE job_matches ADD COLUMN user_status VARCHAR(20) DEFAULT 'new'");
            console.log('✅ Column user_status added.');
        } else {
            console.log('ℹ️ Column user_status already exists.');
        }

        // 2. Check if search_id exists (often used in the code)
        const checkRes2 = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_matches' AND column_name = 'search_id'
    `);

        if (checkRes2.rowCount === 0) {
            console.log('➕ Adding missing column: search_id (and creating searches table if needed)');

            // Create searches table if missing so FK works
            await pool.query(`
        CREATE TABLE IF NOT EXISTS searches (
            id SERIAL PRIMARY KEY,
            user_id INT,
            job_title VARCHAR(255),
            location VARCHAR(255),
            status VARCHAR(50) DEFAULT 'processing',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

            await pool.query('ALTER TABLE job_matches ADD COLUMN search_id INT');
            console.log('✅ Column search_id added.');
        }

        // 3. Add other common missing columns if they aren't there
        const commonColumns = [
            { name: 'match_reason', type: 'TEXT' },
            { name: 'qualification_status', type: 'BOOLEAN DEFAULT FALSE' }
        ];

        for (const col of commonColumns) {
            const check = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'job_matches' AND column_name = $1
        `, [col.name]);

            if (check.rowCount === 0) {
                console.log(`➕ Adding missing column: ${col.name}`);
                await pool.query(`ALTER TABLE job_matches ADD COLUMN ${col.name} ${col.type}`);
            }
        }

    } catch (err) {
        console.error('❌ Error fixing job_matches schema:', err);
    } finally {
        await pool.end();
    }
}

fixJobMatchesSchema();
