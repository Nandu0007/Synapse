# Prompts Used During Development

I didn't use AI to write the app for me; instead, I used it to solve specific technical blockers and brainstorm the architecture. Here are some representative prompts I used:

### 1. Architectural Trade-offs
> "I'm building a document Q&A app. I need to store embeddings for document chunks. For a lightweight, local-first app, is it better to use a vector plugin for SQLite or just calculate cosine similarity in-memory with JavaScript?"

### 2. Chunking & Overlap Logic
> "How do I implement a sliding window chunking algorithm in JS that tries to respect sentence boundaries (`.`, `!`, `?`) so I don't lose context in my embeddings?"

### 3. Debugging PDF.js ESM Imports
> "I'm getting 'Top-level await' errors when trying to import `pdfjs-dist` in a standard Node.js project. How do I use the legacy build or a dynamic import to extract text from a buffer?"

### 4. Multimodal extraction
> "Instead of running a separate Tesseract OCR worker, can I just send a base64 image buffer to Gemini 1.5 Flash and have it return the raw text content?"

### 5. CSS Micro-interactions
> "Give me some CSS snippets for a professional matte-black glassmorphism look. I want subtle 'staggered' reveal animations for a list of documents."
