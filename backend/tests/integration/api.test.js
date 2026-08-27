// tests/integration/api.test.js
const request = require('supertest');
const app = require('../../src/app');
const Word = require('../../src/models/Word');

// Mock Mongoose model to avoid needing a real DB connection
jest.mock('../../src/models/Word');

describe('API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Default mock implementation for finding a word
        const mockSelect = jest.fn().mockImplementation(() => {
            return {
                word: 'testword',
                pronunciation: { uk: '/test/', us: '/test/' },
                audio: { uk: '', us: '' },
                meanings: [
                    {
                        partOfSpeech: 'noun',
                        definitions: [
                            { text: 'A word used exclusively for automated testing', examples: ['This is a testword.'] }
                        ]
                    }
                ],
                synonyms: ['mockword'],
                antonyms: [],
                relatedWords: []
            };
        });
        
        Word.findOne.mockReturnValue({ 
            select: jest.fn().mockReturnValue({
                lean: mockSelect
            }) 
        });
    });

    describe('GET /api/health', () => {
        it('returns status reflecting database state and a health check message', async () => {
            const res = await request(app).get('/api/health');
            // Since this is a unit test without DB connection, it expects 503
            expect(res.status).toBe(503);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('English Dictionary API health check');
            expect(res.body.database).toBe('disconnected');
        });
    });

    describe('GET /api/words/:word', () => {
        it('returns 200 and the dictionary entry for an existing word', async () => {
            const res = await request(app).get('/api/words/testword');
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.word).toBe('testword');
            expect(res.body.data.meanings[0].partOfSpeech).toBe('noun');
            expect(res.body.data.synonyms).toContain('mockword');
        });

        it('returns 404 when the word does not exist', async () => {
            // Override mock for this specific test
            Word.findOne.mockReturnValue({ 
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null)
                }) 
            });

            const res = await request(app).get('/api/words/nonexistent');
            
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Word not found');
        });

        it('returns 400 when the search term is invalid', async () => {
            const res = await request(app).get('/api/words/123456');
            
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid search term');
        });

        it('returns 400 for very long input', async () => {
            const res = await request(app).get('/api/words/' + 'a'.repeat(101));
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Search term is too long');
        });

        it('returns 400 for special characters to prevent NoSQL injection', async () => {
            const res = await request(app).get('/api/words/{$ne:null}');
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid search term');
        });

        it('returns 500 safely when the database query throws an unexpected error', async () => {
            // Mock a database crash
            Word.findOne.mockReturnValue({ 
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockRejectedValue(new Error('Mongoose connection failed'))
                })
            });

            const res = await request(app).get('/api/words/validword');
            
            // Expected safe JSON with no stack trace
            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Internal server error'); // Stack trace hidden!
            expect(res.body.message).not.toMatch(/Mongoose/); // Implementation details hidden!
        });
    });

    describe('GET /api/words/', () => {
        it('returns 404 Route not found for missing word parameter', async () => {
            const res = await request(app).get('/api/words/');
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Route not found');
        });
    });

    describe('Rate Limiting', () => {
        it('returns 429 when the rate limit is exceeded', async () => {
            // We need to exhaust the 100 requests limit minus the few requests 
            // we already made in the tests above.
            for (let i = 0; i < 100; i++) {
                await request(app).get('/api/words/ratelimittest');
            }
            
            const res = await request(app).get('/api/words/ratelimittest');
            expect(res.status).toBe(429);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/too many requests/i);
        });
    });

    describe('Security and CORS Middleware', () => {
        it('rejects cross-origin requests from unknown origins', async () => {
            const res = await request(app)
                .get('/api/health')
                .set('Origin', 'http://malicious.com');
                
            expect(res.status).toBe(500);
            expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });

        it('accepts requests from allowed origins', async () => {
            const res = await request(app)
                .get('/api/health')
                .set('Origin', 'http://localhost:5500');
                
            expect(res.status).toBe(503);
            expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5500');
        });

        it('includes helmet security headers', async () => {
            const res = await request(app).get('/api/health');
            
            expect(res.headers['x-powered-by']).toBeUndefined();
            expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
            expect(res.headers['x-content-type-options']).toBe('nosniff');
        });
    });

    describe('Error Handling Middleware', () => {
        it('returns 404 for unknown routes', async () => {
            const res = await request(app).get('/api/does-not-exist');
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Route not found');
        });
    });
});
