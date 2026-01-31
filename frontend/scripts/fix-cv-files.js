
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkCvFiles() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'cv_files'");
        if (res.rowCount === 0) {
            console.log('❌ cv_files table MISSING');
            console.log('🛠 Creating cv_files table...');
            await pool.query(`
        CREATE TABLE cv_files (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            filename VARCHAR(255),
            mime_type VARCHAR(100),
            file_content BYTEA,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_current BOOLEAN DEFAULT TRUE
        )
      `);
            console.log('✅ cv_files table created.');
        } else {
            console.log('✅ cv_files table exists.');
        }
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

checkCvFiles();
