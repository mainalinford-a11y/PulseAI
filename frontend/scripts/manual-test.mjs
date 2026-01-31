
import fetch from 'node-fetch';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'mainalinford9@gmail.com';
const PASSWORD = 'Freya';

async function runTest() {
    console.log('🚀 Starting Manual Auth & Search Test...');

    // 1. Login
    console.log(`\nAttempting login for ${EMAIL}...`);
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });

    if (!loginRes.ok) {
        console.error('❌ Login Failed:', loginRes.status, await loginRes.text());
        return;
    }

    const loginData = await loginRes.json();
    console.log('✅ Login Successful:', loginData.message);

    // Extract Cookie
    const rawCookie = loginRes.headers.get('set-cookie');
    if (!rawCookie) {
        console.error('❌ No Set-Cookie header received!');
        return;
    }

    // Simple cookie parsing
    const cookie = rawCookie.split(';')[0];
    console.log('🍪 Session Cookie:', cookie);

    // 2. Start Search
    console.log('\nAttempting to start job search...');

    const form = new FormData();
    form.append('job_title', 'Senior Frontend Engineer');
    form.append('location', 'Remote');
    form.append('email', EMAIL);
    form.append('name', loginData.user.name || 'Test User');
    form.append('cv_text', 'Experienced Frontend Engineer with 5 years in React, Next.js, and TypeScript. Looking for remote roles.');

    const searchRes = await fetch(`${BASE_URL}/api/n8n/start-matching`, {
        method: 'POST',
        headers: {
            'Cookie': cookie,
            ...form.getHeaders()
        },
        body: form
    });

    if (!searchRes.ok) {
        console.error('❌ Search Request Failed:', searchRes.status, await searchRes.text());
        return;
    }

    const searchData = await searchRes.json();
    console.log('✅ Search Started Successfully:', searchData);

    console.log('\n🎉 Test Complete!');
}

runTest().catch(console.error);
