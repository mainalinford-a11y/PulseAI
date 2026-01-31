
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function findUser() {
    try {
        const res = await pool.query("SELECT id, email, full_name FROM users WHERE email = 'mainalinford9@gmail.com'");
        console.log('User check:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

findUser();
