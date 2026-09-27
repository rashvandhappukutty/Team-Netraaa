import db from '../config/db.js';

export function getAuditLogs(req, res) {
  try {
    const { investigation_id, data_source_id, action, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        a.*, 
        u.name as user_name, 
        u.role as user_role, 
        u.badge_number,
        i.investigation_id as inv_code,
        i.title as inv_title,
        ds.data_source_id as source_code,
        ds.file_name as source_file_name
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN investigations i ON a.investigation_id = i.id
      LEFT JOIN data_sources ds ON a.data_source_id = ds.id
      WHERE 1=1
    `;
    const params = [];

    if (investigation_id) {
      const inv = isNaN(investigation_id)
        ? db.get('SELECT id FROM investigations WHERE investigation_id = ?', [investigation_id])
        : { id: investigation_id };
      if (inv) {
        query += ` AND a.investigation_id = ?`;
        params.push(inv.id);
      }
    }

    if (data_source_id) {
      const ds = isNaN(data_source_id)
        ? db.get('SELECT id FROM data_sources WHERE data_source_id = ?', [data_source_id])
        : { id: data_source_id };
      if (ds) {
        query += ` AND a.data_source_id = ?`;
        params.push(ds.id);
      }
    }

    if (action) {
      query += ` AND a.action = ?`;
      params.push(action);
    }

    query += ` ORDER BY a.timestamp DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const logs = db.all(query, params);
    const totalCount = db.get(`SELECT COUNT(*) as count FROM audit_logs`).count;

    return res.json({
      total: totalCount,
      logs
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ error: 'Failed to retrieve audit trail.' });
  }
}
