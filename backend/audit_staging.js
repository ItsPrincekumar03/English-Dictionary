const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { runMigration } = require('./scripts/migration/migration');
const { parseWordNetJSON } = require('./scripts/migration/parser');
const Word = require('./src/models/Word');

async function main() {
  console.log("=== DATASET INTEGRITY AUDIT ===");
  const synsets = [];
  const antonymPairs = [];
  const pronunciations = [];
  
  const files = fs.readdirSync(__dirname);
  const dataFiles = files.filter(f => /^(noun|verb|adj|adv)\..*\.json$/.test(f));
  const entriesFiles = files.filter(f => /^entries-.*\.json$/.test(f));
  
  for (const file of dataFiles) {
      const parsed = parseWordNetJSON(fs.readFileSync(path.join(__dirname, file), 'utf8'));
      if (parsed) synsets.push(...parsed);
  }
  
  let lexicalEntriesCount = 0;
  for (const file of entriesFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const data = JSON.parse(content);
      lexicalEntriesCount += Object.keys(data).length;
      
      const parsedData = parseWordNetJSON(content, true);
      if (parsedData) {
          antonymPairs.push(...parsedData.antonymPairs);
          pronunciations.push(...parsedData.pronunciations);
      }
  }
  console.log(`Source synsets: ${synsets.length}`);
  console.log(`Source lexical entries: ${lexicalEntriesCount}`);

  const mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri() + 'dictionary_staging';
  await mongoose.connect(process.env.MONGODB_URI);

  const startT = Date.now();
  await runMigration(synsets, antonymPairs, pronunciations);
  const endT = Date.now();
  console.log(`Migration Duration: ${endT - startT}ms`);

  const totalWords = await Word.countDocuments();
  console.log(`Total words: ${totalWords}`);

  const missingSyn = await Word.countDocuments({ "synonyms.0": { $exists: false } });
  const missingAnt = await Word.countDocuments({ "antonyms.0": { $exists: false } });
  const missingRel = await Word.countDocuments({ "relatedWords.0": { $exists: false } });
  const missingUk = await Word.countDocuments({ $or: [{ "pronunciation.uk": { $exists: false } }, { "pronunciation.uk": "" }] });
  const missingUs = await Word.countDocuments({ $or: [{ "pronunciation.us": { $exists: false } }, { "pronunciation.us": "" }] });
  const missingAudioUk = await Word.countDocuments({ $or: [{ "audio.uk": { $exists: false } }, { "audio.uk": "" }] });

  console.log(`Missing synonyms: ${missingSyn}`);
  console.log(`Missing antonyms: ${missingAnt}`);
  console.log(`Missing relatedWords: ${missingRel}`);
  console.log(`Missing UK pron: ${missingUk}`);
  console.log(`Missing US pron: ${missingUs}`);
  console.log(`Missing UK audio: ${missingAudioUk}`);

  // Schema Validation (100 sample docs)
  const samples = await Word.aggregate([{ $sample: { size: 100 } }]);
  let validDocs = 0;
  samples.forEach(doc => {
      if (doc.word && doc.meanings && doc.meanings.length > 0 && doc.meanings[0].definitions.length > 0) {
          validDocs++;
      }
  });
  console.log(`Valid 100 sample docs: ${validDocs}/100`);

  // Word matrix
  const matrixWords = ['happy', 'run', 'good', 'hot', 'large', 'well-known', 'nonexistentword'];
  for (const w of matrixWords) {
      console.time(`lookup_${w}`);
      const doc = await Word.findOne({ word: w }).lean();
      console.timeEnd(`lookup_${w}`);
      if (doc) {
          console.log(`MATRIX: ${w} | Exists: true | Meanings: ${doc.meanings.length} | Synonyms: ${doc.synonyms.length} | Antonyms: ${doc.antonyms.length} | UK: ${doc.pronunciation?.uk || '-'} | US: ${doc.pronunciation?.us || '-'}`);
      } else {
          console.log(`MATRIX: ${w} | Exists: false`);
      }
  }

  await mongoose.disconnect();
  await mongoServer.stop();
}

main().catch(console.error);
