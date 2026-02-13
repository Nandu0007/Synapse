const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'knowledge.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
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
            content TEXT NOT NULL,
            size INTEGER NOT NULL DEFAULT 0,
            mime_type TEXT,
            original_file BLOB,
            user_id INTEGER REFERENCES users(id),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            embedding TEXT,
            chunk_index INTEGER NOT NULL,
            FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL DEFAULT 'New Conversation',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            sources TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON chunks(doc_id);
        CREATE INDEX IF NOT EXISTS idx_docs_user_id ON documents(user_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
        CREATE INDEX IF NOT EXISTS idx_messages_conv_id ON messages(conversation_id);
    `);

  // migrations
  try {
    db.prepare("SELECT user_id FROM documents LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE documents ADD COLUMN user_id INTEGER REFERENCES users(id)");
  }

  try {
    db.prepare("SELECT mime_type FROM documents LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE documents ADD COLUMN mime_type TEXT");
    db.exec("ALTER TABLE documents ADD COLUMN original_file BLOB");
  }
}

function isHealthy() {
  try {
    const row = getDb().prepare('SELECT 1 as ok').get();
    return row && row.ok === 1;
  } catch {
    return false;
  }
}

module.exports = { getDb, isHealthy };
