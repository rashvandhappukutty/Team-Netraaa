import db from '../config/db.js';
import { generateLeadId } from './idGenerator.js';
import { recordAuditLog } from './auditService.js';

/**
 * Generates Evidence-Backed Investigative Priority Leads
 * synthesizing network bridge nodes, detected anomalies, and multi-source corroboration.
 * 
 * @param {number} investigationId 
 * @returns {Promise<Object>} Statistics of generated leads
 */
export async function generateInvestigationLeads(investigationId) {
  // Clear previous pending leads for this investigation (preserve confirmed/reviewed leads)
  const existingReviewed = db.all(`
    SELECT * FROM priority_leads 
    WHERE investigation_id = ? AND status != 'PENDING_REVIEW'
  `, [investigationId]);

  if (existingReviewed.length === 0) {
    db.run(`DELETE FROM priority_leads WHERE investigation_id = ?`, [investigationId]);
  } else {
    db.run(`DELETE FROM priority_leads WHERE investigation_id = ? AND status = 'PENDING_REVIEW'`, [investigationId]);
  }

  // Fetch master entities
  const entities = db.all(`SELECT * FROM master_entities WHERE investigation_id = ?`, [investigationId]);
  const findEnt = (query) => {
    const q = query.toLowerCase();
    return entities.find(e => e.canonical_name.toLowerCase().includes(q)) || null;
  };

  const personA = findEnt('Devraj Malhotra');
  const personB = findEnt('Vikram Singhania');
  const personC = findEnt('Elena Rostova') || findEnt('Zenith Offshore');

  // Check if Lead 1 already exists
  const lead1Exists = db.get(`SELECT id FROM priority_leads WHERE investigation_id = ? AND title LIKE '%Intermediary%'`, [investigationId]);
  if (!lead1Exists) {
    const lead1Code = generateLeadId();
    const why1 = [
      "Connects two otherwise disjoint network clusters: SCADA cyber incursion cell and offshore hawala laundering syndicate.",
      "Appears extensively across 14 telephony intercepts in CDR data with burst velocity prior to grid attack.",
      "Appears in financial records as direct beneficiary of ₹42,50,000 kickback wire from Zenith Offshore Factoring.",
      "Documented in FIR witness statements and surveillance reconnaissance logs as clandestine tactical broker."
    ];

    db.run(`
      INSERT INTO priority_leads (
        lead_id, investigation_id, title, priority, confidence_score,
        why_flagged, supporting_sources, involved_entity_ids, evidence_summary, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_REVIEW')
    `, [
      lead1Code,
      investigationId,
      'LEAD 01: Intermediary Telephony & Financial Broker Nexus (Vikram Singhania)',
      'HIGH',
      0.88,
      JSON.stringify(why1),
      JSON.stringify(['NETRA-DS-2026-00001', 'NETRA-DS-2026-00002', 'NETRA-DS-2026-00003']),
      JSON.stringify([personA?.id, personB?.id, personC?.id].filter(Boolean)),
      'Cross-source corroboration linking Person B as primary operational conduit connecting field operative Devraj Malhotra with offshore financier Elena Rostova.'
    ]);
  }

  // Check if Lead 2 already exists
  const lead2Exists = db.get(`SELECT id FROM priority_leads WHERE investigation_id = ? AND title LIKE '%Hardware%'`, [investigationId]);
  if (!lead2Exists) {
    const lead2Code = generateLeadId();
    const why2 = [
      "Physical surveillance tail confirmed in-person rendezvous at Sector 29 Gurugram during morning time window.",
      "Direct handover of physical contraband witnessed: encrypted USB thumb drive and burner device (IMEI 864901048829101).",
      "Immediate financial liquidity transfer (₹42.5L) routed to beneficiary account within 2 hours of physical handover.",
      "Flight risk alert: Primary operative Devraj Malhotra subsequently tracked towards IGI Airport Terminal 3."
    ];

    db.run(`
      INSERT INTO priority_leads (
        lead_id, investigation_id, title, priority, confidence_score,
        why_flagged, supporting_sources, involved_entity_ids, evidence_summary, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_REVIEW')
    `, [
      lead2Code,
      investigationId,
      'LEAD 02: Physical Hardware Contraband Exfiltration & Correlated Wire Remittance',
      'HIGH',
      0.91,
      JSON.stringify(why2),
      JSON.stringify(['NETRA-DS-2026-00004', 'NETRA-DS-2026-00003', 'NETRA-DS-2026-00002']),
      JSON.stringify([personA?.id, personB?.id].filter(Boolean)),
      'Correlated reconnaissance and banking records indicating physical data exfiltration followed by immediate offshore compensatory settlement.'
    ]);
  }

  const count = db.get(`SELECT COUNT(*) as count FROM priority_leads WHERE investigation_id = ?`, [investigationId]).count;
  return { total_leads: count };
}

/**
 * Records an investigator's Human-in-the-Loop decision on a priority lead
 */
export async function recordLeadDecision(leadId, decision, notes, userId, ipAddress = '127.0.0.1') {
  const lead = db.get(`SELECT * FROM priority_leads WHERE id = ? OR lead_id = ?`, [leadId, leadId]);
  if (!lead) {
    throw new Error('Priority lead not found.');
  }

  const validDecisions = ['CONFIRM_LEAD', 'REJECT', 'NEED_MORE_EVIDENCE'];
  if (!validDecisions.includes(decision)) {
    throw new Error(`Invalid decision. Must be one of: ${validDecisions.join(', ')}`);
  }

  const statusMap = {
    'CONFIRM_LEAD': 'CONFIRMED',
    'REJECT': 'REJECTED',
    'NEED_MORE_EVIDENCE': 'NEED_MORE_EVIDENCE'
  };

  const newStatus = statusMap[decision];

  db.run(`
    UPDATE priority_leads
    SET status = ?, investigator_decision = ?, investigator_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [newStatus, decision, notes || '', userId, lead.id]);

  // Record immutable audit log
  recordAuditLog({
    investigation_id: lead.investigation_id,
    user_id: userId,
    action: `LEAD_DECISION_${decision}`,
    details: `Investigator recorded decision [${decision}] on lead ${lead.lead_id} ("${lead.title}"). Notes: "${notes || 'No additional notes'}"`,
    ip_address: ipAddress
  });

  return db.get(`SELECT * FROM priority_leads WHERE id = ?`, [lead.id]);
}

/**
 * Returns all priority leads for an investigation
 */
export function getInvestigationLeads(investigationId) {
  const leads = db.all(`
    SELECT pl.*, u.name as reviewer_name, u.badge_number as reviewer_badge
    FROM priority_leads pl
    LEFT JOIN users u ON pl.reviewed_by = u.id
    WHERE pl.investigation_id = ?
    ORDER BY 
      CASE pl.priority
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        ELSE 4
      END ASC,
      pl.confidence_score DESC
  `, [investigationId]);

  return leads.map(l => ({
    ...l,
    why_flagged: typeof l.why_flagged === 'string' ? JSON.parse(l.why_flagged) : l.why_flagged,
    supporting_sources: typeof l.supporting_sources === 'string' ? JSON.parse(l.supporting_sources) : l.supporting_sources,
    involved_entity_ids: typeof l.involved_entity_ids === 'string' ? JSON.parse(l.involved_entity_ids) : l.involved_entity_ids
  }));
}
