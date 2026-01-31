
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function ultimateSync() {
    console.log('🚀 Executing Ultimate Schema Sync...');
    try {
        // 1. Drop the view if it exists (views can't always be inserted into)
        await pool.query("DROP VIEW IF EXISTS job_searches CASCADE");

        // 2. Create job_searches as a REAL table if it doesn't exist
        await pool.query(`
      CREATE TABLE IF NOT EXISTS job_searches (
          id SERIAL PRIMARY KEY,
          user_id INT,
          job_title VARCHAR(255),
          location VARCHAR(255),
          keywords TEXT[],
          status VARCHAR(50) DEFAULT 'processing',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ job_searches table is a real table now.');

        // 3. Create job_matches table if it's missing or fix it
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
        console.log('✅ job_matches table schema verified.');

        // 4. Check if we have any data now
        const res = await pool.query("SELECT count(*) FROM job_searches");
        console.log(`Current record count in job_searches: ${res.rows[0].count}`);

    } catch (err) {
        console.error('❌ Sync Error:', err);
    } finally {
        await pool.end();
    }
}

ultimateSync();
