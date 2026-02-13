const express = require('express');
const { getDb } = require('../db');
const { askQuestion } = require('../embeddings');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { question, conversationId } = req.body;

        if (!question || typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({ error: 'Please enter a question.' });
        }
        if (question.trim().length < 3) {
            return res.status(400).json({ error: 'Question is too short.' });
        }
        if (question.trim().length > 2000) {
            return res.status(400).json({ error: 'Question is too long (max 2000 chars).' });
        }

        const db = getDb();
        const userId = req.user.id;

        // check user has documents
        const { count } = db.prepare(
            'SELECT COUNT(*) as count FROM documents WHERE user_id = ?'
        ).get(userId);
        if (count === 0) {
            return res.status(400).json({ error: 'No documents uploaded yet.' });
        }

        // get user's chunks only
        const chunks = db.prepare(`
            SELECT c.id, c.doc_id, c.text, c.embedding, c.chunk_index, d.name as doc_name
            FROM chunks c
            JOIN documents d ON d.id = c.doc_id
            WHERE c.embedding IS NOT NULL AND d.user_id = ?
        `).all(userId);

        if (chunks.length === 0) {
            return res.status(400).json({
                error: 'No embeddings available. Try re-uploading your documents.',
            });
        }

        // get or create conversation
        let convId = conversationId;
        if (convId) {
            const convo = db.prepare(
                'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
            ).get(convId, userId);
            if (!convo) {
                return res.status(404).json({ error: 'Conversation not found.' });
            }
        } else {
            // auto-create a conversation titled from the question
            const title = question.trim().slice(0, 60) + (question.trim().length > 60 ? '...' : '');
            const result = db.prepare(
                'INSERT INTO conversations (user_id, title) VALUES (?, ?)'
            ).run(userId, title);
            convId = Number(result.lastInsertRowid);
        }

        // load conversation history for follow-ups
        const history = db.prepare(
            'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
        ).all(convId);

        // ask with conversation context
        const result = await askQuestion(question.trim(), chunks, history);

        // save user message
        db.prepare(
            'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)'
        ).run(convId, 'user', question.trim());

        // save assistant message with sources
        db.prepare(
            'INSERT INTO messages (conversation_id, role, content, sources) VALUES (?, ?, ?, ?)'
        ).run(convId, 'assistant', result.answer, JSON.stringify(result.sources));

        // update conversation timestamp
        db.prepare(
            'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(convId);

        res.json({
            conversationId: convId,
            question: question.trim(),
            answer: result.answer,
            sources: result.sources,
        });
    } catch (err) {
        console.error('Q&A error:', err);
        res.status(500).json({ error: 'Failed to generate an answer.' });
    }
});

module.exports = router;
