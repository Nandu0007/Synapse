const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getClient() {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

// Generate embeddings for an array of texts (batched to avoid rate limits)
async function generateEmbeddings(texts) {
    const client = getClient();
    const model = client.getGenerativeModel({ model: 'gemini-embedding-001' });

    const embeddings = [];
    const batchSize = 10;

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const results = await Promise.all(
            batch.map(async (text) => {
                const result = await model.embedContent(text);
                return result.embedding.values;
            })
        );
        embeddings.push(...results);
    }

    return embeddings;
}

async function generateEmbedding(text) {
    const [embedding] = await generateEmbeddings([text]);
    return embedding;
}

// Cosine similarity between two vectors
function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;

    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}

// Find top-k chunks most similar to the query embedding
function findSimilarChunks(queryEmbedding, chunks, topK = 5) {
    return chunks
        .map((chunk) => {
            let embedding;
            try { embedding = JSON.parse(chunk.embedding); }
            catch { return null; }
            return { chunk, score: cosineSimilarity(queryEmbedding, embedding) };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}

// RAG: embed the question, find relevant chunks, generate answer
// history is an optional array of { role, content } for follow-ups
async function askQuestion(question, chunks, history = []) {
    const client = getClient();
    const queryEmbedding = await generateEmbedding(question);
    const topChunks = findSimilarChunks(queryEmbedding, chunks, 5);

    if (topChunks.length === 0) {
        return {
            answer: 'I could not find any relevant information in the uploaded documents to answer your question.',
            sources: [],
        };
    }

    // build context from matched chunks
    const context = topChunks.map((item, i) =>
        `[Source ${i + 1}: "${item.chunk.doc_name}", Chunk ${item.chunk.chunk_index + 1}]\n${item.chunk.text}`
    ).join('\n\n---\n\n');

    // build conversation history section (last 10 messages max)
    let historySection = '';
    if (history.length > 0) {
        const recent = history.slice(-10);
        historySection = '\nPrevious conversation:\n' +
            recent.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n') +
            '\n';
    }

    const model = client.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `You are a helpful knowledge assistant. Answer the user's question based ONLY on the provided context from their documents. If the context doesn't contain enough information to answer the question, say so clearly.

When answering, reference which source(s) you used by mentioning the document name.
${historySection}
Context from uploaded documents:
${context}

User's question: ${question}

Provide a clear, concise answer:`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    const sources = topChunks.map((item) => ({
        documentName: item.chunk.doc_name,
        documentId: item.chunk.doc_id,
        chunkIndex: item.chunk.chunk_index,
        text: item.chunk.text,
        relevanceScore: Math.round(item.score * 100) / 100,
    }));

    return { answer, sources };
}

// Health check — test embedding model without burning generative quota
async function isLlmHealthy() {
    try {
        const client = getClient();
        const model = client.getGenerativeModel({ model: 'gemini-embedding-001' });
        const result = await model.embedContent('health check');
        return result && result.embedding && result.embedding.values.length > 0;
    } catch (err) {
        console.error('LLM health check failed:', err.message);
        return false;
    }
}

module.exports = {
    generateEmbeddings,
    generateEmbedding,
    findSimilarChunks,
    askQuestion,
    isLlmHealthy,
};
