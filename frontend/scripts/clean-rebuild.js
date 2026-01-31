
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function clearAndRebuild() {
    console.log('🧹 Rebuilding tables for n8n...');
    try {
        // 1. Drop the potential view and table
        await pool.query("DROP VIEW IF EXISTS job_searches");
        await pool.query("DROP TABLE IF EXISTS job_searches CASCADE");
        console.log('🗑 Dropped old job_searches.');

        // 2. Create the real table
        await pool.query(`
      CREATE TABLE job_searches (
          id SERIAL PRIMARY KEY,
          user_id INT,
          job_title VARCHAR(255),
          location VARCHAR(255),
          keywords TEXT[],
          status VARCHAR(50) DEFAULT 'processing',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Created REAL job_searches table.');

        // 3. Ensure job_matches exists
        await pool.query(`
      CREATE TABLE IF NOT EXISTS job_matches (
          id SERIAL PRIMARY KEY,
          user_id INT,
          search_id INT,
          job_title VARCHAR(255),
          company_name VARCHAR(255),
          job_url TEXT UNIQUE,
          location VARCHAR(255),
          description TEXT,
          match_score INT,
          qualification_status BOOLEAN DEFAULT FALSE,
          match_reason TEXT,
          user_status VARCHAR(20) DEFAULT 'new',
          found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Created job_matches table.');

    } catch (err) {
        console.error('❌ Error during rebuild:', err);
    } finally {
        await pool.end();
    }
}

clearAndRebuild();
