const request = require('supertest');
const { createTestApp, closeTestDb } = require('./setup');

let app;

beforeAll(() => { app = createTestApp(); });
afterAll(() => { closeTestDb(); });

describe('POST /api/auth/register', () => {
    it('should register a valid user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser', email: 'test@example.com', password: 'Passw0rd' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.username).toBe('testuser');
        expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'test' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/required/i);
    });

    it('should reject invalid email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'user2', email: 'not-an-email', password: 'Passw0rd' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/email/i);
    });

    it('should reject weak password', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'user3', email: 'user3@example.com', password: 'weak' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/password/i);
    });

    it('should reject invalid username (special chars)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'bad user!', email: 'bad@example.com', password: 'Passw0rd' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/username/i);
    });

    it('should reject duplicate user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser', email: 'test@example.com', password: 'Passw0rd' });

        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/taken/i);
    });
});

describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'Passw0rd' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'WrongPass1' });

        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/invalid/i);
    });

    it('should reject non-existent email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'ghost@example.com', password: 'Passw0rd' });

        expect(res.status).toBe(401);
    });

    it('should reject missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(res.status).toBe(400);
    });

    it('should reject invalid email format on login', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'bad-email', password: 'Passw0rd' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/email/i);
    });
});

describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'Passw0rd' });

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${loginRes.body.token}`);

        expect(res.status).toBe(200);
        expect(res.body.user).toHaveProperty('username', 'testuser');
    });

    it('should reject request without token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer invalid-token-here');

        expect(res.status).toBe(401);
    });
});
