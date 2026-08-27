const Word = require('../../src/models/Word');

async function importBatch(records) {
  if (!records || records.length === 0) return { success: true, count: 0 };
  
  // Safety guard against production usage
  const dbUri = process.env.MONGODB_URI || '';
  if (!dbUri.includes('test') && !dbUri.includes('staging') && !dbUri.includes('memory') && !dbUri.includes('127.0.0.1') && !dbUri.includes('localhost')) {
     if (process.env.ALLOW_PRODUCTION_MIGRATION !== 'true') {
         return { success: false, error: "SAFETY GUARD: Refusing to import to a production-like database. Set ALLOW_PRODUCTION_MIGRATION=true to override." };
     }
  }

  const operations = records.map(record => ({
    updateOne: {
      filter: { word: record.word },
      update: { $set: record },
      upsert: true
    }
  }));

  try {
    const result = await Word.bulkWrite(operations, { ordered: false });
    return { success: true, count: result.upsertedCount + result.modifiedCount + (result.insertedCount || 0) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { importBatch };
