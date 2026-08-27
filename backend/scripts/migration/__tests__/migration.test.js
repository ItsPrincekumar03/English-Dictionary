const { runMigration } = require('../migration');
const { importBatch } = require('../importer');

jest.mock('../importer');

describe('migration metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates metrics correctly', async () => {
    importBatch.mockResolvedValue({ success: true, count: 1 });

    const jsonStr = JSON.stringify({
      synsets: [
        { id: "1", pos: "n", definition: "Test 1.", members: ["validword"] },
        { id: "2", pos: "n", definition: "Test 2.", members: ["secondword"] }
      ]
    });

    const pronunciations = [
      { lemma: "validword", uk: "test", us: "test" },
      { lemma: "secondword", uk: "test", us: "" }
    ];

    const metrics = await runMigration(jsonStr, [], pronunciations);

    expect(metrics.totalSourceRecords).toBe(2);
    expect(metrics.validRecords).toBe(2);
    expect(metrics.importedRecords).toBe(2);
    expect(metrics.missingPronunciation).toBe(0);
    expect(metrics.wordsWithGBPronunciation).toBe(2);
    expect(metrics.wordsWithUSPronunciation).toBe(1);
    expect(metrics.wordsWithOnlyGB).toBe(1);
  });
});
