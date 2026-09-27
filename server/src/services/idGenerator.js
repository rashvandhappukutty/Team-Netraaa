import db from '../config/db.js';

/**
 * Generates formatted, sequential business identifiers:
 * - Investigations: NETRA-INV-YYYY-XXXXX
 * - Data Sources:   NETRA-DS-YYYY-XXXXX
 * - Entity Mentions: NETRA-MEN-YYYY-XXXXX
 * - Master Entities: NETRA-ENT-YYYY-XXXXX
 */

export function generateInvestigationId() {
  const currentYear = new Date().getFullYear();
  const prefix = `NETRA-INV-${currentYear}-`;

  const result = db.get(
    `SELECT investigation_id FROM investigations WHERE investigation_id LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSequence = 1;
  if (result && result.investigation_id) {
    const parts = result.investigation_id.split('-');
    const lastSeq = parseInt(parts[3], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `${prefix}${paddedSequence}`;
}

export function generateDataSourceId() {
  const currentYear = new Date().getFullYear();
  const prefix = `NETRA-DS-${currentYear}-`;

  const result = db.get(
    `SELECT data_source_id FROM data_sources WHERE data_source_id LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSequence = 1;
  if (result && result.data_source_id) {
    const parts = result.data_source_id.split('-');
    const lastSeq = parseInt(parts[3], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `${prefix}${paddedSequence}`;
}

export function generateEntityMentionId() {
  const currentYear = new Date().getFullYear();
  const prefix = `NETRA-MEN-${currentYear}-`;

  const result = db.get(
    `SELECT entity_mention_id FROM entity_mentions WHERE entity_mention_id LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSequence = 1;
  if (result && result.entity_mention_id) {
    const parts = result.entity_mention_id.split('-');
    const lastSeq = parseInt(parts[3], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `${prefix}${paddedSequence}`;
}

export function generateMasterEntityId() {
  const currentYear = new Date().getFullYear();
  const prefix = `NETRA-ENT-${currentYear}-`;

  const result = db.get(
    `SELECT entity_id FROM master_entities WHERE entity_id LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSequence = 1;
  if (result && result.entity_id) {
    const parts = result.entity_id.split('-');
    const lastSeq = parseInt(parts[3], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `${prefix}${paddedSequence}`;
}

export function generateRelationshipId() {
  const currentYear = new Date().getFullYear();
  const prefix = `NETRA-REL-${currentYear}-`;

  const result = db.get(
    `SELECT relationship_id FROM relationships WHERE relationship_id LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSequence = 1;
  if (result && result.relationship_id) {
    const parts = result.relationship_id.split('-');
    const lastSeq = parseInt(parts[3], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `${prefix}${paddedSequence}`;
}

export function generatePatternId() {
  const currentYear = new Date().getFullYear();
  const prefix = `NETRA-PAT-${currentYear}-`;

  const result = db.get(
    `SELECT pattern_id FROM detected_patterns WHERE pattern_id LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSequence = 1;
  if (result && result.pattern_id) {
    const parts = result.pattern_id.split('-');
    const lastSeq = parseInt(parts[3], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `${prefix}${paddedSequence}`;
}

export function generateTimelineEventId() {
  const currentYear = new Date().getFullYear();
  const prefix = `NETRA-EVT-${currentYear}-`;

  const result = db.get(
    `SELECT event_id FROM timeline_events WHERE event_id LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSequence = 1;
  if (result && result.event_id) {
    const parts = result.event_id.split('-');
    const lastSeq = parseInt(parts[3], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `${prefix}${paddedSequence}`;
}

export function generateLeadId() {
  const currentYear = new Date().getFullYear();
  const prefix = `NETRA-LEAD-${currentYear}-`;

  const result = db.get(
    `SELECT lead_id FROM priority_leads WHERE lead_id LIKE ? ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let nextSequence = 1;
  if (result && result.lead_id) {
    const parts = result.lead_id.split('-');
    const lastSeq = parseInt(parts[3], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `${prefix}${paddedSequence}`;
}

