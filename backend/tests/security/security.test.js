// tests/security/security.test.js
const request = require('supertest');
const app = require('../../src/app');
const Word = require('../../src/models/Word');

jest.mock('../../src/models/Word');

describe('Security Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Word.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    });

    describe('Input Validation & XSS Prevention', () => {
        it('rejects XSS payloads in URL parameters', async () => {
            const payloads = [
                '<script>alert(1)</script>',
                '<img src=x onerror=alert(1)>',
                'javascript:alert(1)'
            ];

            for (const payload of payloads) {
                const res = await request(app).get(`/api/words/${encodeURIComponent(payload)}`);
                expect(res.status).toBe(400);
                expect(res.body.success).toBe(false);
                expect(res.body.message).toBe('Invalid search term');
            }
        });

        it('rejects directory traversal attempts', async () => {
            const res = await request(app).get(`/api/words/${encodeURIComponent('../../../../etc/passwd')}`);
            expect(res.status).toBe(400);
        });

        it('rejects arbitrary lengthy strings (Buffer exhaustion/DoS protection)', async () => {
            const longString = 'a'.repeat(1000);
            const res = await request(app).get(`/api/words/${longString}`);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Search term is too long');
        });
    });

    describe('NoSQL Injection Protection', () => {
        it('treats MongoDB operators as invalid strings (rejected by validation)', async () => {
            const payloads = [
                '$ne',
                '$gt',
                '{"$ne":null}',
                '{"$regex":".*"}'
            ];

            for (const payload of payloads) {
                // Testing direct payload injection as URL params (Express parses as strings)
                const res = await request(app).get(`/api/words/${encodeURIComponent(payload)}`);
                // Since our regex validator only allows letters, spaces, hyphens, and apostrophes,
                // $ and {} are immediately rejected safely with 400 Bad Request.
                expect(res.status).toBe(400);
                expect(res.body.message).toBe('Invalid search term');
            }
        });
    });

    describe('Error Information Disclosure', () => {
        it('does not expose stack traces on 500 errors', async () => {
            // Force the DB mock to throw a simulated unexpected crash
            Word.findOne.mockImplementation(() => {
                throw new Error('Secret Database Connection Failure: mongo://admin:password@localhost');
            });

            const res = await request(app).get('/api/words/validword');
            
            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            // The user must get a generic message, NOT the actual error message or stack trace
            expect(res.body.message).toBe('Internal server error');
            expect(res.body.stack).toBeUndefined();
            expect(JSON.stringify(res.body)).not.toMatch(/Secret Database Connection Failure/i);
        });
    });

    describe('Security Headers (Helmet)', () => {
        it('includes standard security headers in the response', async () => {
            const res = await request(app).get('/api/health');
            
            expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
            expect(res.headers['x-xss-protection']).toBe('0');
            expect(res.headers['x-content-type-options']).toBe('nosniff');
            expect(res.headers['strict-transport-security']).toBeDefined();
            // Powered by Express must be hidden
            expect(res.headers['x-powered-by']).toBeUndefined();
        });
    });

    describe('Unexpected HTTP Methods & Routes', () => {
        it('returns 404 for unhandled HTTP methods (POST, PUT, DELETE)', async () => {
            let res = await request(app).post('/api/words/test');
            expect(res.status).toBe(404);

            res = await request(app).put('/api/words/test');
            expect(res.status).toBe(404);

            res = await request(app).delete('/api/words/test');
            expect(res.status).toBe(404);
        });

        it('returns 404 for sensitive internal routes', async () => {
            const routes = ['/api/admin', '/api/users', '/api/config', '/api/env', '/.env'];

            for (const route of routes) {
                const res = await request(app).get(route);
                expect(res.status).toBe(404);
            }
        });
    });
});
