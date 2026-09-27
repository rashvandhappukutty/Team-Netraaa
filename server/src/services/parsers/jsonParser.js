import fs from 'fs';

/**
 * Parses and normalizes structured JSON intelligence datasets
 * @param {string} filePath
 * @param {string} sourceType
 * @returns {{ records: Array<{ originalRef: string, raw: string, normalized: Object }>, totalCount: number }}
 */
export function parseAndNormalizeJson(filePath, sourceType) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error(`Invalid JSON syntax in data source: ${err.message}`);
  }

  const items = Array.isArray(parsed) ? parsed : (parsed.records || parsed.data || parsed.items || [parsed]);
  const records = [];

  items.forEach((item, index) => {
    const itemNum = index + 1;
    const rawString = JSON.stringify(item);
    
    records.push({
      originalRef: `JSON Entry #${itemNum}${item.id ? ` [ID: ${item.id}]` : ''}`,
      raw: rawString,
      normalized: {
        _source_type: sourceType,
        _entry_index: itemNum,
        ...item
      }
    });
  });

  return {
    records,
    totalCount: records.length
  };
}
