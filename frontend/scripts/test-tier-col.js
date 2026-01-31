const { Pool } = require('pg');
require('dotenv').config({ path: 'frontend/.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query('SELECT subscription_tier FROM users LIMIT 1');
        console.log('Success - subscription_tier exists');
    } catch (e) {
        console.error('FAILED - subscription_tier missing:', e.message);
    }
    await pool.end();
}
check();
