
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixSchema() {
    console.log('🛠 Starting Schema Fix...');
    try {
        // 1. Check if cv_url exists
        const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'cv_url'
    `);

        if (checkRes.rowCount === 0) {
            console.log('➕ Adding missing column: cv_url');
            await pool.query('ALTER TABLE users ADD COLUMN cv_url TEXT');
            console.log('✅ Column cv_url added.');
        } else {
            console.log('ℹ️ Column cv_url already exists.');
        }

        // 2. Check if cv_uploaded_at exists
        const checkRes2 = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'cv_uploaded_at'
    `);

        if (checkRes2.rowCount === 0) {
            console.log('➕ Adding missing column: cv_uploaded_at');
            await pool.query('ALTER TABLE users ADD COLUMN cv_uploaded_at TIMESTAMP');
            console.log('✅ Column cv_uploaded_at added.');
        } else {
            console.log('ℹ️ Column cv_uploaded_at already exists.');
        }

        // 3. Check subscription_tier (often used in the code)
        const checkRes3 = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'subscription_tier'
    `);

        if (checkRes3.rowCount === 0) {
            console.log('➕ Adding missing column: subscription_tier');
            await pool.query("ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free'");
            console.log('✅ Column subscription_tier added.');
        }

    } catch (err) {
        console.error('❌ Error applying schema fixes:', err);
    } finally {
        await pool.end();
    }
}

fixSchema();
