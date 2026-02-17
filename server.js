require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const auth = require('./src/middleware/auth');
const authRouter = require('./src/routes/auth');
const documentsRouter = require('./src/routes/documents');
const qaRouter = require('./src/routes/qa');
const healthRouter = require('./src/routes/health');
const conversationsRouter = require('./src/routes/conversations');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Security Middleware ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
        },
    },
}));

// General rate limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
});

// Strict rate limiter for auth endpoints: 15 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

app.use(generalLimiter);

const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000'];

app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (same-origin, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Public routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/health', healthRouter);

// Protected routes
app.use('/api/documents', auth, documentsRouter);
app.use('/api/ask', auth, qaRouter);
app.use('/api/conversations', auth, conversationsRouter);

// SPA fallback
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'An unexpected error occurred.' });
});

app.listen(PORT, () => {
    console.log(`\n\n🧠 Synapse running at http://localhost:${PORT}`);
});
