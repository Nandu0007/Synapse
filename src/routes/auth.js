const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const auth = require('../middleware/auth');
const { sanitizeString, isValidEmail, isValidUsername, isStrongPassword } = require('../middleware/validate');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // --- Input presence ---
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required.' });
        }

        // --- Sanitise ---
        const cleanUsername = sanitizeString(username, 30);
        const cleanEmail = sanitizeString(email, 254).toLowerCase();

        // --- Validate username ---
        if (!isValidUsername(cleanUsername)) {
            return res.status(400).json({
                error: 'Username must be 3-30 characters and contain only letters, numbers, or underscores.',
            });
        }

        // --- Validate email ---
        if (!isValidEmail(cleanEmail)) {
            return res.status(400).json({ error: 'Please enter a valid email address.' });
        }

        // --- Validate password strength ---
        if (!isStrongPassword(password)) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number.',
            });
        }

        const db = getDb();

        const existing = db.prepare(
            'SELECT id FROM users WHERE email = ? OR username = ?'
        ).get(cleanEmail, cleanUsername.toLowerCase());

        if (existing) {
            return res.status(409).json({ error: 'Username or email already taken.' });
        }

        const hash = await bcrypt.hash(password, 12);
        const result = db.prepare(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
        ).run(cleanUsername.toLowerCase(), cleanEmail, hash);

        const userId = Number(result.lastInsertRowid);
        const token = jwt.sign(
            { id: userId, username: cleanUsername.toLowerCase(), email: cleanEmail },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: { id: userId, username: cleanUsername.toLowerCase(), email: cleanEmail },
        });
    } catch (err) {
        console.error('Register error:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        if (!usernameOrEmail || !password) {
            return res.status(400).json({ error: 'Username/Email and password are required.' });
        }

        const input = sanitizeString(usernameOrEmail, 254).toLowerCase();
        const db = getDb();
        
        // Try to find user by email first, then by username
        let user = null;
        
        // Check if input is an email
        if (isValidEmail(input)) {
            user = db.prepare('SELECT * FROM users WHERE email = ?').get(input);
        }
        
        // If not found by email, try username
        if (!user) {
            user = db.prepare('SELECT * FROM users WHERE username = ?').get(input);
        }

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
            { expiresIn: '7d' }
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
