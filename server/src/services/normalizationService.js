import db from '../config/db.js';
import { parseAndNormalizeCsv } from './parsers/csvParser.js';
import { parseAndNormalizeDocument } from './parsers/documentParser.js';
import { parseAndNormalizeJson } from './parsers/jsonParser.js';
import { recordAuditLog } from './auditService.js';

/**
 * Executes the complete Extraction & Normalization pipeline for an ingested data source
 * @param {Object} dataSource
 * @param {number} userId
 * @param {string} ipAddress
 */
export async function processAndNormalizeDataSource(dataSource, userId, ipAddress = '127.0.0.1') {
  const { id: dataSourceId, investigation_id, data_source_id, source_type, file_path, file_extension } = dataSource;

  try {
    // 1. Mark status as EXTRACTING
    db.run(`UPDATE data_sources SET processing_status = 'EXTRACTING' WHERE id = ?`, [dataSourceId]);

    const ext = file_extension.toLowerCase().replace('.', '');
    let parseResult = null;
    let contentType = 'DOCUMENT_TEXT';
    let rawContentToStore = '';

    if (['csv', 'tsv'].includes(ext)) {
      contentType = 'TABULAR_ROWS';
      parseResult = parseAndNormalizeCsv(file_path, source_type);
      rawContentToStore = JSON.stringify({
        columns: parseResult.columns,
        sample_rows: parseResult.records.slice(0, 10).map(r => r.normalized)
      });
    } else if (ext === 'json') {
      contentType = 'JSON_OBJECT';
      parseResult = parseAndNormalizeJson(file_path, source_type);
      rawContentToStore = JSON.stringify(parseResult.records.slice(0, 10).map(r => r.normalized));
    } else {
      // PDF, DOCX, TXT, LOG
      contentType = 'DOCUMENT_TEXT';
      parseResult = await parseAndNormalizeDocument(file_path, file_extension, source_type);
      rawContentToStore = parseResult.rawText.substring(0, 100000); // Store up to 100k chars of raw text
    }

    // 2. Store in extracted_content table (clear previous if any)
    db.run(`DELETE FROM extracted_content WHERE data_source_id = ?`, [dataSourceId]);
    db.run(`DELETE FROM normalized_records WHERE data_source_id = ?`, [dataSourceId]);

    db.run(`
      INSERT INTO extracted_content (investigation_id, data_source_id, content_type, raw_content, original_reference)
      VALUES (?, ?, ?, ?, ?)
    `, [
      investigation_id,
      dataSourceId,
      contentType,
      rawContentToStore,
      `${dataSource.file_name} (${parseResult.totalCount} records extracted)`
    ]);

    // Record Content Extracted Audit Log
    recordAuditLog({
      investigationId: investigation_id,
      dataSourceId,
      userId,
      action: 'CONTENT_EXTRACTED',
      details: `Extracted ${parseResult.totalCount} machine-readable content units from ${data_source_id} (${source_type}).`,
      ipAddress
    });

    // 3. Mark status as NORMALIZING
    db.run(`UPDATE data_sources SET processing_status = 'NORMALIZING' WHERE id = ?`, [dataSourceId]);

    // 4. Insert normalized records into normalized_records table
    const records = parseResult.records || [];
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const recordSeq = String(i + 1).padStart(4, '0');
      const uniqueRecordId = `REC-${data_source_id}-${recordSeq}`;

      db.run(`
        INSERT INTO normalized_records (
          investigation_id, data_source_id, source_type,
          record_id, original_record_reference, raw_content,
          normalized_content, processing_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'READY_FOR_AI')
      `, [
        investigation_id,
        dataSourceId,
        source_type,
        uniqueRecordId,
        rec.originalRef,
        rec.raw,
        JSON.stringify(rec.normalized)
      ]);
    }

    // 5. Update data_sources to READY_FOR_AI
    db.run(`
      UPDATE data_sources
      SET processing_status = 'READY_FOR_AI',
          record_count = ?,
          extraction_status = 'COMPLETED'
      WHERE id = ?
    `, [records.length, dataSourceId]);

    // Record Data Normalized Audit Log
    recordAuditLog({
      investigationId: investigation_id,
      dataSourceId,
      userId,
      action: 'DATA_NORMALIZED',
      details: `Normalized ${records.length} records with source traceability references. Status set to READY_FOR_AI.`,
      ipAddress
    });

    return {
      success: true,
      totalCount: records.length,
      status: 'READY_FOR_AI'
    };
  } catch (error) {
    console.error(`Normalization failed for Data Source ${data_source_id}:`, error);
    db.run(`
      UPDATE data_sources
      SET processing_status = 'FAILED',
          extraction_status = 'FAILED'
      WHERE id = ?
    `, [dataSourceId]);

    recordAuditLog({
      investigationId: investigation_id,
      dataSourceId,
      userId,
      action: 'DATA_NORMALIZED',
      details: `EXTRACTION/NORMALIZATION FAILURE for ${data_source_id}: ${error.message}`,
      ipAddress
    });

    throw error;
  }
}
