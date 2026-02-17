const request = require('supertest');
const path = require('path');
const { createTestApp, closeTestDb } = require('./setup');

let app, authToken;

beforeAll(async () => {
    app = createTestApp();

    // Register + login to get token
    await request(app)
        .post('/api/auth/register')
        .send({ username: 'docuser', email: 'docuser@example.com', password: 'Passw0rd' });

    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'docuser@example.com', password: 'Passw0rd' });

    authToken = loginRes.body.token;
});

afterAll(() => { closeTestDb(); });

describe('POST /api/documents (upload)', () => {
    it('should reject request without auth', async () => {
        const res = await request(app)
            .post('/api/documents')
            .attach('file', Buffer.from('hello'), 'test.txt');

        expect(res.status).toBe(401);
    });

    it('should reject request without file', async () => {
        const res = await request(app)
            .post('/api/documents')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/no file/i);
    });

    it('should upload a valid text file', async () => {
        const res = await request(app)
            .post('/api/documents')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', Buffer.from('This is test content for the document.'), 'test.txt');

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('name', 'test.txt');
        expect(res.body).toHaveProperty('chunks');
        expect(res.body.chunks).toBeGreaterThan(0);
    });
});

describe('GET /api/documents', () => {
    it('should list user documents', async () => {
        const res = await request(app)
            .get('/api/documents')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0]).toHaveProperty('name');
        expect(res.body[0]).toHaveProperty('chunk_count');
    });

    it('should reject access without auth', async () => {
        const res = await request(app).get('/api/documents');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/documents/:id', () => {
    it('should return a document by id', async () => {
        const listRes = await request(app)
            .get('/api/documents')
            .set('Authorization', `Bearer ${authToken}`);

        const docId = listRes.body[0].id;

        const res = await request(app)
            .get(`/api/documents/${docId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('content');
    });

    it('should return 404 for non-existent document', async () => {
        const res = await request(app)
            .get('/api/documents/99999')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
    });

    it('should reject invalid id param', async () => {
        const res = await request(app)
            .get('/api/documents/abc')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/invalid/i);
    });
});

describe('DELETE /api/documents/:id', () => {
    it('should delete a document', async () => {
        // Upload a disposable doc
        const uploadRes = await request(app)
            .post('/api/documents')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', Buffer.from('Disposable content'), 'disposable.txt');

        const docId = uploadRes.body.id;

        const res = await request(app)
            .delete(`/api/documents/${docId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);

        // Confirm it's gone
        const getRes = await request(app)
            .get(`/api/documents/${docId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(getRes.status).toBe(404);
    });

    it('should return 404 for another user\'s document', async () => {
        // Register a 2nd user
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'otheruser', email: 'other@example.com', password: 'Passw0rd' });

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'other@example.com', password: 'Passw0rd' });

        const otherToken = loginRes.body.token;

        // Upload a doc as the original user
        const uploadRes = await request(app)
            .post('/api/documents')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', Buffer.from('Private content'), 'private.txt');

        // Try to delete as the other user
        const res = await request(app)
            .delete(`/api/documents/${uploadRes.body.id}`)
            .set('Authorization', `Bearer ${otherToken}`);

        expect(res.status).toBe(404);
    });
});
