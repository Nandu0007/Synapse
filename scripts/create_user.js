const bcrypt = require('bcryptjs');
const { getDb } = require('../src/db');

async function createUser() {
    const args = process.argv.slice(2);
    const username = args[0] || 'admin';
    const email = args[1] || 'admin@synapse.com';
    const password = args[2] || 'password123';

    if (password.length < 6) {
        console.error('Error: Password must be at least 6 characters.');
        process.exit(1);
    }

    const db = getDb();

    // Check if user exists
    const existing = db.prepare(
        'SELECT id FROM users WHERE email = ? OR username = ?'
    ).get(email, username);

    if (existing) {
        console.log(`User already exists (ID: ${existing.id})`);
        console.log(`Username: ${username}`);
        console.log(`Email: ${email}`);
        return;
    }

    console.log(`Creating user...`);
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);

    try {
        const hash = await bcrypt.hash(password, 10);
        const result = db.prepare(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
        ).run(username, email, hash);

        console.log(`User created successfully! ID: ${result.lastInsertRowid}`);
        console.log(`Login with:`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (err) {
        console.error('Failed to create user:', err.message);
        process.exit(1);
    }
}

createUser();
