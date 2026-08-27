const fs = require('fs');

const words = ["can't", "don't", "won't", "isn't", "can t", "don t"];
const files = ['entries-c.json', 'entries-d.json', 'entries-w.json', 'entries-i.json'];

files.forEach(f => {
  try {
    const data = JSON.parse(fs.readFileSync(f, 'utf8'));
    words.forEach(w => {
      if (data[w]) {
        console.log('FOUND:', w);
      }
    });
  } catch (e) {
    console.error(e);
  }
});
