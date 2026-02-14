const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set.');
    process.exit(1);
}

function auth(req, res, next) {
    const header = req.headers.authorization;
    let token;

    if (header && header.startsWith('Bearer ')) {
        token = header.slice(7);
    } else if (req.query.token) {
        token = req.query.token;
    } else {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        // Verify user still exists in DB (crucial for Render's ephemeral filesystem)
        const { getDb } = require('../db');
        const db = getDb();
        const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(payload.id);

        if (!user) {
            console.warn(`AUTH: User ID ${payload.id} not found in database. Possible DB wipe.`);
            return res.status(401).json({ error: 'User account no longer exists. Please register again. (ERR_USER_NOT_FOUND)' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = auth;
