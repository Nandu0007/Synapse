# Synapse — AI Knowledge Base

A professional, minimal web app where you can upload documents (text, PDFs, images), ask questions about them, and get AI-powered answers with source attribution.

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Gemini](https://img.shields.io/badge/LLM-Gemini%201.5%20Flash-blue) ![SQLite](https://img.shields.io/badge/DB-SQLite-lightgrey)

## Features

- **Professional Minimal UI** — "Synapse" branding with a matte black theme
- **Document upload** — Drag-and-drop text files, PDFs, and images
- **PDF text extraction** — Parses PDF pages and extracts text content using Mozilla's PDF.js
- **Image OCR** — Extracts text from images (screenshots, scanned docs, photos) via Gemini Vision
- **AI Q&A** — Ask questions and get answers grounded in your documents
- **Multi-turn Chat** — Ask follow-up questions with conversation context
- **Source attribution** — See which document and passage the answer came from, with relevance scores
- **Authentication** — Secure user accounts with JWT and "Remember Me" functionality
- **Health dashboard** — Monitor backend, database, and LLM connection status

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| LLM | Google Gemini 1.5 Flash |
| Embeddings | Gemini embedding-001 |
| PDF parsing | pdfjs-dist (Mozilla PDF.js) |
| Image OCR | Gemini Vision (multimodal) |
| Frontend | Vanilla HTML/CSS/JS |
| Auth | JWT + bcryptjs |

## Quick Start

```bash
# Install dependencies
npm install

# Set up env
cp .env.example .env
# Add your GEMINI_API_KEY and JWT_SECRET to .env

# Run
npm start
```

Open [http://localhost:3000](http://localhost:3000).

For development with auto-reload: `npm run dev`

## How It Works

```
Upload → Extract Text → Chunk → Embed → Store
                                          ↓
Question → Embed → Cosine Similarity → Top Chunks → Gemini → Answer
```

1. **Upload** — File goes through the extraction pipeline (text → UTF-8, PDF → pdfjs-dist, image → Gemini Vision)
2. **Chunk** — Extracted text is split into ~500-char chunks with 100-char overlap at sentence boundaries
3. **Embed** — Each chunk gets a vector embedding via `gemini-embedding-001`
4. **Query** — Your question is embedded and compared to all chunks using cosine similarity
5. **Answer** — Top matching chunks are sent as context to Gemini, which generates an answer with source references

## Supported File Types

| Type | Extensions | Extraction |
|------|-----------|------------|
| Text | .txt, .md, .csv, .json, .log, .xml, .html, .css, .js, .py, .java, .c, .cpp, .h | UTF-8 decode |
| PDF | .pdf | pdfjs-dist page-by-page extraction |
| Images | .png, .jpg, .jpeg, .gif, .webp, .bmp, .tiff | Gemini Vision OCR |

Max file size: 10MB

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| POST | /api/documents | Upload a file |
| GET | /api/documents | List documents |
| GET | /api/documents/:id | Get document |
| DELETE | /api/documents/:id | Delete document |
| POST | /api/ask | Ask a question |
| GET | /api/conversations | List conversations |
| POST | /api/conversations | Create/continue conversation |
| GET | /api/health | Health check |

## Project Structure

```
├── server.js               # Express entry point
├── src/
│   ├── db.js               # SQLite setup + schema
│   ├── chunker.js          # Text chunking (sentence-aware)
│   ├── embeddings.js       # Embeddings, similarity search, RAG
│   ├── extractor.js        # Text extraction (text/PDF/image)
│   ├── middleware/
│   │   └── auth.js         # JWT verification
│   └── routes/
│       ├── auth.js         # User registration/login
│       ├── documents.js    # Document CRUD
│       ├── conversations.js # Chat history
│       ├── qa.js           # Q&A endpoint
│       └── health.js       # Health checks
├── public/
│   ├── index.html          # SPA shell
│   ├── css/style.css       # Synapse minimal theme
│   └── js/app.js           # Client logic
└── .env.example
```

## What's Done

- ✅ Document upload with drag-and-drop
- ✅ PDF and image text extraction
- ✅ Sentence-aware chunking with overlap
- ✅ Vector embeddings + cosine similarity search
- ✅ RAG Q&A with source attribution
- ✅ Health monitoring dashboard
- ✅ Input validation and error handling
- ✅ Responsive professional UI
- ✅ Authentication / multi-user
- ✅ Conversation history / follow-up questions
- ✅ "Remember Me" persistent login

## What's Not Done

- ❌ Incremental re-embedding on document update
- ❌ Production vector DB (currently in-memory similarity)
- ❌ Rate limiting
- ❌ Automated tests

## License

MIT
