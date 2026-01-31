
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const EMAIL = 'mainalinford9@gmail.com';
const PASSWORD = 'Freya';

async function checkUser() {
    console.log('🔍 Checking Database Connection...');
    console.log('URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');

    try {
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [EMAIL.toLowerCase()]);

        if (res.rows.length === 0) {
            console.log(`❌ User ${EMAIL} NOT FOUND in database.`);
            return;
        }

        const user = res.rows[0];
        console.log('✅ User Found:');
        console.log(' - ID:', user.id);
        console.log(' - Email:', user.email);
        console.log(' - Name:', user.full_name);
        console.log(' - Hash:', user.password_hash?.substring(0, 10) + '...');

        console.log('\n🔐 Verifying Password...');
        const match = await bcrypt.compare(PASSWORD, user.password_hash);

        if (match) {
            console.log('✅ Password "Freya" matches the stored hash.');
        } else {
            console.log('❌ Password "Freya" DOES NOT match the stored hash.');
        }

    } catch (err) {
        console.error('❌ Database Error:', err);
    } finally {
        await pool.end();
    }
}

checkUser();
