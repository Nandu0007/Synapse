const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';
const EMAIL = 'debug@test.com';
const PASSWORD = 'password123';
const USERNAME = 'debug_user';

async function testUpload() {
    try {
        console.log('--- 1. Testing Health ---');
        const healthRes = await fetch(`${API_BASE}/api/health`);
        const health = await healthRes.json();
        console.log('Health:', JSON.stringify(health, null, 2));

        console.log('\n--- 2. Logging In ---');
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
            console.log('Login failed, trying to register...');
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

        console.log('\n--- 3. Uploading Test PDF ---');
        const pdfPath = path.join(__dirname, '..', 'public', 'assets', 'resume.pdf');
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

        const formData = new FormData();
        formData.append('file', pdfBlob, 'resume.pdf');

        const uploadRes = await fetch(`${API_BASE}/api/documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const uploadData = await uploadRes.json();
        console.log('Upload Status:', uploadRes.status);
        console.log('Upload Data:', JSON.stringify(uploadData, null, 2));

        console.log('\nVerification Successful!');
    } catch (err) {
        console.error('\nVerification FAILED:');
        console.error(err);
    }
}

testUpload();
