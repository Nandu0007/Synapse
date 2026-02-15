const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';
const EMAIL = 'qa_debug@test.com';
const PASSWORD = 'password123';
const USERNAME = 'qa_user';

async function testQA() {
    try {
        console.log('--- 1. Testing Health ---');
        const healthRes = await fetch(`${API_BASE}/api/health`);
        const health = await healthRes.json();
        console.log('Health:', JSON.stringify(health, null, 2));

        console.log('\n--- 2. Auth (Login/Register) ---');
        let token;
        const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        let loginData = await loginRes.json();
        if (loginRes.ok) {
            token = loginData.token;
            console.log('Login successful');
        } else {
            console.log('Login failed, registering...');
            const regRes = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: USERNAME, email: EMAIL, password: PASSWORD })
            });
            const regData = await regRes.json();
            if (regRes.ok) {
                token = regData.token;
                console.log('Registration successful');
            } else {
                throw new Error(`Auth failed: ${regData.error}`);
            }
        }

        console.log('\n--- 3. Uploading Document for context ---');
        const formData = new FormData();
        const blob = new Blob(['The secret code for Synapse is 007.'], { type: 'text/plain' });
        formData.append('file', blob, 'secret.txt');

        const uploadRes = await fetch(`${API_BASE}/api/documents`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const uploadData = await uploadRes.json();
        console.log('Upload Status:', uploadRes.status);

        console.log('\n--- 4. Asking Question ---');
        const qaRes = await fetch(`${API_BASE}/api/ask`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: 'What is the secret code for Synapse?' })
        });

        const qaData = await qaRes.json();
        console.log('QA Status:', qaRes.status);
        console.log('QA Data:', JSON.stringify(qaData, null, 2));

        if (qaRes.ok && qaData.answer.includes('007')) {
            console.log('\nVerification Successful!');
        } else {
            console.error('\nVerification FAILED: Answer did not contain the expected info.');
        }

    } catch (err) {
        console.error('\nVerification FAILED:');
        console.error(err);
    }
}

testQA();
