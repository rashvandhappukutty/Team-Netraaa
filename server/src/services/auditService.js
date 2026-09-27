import db from '../config/db.js';

/**
 * Creates an immutable chain of custody audit log entry
 * @param {Object} params
 * @param {number|null} params.investigationId
 * @param {number|null} params.dataSourceId
 * @param {number} params.userId
 * @param {string} params.action - 'LOGIN'|'LOGOUT'|'INVESTIGATION_CREATED'|'INVESTIGATION_UPDATED'|'DATA_SOURCE_UPLOADED'|'FILE_VALIDATED'|'HASH_GENERATED'|'CONTENT_EXTRACTED'|'DATA_NORMALIZED'|'INTEGRITY_VERIFIED'|'DATA_SOURCE_ACCESSED'|'USER_CREATED'
 * @param {string} params.details
 * @param {string} [params.ipAddress]
 */
export function recordAuditLog(params = {}) {
  try {
    const investigationId = params.investigationId ?? params.investigation_id ?? null;
    const dataSourceId = params.dataSourceId ?? params.data_source_id ?? null;
    const userId = params.userId ?? params.user_id ?? 1;
    const action = params.action || 'SYSTEM_ACTION';
    const details = params.details || '';
    const ipAddress = params.ipAddress ?? params.ip_address ?? '127.0.0.1';

    const result = db.run(`
      INSERT INTO audit_logs (investigation_id, data_source_id, user_id, action, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [investigationId, dataSourceId, userId, action, details, ipAddress]);
    return result;
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
}
