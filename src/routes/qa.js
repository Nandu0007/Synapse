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
        console.log(`DEBUG: [QA] Starting Q&A for User ID: ${userId}, Question: "${question.trim()}"`);

        // check user has documents
        const { count } = db.prepare(
            'SELECT COUNT(*) as count FROM documents WHERE user_id = ?'
        ).get(userId);

        if (count === 0) {
            console.warn(`DEBUG: [QA] User ${userId} has no documents.`);
            return res.status(400).json({ error: 'No documents uploaded yet.' });
        }

        // get user's chunks only
        console.log(`DEBUG: [QA] Fetching chunks for User ID: ${userId}...`);
        const chunks = db.prepare(`
            SELECT c.id, c.doc_id, c.text, c.embedding, c.chunk_index, d.name as doc_name
            FROM chunks c
            JOIN documents d ON d.id = c.doc_id
            WHERE c.embedding IS NOT NULL AND d.user_id = ?
        `).all(userId);

        if (chunks.length === 0) {
            console.warn(`DEBUG: [QA] No embeddings found for User ID: ${userId}.`);
            return res.status(400).json({
                error: 'No embeddings available. Try re-uploading your documents. (ERR_QA_NO_EMBEDDINGS)',
            });
        }
        console.log(`DEBUG: [QA] Found ${chunks.length} chunks with embeddings.`);

        // get or create conversation
        let convId = conversationId;
        if (convId) {
            console.log(`DEBUG: [QA] Using existing conversation ID: ${convId}`);
            const convo = db.prepare(
                'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
            ).get(convId, userId);
            if (!convo) {
                console.error(`DEBUG: [QA] Conversation ${convId} not found for User ${userId}`);
                return res.status(404).json({ error: 'Conversation not found. (ERR_QA_CONV_NOT_FOUND)' });
            }
        } else {
            console.log(`DEBUG: [QA] Creating new conversation...`);
            const title = question.trim().slice(0, 60) + (question.trim().length > 60 ? '...' : '');
            const result = db.prepare(
                'INSERT INTO conversations (user_id, title) VALUES (?, ?)'
            ).run(userId, title);
            convId = Number(result.lastInsertRowid);
            console.log(`DEBUG: [QA] New conversation created. ID: ${convId}`);
        }

        // load conversation history for follow-ups
        const history = db.prepare(
            'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
        ).all(convId);
        console.log(`DEBUG: [QA] Loaded session history: ${history.length} messages.`);

        // ask with conversation context
        let result;
        try {
            console.log(`DEBUG: [QA] Calling askQuestion (Generative step)...`);
            result = await askQuestion(question.trim(), chunks, history);
            console.log(`DEBUG: [QA] askQuestion successful.`);
        } catch (err) {
            console.error(`DEBUG: [QA] askQuestion FAILED:`, err);
            const isEmbedError = err.message?.toLowerCase().includes('embed') || err.message?.toLowerCase().includes('embedding');
            const code = isEmbedError ? 'ERR_QA_EMBED' : 'ERR_QA_GEN';
            return res.status(500).json({ error: `Failed to generate an answer. ${err.message} (${code})` });
        }

        try {
            console.log(`DEBUG: [QA] Saving messages to DB...`);
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
            console.log(`DEBUG: [QA] Messages saved successfully.`);
        } catch (err) {
            console.error(`DEBUG: [QA] Saving messages FAILED:`, err);
            return res.status(500).json({ error: `Answer generated but failed to save to history. ${err.message} (ERR_QA_DB)` });
        }

        res.json({
            conversationId: convId,
            question: question.trim(),
            answer: result.answer,
            sources: result.sources,
        });
    } catch (err) {
        console.error('DEBUG: [QA] Unexpected error:', err);
        res.status(500).json({ error: `Failed to generate an answer. ${err.message} (ERR_QA_UNKNOWN)` });
    }
});

module.exports = router;
