// tests/unit/wordService.test.js
const wordService = require('../../src/services/wordService');
const Word = require('../../src/models/Word');

// Mock the Word model to avoid database interactions in this unit test
jest.mock('../../src/models/Word');

describe('Word Service Unit Tests', () => {
    // Clear mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getWordByName', () => {
        it('throws an error if the word is empty', async () => {
            await expect(wordService.getWordByName('')).rejects.toThrow('Word is required');
        });

        it('throws an error if the word is too long', async () => {
            const longWord = 'a'.repeat(101);
            await expect(wordService.getWordByName(longWord)).rejects.toThrow('Search term is too long');
        });

        it('throws an error if the word contains invalid characters', async () => {
            await expect(wordService.getWordByName('hello<script>')).rejects.toThrow('Invalid search term');
            await expect(wordService.getWordByName('123456')).rejects.toThrow('Invalid search term');
        });

        it('normalizes the word (trim and lowercase) before querying', async () => {
            // Setup the mock to return something so it chains .select()
            const mockSelect = jest.fn().mockResolvedValue({ word: 'happy' });
            Word.findOne.mockReturnValue({ select: mockSelect });

            await wordService.getWordByName('  HaPpY  ');

            // Verify findOne was called with the normalized word
            expect(Word.findOne).toHaveBeenCalledWith({ word: 'happy' });
            expect(mockSelect).toHaveBeenCalledWith('-__v -createdAt -updatedAt');
        });

        it('returns null if the word is not found', async () => {
            const mockSelect = jest.fn().mockResolvedValue(null);
            Word.findOne.mockReturnValue({ select: mockSelect });

            const result = await wordService.getWordByName('unknown');
            expect(result).toBeNull();
        });

        it('returns the word document if found', async () => {
            const mockDoc = { word: 'happy', meanings: [] };
            const mockSelect = jest.fn().mockResolvedValue(mockDoc);
            Word.findOne.mockReturnValue({ select: mockSelect });

            const result = await wordService.getWordByName('happy');
            expect(result).toEqual(mockDoc);
        });
    });
});
