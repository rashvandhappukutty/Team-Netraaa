import db from '../config/db.js';
import { generateCaseId } from '../services/idGenerator.js';
import { recordAuditLog } from '../services/auditService.js';

export function createCase(req, res) {
  try {
    const {
      title,
      case_type,
      crime_category,
      description,
      incident_date,
      incident_time,
      crime_location,
      priority,
      lead_investigator_id,
      additional_investigator_ids = []
    } = req.body;

    // Validation
    if (!title || !case_type || !crime_category || !incident_date || !crime_location || !priority) {
      return res.status(400).json({ error: 'Missing required case fields (title, case_type, crime_category, incident_date, crime_location, priority).' });
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validPriorities.includes(priority.toUpperCase())) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` });
    }

    // Default lead investigator to current user if investigator, or designated ID
    const effectiveLeadId = lead_investigator_id || req.user.id;

    // Generate unique uneditable Case ID
    const caseId = generateCaseId();

    db.run(`
      INSERT INTO cases (
        case_id, title, case_type, crime_category, description,
        incident_date, incident_time, crime_location, priority, status,
        lead_investigator_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
    `, [
      caseId,
      title.trim(),
      case_type.trim(),
      crime_category.trim(),
      description || '',
      incident_date,
      incident_time || '',
      crime_location.trim(),
      priority.toUpperCase(),
      effectiveLeadId
    ]);

    const createdRecord = db.get('SELECT id FROM cases WHERE case_id = ?', [caseId]);
    const newCaseDbId = createdRecord ? createdRecord.id : null;

    // Assign lead investigator to case_investigators
    if (newCaseDbId) {
      db.run(`INSERT OR IGNORE INTO case_investigators (case_id, investigator_id) VALUES (?, ?)`, [newCaseDbId, effectiveLeadId]);

      // Assign additional investigators
      if (Array.isArray(additional_investigator_ids)) {
        for (const invId of additional_investigator_ids) {
          if (invId && invId !== effectiveLeadId) {
            db.run(`INSERT OR IGNORE INTO case_investigators (case_id, investigator_id) VALUES (?, ?)`, [newCaseDbId, invId]);
          }
        }
      }
    }

    // Record Immutable Audit Log
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    recordAuditLog({
      caseId: newCaseDbId,
      userId: req.user.id,
      action: 'CASE_CREATED',
      details: `Case ${caseId} (${title}) initialized with priority ${priority.toUpperCase()} by ${req.user.name}.`,
      ipAddress: ip
    });

    const createdCase = db.get(`
      SELECT c.*, u.name as lead_investigator_name, u.badge_number as lead_badge
      FROM cases c
      JOIN users u ON c.lead_investigator_id = u.id
      WHERE c.case_id = ?
    `, [caseId]);

    return res.status(201).json({
      message: 'Case created successfully',
      case: createdCase
    });
  } catch (error) {
    console.error('Error creating case:', error);
    return res.status(500).json({ error: 'Failed to create case record.' });
  }
}

export function getCases(req, res) {
  try {
    const { search, status, priority, case_type, my_cases } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        c.*, 
        u.name as lead_investigator_name, 
        u.badge_number as lead_badge,
        (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.id) as evidence_count
      FROM cases c
      JOIN users u ON c.lead_investigator_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Filter for Investigator's assigned/my cases if requested or by default for specific views
    if (my_cases === 'true' || (userRole === 'INVESTIGATOR' && req.query.all !== 'true')) {
      query += ` AND (c.lead_investigator_id = ? OR c.id IN (SELECT case_id FROM case_investigators WHERE investigator_id = ?))`;
      params.push(userId, userId);
    }

    if (search) {
      query += ` AND (c.case_id LIKE ? OR c.title LIKE ? OR c.crime_category LIKE ? OR c.crime_location LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status.toUpperCase());
    }

    if (priority) {
      query += ` AND c.priority = ?`;
      params.push(priority.toUpperCase());
    }

    if (case_type) {
      query += ` AND c.case_type = ?`;
      params.push(case_type);
    }

    query += ` ORDER BY c.created_at DESC`;

    const cases = db.all(query, params);
    return res.json({ cases });
  } catch (error) {
    console.error('Error retrieving cases:', error);
    return res.status(500).json({ error: 'Failed to fetch cases.' });
  }
}

export function getCaseById(req, res) {
  try {
    const { id } = req.params;

    // Support lookup by integer ID or by case_id string (e.g. NETRA-2026-00001)
    const caseRecord = isNaN(id)
      ? db.get(`
          SELECT c.*, u.name as lead_investigator_name, u.badge_number as lead_badge, u.email as lead_email, u.department as lead_dept
          FROM cases c
          JOIN users u ON c.lead_investigator_id = u.id
          WHERE c.case_id = ?
        `, [id])
      : db.get(`
          SELECT c.*, u.name as lead_investigator_name, u.badge_number as lead_badge, u.email as lead_email, u.department as lead_dept
          FROM cases c
          JOIN users u ON c.lead_investigator_id = u.id
          WHERE c.id = ?
        `, [id]);

    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    // Fetch assigned investigators
    const investigators = db.all(`
      SELECT u.id, u.name, u.email, u.badge_number, u.department, ci.assigned_at
      FROM case_investigators ci
      JOIN users u ON ci.investigator_id = u.id
      WHERE ci.case_id = ?
    `, [caseRecord.id]);

    // Fetch evidence items
    const evidenceList = db.all(`
      SELECT e.*, u.name as uploader_name, u.badge_number as uploader_badge
      FROM evidence e
      JOIN users u ON e.uploaded_by = u.id
      WHERE e.case_id = ?
      ORDER BY e.uploaded_at DESC
    `, [caseRecord.id]);

    // Fetch recent activity audit logs
    const activities = db.all(`
      SELECT a.*, u.name as user_name, u.role as user_role, u.badge_number
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      WHERE a.case_id = ?
      ORDER BY a.timestamp DESC
      LIMIT 50
    `, [caseRecord.id]);

    return res.json({
      case: caseRecord,
      investigators,
      evidence: evidenceList,
      activities
    });
  } catch (error) {
    console.error('Error fetching case by id:', error);
    return res.status(500).json({ error: 'Failed to retrieve case details.' });
  }
}

export function updateCase(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      case_type,
      crime_category,
      description,
      incident_date,
      incident_time,
      crime_location,
      priority,
      status,
      lead_investigator_id
    } = req.body;

    const existingCase = isNaN(id)
      ? db.get('SELECT * FROM cases WHERE case_id = ?', [id])
      : db.get('SELECT * FROM cases WHERE id = ?', [id]);

    if (!existingCase) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    // Permission check: Admin or assigned investigator
    if (req.user.role !== 'ADMIN' && existingCase.lead_investigator_id !== req.user.id) {
      const isAssigned = db.get('SELECT 1 FROM case_investigators WHERE case_id = ? AND investigator_id = ?', [existingCase.id, req.user.id]);
      if (!isAssigned) {
        return res.status(403).json({ error: 'Unauthorized to update this case.' });
      }
    }

    const updatedTitle = title !== undefined ? title : existingCase.title;
    const updatedType = case_type !== undefined ? case_type : existingCase.case_type;
    const updatedCategory = crime_category !== undefined ? crime_category : existingCase.crime_category;
    const updatedDesc = description !== undefined ? description : existingCase.description;
    const updatedDate = incident_date !== undefined ? incident_date : existingCase.incident_date;
    const updatedTime = incident_time !== undefined ? incident_time : existingCase.incident_time;
    const updatedLocation = crime_location !== undefined ? crime_location : existingCase.crime_location;
    const updatedPriority = priority !== undefined ? priority.toUpperCase() : existingCase.priority;
    const updatedStatus = status !== undefined ? status.toUpperCase() : existingCase.status;
    const updatedLeadId = lead_investigator_id !== undefined ? lead_investigator_id : existingCase.lead_investigator_id;

    db.run(`
      UPDATE cases
      SET title = ?, case_type = ?, crime_category = ?, description = ?,
          incident_date = ?, incident_time = ?, crime_location = ?,
          priority = ?, status = ?, lead_investigator_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      updatedTitle,
      updatedType,
      updatedCategory,
      updatedDesc,
      updatedDate,
      updatedTime,
      updatedLocation,
      updatedPriority,
      updatedStatus,
      updatedLeadId,
      existingCase.id
    ]);

    // Record delta in audit logs
    const changes = [];
    if (updatedStatus !== existingCase.status) changes.push(`Status changed from ${existingCase.status} to ${updatedStatus}`);
    if (updatedPriority !== existingCase.priority) changes.push(`Priority changed from ${existingCase.priority} to ${updatedPriority}`);
    if (updatedTitle !== existingCase.title) changes.push(`Title updated`);
    if (updatedLocation !== existingCase.crime_location) changes.push(`Location updated to ${updatedLocation}`);

    const detailsMsg = changes.length > 0 
      ? `Case ${existingCase.case_id} updated: ${changes.join(', ')}.`
      : `Case ${existingCase.case_id} details updated.`;

    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    recordAuditLog({
      caseId: existingCase.id,
      userId: req.user.id,
      action: 'CASE_UPDATED',
      details: detailsMsg,
      ipAddress: ip
    });

    const updated = db.get(`
      SELECT c.*, u.name as lead_investigator_name, u.badge_number as lead_badge
      FROM cases c
      JOIN users u ON c.lead_investigator_id = u.id
      WHERE c.id = ?
    `, [existingCase.id]);

    return res.json({
      message: 'Case updated successfully',
      case: updated
    });
  } catch (error) {
    console.error('Error updating case:', error);
    return res.status(500).json({ error: 'Failed to update case.' });
  }
}

export function getCaseActivity(req, res) {
  try {
    const { id } = req.params;
    const caseRecord = isNaN(id)
      ? db.get('SELECT id, case_id FROM cases WHERE case_id = ?', [id])
      : db.get('SELECT id, case_id FROM cases WHERE id = ?', [id]);

    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const activities = db.all(`
      SELECT a.*, u.name as user_name, u.role as user_role, u.badge_number, e.title as evidence_title, e.evidence_id as evidence_code
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN evidence e ON a.evidence_id = e.id
      WHERE a.case_id = ?
      ORDER BY a.timestamp DESC
    `, [caseRecord.id]);

    return res.json({ activities });
  } catch (error) {
    console.error('Error fetching case activity:', error);
    return res.status(500).json({ error: 'Failed to fetch case activity trail.' });
  }
}
