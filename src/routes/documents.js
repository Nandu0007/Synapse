const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDb } = require('../db');
const { chunkText } = require('../chunker');
const { generateEmbeddings } = require('../embeddings');
const { extractText, getExtractionMethod } = require('../extractor');
const { validateId } = require('../middleware/validate');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [
            '.txt', '.md', '.csv', '.json', '.log', '.xml', '.html', '.css', '.js', '.py', '.java', '.c', '.cpp', '.h',
            '.pdf',
            '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.avif',
        ];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error(`File type "${ext}" is not supported.`));
    },
});

const handleUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.message?.includes('not supported') || err instanceof multer.MulterError) {
                return res.status(400).json({ error: err.message });
            }
            console.error('Multer upload error:', err);
            return res.status(500).json({ error: `Upload error: ${err.message}` });
        }
        next();
    });
};

// Upload a document (scoped to current user)
router.post('/', handleUpload, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const name = req.file.originalname;
        console.log(`DEBUG: [Upload] Starting process for "${name}" (${req.file.mimetype}, ${req.file.size} bytes)`);

        let content;
        try {
            console.log(`DEBUG: [Upload] Starting extraction for "${name}"...`);
            content = await extractText(req.file.buffer, name, req.file.mimetype);
            console.log(`DEBUG: [Upload] Extraction successful. Content length: ${content.length}`);
        } catch (err) {
            console.error(`DEBUG: [Upload] Extraction FAILED for "${name}":`, err);
            return res.status(400).json({ error: `Extraction failed: ${err.message} (ERR_EXTRACT)` });
        }

        if (!content.trim()) {
            return res.status(400).json({ error: 'No text could be extracted from the file. (ERR_EMPTY_CONTENT)' });
        }

        const db = getDb();

        let docId;
        try {
            console.log(`DEBUG: [Upload] Inserting document metadata into DB...`);
            const result = db.prepare(
                'INSERT INTO documents (name, content, size, mime_type, original_file, user_id) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(name, content, req.file.size, req.file.mimetype, req.file.buffer, req.user.id);
            docId = result.lastInsertRowid;
            console.log(`DEBUG: [Upload] DB insertion successful. Doc ID: ${docId}`);
        } catch (err) {
            console.error(`DEBUG: [Upload] DB insertion FAILED for "${name}":`, err);
            return res.status(500).json({ error: `Failed to save document metadata. ${err.message} (ERR_DB)` });
        }

        console.log(`DEBUG: [Upload] Starting chunking...`);
        const chunks = chunkText(content);
        console.log(`DEBUG: [Upload] Chunking complete. Generated ${chunks.length} chunks.`);

        let embeddings;
        try {
            console.log(`DEBUG: [Upload] Generating embeddings for ${chunks.length} chunks...`);
            embeddings = await generateEmbeddings(chunks);
            console.log(`DEBUG: [Upload] Embeddings generation successful.`);
        } catch (err) {
            console.error(`DEBUG: [Upload] Embedding FAILED for "${name}":`, err.message);
            const insert = db.prepare(
                'INSERT INTO chunks (doc_id, text, embedding, chunk_index) VALUES (?, ?, ?, ?)'
            );
            db.transaction(() => {
                chunks.forEach((c, i) => insert.run(docId, c, null, i));
            })();

            return res.status(201).json({
                id: Number(docId), name, size: req.file.size, chunks: chunks.length,
                warning: 'Saved but embeddings failed. Q&A may not work for this document. (WARN_EMBEDDING)',
            });
        }

        try {
            console.log(`DEBUG: [Upload] Saving ${chunks.length} chunks to DB...`);
            const insert = db.prepare(
                'INSERT INTO chunks (doc_id, text, embedding, chunk_index) VALUES (?, ?, ?, ?)'
            );
            db.transaction(() => {
                chunks.forEach((c, i) => insert.run(docId, c, JSON.stringify(embeddings[i]), i));
            })();
            console.log(`DEBUG: [Upload] Chunks saved successfully.`);
        } catch (err) {
            console.error(`DEBUG: [Upload] Saving chunks FAILED for "${name}":`, err);
            return res.status(500).json({ error: `Failed to save document chunks. ${err.message} (ERR_CHUNK)` });
        }

        res.status(201).json({
            id: Number(docId), name, size: req.file.size, chunks: chunks.length,
        });
    } catch (err) {
        console.error('DEBUG: [Upload] Unexpected error details:', err);
        res.status(500).json({ error: `Failed to upload document. ${err.message} (ERR_UNKNOWN)` });
    }
});

// List documents (user's only)
router.get('/', (req, res) => {
    try {
        const docs = getDb().prepare(`
            SELECT d.id, d.name, d.size, d.created_at,
                   COUNT(c.id) as chunk_count
            FROM documents d
            LEFT JOIN chunks c ON c.doc_id = d.id
            WHERE d.user_id = ?
            GROUP BY d.id
            ORDER BY d.created_at DESC
        `).all(req.user.id);
        res.json(docs);
    } catch (err) {
        console.error('List error:', err);
        res.status(500).json({ error: 'Failed to retrieve documents.' });
    }
});

// Get a single document (user's only)
router.get('/:id', validateId(), (req, res) => {
    try {
        const doc = getDb().prepare(
            'SELECT id, name, content, size, created_at FROM documents WHERE id = ? AND user_id = ?'
        ).get(req.params.id, req.user.id);

        if (!doc) return res.status(404).json({ error: 'Document not found.' });
        res.json(doc);
    } catch (err) {
        console.error('Get error:', err);
        res.status(500).json({ error: 'Failed to retrieve document.' });
    }
});

// Delete a document (user's only)
router.delete('/:id', validateId(), (req, res) => {
    try {
        const db = getDb();
        const doc = db.prepare(
            'SELECT id FROM documents WHERE id = ? AND user_id = ?'
        ).get(req.params.id, req.user.id);

        if (!doc) return res.status(404).json({ error: 'Document not found.' });

        db.prepare('DELETE FROM chunks WHERE doc_id = ?').run(doc.id);
        db.prepare('DELETE FROM documents WHERE id = ?').run(doc.id);

        res.json({ message: 'Document deleted.' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Failed to delete document.' });
    }
});

// Get original file content
router.get('/:id/file', validateId(), (req, res) => {
    try {
        // Authenticate via token in query param or header (for iframes/images)
        // Since iframes can't easily send headers, we might need a cookie or query param.
        // For simplicity in this demo, we'll try to use the auth middleware if possible, 
        // but for <iframe src="..."> we often need a query token "token=..." 
        // OR we just rely on cookies if we had them.
        // Let's assume the client appends ?token=... for this resource.

        let userId = req.user?.id;
        if (!userId && req.query.token) {
            // Manual verify if coming from standard src generic request
            const jwt = require('jsonwebtoken');
            try {
                const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET || 'dev-secret-change-me');
                userId = decoded.id;
            } catch (e) {
                return res.status(401).send('Invalid token');
            }
        }

        if (!userId) {
            // But we are JWT based.
            // If this route is hit by <img>, it needs the token.
            return res.status(401).send('Unauthorized');
        }

        const doc = getDb().prepare(
            'SELECT name, mime_type, original_file FROM documents WHERE id = ? AND user_id = ?'
        ).get(req.params.id, userId);

        if (!doc || !doc.original_file) return res.status(404).send('File not found.');

        res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
        // Sanitise filename to prevent header injection
        const safeName = doc.name.replace(/[\r\n"%]/g, '_');
        res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
        res.send(doc.original_file);
    } catch (err) {
        console.error('File retrieve error:', err);
        res.status(500).send('Failed to retrieve file.');
    }
});

module.exports = router;
