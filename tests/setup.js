/**
 * Test setup — creates an Express app backed by an in-memory SQLite database.
 */
const express = require('express');
const path = require('path');

// Force JWT_SECRET before any module tries to read it
process.env.JWT_SECRET = 'test-jwt-secret-for-ci';
process.env.GEMINI_API_KEY = 'fake-key-for-testing';

// Override DB to use an in-memory database for tests
const Database = require('better-sqlite3');
const dbModule = require('../src/db');

let testDb;

function initTestDb() {
    testDb = new Database(':memory:');
    testDb.pragma('journal_mode = WAL');
    testDb.pragma('foreign_keys = ON');

    // Create schema
    testDb.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            content TEXT,
            size INTEGER DEFAULT 0,
            mime_type TEXT,
            original_file BLOB,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            embedding TEXT,
            chunk_index INTEGER DEFAULT 0,
            FOREIGN KEY (doc_id) REFERENCES documents(id)
        );
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT DEFAULT 'New Conversation',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            sources TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id)
        );
    `);

    // Monkey-patch getDb to return the in-memory instance
    dbModule.getDb = () => testDb;
}

/**
 * Creates a fresh Express app wired to the in-memory DB for each test suite.
 */
function createTestApp() {
    initTestDb();

    const app = express();
    app.use(express.json({ limit: '1mb' }));

    const auth = require('../src/middleware/auth');
    const authRouter = require('../src/routes/auth');
    const documentsRouter = require('../src/routes/documents');
    const qaRouter = require('../src/routes/qa');
    const conversationsRouter = require('../src/routes/conversations');

    app.use('/api/auth', authRouter);
    app.use('/api/documents', auth, documentsRouter);
    app.use('/api/ask', auth, qaRouter);
    app.use('/api/conversations', auth, conversationsRouter);

    app.use((err, req, res, next) => {
        console.error('Test error:', err);
        res.status(500).json({ error: 'An unexpected error occurred.' });
    });

    return app;
}

function closeTestDb() {
    if (testDb) testDb.close();
}

module.exports = { createTestApp, closeTestDb, initTestDb };
