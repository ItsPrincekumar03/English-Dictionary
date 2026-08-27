const fs = require('fs');
const path = require('path');
const { parseWordNetJSON } = require('./parser');

function auditMetrics() {
    console.log("--- ACTUAL SOURCE OF TRUTH METRICS ---");
    const synsets = [];
    const antonymPairs = [];
    const pronunciations = [];
    
    // Dataset is in backend directory
    const datasetDir = path.join(__dirname, '../../');
    const synsetFiles = fs.readdirSync(datasetDir).filter(f => /^(noun|verb|adj|adv)\..*\.json$/.test(f));
    const entriesFiles = fs.readdirSync(datasetDir).filter(f => /^entries-.*\.json$/.test(f));
    
    let sourceLexicalEntries = 0;
    
    for (const file of synsetFiles) {
        const parsed = parseWordNetJSON(fs.readFileSync(path.join(datasetDir, file), 'utf8'));
        if (parsed) synsets.push(...parsed);
    }
    
    for (const file of entriesFiles) {
        const content = fs.readFileSync(path.join(datasetDir, file), 'utf8');
        const data = JSON.parse(content);
        sourceLexicalEntries += Object.keys(data).length;
        
        const parsedData = parseWordNetJSON(content, true);
        if (parsedData) {
            antonymPairs.push(...parsedData.antonymPairs);
            pronunciations.push(...parsedData.pronunciations);
        }
    }
    
    const wordMap = new Map();
    synsets.forEach(synset => {
        if (!synset || !synset.members) return;
        synset.members.forEach(member => {
            const word = member.toLowerCase();
            if (!wordMap.has(word)) {
                wordMap.set(word, []);
            }
            wordMap.get(word).push(synset);
        });
    });

    const canonicalWords = wordMap.size;
    let expectedBatches = Math.ceil(canonicalWords / 1000);
    
    console.log(`Source synsets: ${synsets.length}`);
    console.log(`Source lexical entries: ${sourceLexicalEntries}`);
    console.log(`Canonical words: ${canonicalWords}`);
    console.log(`Antonym pairs extracted: ${antonymPairs.length}`);
    console.log(`Pronunciations extracted: ${pronunciations.length}`);
    console.log(`Expected batches: ${expectedBatches}`);
}

auditMetrics();
