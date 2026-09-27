import fs from 'fs';
import { parse } from 'csv-parse/sync';

/**
 * Parses and normalizes CSV/TSV tabular data files
 * @param {string} filePath
 * @param {string} sourceType
 * @returns {{ columns: string[], records: Array<{ originalRef: string, raw: string, normalized: Object }>, totalCount: number }}
 */
export function parseAndNormalizeCsv(filePath, sourceType) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // Parse CSV with auto-delimiter detection and trim
  const rawRows = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  if (!rawRows || rawRows.length === 0) {
    return {
      columns: [],
      records: [],
      totalCount: 0
    };
  }

  const columns = Object.keys(rawRows[0]);
  const records = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 1;
    const rawString = JSON.stringify(row);
    
    // Normalization mapping based on source type while strictly preserving all original keys
    const normalizedData = {
      _source_type: sourceType,
      _row_index: rowNumber,
      ...row
    };

    // Construct high-value traceability label
    let traceabilityLabel = `Row ${rowNumber}`;
    if (sourceType === 'CDR') {
      const caller = row['Caller Number'] || row['CALLING_NO'] || row['caller_number'] || row['Caller'] || row['caller'] || '';
      const receiver = row['Receiver Number'] || row['CALLED_NO'] || row['receiver_number'] || row['Receiver'] || row['receiver'] || '';
      if (caller && receiver) {
        traceabilityLabel = `Row ${rowNumber} [${caller} ➔ ${receiver}]`;
      }
    } else if (sourceType === 'FINANCIAL_TRANSACTIONS') {
      const sender = row['Sender'] || row['SENDER'] || row['sender'] || row['Account Number'] || '';
      const amount = row['Transaction Amount'] || row['AMOUNT'] || row['amount'] || row['Amount'] || '';
      if (sender || amount) {
        traceabilityLabel = `Row ${rowNumber} [${sender} | ${amount}]`;
      }
    }

    records.push({
      originalRef: traceabilityLabel,
      raw: rawString,
      normalized: normalizedData
    });
  });

  return {
    columns,
    records,
    totalCount: records.length
  };
}
