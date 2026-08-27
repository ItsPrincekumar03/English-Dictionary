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
});
