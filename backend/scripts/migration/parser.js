function parseWordNetJSON(jsonStr, isEntriesFile = false) {
  try {
    const data = JSON.parse(jsonStr);
    
    // For mocked tests
    if (Array.isArray(data)) return data;
    if (data.synsets && Array.isArray(data.synsets)) return data.synsets;

    if (isEntriesFile) {
        const result = { antonymPairs: [], pronunciations: [] };
        
        for (const [lemma, posObj] of Object.entries(data)) {
            const cleanLemma = lemma.replace(/_/g, ' ');
            let addedPronunciation = false;

            for (const pos of Object.keys(posObj)) {
                // Parse antonyms
                if (posObj[pos].sense && Array.isArray(posObj[pos].sense)) {
                    posObj[pos].sense.forEach(s => {
                        if (s.antonym && Array.isArray(s.antonym)) {
                            s.antonym.forEach(ant => {
                                const targetLemma = ant.split('%')[0].replace(/_/g, ' ');
                                result.antonymPairs.push({ source: cleanLemma, target: targetLemma });
                            });
                        }
                    });
                }

                // Parse pronunciation
                if (!addedPronunciation && posObj[pos].pronunciation && Array.isArray(posObj[pos].pronunciation)) {
                    const pronList = posObj[pos].pronunciation;
                    let uk = "";
                    let us = "";
                    
                    const gbEntry = pronList.find(p => p.variety === 'GB');
                    if (gbEntry && gbEntry.value) uk = gbEntry.value.trim();
                    
                    const usEntry = pronList.find(p => p.variety === 'US');
                    if (usEntry && usEntry.value) us = usEntry.value.trim();

                    if (uk || us) {
                        result.pronunciations.push({ lemma: cleanLemma, uk, us });
                        addedPronunciation = true; // only take first POS's pronunciation for simplicity
                    }
                }
            }
        }
        return result;
    } else {
        const synsets = [];
        for (const [id, synsetObj] of Object.entries(data)) {
            if (typeof synsetObj === 'object' && synsetObj !== null && !Array.isArray(synsetObj) && !id.startsWith('entries') && id.match(/^[0-9]{8}-[nvasr]$/)) {
                synsetObj.id = id;
                if (synsetObj.example) synsetObj.examples = synsetObj.example;
                if (synsetObj.partOfSpeech) synsetObj.pos = synsetObj.partOfSpeech;
                if (Array.isArray(synsetObj.definition)) synsetObj.definition = synsetObj.definition[0];
                synsets.push(synsetObj);
            }
        }
        return synsets;
    }
  } catch(e) {
    return null;
  }
}
module.exports = { parseWordNetJSON };
