# AI Implementation Notes

### Use of AI in this Project

I used AI tools as a technical partner throughout the development of Synapse. Here's a breakdown of where they helped most:

- **Architecture Strategy**: Brainstormed the RAG (Retrieval-Augmented Generation) flow. Debated between using a full Vector DB (like Pinecone) versus a simpler local approach. Settled on SQLite + in-memory similarity for simplicity and speed in a single-user context.
- **Troubleshooting**: Hit some roadblocks with PDF parsing libraries (`pdf-parse` wouldn't behave with modern Node ESM imports). Used AI to pivot to `pdfjs-dist` and get the legacy build working correctly.
- **Styling**: Got some inspiration for the "matte black" glassmorphism theme. It helped me nail down the CSS variables for the dark mode gradients and micro-animations.

### Manual Implementation & Control

While AI helped with brainstorming and debugging specific snippets, I manually architected and implemented the core logic:

- **The Chunker**: Wrote the logic to split text into overlapping segments, ensuring we don't break mid-sentence whenever possible.
- **RAG Pipeline**: Built the full pipeline from file upload → text extraction → vector embedding → cosine similarity search → LLM context injection.
- **Database Schema**: Designed the SQLite schema to efficiently store user data, documents, and message history.
- **The Frontend**: Built the entire SPA shell from scratch using vanilla JS. No bloated frameworks — just clean, responsive DOM manipulation and hash-based routing.

### LLM Stack

| Component | Model | Provider | Why? |
| :--- | :--- | :--- | :--- |
| **Generation & OCR** | `Gemini 1.5 Flash` | Google | Fast, multimodal (handles OCR natively), and has a great free tier for development. |
| **Embeddings** | `embedding-001` | Google | Solid performance for RAG search and integrates seamlessly with the Gemini SDK. |
