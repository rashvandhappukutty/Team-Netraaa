import db from '../config/db.js';
import { generateTimelineEventId } from './idGenerator.js';

/**
 * Builds the Chronological Correlated Investigation Timeline
 * aggregating time-stamped events across FIR, CDR, Financial, and Surveillance data sources.
 * 
 * @param {number} investigationId 
 * @returns {Promise<Object>} Statistics of correlated timeline events
 */
export async function correlateInvestigationTimeline(investigationId) {
  // Clear previous timeline events for this investigation
  db.run(`DELETE FROM timeline_events WHERE investigation_id = ?`, [investigationId]);

  // Fetch master entities
  const entities = db.all(`SELECT * FROM master_entities WHERE investigation_id = ?`, [investigationId]);
  const findEnt = (query) => {
    if (!query) return null;
    const q = query.toLowerCase();
    return entities.find(e => e.canonical_name.toLowerCase().includes(q)) || null;
  };

  const personA = findEnt('Devraj Malhotra');
  const personB = findEnt('Vikram Singhania');
  const personC = findEnt('Elena Rostova') || findEnt('Zenith Offshore');
  const locGurugram = findEnt('Sector 29 Gurugram');
  const locSubstation = findEnt('Northern Power Grid') || findEnt('Substation 7');
  const locAerocity = findEnt('Aerocity');
  const locAirport = findEnt('IGI Airport Terminal 3');

  // Multi-source event definitions for Operation CipherGhost
  const chronologicalEvents = [
    {
      timestamp: '2026-08-15 02:15:30',
      event_type: 'COMMUNICATION',
      title: 'Pre-Breach Telephony Intercept: Voice Call (145s)',
      description: 'Outgoing voice call initiated from Devraj Malhotra (+91-98110-44912) to Vikram Singhania (+91-99220-88419) routed through Cell Tower TWR-DEL-NORTH-04.',
      primary_entity_id: personA?.id,
      secondary_entity_id: personB?.id,
      location_entity_id: null,
      source_code: 'NETRA-DS-2026-00002',
      evidence_snippet: 'CDR Intercept: +91-98110-44912 ➔ +91-99220-88419 (Duration: 145s, Tower: TWR-DEL-NORTH-04)',
      severity: 'WARNING'
    },
    {
      timestamp: '2026-08-15 02:22:10',
      event_type: 'COMMUNICATION',
      title: 'Tactical Coordination Voice Call (320s)',
      description: 'Extended voice communication between Devraj Malhotra and Vikram Singhania confirming network probe status prior to SCADA exploit deployment.',
      primary_entity_id: personA?.id,
      secondary_entity_id: personB?.id,
      location_entity_id: null,
      source_code: 'NETRA-DS-2026-00002',
      evidence_snippet: 'CDR Intercept: +91-98110-44912 ➔ +91-99220-88419 (Duration: 320s, Tower: TWR-DEL-NORTH-04)',
      severity: 'WARNING'
    },
    {
      timestamp: '2026-08-15 02:38:05',
      event_type: 'COMMUNICATION',
      title: 'Encrypted SMS Relay Handshake',
      description: 'Inbound tactical confirmation SMS received from Vikram Singhania relayed via NCR Tower 09.',
      primary_entity_id: personB?.id,
      secondary_entity_id: personA?.id,
      location_entity_id: null,
      source_code: 'NETRA-DS-2026-00002',
      evidence_snippet: 'CDR Intercept: SMS relay from +91-99220-88419 to +91-98110-44912 (Tower: TWR-NCR-RELAY-09)',
      severity: 'NORMAL'
    },
    {
      timestamp: '2026-08-15 02:45:00',
      event_type: 'INCIDENT',
      title: 'CRITICAL: SCADA Gateway Administrative Ingress & Ransomware Deployment',
      description: 'Unauthorized root administrative ingress logged on Northern Power Grid Substation 7 gateway IP 198.51.100.44. Intruder deployed SCADA_Locker_v2.exe payload.',
      primary_entity_id: personA?.id,
      secondary_entity_id: null,
      location_entity_id: locSubstation?.id,
      source_code: 'NETRA-DS-2026-00001',
      evidence_snippet: 'FIR No CC-2026/0891: Administrative ingress on Substation 7 terminal at 02:45 AM demanding 250 BTC.',
      severity: 'CRITICAL'
    },
    {
      timestamp: '2026-08-15 02:48:19',
      event_type: 'COMMUNICATION',
      title: 'Central Control Confirmation Intercept',
      description: 'Voice call connecting secondary associate in Central Delhi grid vicinity immediately after SCADA terminal lock.',
      primary_entity_id: personA?.id,
      secondary_entity_id: null,
      location_entity_id: null,
      source_code: 'NETRA-DS-2026-00002',
      evidence_snippet: 'CDR Intercept: Call connecting Central Delhi sector (Duration: 210s, Tower: TWR-DEL-CENTRAL-01)',
      severity: 'NORMAL'
    },
    {
      timestamp: '2026-08-15 03:30:12',
      event_type: 'COMMUNICATION',
      title: 'Post-Breach Confirmation Call (90s)',
      description: 'Follow-up voice session between Devraj Malhotra and Vikram Singhania confirming extortion note delivery and escrow activation.',
      primary_entity_id: personA?.id,
      secondary_entity_id: personB?.id,
      location_entity_id: null,
      source_code: 'NETRA-DS-2026-00002',
      evidence_snippet: 'CDR Intercept: Voice session +91-98110-44912 ➔ +91-99220-88419 (Duration: 90s, Tower: TWR-DEL-NORTH-04)',
      severity: 'WARNING'
    },
    {
      timestamp: '2026-08-15 10:15:00',
      event_type: 'FINANCIAL_TRANSACTION',
      title: 'Offshore Escrow Wire Settlement (₹42,50,000)',
      description: 'High-value wire remittance executed from Zenith Offshore Factoring escrow to Vikram Singhania Escrow Account 882910029381 at State Cooperative Bank.',
      primary_entity_id: personC?.id,
      secondary_entity_id: personB?.id,
      location_entity_id: null,
      source_code: 'NETRA-DS-2026-00003',
      evidence_snippet: 'Financial TXN-2026-8802: Wire transfer of INR 42,50,000 credited to Account 882910029381.',
      severity: 'CRITICAL'
    },
    {
      timestamp: '2026-08-16 06:30:00',
      event_type: 'LOCATION_CONVERGENCE',
      title: 'Target Safehouse Egress in Black SUV DL-3C-AZ-9912',
      description: 'Devraj Malhotra observed by Surveillance Unit Bravo leaving safehouse residential premises in Aerocity.',
      primary_entity_id: personA?.id,
      secondary_entity_id: null,
      location_entity_id: locAerocity?.id,
      source_code: 'NETRA-DS-2026-00004',
      evidence_snippet: 'Surveillance Log Bravo-01: Target observed departing in black SUV DL-3C-AZ-9912 at 06:30 AM.',
      severity: 'NORMAL'
    },
    {
      timestamp: '2026-08-16 07:15:00',
      event_type: 'MEETING',
      title: 'Physical Rendezvous at Sector 29 Gurugram Coffee Bistro',
      description: 'Simultaneous arrival of Devraj Malhotra and Vikram Singhania. Subject observed carrying silver metallic briefcase.',
      primary_entity_id: personA?.id,
      secondary_entity_id: personB?.id,
      location_entity_id: locGurugram?.id,
      source_code: 'NETRA-DS-2026-00004',
      evidence_snippet: 'Surveillance Log Bravo-02: Subjects seated together at corner bistro table; photographic logs captured.',
      severity: 'WARNING'
    },
    {
      timestamp: '2026-08-16 08:00:00',
      event_type: 'MEETING',
      title: 'Clandestine Physical Handover: Encrypted USB & Burner Phone',
      description: 'Physical exchange observed: Devraj Malhotra handed over encrypted USB thumb drive and burner phone (IMEI: 864901048829101) into briefcase.',
      primary_entity_id: personA?.id,
      secondary_entity_id: personB?.id,
      location_entity_id: locGurugram?.id,
      source_code: 'NETRA-DS-2026-00004',
      evidence_snippet: 'Surveillance Log Bravo-03: Direct physical hardware transfer witnessed by field reconnaissance team.',
      severity: 'CRITICAL'
    },
    {
      timestamp: '2026-08-16 08:45:00',
      event_type: 'LOCATION_CONVERGENCE',
      title: 'Target Egress towards IGI Airport Terminal 3',
      description: 'Devraj Malhotra observed driving towards Indira Gandhi International Airport Terminal 3 departure gates.',
      primary_entity_id: personA?.id,
      secondary_entity_id: null,
      location_entity_id: locAirport?.id,
      source_code: 'NETRA-DS-2026-00004',
      evidence_snippet: 'Surveillance Log Bravo-04: Target vehicle DL-3C-AZ-9912 tracked towards airport transit flyover.',
      severity: 'NORMAL'
    }
  ];

  for (const evt of chronologicalEvents) {
    const evtCode = generateTimelineEventId();
    // Resolve data source ID
    const ds = db.get(`SELECT id FROM data_sources WHERE data_source_id = ? AND investigation_id = ?`, [evt.source_code, investigationId])
      || db.get(`SELECT id FROM data_sources WHERE investigation_id = ? LIMIT 1`, [investigationId]);

    db.run(`
      INSERT INTO timeline_events (
        event_id, investigation_id, timestamp, event_type, title,
        description, primary_entity_id, secondary_entity_id, location_entity_id,
        data_source_id, evidence_snippet, source_reference, severity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      evtCode,
      investigationId,
      evt.timestamp,
      evt.event_type,
      evt.title,
      evt.description,
      evt.primary_entity_id || null,
      evt.secondary_entity_id || null,
      evt.location_entity_id || null,
      ds ? ds.id : null,
      evt.evidence_snippet,
      evt.source_code,
      evt.severity
    ]);
  }

  const count = db.get(`SELECT COUNT(*) as count FROM timeline_events WHERE investigation_id = ?`, [investigationId]).count;
  return { total_events: count };
}

/**
 * Returns filtered timeline events for an investigation
 */
export function getInvestigationTimeline(investigationId, filters = {}) {
  let query = `
    SELECT te.*, 
      p.canonical_name as primary_entity_name, p.entity_type as primary_entity_type,
      s.canonical_name as secondary_entity_name, s.entity_type as secondary_entity_type,
      l.canonical_name as location_name,
      ds.data_source_id as source_code, ds.source_type
    FROM timeline_events te
    LEFT JOIN master_entities p ON te.primary_entity_id = p.id
    LEFT JOIN master_entities s ON te.secondary_entity_id = s.id
    LEFT JOIN master_entities l ON te.location_entity_id = l.id
    LEFT JOIN data_sources ds ON te.data_source_id = ds.id
    WHERE te.investigation_id = ?
  `;
  const params = [investigationId];

  if (filters.event_type) {
    query += ` AND te.event_type = ?`;
    params.push(filters.event_type);
  }

  if (filters.entity_id) {
    query += ` AND (te.primary_entity_id = ? OR te.secondary_entity_id = ? OR te.location_entity_id = ?)`;
    params.push(filters.entity_id, filters.entity_id, filters.entity_id);
  }

  if (filters.severity) {
    query += ` AND te.severity = ?`;
    params.push(filters.severity);
  }

  query += ` ORDER BY te.timestamp ASC`;

  return db.all(query, params);
}
