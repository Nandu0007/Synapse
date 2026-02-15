const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');


let _pdfjsLib = null;
async function loadPdfjs() {
    if (!_pdfjsLib) {
        _pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    }
    return _pdfjsLib;
}

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.tif'];
const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];

function isImage(ext, mime) {
    return IMAGE_EXTS.includes(ext) || IMAGE_MIMES.includes(mime);
}


async function extractText(buffer, filename, mimetype) {
    const ext = path.extname(filename).toLowerCase();

    if (ext === '.pdf' || mimetype === 'application/pdf') {
        return extractPdf(buffer);
    }
    if (isImage(ext, mimetype)) {
        return extractImage(buffer, mimetype);
    }

    // plain text
    return buffer.toString('utf-8');
}

// Parse PDF pages and join their text
async function extractPdf(buffer) {
    try {
        console.log('DEBUG: [Extractor] Loading pdfjs-dist...');
        const pdfjs = await loadPdfjs();
        console.log('DEBUG: [Extractor] pdfjs-dist loaded. Parsing document...');

        const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
        console.log(`DEBUG: [Extractor] PDF loaded. Pages: ${doc.numPages}`);

        const pages = [];

        for (let i = 1; i <= doc.numPages; i++) {
            console.log(`DEBUG: [Extractor] Extracting page ${i}/${doc.numPages}...`);
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            const text = content.items.map(item => item.str).join(' ').trim();
            if (text) pages.push(text);
        }

        const result = pages.join('\n\n');
        if (!result.trim()) {
            throw new Error('The PDF contains no extractable text. Try uploading as an image instead.');
        }
        console.log(`DEBUG: [Extractor] PDF extraction complete. Total text length: ${result.length}`);
        return result;
    } catch (err) {
        console.error(`DEBUG: [Extractor] PDF extraction FAILED:`, err);
        if (err.message.includes('no extractable text')) throw err;
        throw new Error(`Failed to parse PDF: ${err.message}`);
    }
}

// Send image to Gemini Vision for OCR / description
async function extractImage(buffer, mimetype) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set — cannot extract text from images.');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Analyze this image and extract ALL text content from it.
If it contains text (handwritten, printed, typed), extract and return all of it preserving structure.
If it contains diagrams, charts, or tables, describe their content and labels.
If there's no text, provide a detailed description useful for answering questions about it.
Return ONLY the extracted text or description.`;

    try {
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: buffer.toString('base64'), mimeType: mimetype } },
        ]);

        const text = result.response.text()?.trim();
        if (!text) throw new Error('Could not extract any content from the image.');
        return text;
    } catch (err) {
        if (err.message.includes('Could not extract')) throw err;
        console.error('Image extraction error:', err.message);
        throw new Error(`Failed to extract text from image: ${err.message}`);
    }
}

function getExtractionMethod(filename, mimetype) {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.pdf' || mimetype === 'application/pdf') return 'pdf';
    if (isImage(ext, mimetype)) return 'image';
    return 'text';
}

module.exports = { extractText, isImage, getExtractionMethod };
