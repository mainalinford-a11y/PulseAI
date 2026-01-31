
const fetch = require('node-fetch');

const payload = {
    job_title: "Accountant",
    location: "Kenya",
    email: "mainalinford9@gmail.com",
    name: "maish",
    cv_text: "This is a test CV text for debugging purposes. Accountant with 5 years experience in Kenya."
};

async function testWebhook() {
    const url = "https://sterilisable-joy-unintervolved.ngrok-free.dev/webhook/job-search";
    console.log(`📡 Sending test trigger to: ${url}`);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

testWebhook();
