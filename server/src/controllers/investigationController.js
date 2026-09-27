import db from '../config/db.js';
import { generateInvestigationId } from '../services/idGenerator.js';
import { recordAuditLog } from '../services/auditService.js';

export function createInvestigation(req, res) {
  try {
    const {
      title,
      description = '',
      investigation_type,
      priority,
      start_date = new Date().toISOString().split('T')[0],
      primary_location,
      lead_investigator_id,
      additional_member_ids = []
    } = req.body;

    if (!title || !investigation_type || !priority || !primary_location) {
      return res.status(400).json({ error: 'Missing required fields (title, investigation_type, priority, primary_location).' });
    }

    const effectiveLeadId = lead_investigator_id || req.user.id;
    const investigationId = generateInvestigationId();

    db.run(`
      INSERT INTO investigations (
        investigation_id, title, description, investigation_type,
        priority, status, start_date, primary_location, lead_investigator_id
      ) VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
    `, [
      investigationId,
      title.trim(),
      description.trim(),
      investigation_type.trim(),
      priority.toUpperCase(),
      start_date,
      primary_location.trim(),
      effectiveLeadId
    ]);

    const createdRecord = db.get('SELECT id FROM investigations WHERE investigation_id = ?', [investigationId]);
    const newInvDbId = createdRecord ? createdRecord.id : null;

    if (newInvDbId) {
      db.run(`INSERT OR IGNORE INTO investigation_members (investigation_id, user_id) VALUES (?, ?)`, [newInvDbId, effectiveLeadId]);
      if (Array.isArray(additional_member_ids)) {
        for (const memberId of additional_member_ids) {
          if (memberId && memberId !== effectiveLeadId) {
            db.run(`INSERT OR IGNORE INTO investigation_members (investigation_id, user_id) VALUES (?, ?)`, [newInvDbId, memberId]);
          }
        }
      }
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    recordAuditLog({
      investigationId: newInvDbId,
      userId: req.user.id,
      action: 'INVESTIGATION_CREATED',
      details: `Investigation ${investigationId} ("${title}") initiated under priority ${priority.toUpperCase()} by ${req.user.name}.`,
      ipAddress: ip
    });

    const createdInvestigation = db.get(`
      SELECT i.*, u.name as lead_investigator_name, u.badge_number as lead_badge
      FROM investigations i
      JOIN users u ON i.lead_investigator_id = u.id
      WHERE i.investigation_id = ?
    `, [investigationId]);

    return res.status(201).json({
      message: 'Investigation created successfully',
      investigation: createdInvestigation
    });
  } catch (error) {
    console.error('Error creating investigation:', error);
    return res.status(500).json({ error: 'Failed to create investigation record.' });
  }
}

export function getInvestigations(req, res) {
  try {
    const { search, status, priority, type, my_investigations } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT 
        i.*, 
        u.name as lead_investigator_name, 
        u.badge_number as lead_badge,
        (SELECT COUNT(*) FROM data_sources ds WHERE ds.investigation_id = i.id) as source_count,
        (SELECT COUNT(*) FROM normalized_records nr WHERE nr.investigation_id = i.id) as normalized_record_count
      FROM investigations i
      JOIN users u ON i.lead_investigator_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (my_investigations === 'true' || (userRole === 'INVESTIGATOR' && req.query.all !== 'true')) {
      query += ` AND (i.lead_investigator_id = ? OR i.id IN (SELECT investigation_id FROM investigation_members WHERE user_id = ?))`;
      params.push(userId, userId);
    }

    if (search) {
      query += ` AND (i.investigation_id LIKE ? OR i.title LIKE ? OR i.primary_location LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (status) {
      query += ` AND i.status = ?`;
      params.push(status.toUpperCase());
    }

    if (priority) {
      query += ` AND i.priority = ?`;
      params.push(priority.toUpperCase());
    }

    if (type) {
      query += ` AND i.investigation_type = ?`;
      params.push(type);
    }

    query += ` ORDER BY i.created_at DESC`;

    const investigations = db.all(query, params);
    return res.json({ investigations });
  } catch (error) {
    console.error('Error fetching investigations:', error);
    return res.status(500).json({ error: 'Failed to retrieve investigations.' });
  }
}

export function getInvestigationById(req, res) {
  try {
    const { id } = req.params;

    const inv = isNaN(id)
      ? db.get(`
          SELECT i.*, u.name as lead_investigator_name, u.badge_number as lead_badge, u.email as lead_email, u.department as lead_dept
          FROM investigations i
          JOIN users u ON i.lead_investigator_id = u.id
          WHERE i.investigation_id = ?
        `, [id])
      : db.get(`
          SELECT i.*, u.name as lead_investigator_name, u.badge_number as lead_badge, u.email as lead_email, u.department as lead_dept
          FROM investigations i
          JOIN users u ON i.lead_investigator_id = u.id
          WHERE i.id = ?
        `, [id]);

    if (!inv) {
      return res.status(404).json({ error: 'Investigation not found.' });
    }

    const members = db.all(`
      SELECT u.id, u.name, u.email, u.badge_number, u.department, im.assigned_at
      FROM investigation_members im
      JOIN users u ON im.user_id = u.id
      WHERE im.investigation_id = ?
    `, [inv.id]);

    const dataSources = db.all(`
      SELECT ds.*, u.name as uploader_name, u.badge_number as uploader_badge
      FROM data_sources ds
      JOIN users u ON ds.uploaded_by = u.id
      WHERE ds.investigation_id = ?
      ORDER BY ds.uploaded_at DESC
    `, [inv.id]);

    const normalizedRecordsCount = db.get(`
      SELECT COUNT(*) as count FROM normalized_records WHERE investigation_id = ?
    `, [inv.id]).count;

    const activities = db.all(`
      SELECT a.*, u.name as user_name, u.role as user_role, u.badge_number
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      WHERE a.investigation_id = ?
      ORDER BY a.timestamp DESC
      LIMIT 50
    `, [inv.id]);

    return res.json({
      investigation: inv,
      members,
      data_sources: dataSources,
      normalized_records_count: normalizedRecordsCount,
      activities
    });
  } catch (error) {
    console.error('Error fetching investigation by id:', error);
    return res.status(500).json({ error: 'Failed to retrieve investigation details.' });
  }
}

export function updateInvestigation(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      investigation_type,
      description,
      priority,
      status,
      start_date,
      primary_location,
      lead_investigator_id
    } = req.body;

    const existing = isNaN(id)
      ? db.get('SELECT * FROM investigations WHERE investigation_id = ?', [id])
      : db.get('SELECT * FROM investigations WHERE id = ?', [id]);

    if (!existing) {
      return res.status(404).json({ error: 'Investigation not found.' });
    }

    const updatedTitle = title !== undefined ? title : existing.title;
    const updatedType = investigation_type !== undefined ? investigation_type : existing.investigation_type;
    const updatedDesc = description !== undefined ? description : existing.description;
    const updatedPriority = priority !== undefined ? priority.toUpperCase() : existing.priority;
    const updatedStatus = status !== undefined ? status.toUpperCase() : existing.status;
    const updatedDate = start_date !== undefined ? start_date : existing.start_date;
    const updatedLocation = primary_location !== undefined ? primary_location : existing.primary_location;
    const updatedLeadId = lead_investigator_id !== undefined ? lead_investigator_id : existing.lead_investigator_id;

    db.run(`
      UPDATE investigations
      SET title = ?, investigation_type = ?, description = ?,
          priority = ?, status = ?, start_date = ?, primary_location = ?,
          lead_investigator_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      updatedTitle,
      updatedType,
      updatedDesc,
      updatedPriority,
      updatedStatus,
      updatedDate,
      updatedLocation,
      updatedLeadId,
      existing.id
    ]);

    const changes = [];
    if (updatedStatus !== existing.status) changes.push(`Status changed to ${updatedStatus}`);
    if (updatedPriority !== existing.priority) changes.push(`Priority changed to ${updatedPriority}`);
    if (updatedTitle !== existing.title) changes.push(`Title updated`);

    const detailsMsg = changes.length > 0 
      ? `Investigation ${existing.investigation_id} modified: ${changes.join(', ')}.`
      : `Investigation ${existing.investigation_id} parameters updated.`;

    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    recordAuditLog({
      investigationId: existing.id,
      userId: req.user.id,
      action: 'INVESTIGATION_UPDATED',
      details: detailsMsg,
      ipAddress: ip
    });

    const updated = db.get(`
      SELECT i.*, u.name as lead_investigator_name, u.badge_number as lead_badge
      FROM investigations i
      JOIN users u ON i.lead_investigator_id = u.id
      WHERE i.id = ?
    `, [existing.id]);

    return res.json({
      message: 'Investigation updated successfully',
      investigation: updated
    });
  } catch (error) {
    console.error('Error updating investigation:', error);
    return res.status(500).json({ error: 'Failed to update investigation.' });
  }
}

export function getInvestigationActivity(req, res) {
  try {
    const { id } = req.params;
    const inv = isNaN(id)
      ? db.get('SELECT id, investigation_id FROM investigations WHERE investigation_id = ?', [id])
      : db.get('SELECT id, investigation_id FROM investigations WHERE id = ?', [id]);

    if (!inv) {
      return res.status(404).json({ error: 'Investigation not found.' });
    }

    const activities = db.all(`
      SELECT a.*, u.name as user_name, u.role as user_role, u.badge_number, ds.data_source_id as source_code, ds.file_name
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN data_sources ds ON a.data_source_id = ds.id
      WHERE a.investigation_id = ?
      ORDER BY a.timestamp DESC
    `, [inv.id]);

    return res.json({ activities });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve activity trail.' });
  }
}
