const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { runMigration } = require('./scripts/migration/migration');
const { parseWordNetJSON } = require('./scripts/migration/parser');
const Word = require('./src/models/Word');
const wordService = require('./src/services/wordService');

async function main() {
  console.log("STAGING MIGRATION MODE — PRODUCTION DATABASE WILL NOT BE MODIFIED");
  
  // 1. Dataset Verification
  console.log("Loading Open English WordNet 2025 dataset...");
  const synsets = [];
  const antonymPairs = [];
  const pronunciations = [];
  
  const files = fs.readdirSync(__dirname);
  const dataFiles = files.filter(f => /^(noun|verb|adj|adv)\..*\.json$/.test(f));
  const entriesFiles = files.filter(f => /^entries-.*\.json$/.test(f));
  
  for (const file of dataFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const parsed = parseWordNetJSON(content);
      if (parsed) {
          synsets.push(...parsed);
      }
  }
  
  for (const file of entriesFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const parsedData = parseWordNetJSON(content, true);
      if (parsedData) {
          antonymPairs.push(...parsedData.antonymPairs);
          pronunciations.push(...parsedData.pronunciations);
      }
  }
  
  console.log(`Loaded ${synsets.length} synsets.`);
  console.log(`Loaded ${antonymPairs.length} antonym pairs.`);
  console.log(`Loaded ${pronunciations.length} pronunciations.`);

  // 2. Staging Database Safety
  const mongoServer = await MongoMemoryServer.create();
  const stagingUri = mongoServer.getUri() + 'dictionary_staging';
  process.env.MONGODB_URI = stagingUri;
  console.log(`Connected to Staging Database: ${stagingUri}`);
  
  await mongoose.connect(stagingUri);

  // 4. Execute Migration
  console.log("Executing migration pipeline (this might take a few minutes)...");
  
  const metrics = await runMigration(synsets, antonymPairs, pronunciations);
  
  console.log("==================================================");
  console.log("MIGRATION METRICS:");
  console.log(JSON.stringify(metrics, null, 2));
  console.log("==================================================");

  // 5. Data Quality Validation
  console.log("Running Data Quality Validation...");
  
  const sampleWords = ['happy', 'run', 'good', 'hot', 'large'];
  for (const w of sampleWords) {
      const doc = await Word.findOne({ word: w }).lean();
      if (doc) {
          console.log(`[VALIDATION PASS] Word found: ${w}`);
          console.log(`  - Meanings: ${doc.meanings.length}`);
          if (doc.pronunciation && (doc.pronunciation.uk || doc.pronunciation.us)) {
              console.log(`  - Pronunciation populated for ${w}: UK [${doc.pronunciation.uk}], US [${doc.pronunciation.us}]`);
          } else {
              console.log(`  - Pronunciation MISSING for ${w}`);
          }
      } else {
          console.log(`[VALIDATION FAIL/SKIP] Word NOT found: ${w}`);
      }
  }

  // 7. API Validation locally
  const happyWord = await wordService.getWordByName('happy');
  if (happyWord && happyWord.word === 'happy') {
      console.log(`[API VALIDATION PASS] getWordByName('happy') returned successfully.`);
  }

  await mongoose.disconnect();
  await mongoServer.stop();
  console.log("Staging database torn down safely.");
}

main().catch(err => {
  console.error("Migration Failed:", err);
  process.exit(1);
});
