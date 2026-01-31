
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function syncTables() {
    console.log('🔄 Synchronizing search tables...');
    try {
        // 1. Check which tables exist
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name IN ('searches', 'job_searches')");
        const tableNames = tables.rows.map(r => r.table_name);
        console.log('Existing tables:', tableNames);

        // 2. If 'searches' exists but 'job_searches' doesn't, create an alias or move data
        if (tableNames.includes('searches') && !tableNames.includes('job_searches')) {
            console.log('➡ Creating job_searches as an alias for searches');
            await pool.query('CREATE VIEW job_searches AS SELECT * FROM searches');
        }

        // 3. Ensure both have the correct structure
        // We'll rename them to be consistent if needed, but for now let's just make 'job_searches' the primary since the workflow uses it
        if (tableNames.includes('searches') && tableNames.includes('job_searches')) {
            console.log('✅ Both tables exist. Checking if data is arriving in either...');
            const s1 = await pool.query('SELECT count(*) FROM searches');
            const s2 = await pool.query('SELECT count(*) FROM job_searches');
            console.log(`Searches count: ${s1.rows[0].count}, Job_searches count: ${s2.rows[0].count}`);
        }

        // 4. Force columns to match for job_searches (what n8n uses)
        console.log('🛠 Ensuring job_searches has the right columns...');
        const columns = [
            { name: 'keywords', type: 'TEXT[]' },
            { name: 'status', type: 'VARCHAR(50) DEFAULT \'processing\'' }
        ];

        for (const col of columns) {
            try {
                await pool.query(`ALTER TABLE job_searches ADD COLUMN ${col.name} ${col.type}`);
                console.log(`✅ Added ${col.name} to job_searches`);
            } catch (e) {
                // Probably already exists
            }
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

syncTables();
