const express = require('express');
const { getDb } = require('../db');
const { validateId, sanitizeString } = require('../middleware/validate');

const router = express.Router();

// List conversations for current user
router.get('/', (req, res) => {
    try {
        const convos = getDb().prepare(`
            SELECT c.id, c.title, c.created_at, c.updated_at,
                   COUNT(m.id) as message_count
            FROM conversations c
            LEFT JOIN messages m ON m.conversation_id = c.id
            WHERE c.user_id = ?
            GROUP BY c.id
            ORDER BY c.updated_at DESC
        `).all(req.user.id);
        res.json(convos);
    } catch (err) {
        console.error('List conversations error:', err);
        res.status(500).json({ error: 'Failed to list conversations.' });
    }
});

// Create new conversation
router.post('/', (req, res) => {
    try {
        const title = sanitizeString(req.body.title || 'New Conversation', 200);
        const result = getDb().prepare(
            'INSERT INTO conversations (user_id, title) VALUES (?, ?)'
        ).run(req.user.id, title);

        res.status(201).json({
            id: Number(result.lastInsertRowid),
            title,
            message_count: 0,
        });
    } catch (err) {
        console.error('Create conversation error:', err);
        res.status(500).json({ error: 'Failed to create conversation.' });
    }
});

// Get conversation with messages
router.get('/:id', validateId(), (req, res) => {
    try {
        const db = getDb();
        const convo = db.prepare(
            'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
        ).get(req.params.id, req.user.id);

        if (!convo) return res.status(404).json({ error: 'Conversation not found.' });

        const messages = db.prepare(
            'SELECT id, role, content, sources, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
        ).all(convo.id);

        // parse sources JSON
        const parsed = messages.map(m => ({
            ...m,
            sources: m.sources ? JSON.parse(m.sources) : null,
        }));

        res.json({ ...convo, messages: parsed });
    } catch (err) {
        console.error('Get conversation error:', err);
        res.status(500).json({ error: 'Failed to get conversation.' });
    }
});

// Rename conversation
router.patch('/:id', validateId(), (req, res) => {
    try {
        const db = getDb();
        const convo = db.prepare(
            'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
        ).get(req.params.id, req.user.id);

        if (!convo) return res.status(404).json({ error: 'Conversation not found.' });

        const title = sanitizeString(req.body.title, 200);
        if (!title) {
            return res.status(400).json({ error: 'Title is required (max 200 characters).' });
        }

        db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(title, convo.id);
        res.json({ message: 'Renamed.' });
    } catch (err) {
        console.error('Rename conversation error:', err);
        res.status(500).json({ error: 'Failed to rename.' });
    }
});

// Delete conversation
router.delete('/:id', validateId(), (req, res) => {
    try {
        const db = getDb();
        const convo = db.prepare(
            'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
        ).get(req.params.id, req.user.id);

        if (!convo) return res.status(404).json({ error: 'Conversation not found.' });

        db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(convo.id);
        db.prepare('DELETE FROM conversations WHERE id = ?').run(convo.id);

        res.json({ message: 'Conversation deleted.' });
    } catch (err) {
        console.error('Delete conversation error:', err);
        res.status(500).json({ error: 'Failed to delete.' });
    }
});

module.exports = router;
