const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required.' });
        }
        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({ error: 'Username must be 3-30 characters.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }
        if (!email.includes('@')) {
            return res.status(400).json({ error: 'Please enter a valid email.' });
        }

        const db = getDb();

        const existing = db.prepare(
            'SELECT id FROM users WHERE email = ? OR username = ?'
        ).get(email.toLowerCase(), username.toLowerCase());

        if (existing) {
            return res.status(409).json({ error: 'Username or email already taken.' });
        }

        const hash = await bcrypt.hash(password, 10);
        const result = db.prepare(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
        ).run(username.toLowerCase(), email.toLowerCase(), hash);

        const token = jwt.sign(
            { id: Number(result.lastInsertRowid), username: username.toLowerCase(), email: email.toLowerCase() },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            token,
            user: { id: Number(result.lastInsertRowid), username: username.toLowerCase(), email: email.toLowerCase() },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: { id: user.id, username: user.username, email: user.email },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// Get current user
router.get('/me', auth, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
