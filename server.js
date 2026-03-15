require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// --- Validate required environment variables ---
const requiredEnvVars = ['GEMINI_API_KEY', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.error('Please set these variables before starting the server.');
    process.exit(1);
}

console.log('✅ Environment variables loaded successfully');

const auth = require('./src/middleware/auth');
const authRouter = require('./src/routes/auth');
const documentsRouter = require('./src/routes/documents');
const qaRouter = require('./src/routes/qa');
const healthRouter = require('./src/routes/health');
const conversationsRouter = require('./src/routes/conversations');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// --- Security Middleware ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
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
    skip: (req) => req.path === '/api/health',
    message: { error: 'Too many requests. Please try again later.' },
});

// Strict rate limiter for auth endpoints: 15 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/health',
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

app.use(generalLimiter);

// Determine allowed origins based on environment
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
];

// Add Render deployment URLs if they exist
if (isProduction) {
    const renderUrl = process.env.RENDER_EXTERNAL_URL;
    if (renderUrl) allowedOrigins.push(renderUrl);
    // Allow all Render URLs as fallback
    allowedOrigins.push(/\.onrender\.com$/);
}

// Add custom CORS origins from environment
if (process.env.CORS_ORIGINS) {
    const customOrigins = process.env.CORS_ORIGINS.split(',').map(o => o.trim());
    allowedOrigins.push(...customOrigins);
}

app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (same-origin, curl, etc.)
        if (!origin) return cb(null, true);
        
        // Check if origin is allowed
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return origin === allowed;
        });
        
        if (isAllowed) return cb(null, true);
        
        console.warn(`CORS blocked request from: ${origin}`);
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
