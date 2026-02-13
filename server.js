require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const auth = require('./src/middleware/auth');
const authRouter = require('./src/routes/auth');
const documentsRouter = require('./src/routes/documents');
const qaRouter = require('./src/routes/qa');
const healthRouter = require('./src/routes/health');
const conversationsRouter = require('./src/routes/conversations');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Public routes
app.use('/api/auth', authRouter);
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
