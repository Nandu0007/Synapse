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
        req.user = { id: payload.id, username: payload.username, email: payload.email };
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = auth;
