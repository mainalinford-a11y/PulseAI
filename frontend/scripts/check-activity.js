
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkRecentActivity() {
    console.log('🔍 Checking for recent searches and matches...');
    try {
        const searches = await pool.query('SELECT id, job_title, location, created_at FROM job_searches ORDER BY created_at DESC LIMIT 1');
        if (searches.rows.length > 0) {
            const lastSearchId = searches.rows[0].id;
            console.log(`--- LATEST SEARCH (ID: ${lastSearchId}) ---`);
            console.log(JSON.stringify(searches.rows[0], null, 2));

            const matches = await pool.query('SELECT job_title, company_name, match_score, found_at FROM job_matches WHERE search_id = $1 ORDER BY found_at DESC', [lastSearchId]);
            console.log(`--- MATCHES FOR SEARCH ${lastSearchId} (${matches.rowCount} found) ---`);
            console.log(JSON.stringify(matches.rows, null, 2));
        } else {
            console.log('No searches found.');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

checkRecentActivity();
