const { parseWordNetJSON } = require('../parser');

describe('parser', () => {
  it('parses valid JSON', () => {
    const jsonStr = JSON.stringify({ synsets: [{ id: "1" }] });
    const result = parseWordNetJSON(jsonStr);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it('handles empty JSON gracefully', () => {
    const jsonStr = JSON.stringify({});
    const result = parseWordNetJSON(jsonStr);
    expect(result).toEqual([]);
  });

  it('handles malformed JSON gracefully', () => {
    const result = parseWordNetJSON("{ bad json");
    expect(result).toBeNull();
  });

  it('regression: correctly maps synset object and preserves members array (not words)', () => {
    const rawData = {
      "00034778-n": {
        "definition": ["an action"],
        "members": ["thing"],
        "partOfSpeech": "n"
      }
    };
    const result = parseWordNetJSON(JSON.stringify(rawData));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("00034778-n");
    expect(result[0].pos).toBe("n");
    expect(result[0].members).toEqual(["thing"]);
    expect(result[0].words).toBeUndefined();
  });
});
