import path from 'path';
import fs from 'fs';
import db from '../config/db.js';
import { generateDataSourceId } from '../services/idGenerator.js';
import { calculateFileHash, verifyFileIntegrity } from '../services/hashService.js';
import { recordAuditLog } from '../services/auditService.js';
import { processAndNormalizeDataSource } from '../services/normalizationService.js';

// Format validation mapping
const SOURCE_FORMAT_RULES = {
  'FIR_POLICE_REPORT': ['pdf', 'docx', 'doc', 'txt', 'log'],
  'CDR': ['csv', 'tsv', 'xlsx', 'xls', 'txt'],
  'FINANCIAL_TRANSACTIONS': ['csv', 'tsv', 'xlsx', 'xls', 'txt'],
  'SURVEILLANCE_REPORT': ['pdf', 'docx', 'doc', 'txt', 'log'],
  'CRIMINAL_HISTORY': ['csv', 'tsv', 'xlsx', 'json', 'txt'],
  'SOCIAL_MEDIA_INTEL': ['csv', 'json', 'txt', 'log'],
  'OTHER': ['pdf', 'docx', 'txt', 'csv', 'xlsx', 'json', 'log']
};

export async function uploadDataSource(req, res) {
  try {
    const { investigationId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No data source file uploaded.' });
    }

    const inv = isNaN(investigationId)
      ? db.get('SELECT * FROM investigations WHERE investigation_id = ?', [investigationId])
      : db.get('SELECT * FROM investigations WHERE id = ?', [investigationId]);

    if (!inv) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Associated investigation container not found.' });
    }

    const { source_type = 'FIR_POLICE_REPORT' } = req.body;
    const originalFileName = file.originalname;
    const fileExtension = path.extname(originalFileName).replace('.', '').toLowerCase();
    const mimeType = file.mimetype || 'application/octet-stream';
    const fileSize = file.size;

    // 1. Source format validation
    const allowedExts = SOURCE_FORMAT_RULES[source_type] || SOURCE_FORMAT_RULES['OTHER'];
    if (!allowedExts.includes(fileExtension)) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({
        error: `Unsupported file format (.${fileExtension}) for source type "${source_type}". Allowed formats: ${allowedExts.map(e => '.' + e).join(', ')}`
      });
    }

    // 2. Generate SHA-256 Hash
    const sha256Hash = await calculateFileHash(file.path);

    // 3. Generate unique Data Source ID
    const dataSourceId = generateDataSourceId();

    // 4. Insert into database
    db.run(`
      INSERT INTO data_sources (
        data_source_id, investigation_id, source_type, file_name,
        file_path, file_extension, mime_type, file_size, sha256_hash,
        integrity_status, uploaded_by, processing_status, record_count, extraction_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?, 'VALIDATING', 0, 'PENDING')
    `, [
      dataSourceId,
      inv.id,
      source_type,
      originalFileName,
      file.path,
      fileExtension,
      mimeType,
      fileSize,
      sha256Hash,
      req.user.id
    ]);

    const createdRecord = db.get('SELECT id FROM data_sources WHERE data_source_id = ?', [dataSourceId]);
    const newDsDbId = createdRecord ? createdRecord.id : null;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    // 5. Record initial Audit Logs
    recordAuditLog({
      investigationId: inv.id,
      dataSourceId: newDsDbId,
      userId: req.user.id,
      action: 'DATA_SOURCE_UPLOADED',
      details: `Data Source ${dataSourceId} ("${originalFileName}", ${source_type}, ${(fileSize / 1024).toFixed(1)} KB) ingested by ${req.user.name}.`,
      ipAddress: ip
    });

    recordAuditLog({
      investigationId: inv.id,
      dataSourceId: newDsDbId,
      userId: req.user.id,
      action: 'FILE_VALIDATED',
      details: `Source file structure validated (.${fileExtension} format compatible with ${source_type}).`,
      ipAddress: ip
    });

    recordAuditLog({
      investigationId: inv.id,
      dataSourceId: newDsDbId,
      userId: req.user.id,
      action: 'HASH_GENERATED',
      details: `SHA-256 cryptographic master seal: ${sha256Hash}`,
      ipAddress: ip
    });

    // 6. Execute Content Extraction & Normalization Engine
    const dataSourceObj = {
      id: newDsDbId,
      investigation_id: inv.id,
      data_source_id: dataSourceId,
      source_type,
      file_name: originalFileName,
      file_path: file.path,
      file_extension: fileExtension
    };

    const normResult = await processAndNormalizeDataSource(dataSourceObj, req.user.id, ip);

    const finalDataSource = db.get(`
      SELECT ds.*, u.name as uploader_name, u.badge_number as uploader_badge, i.investigation_id as parent_inv_id, i.title as investigation_title
      FROM data_sources ds
      JOIN users u ON ds.uploaded_by = u.id
      JOIN investigations i ON ds.investigation_id = i.id
      WHERE ds.id = ?
    `, [newDsDbId]);

    return res.status(201).json({
      message: 'Data source uploaded, validated, extracted, and normalized into unified intelligence format.',
      data_source: finalDataSource,
      normalization: normResult
    });
  } catch (error) {
    console.error('Error uploading data source:', error);
    return res.status(500).json({ error: error.message || 'Failed to process data source upload.' });
  }
}

export function getDataSourcesByInvestigation(req, res) {
  try {
    const { investigationId } = req.params;
    const inv = isNaN(investigationId)
      ? db.get('SELECT id FROM investigations WHERE investigation_id = ?', [investigationId])
      : db.get('SELECT id FROM investigations WHERE id = ?', [investigationId]);

    if (!inv) {
      return res.status(404).json({ error: 'Investigation not found.' });
    }

    const sources = db.all(`
      SELECT ds.*, u.name as uploader_name, u.badge_number as uploader_badge
      FROM data_sources ds
      JOIN users u ON ds.uploaded_by = u.id
      WHERE ds.investigation_id = ?
      ORDER BY ds.uploaded_at DESC
    `, [inv.id]);

    return res.json({ data_sources: sources });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch data sources.' });
  }
}

export function getAllDataSources(req, res) {
  try {
    const { search, source_type, integrity, processing_status } = req.query;
    let query = `
      SELECT ds.*, u.name as uploader_name, u.badge_number as uploader_badge, i.investigation_id as parent_inv_id, i.title as investigation_title
      FROM data_sources ds
      JOIN users u ON ds.uploaded_by = u.id
      JOIN investigations i ON ds.investigation_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (ds.data_source_id LIKE ? OR ds.file_name LIKE ? OR i.investigation_id LIKE ? OR i.title LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (source_type) {
      query += ` AND ds.source_type = ?`;
      params.push(source_type);
    }

    if (integrity) {
      query += ` AND ds.integrity_status = ?`;
      params.push(integrity.toUpperCase());
    }

    if (processing_status) {
      query += ` AND ds.processing_status = ?`;
      params.push(processing_status.toUpperCase());
    }

    query += ` ORDER BY ds.uploaded_at DESC`;

    const sources = db.all(query, params);
    return res.json({ data_sources: sources });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve data sources.' });
  }
}

export function getDataSourceById(req, res) {
  try {
    const { id } = req.params;
    const ds = isNaN(id)
      ? db.get(`
          SELECT ds.*, u.name as uploader_name, u.badge_number as uploader_badge, i.investigation_id as parent_inv_id, i.title as investigation_title
          FROM data_sources ds
          JOIN users u ON ds.uploaded_by = u.id
          JOIN investigations i ON ds.investigation_id = i.id
          WHERE ds.data_source_id = ?
        `, [id])
      : db.get(`
          SELECT ds.*, u.name as uploader_name, u.badge_number as uploader_badge, i.investigation_id as parent_inv_id, i.title as investigation_title
          FROM data_sources ds
          JOIN users u ON ds.uploaded_by = u.id
          JOIN investigations i ON ds.investigation_id = i.id
          WHERE ds.id = ?
        `, [id]);

    if (!ds) {
      return res.status(404).json({ error: 'Data source not found.' });
    }

    const extracted = db.get(`
      SELECT * FROM extracted_content WHERE data_source_id = ?
    `, [ds.id]);

    const normalizedSample = db.all(`
      SELECT * FROM normalized_records WHERE data_source_id = ? ORDER BY id ASC LIMIT 25
    `, [ds.id]);

    return res.json({
      data_source: ds,
      extracted_content: extracted,
      normalized_sample: normalizedSample
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve data source details.' });
  }
}

export function getDataSourcePreview(req, res) {
  try {
    const { id } = req.params;
    const ds = isNaN(id)
      ? db.get('SELECT id FROM data_sources WHERE data_source_id = ?', [id])
      : db.get('SELECT id FROM data_sources WHERE id = ?', [id]);

    if (!ds) {
      return res.status(404).json({ error: 'Data source not found.' });
    }

    const extracted = db.get('SELECT * FROM extracted_content WHERE data_source_id = ?', [ds.id]);
    const normalizedRecords = db.all('SELECT * FROM normalized_records WHERE data_source_id = ? ORDER BY id ASC LIMIT 50', [ds.id]);

    return res.json({
      extracted_content: extracted,
      normalized_records: normalizedRecords
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load preview.' });
  }
}

export function getNormalizedRecords(req, res) {
  try {
    const { id } = req.params; // data_source ID or investigation ID via query
    const { investigation_id, search, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT nr.*, ds.data_source_id as source_code, ds.file_name, ds.source_type as ds_source_type, i.investigation_id as inv_code
      FROM normalized_records nr
      JOIN data_sources ds ON nr.data_source_id = ds.id
      JOIN investigations i ON nr.investigation_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (id) {
      const ds = isNaN(id)
        ? db.get('SELECT id FROM data_sources WHERE data_source_id = ?', [id])
        : { id };
      if (ds) {
        query += ` AND nr.data_source_id = ?`;
        params.push(ds.id);
      }
    }

    if (investigation_id) {
      const inv = isNaN(investigation_id)
        ? db.get('SELECT id FROM investigations WHERE investigation_id = ?', [investigation_id])
        : { id: investigation_id };
      if (inv) {
        query += ` AND nr.investigation_id = ?`;
        params.push(inv.id);
      }
    }

    if (search) {
      query += ` AND (nr.record_id LIKE ? OR nr.original_record_reference LIKE ? OR nr.raw_content LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY nr.id ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const records = db.all(query, params);
    const parsedRecords = records.map(r => ({
      ...r,
      normalized_content: JSON.parse(r.normalized_content)
    }));

    return res.json({
      records: parsedRecords,
      count: parsedRecords.length
    });
  } catch (error) {
    console.error('Error fetching normalized records:', error);
    return res.status(500).json({ error: 'Failed to retrieve normalized records.' });
  }
}

export async function verifyDataSourceIntegrity(req, res) {
  try {
    const { id } = req.params;
    const ds = isNaN(id)
      ? db.get('SELECT * FROM data_sources WHERE data_source_id = ?', [id])
      : db.get('SELECT * FROM data_sources WHERE id = ?', [id]);

    if (!ds) {
      return res.status(404).json({ error: 'Data source record not found.' });
    }

    if (!fs.existsSync(ds.file_path)) {
      db.run(`UPDATE data_sources SET integrity_status = 'VERIFICATION_FAILED' WHERE id = ?`, [ds.id]);
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      recordAuditLog({
        investigationId: ds.investigation_id,
        dataSourceId: ds.id,
        userId: req.user.id,
        action: 'INTEGRITY_VERIFIED',
        details: `INTEGRITY ALERT: Source file ${ds.data_source_id} missing from disk storage. Verification failed.`,
        ipAddress: ip
      });

      return res.status(400).json({
        verified: false,
        status: 'VERIFICATION_FAILED',
        error: 'Original source file missing from storage repository.',
        data_source_id: ds.data_source_id
      });
    }

    const verification = await verifyFileIntegrity(ds.file_path, ds.sha256_hash);
    const newStatus = verification.isMatch ? 'VERIFIED' : 'VERIFICATION_FAILED';

    db.run(`UPDATE data_sources SET integrity_status = ? WHERE id = ?`, [newStatus, ds.id]);

    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const auditDetails = verification.isMatch
      ? `Cryptographic integrity verified for ${ds.data_source_id}. Disk file SHA-256 matched recorded master seal (${verification.recalculatedHash.substring(0, 16)}...).`
      : `INTEGRITY ALERT: Tampering detected for ${ds.data_source_id}! Stored hash != Disk hash.`;

    recordAuditLog({
      investigationId: ds.investigation_id,
      dataSourceId: ds.id,
      userId: req.user.id,
      action: 'INTEGRITY_VERIFIED',
      details: auditDetails,
      ipAddress: ip
    });

    return res.json({
      verified: verification.isMatch,
      integrity_status: newStatus,
      data_source_id: ds.data_source_id,
      original_hash: ds.sha256_hash,
      recalculated_hash: verification.recalculatedHash,
      timestamp: new Date().toISOString(),
      verified_by: req.user.name
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify data source integrity.' });
  }
}

export function downloadOriginalFile(req, res) {
  try {
    const { id } = req.params;
    const ds = isNaN(id)
      ? db.get('SELECT * FROM data_sources WHERE data_source_id = ?', [id])
      : db.get('SELECT * FROM data_sources WHERE id = ?', [id]);

    if (!ds) {
      return res.status(404).json({ error: 'Data source not found.' });
    }

    if (!fs.existsSync(ds.file_path)) {
      return res.status(404).json({ error: 'Physical source file not found.' });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    recordAuditLog({
      investigationId: ds.investigation_id,
      dataSourceId: ds.id,
      userId: req.user.id,
      action: 'DATA_SOURCE_ACCESSED',
      details: `Data Source ${ds.data_source_id} (${ds.file_name}) downloaded/accessed by ${req.user.name}.`,
      ipAddress: ip
    });

    res.setHeader('Content-Type', ds.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${ds.file_name}"`);
    return res.sendFile(path.resolve(ds.file_path));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to access source file.' });
  }
}
