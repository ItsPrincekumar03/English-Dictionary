const { parseWordNetJSON } = require('./parser');
const { transformSynsetsToWords } = require('./transformer');
const { validateMigrationRecord } = require('./validator');
const { importBatch } = require('./importer');

async function runMigration(inputData, inputAntonyms = [], inputPronunciations = []) {
  const metrics = {
    totalSourceRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    skippedRecords: 0,
    importedRecords: 0,
    duplicateCount: 0,
    missingDefinitions: 0,
    missingExamples: 0,
    missingSynonyms: 0,
    missingAntonyms: 0,
    missingPronunciation: 0,
    missingAudio: 0,
    wordsWithGBPronunciation: 0,
    wordsWithUSPronunciation: 0,
    wordsWithBothPronunciations: 0,
    wordsWithOnlyGB: 0,
    wordsWithOnlyUS: 0,
    failedBatches: 0,
    importDuration: 0
  };

  const startTime = Date.now();

  let synsets = [];
  if (typeof inputData === 'string') {
      synsets = parseWordNetJSON(inputData) || [];
  } else if (Array.isArray(inputData)) {
      synsets = inputData;
  }
  
  metrics.totalSourceRecords = synsets.length;

  const words = transformSynsetsToWords(synsets, inputAntonyms, inputPronunciations);
  
  const validBatch = [];
  
  for (const word of words) {
     const status = validateMigrationRecord(word);
     if (status === 'SKIPPED') {
        metrics.skippedRecords++;
     } else if (status === 'INVALID') {
        metrics.invalidRecords++;
     } else {
        metrics.validRecords++;
        validBatch.push(word);
        
        if (word.meanings.some(m => m.definitions.some(d => !d.examples || d.examples.length === 0))) metrics.missingExamples++;
        if (word.synonyms.length === 0) metrics.missingSynonyms++;
        if (word.antonyms.length === 0) metrics.missingAntonyms++;
        
        const hasUk = !!(word.pronunciation && word.pronunciation.uk);
        const hasUs = !!(word.pronunciation && word.pronunciation.us);
        
        if (!hasUk && !hasUs) {
            metrics.missingPronunciation++;
        }
        if (hasUk) metrics.wordsWithGBPronunciation++;
        if (hasUs) metrics.wordsWithUSPronunciation++;
        if (hasUk && hasUs) metrics.wordsWithBothPronunciations++;
        if (hasUk && !hasUs) metrics.wordsWithOnlyGB++;
        if (!hasUk && hasUs) metrics.wordsWithOnlyUS++;
        
        if (!word.audio || !word.audio.uk) metrics.missingAudio++;
     }
  }

  const chunkSize = 1000;
  for (let i = 0; i < validBatch.length; i += chunkSize) {
    const chunk = validBatch.slice(i, i + chunkSize);
    const result = await importBatch(chunk);
    if (result.success) {
      metrics.importedRecords += chunk.length;
    } else {
      metrics.failedBatches++;
    }
  }

  metrics.importDuration = Date.now() - startTime;
  return metrics;
}

module.exports = { runMigration };
