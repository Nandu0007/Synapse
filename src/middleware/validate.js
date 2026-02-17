/**
 * Shared validation & sanitization middleware
 */

/**
 * Middleware: ensures :paramName is a positive integer.
 */
function validateId(paramName = 'id') {
    return (req, res, next) => {
        const raw = req.params[paramName];
        const id = Number(raw);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: `Invalid ${paramName}: must be a positive integer.` });
        }
        next();
    };
}

/**
 * Sanitise a string: trim, collapse whitespace, truncate.
 */
function sanitizeString(str, maxLen = 500) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').slice(0, maxLen);
}

/**
 * Strict email regex (RFC 5322 simplified).
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Username: 3-30 chars, alphanumeric + underscore only.
 */
function isValidUsername(username) {
    return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

/**
 * Password strength: ≥8 chars, at least one uppercase, one lowercase, one digit.
 */
function isStrongPassword(password) {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
}

module.exports = {
    validateId,
    sanitizeString,
    isValidEmail,
    isValidUsername,
    isStrongPassword,
};
