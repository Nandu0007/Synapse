const express = require('express');
const { isHealthy: isDbHealthy } = require('../db');
const { isLlmHealthy } = require('../embeddings');

const router = express.Router();

router.get('/', async (req, res) => {
    const health = {
        backend: { status: 'healthy', message: 'Express server is running' },
        database: { status: 'unknown', message: 'Checking...' },
        llm: { status: 'unknown', message: 'Checking...' },
        timestamp: new Date().toISOString(),
    };

    // database
    try {
        if (isDbHealthy()) {
            health.database = { status: 'healthy', message: 'SQLite connected' };
        } else {
            health.database = { status: 'unhealthy', message: 'Database query failed' };
        }
    } catch (err) {
        health.database = { status: 'unhealthy', message: err.message };
    }

    // LLM
    try {
        if (!process.env.GEMINI_API_KEY) {
            health.llm = { status: 'unhealthy', message: 'GEMINI_API_KEY not set' };
        } else {
            const ok = await isLlmHealthy();
            health.llm = ok
                ? { status: 'healthy', message: 'Gemini API connected' }
                : { status: 'unhealthy', message: 'Gemini API returned unexpected response' };
        }
    } catch (err) {
        health.llm = { status: 'unhealthy', message: err.message };
    }

    const allOk = health.backend.status === 'healthy'
        && health.database.status === 'healthy'
        && health.llm.status === 'healthy';

    health.overall = allOk ? 'healthy' : 'degraded';
    res.status(allOk ? 200 : 503).json(health);
});

module.exports = router;
