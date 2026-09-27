import db from '../../config/db.js';
import { generateEntityMentionId } from '../idGenerator.js';
import { extractEntitiesFromNormalizedRecord } from './entityExtractor.js';
import { resolveEntityMention } from './entityResolver.js';
import { recordAuditLog } from '../auditService.js';

/**
 * Executes the complete Phase 2 AI Entity Extraction & Entity Resolution Pipeline
 * on all normalized intelligence records in an investigation container.
 * 
 * @param {number|string} investigationId 
 * @param {number} userId 
 * @param {string} ipAddress 
 * @returns {Promise<Object>} Pipeline execution metrics
 */
export async function processInvestigationEntities(investigationId, userId, ipAddress = '127.0.0.1') {
  const inv = isNaN(investigationId)
    ? db.get('SELECT * FROM investigations WHERE investigation_id = ?', [investigationId])
    : db.get('SELECT * FROM investigations WHERE id = ?', [investigationId]);

  if (!inv) {
    throw new Error('Investigation container not found.');
  }

  // Set processing status
  db.run(`
    UPDATE investigations 
    SET entity_processing_status = 'PROCESSING' 
    WHERE id = ?
  `, [inv.id]);

  try {
    // 1. Fetch all normalized records for this investigation
    const records = db.all(`
      SELECT * FROM normalized_records 
      WHERE investigation_id = ?
      ORDER BY id ASC
    `, [inv.id]);

    let totalMentionsExtracted = 0;
    let autoResolvedCount = 0;
    let reviewRequiredCount = 0;
    let newMastersCreated = 0;

    // Track data source entity counts
    const sourceMentionCounts = {};

    for (const rec of records) {
      // 2. Execute Source-Specific Entity Extraction
      const rawMentions = extractEntitiesFromNormalizedRecord(rec);

      for (const rawM of rawMentions) {
        const mentionCode = generateEntityMentionId();

        // 3. Insert Entity Mention
        db.run(`
          INSERT INTO entity_mentions (
            entity_mention_id, investigation_id, data_source_id, normalized_record_id,
            entity_type, original_value, normalized_value, canonical_candidate,
            confidence_score, extraction_method, source_context, source_reference, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EXTRACTED')
        `, [
          mentionCode,
          inv.id,
          rec.data_source_id,
          rec.id,
          rawM.entity_type,
          rawM.original_value,
          rawM.normalized_value,
          rawM.canonical_candidate,
          rawM.confidence_score,
          rawM.extraction_method,
          rawM.source_context || '',
          rawM.source_reference
        ]);

        const createdMention = db.get('SELECT * FROM entity_mentions WHERE entity_mention_id = ?', [mentionCode]);
        totalMentionsExtracted++;
        sourceMentionCounts[rec.data_source_id] = (sourceMentionCounts[rec.data_source_id] || 0) + 1;

        // 4. Execute Entity Resolution Engine
        const resolution = await resolveEntityMention(createdMention);

        if (resolution.is_new) {
          newMastersCreated++;
        } else if (resolution.requires_review) {
          reviewRequiredCount++;
        } else {
          autoResolvedCount++;
        }
      }
    }

    // 5. Update data sources extracted counts
    for (const [dsId, count] of Object.entries(sourceMentionCounts)) {
      db.run(`
        UPDATE data_sources 
        SET entity_extracted_count = ? 
        WHERE id = ?
      `, [count, dsId]);
    }

    // 6. Update investigation status to COMPLETED
    db.run(`
      UPDATE investigations 
      SET entity_processing_status = 'COMPLETED', entity_processed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [inv.id]);

    // 7. Fetch final master entity total
    const totalMasterEntities = db.get(`
      SELECT COUNT(*) as count FROM master_entities WHERE investigation_id = ?
    `, [inv.id]).count;

    // 8. Record Chain of Custody Audit Logs
    recordAuditLog({
      investigationId: inv.id,
      userId: userId,
      action: 'ENTITIES_EXTRACTED',
      details: `AI Entity Extraction Engine identified ${totalMentionsExtracted} entity mentions across ${records.length} normalized records in ${inv.investigation_id}.`,
      ipAddress
    });

    recordAuditLog({
      investigationId: inv.id,
      userId: userId,
      action: 'ENTITIES_RESOLVED',
      details: `Entity Resolution Engine resolved mentions into ${totalMasterEntities} Master Entities (${autoResolvedCount} auto-merged, ${reviewRequiredCount} queued for investigator review).`,
      ipAddress
    });

    return {
      success: true,
      investigation_id: inv.investigation_id,
      records_analyzed: records.length,
      total_mentions_extracted: totalMentionsExtracted,
      master_entities_total: totalMasterEntities,
      auto_resolved_count: autoResolvedCount,
      review_required_count: reviewRequiredCount,
      new_masters_created: newMastersCreated,
      status: 'COMPLETED'
    };
  } catch (error) {
    db.run(`
      UPDATE investigations 
      SET entity_processing_status = 'FAILED' 
      WHERE id = ?
    `, [inv.id]);
    console.error('Error during entity processing pipeline:', error);
    throw error;
  }
}
