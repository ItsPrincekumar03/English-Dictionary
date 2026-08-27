const { importBatch } = require('../importer');
const Word = require('../../../src/models/Word');

jest.mock('../../../src/models/Word');

describe('importer', () => {
  const originalUri = process.env.MONGODB_URI;

  beforeAll(() => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
  });

  afterAll(() => {
    process.env.MONGODB_URI = originalUri;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('safely inserts a batch of words without duplicates', async () => {
    Word.bulkWrite.mockResolvedValue({ upsertedCount: 2, modifiedCount: 0, insertedCount: 0 });
    
    const records = [
      { word: "happy", meanings: [{ partOfSpeech: "adjective", definitions: [{ text: "glad" }] }] },
      { word: "sad", meanings: [{ partOfSpeech: "adjective", definitions: [{ text: "unhappy" }] }] }
    ];
    
    const result = await importBatch(records);
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(Word.bulkWrite).toHaveBeenCalledTimes(1);
  });

  it('performs upsert correctly when word already exists', async () => {
    Word.bulkWrite.mockResolvedValue({ upsertedCount: 0, modifiedCount: 1, insertedCount: 0 });

    const updatedRecord = { word: "upserttest", meanings: [{ partOfSpeech: "noun", definitions: [{ text: "v2" }] }] };
    const result = await importBatch([updatedRecord]);
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(Word.bulkWrite).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({ filter: { word: "upserttest" }, upsert: true })
        })
      ]),
      { ordered: false }
    );
  });

  it('rejects execution if DB URI looks like production', async () => {
    process.env.MONGODB_URI = "mongodb+srv://cluster0.mongodb.net/production";
    delete process.env.ALLOW_PRODUCTION_MIGRATION;
    
    const result = await importBatch([{ word: "fail" }]);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/SAFETY GUARD/);
    
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
  });
});
