// Chunk text into overlapping segments for embedding.
// Splits at sentence boundaries when possible.

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;

function chunkText(text) {
    if (!text || typeof text !== 'string') return [];

    const cleaned = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
    if (cleaned.length <= CHUNK_SIZE) return [cleaned];

    const chunks = [];
    let start = 0;

    while (start < cleaned.length) {
        let end = start + CHUNK_SIZE;

        if (end >= cleaned.length) {
            chunks.push(cleaned.slice(start).trim());
            break;
        }

        // try to break at sentence boundary
        let breakAt = -1;
        for (let i = end; i >= start + CHUNK_SIZE * 0.5; i--) {
            if ('.!?\n'.includes(cleaned[i])) {
                breakAt = i + 1;
                break;
            }
        }

        // fallback: break at space
        if (breakAt === -1) {
            for (let i = end; i >= start + CHUNK_SIZE * 0.5; i--) {
                if (cleaned[i] === ' ') {
                    breakAt = i;
                    break;
                }
            }
        }

        if (breakAt === -1) breakAt = end;

        const chunk = cleaned.slice(start, breakAt).trim();
        if (chunk.length > 0) chunks.push(chunk);

        start = breakAt - CHUNK_OVERLAP;
        if (start < 0) start = 0;
        if (start >= breakAt) start = breakAt;
    }

    return chunks;
}

module.exports = { chunkText };
