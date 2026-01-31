
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const EMAIL = 'mainalinford9@gmail.com';
const NEW_PASSWORD = 'Freya';

async function resetPassword() {
    console.log('🔄 Resetting password for:', EMAIL);

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(NEW_PASSWORD, salt);

        const res = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, full_name',
            [hash, EMAIL.toLowerCase()]
        );

        if (res.rowCount === 0) {
            console.log('❌ User not found. Creating user instead...');
            const insertRes = await pool.query(
                'INSERT INTO users (email, full_name, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name',
                [EMAIL.toLowerCase(), 'Maina Linford', hash]
            );
            console.log('✅ User created successfully:', insertRes.rows[0]);
        } else {
            console.log('✅ Password hash updated successfully for:', res.rows[0].full_name);
        }

    } catch (err) {
        console.error('❌ Database Error:', err);
    } finally {
        await pool.end();
    }
}

resetPassword();
