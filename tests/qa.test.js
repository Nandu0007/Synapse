const request = require('supertest');
const { createTestApp, closeTestDb } = require('./setup');

let app, authToken;

beforeAll(async () => {
    app = createTestApp();

    // Register + login
    await request(app)
        .post('/api/auth/register')
        .send({ username: 'qauser', email: 'qauser@example.com', password: 'Passw0rd' });

    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'qauser@example.com', password: 'Passw0rd' });

    authToken = loginRes.body.token;
});

afterAll(() => { closeTestDb(); });

describe('POST /api/ask', () => {
    it('should reject empty question', async () => {
        const res = await request(app)
            .post('/api/ask')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ question: '' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/question/i);
    });

    it('should reject question that is too short', async () => {
        const res = await request(app)
            .post('/api/ask')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ question: 'hi' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/short/i);
    });

    it('should reject question that is too long (>2000 chars)', async () => {
        const res = await request(app)
            .post('/api/ask')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ question: 'a'.repeat(2001) });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/long/i);
    });

    it('should reject request without auth', async () => {
        const res = await request(app)
            .post('/api/ask')
            .send({ question: 'What is this about?' });

        expect(res.status).toBe(401);
    });

    it('should return error when no documents uploaded', async () => {
        const res = await request(app)
            .post('/api/ask')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ question: 'What is in my documents?' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/no documents/i);
    });
});
