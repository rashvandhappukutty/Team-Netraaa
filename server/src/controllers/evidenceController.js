import path from 'path';
import fs from 'fs';
import db from '../config/db.js';
import { generateEvidenceId } from '../services/idGenerator.js';
import { calculateFileHash, verifyFileIntegrity } from '../services/hashService.js';
import { recordAuditLog } from '../services/auditService.js';
import { detectEvidenceCategory } from '../middleware/upload.js';

export async function uploadEvidence(req, res) {
  try {
    const { caseId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No evidence file provided in the upload payload.' });
    }

    // Verify case exists
    const caseRecord = isNaN(caseId)
      ? db.get('SELECT * FROM cases WHERE case_id = ?', [caseId])
      : db.get('SELECT * FROM cases WHERE id = ?', [caseId]);

    if (!caseRecord) {
      // Clean up orphaned file on disk
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Associated case record not found.' });
    }

    const {
      title,
      description = '',
      evidence_source = 'Field Collection',
      date_collected = new Date().toISOString().split('T')[0]
    } = req.body;

    if (!title || title.trim() === '') {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Evidence title is required.' });
    }

    // 1. Extract file metadata
    const originalFileName = file.originalname;
    const fileExtension = path.extname(originalFileName).replace('.', '').toLowerCase();
    const mimeType = file.mimetype || 'application/octet-stream';
    const fileSize = file.size;
    const evidenceType = detectEvidenceCategory(mimeType, fileExtension);

    // 2. Generate SHA-256 Hash
    const sha256Hash = await calculateFileHash(file.path);

    // 3. Generate unique Evidence ID
    const evidenceId = generateEvidenceId();

    // 4. Insert into database
    const insertRes = db.run(`
      INSERT INTO evidence (
        evidence_id, case_id, title, description, file_name, file_path,
        file_extension, mime_type, file_size, evidence_type, evidence_source,
        date_collected, sha256_hash, integrity_status, processing_status,
        uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', 'UPLOADED', ?)
    `, [
      evidenceId,
      caseRecord.id,
      title.trim(),
      description.trim(),
      originalFileName,
      file.path,
      fileExtension,
      mimeType,
      fileSize,
      evidenceType,
      evidence_source.trim(),
      date_collected,
      sha256Hash,
      req.user.id
    ]);

    const createdRecord = db.get('SELECT id FROM evidence WHERE evidence_id = ?', [evidenceId]);
    const newEvidenceDbId = createdRecord ? createdRecord.id : null;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    // 5. Generate Audit Logs (EVIDENCE_UPLOADED & HASH_GENERATED)
    recordAuditLog({
      caseId: caseRecord.id,
      evidenceId: newEvidenceDbId,
      userId: req.user.id,
      action: 'EVIDENCE_UPLOADED',
      details: `Evidence ${evidenceId} ("${title}", ${evidenceType}, ${(fileSize / 1024).toFixed(1)} KB) uploaded by ${req.user.name}.`,
      ipAddress: ip
    });

    recordAuditLog({
      caseId: caseRecord.id,
      evidenceId: newEvidenceDbId,
      userId: req.user.id,
      action: 'HASH_GENERATED',
      details: `SHA-256 cryptographic integrity hash computed: ${sha256Hash}`,
      ipAddress: ip
    });

    const createdEvidence = db.get(`
      SELECT e.*, u.name as uploader_name, u.badge_number as uploader_badge, c.case_id as parent_case_id, c.title as case_title
      FROM evidence e
      JOIN users u ON e.uploaded_by = u.id
      JOIN cases c ON e.case_id = c.id
      WHERE e.evidence_id = ?
    `, [evidenceId]);

    return res.status(201).json({
      message: 'Evidence uploaded, cryptographically sealed, and registered successfully.',
      evidence: createdEvidence
    });
  } catch (error) {
    console.error('Error uploading evidence:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(500).json({ error: 'Failed to process evidence upload.' });
  }
}

export function getEvidenceByCase(req, res) {
  try {
    const { caseId } = req.params;
    const caseRecord = isNaN(caseId)
      ? db.get('SELECT id FROM cases WHERE case_id = ?', [caseId])
      : db.get('SELECT id FROM cases WHERE id = ?', [caseId]);

    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const evidenceList = db.all(`
      SELECT e.*, u.name as uploader_name, u.badge_number as uploader_badge
      FROM evidence e
      JOIN users u ON e.uploaded_by = u.id
      WHERE e.case_id = ?
      ORDER BY e.uploaded_at DESC
    `, [caseRecord.id]);

    return res.json({ evidence: evidenceList });
  } catch (error) {
    console.error('Error fetching case evidence:', error);
    return res.status(500).json({ error: 'Failed to fetch evidence list.' });
  }
}

export function getAllEvidence(req, res) {
  try {
    const { search, type, integrity, processing } = req.query;
    let query = `
      SELECT e.*, u.name as uploader_name, u.badge_number as uploader_badge, c.case_id as parent_case_id, c.title as case_title
      FROM evidence e
      JOIN users u ON e.uploaded_by = u.id
      JOIN cases c ON e.case_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (e.evidence_id LIKE ? OR e.title LIKE ? OR e.file_name LIKE ? OR c.case_id LIKE ? OR c.title LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (type) {
      query += ` AND e.evidence_type = ?`;
      params.push(type.toUpperCase());
    }

    if (integrity) {
      query += ` AND e.integrity_status = ?`;
      params.push(integrity.toUpperCase());
    }

    if (processing) {
      query += ` AND e.processing_status = ?`;
      params.push(processing.toUpperCase());
    }

    query += ` ORDER BY e.uploaded_at DESC`;

    const evidence = db.all(query, params);
    return res.json({ evidence });
  } catch (error) {
    console.error('Error fetching all evidence:', error);
    return res.status(500).json({ error: 'Failed to retrieve evidence items.' });
  }
}

export function getEvidenceById(req, res) {
  try {
    const { id } = req.params;
    const evidence = isNaN(id)
      ? db.get(`
          SELECT e.*, u.name as uploader_name, u.badge_number as uploader_badge, c.case_id as parent_case_id, c.title as case_title
          FROM evidence e
          JOIN users u ON e.uploaded_by = u.id
          JOIN cases c ON e.case_id = c.id
          WHERE e.evidence_id = ?
        `, [id])
      : db.get(`
          SELECT e.*, u.name as uploader_name, u.badge_number as uploader_badge, c.case_id as parent_case_id, c.title as case_title
          FROM evidence e
          JOIN users u ON e.uploaded_by = u.id
          JOIN cases c ON e.case_id = c.id
          WHERE e.id = ?
        `, [id]);

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence record not found.' });
    }

    return res.json({ evidence });
  } catch (error) {
    console.error('Error fetching evidence details:', error);
    return res.status(500).json({ error: 'Failed to fetch evidence details.' });
  }
}

export async function verifyEvidenceIntegrity(req, res) {
  try {
    const { id } = req.params;
    const evidence = isNaN(id)
      ? db.get('SELECT * FROM evidence WHERE evidence_id = ?', [id])
      : db.get('SELECT * FROM evidence WHERE id = ?', [id]);

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence record not found.' });
    }

    if (!fs.existsSync(evidence.file_path)) {
      db.run(`UPDATE evidence SET integrity_status = 'VERIFICATION_FAILED' WHERE id = ?`, [evidence.id]);
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      recordAuditLog({
        caseId: evidence.case_id,
        evidenceId: evidence.id,
        userId: req.user.id,
        action: 'EVIDENCE_VERIFIED',
        details: `INTEGRITY ALERT: Evidence file ${evidence.evidence_id} missing from secure storage disk. Verification failed.`,
        ipAddress: ip
      });

      return res.status(400).json({
        verified: false,
        status: 'VERIFICATION_FAILED',
        error: 'Integrity Alert: Evidence file is missing from secure storage.',
        evidence_id: evidence.evidence_id
      });
    }

    // Recalculate Hash from disk
    const verification = await verifyFileIntegrity(evidence.file_path, evidence.sha256_hash);
    const newStatus = verification.isMatch ? 'VERIFIED' : 'VERIFICATION_FAILED';

    db.run(`UPDATE evidence SET integrity_status = ? WHERE id = ?`, [newStatus, evidence.id]);

    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const auditDetails = verification.isMatch
      ? `Cryptographic integrity verified for ${evidence.evidence_id}. Recalculated SHA-256 matched original (${verification.recalculatedHash.substring(0, 16)}...).`
      : `INTEGRITY ALERT: Tamper detected for ${evidence.evidence_id}! Stored hash (${evidence.sha256_hash.substring(0, 16)}...) != Disk hash (${verification.recalculatedHash.substring(0, 16)}...).`;

    recordAuditLog({
      caseId: evidence.case_id,
      evidenceId: evidence.id,
      userId: req.user.id,
      action: 'EVIDENCE_VERIFIED',
      details: auditDetails,
      ipAddress: ip
    });

    return res.json({
      verified: verification.isMatch,
      integrity_status: newStatus,
      evidence_id: evidence.evidence_id,
      original_hash: evidence.sha256_hash,
      recalculated_hash: verification.recalculatedHash,
      timestamp: new Date().toISOString(),
      verified_by: req.user.name
    });
  } catch (error) {
    console.error('Error verifying evidence:', error);
    return res.status(500).json({ error: 'Failed to verify evidence integrity.' });
  }
}

export function downloadEvidenceFile(req, res) {
  try {
    const { id } = req.params;
    const evidence = isNaN(id)
      ? db.get('SELECT * FROM evidence WHERE evidence_id = ?', [id])
      : db.get('SELECT * FROM evidence WHERE id = ?', [id]);

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence record not found.' });
    }

    if (!fs.existsSync(evidence.file_path)) {
      return res.status(404).json({ error: 'Physical evidence file missing from storage repository.' });
    }

    // Record Access in Chain of Custody
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    recordAuditLog({
      caseId: evidence.case_id,
      evidenceId: evidence.id,
      userId: req.user.id,
      action: 'EVIDENCE_ACCESSED',
      details: `Evidence ${evidence.evidence_id} (${evidence.file_name}) downloaded/accessed by ${req.user.name}.`,
      ipAddress: ip
    });

    res.setHeader('Content-Type', evidence.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${evidence.file_name}"`);
    return res.sendFile(path.resolve(evidence.file_path));
  } catch (error) {
    console.error('Error downloading evidence:', error);
    return res.status(500).json({ error: 'Failed to access evidence file.' });
  }
}
