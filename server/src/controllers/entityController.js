import db from '../config/db.js';
import { processInvestigationEntities } from '../services/entities/entityProcessingService.js';
import { generateMasterEntityId } from '../services/idGenerator.js';
import { updateMasterEntityStats } from '../services/entities/entityResolver.js';
import { recordAuditLog } from '../services/auditService.js';
import { maskSensitiveValue } from '../services/entities/entityNormalizer.js';

export async function processEntities(req, res) {
  try {
    const { id } = req.params;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const result = await processInvestigationEntities(id, req.user.id, ip);
    return res.json({
      message: 'Entity extraction and resolution pipeline completed successfully.',
      result
    });
  } catch (error) {
    console.error('Entity processing failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to process entities.' });
  }
}

export function getMasterEntities(req, res) {
  try {
    const { id } = req.params;
    const { search, entity_type, min_confidence, status, limit = 100, offset = 0 } = req.query;

    const inv = isNaN(id)
      ? db.get('SELECT id FROM investigations WHERE investigation_id = ?', [id])
      : db.get('SELECT id FROM investigations WHERE id = ?', [id]);

    if (!inv) {
      return res.status(404).json({ error: 'Investigation container not found.' });
    }

    let query = `
      SELECT me.*, 
        (SELECT GROUP_CONCAT(alias_value, ' | ') FROM entity_aliases ea WHERE ea.master_entity_id = me.id) as aliases_summary
      FROM master_entities me
      WHERE me.investigation_id = ?
    `;
    const params = [inv.id];

    if (search) {
      query += ` AND (me.canonical_name LIKE ? OR me.entity_id LIKE ? OR me.id IN (SELECT master_entity_id FROM entity_aliases WHERE alias_value LIKE ?))`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (entity_type) {
      query += ` AND me.entity_type = ?`;
      params.push(entity_type);
    }

    if (status) {
      query += ` AND me.resolution_status = ?`;
      params.push(status);
    }

    if (min_confidence) {
      query += ` AND me.confidence_score >= ?`;
      params.push(parseFloat(min_confidence));
    }

    query += ` ORDER BY me.mention_count DESC, me.id ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const entities = db.all(query, params);
    const totalCount = db.get(`SELECT COUNT(*) as count FROM master_entities WHERE investigation_id = ?`, [inv.id]).count;

    return res.json({
      investigation_id: id,
      total: totalCount,
      entities
    });
  } catch (error) {
    console.error('Error fetching master entities:', error);
    return res.status(500).json({ error: 'Failed to retrieve master entities.' });
  }
}

export function getAllMasterEntities(req, res) {
  try {
    const { search, entity_type, investigation_id, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT me.*, i.investigation_id as inv_code, i.title as inv_title,
        (SELECT GROUP_CONCAT(alias_value, ' | ') FROM entity_aliases ea WHERE ea.master_entity_id = me.id) as aliases_summary
      FROM master_entities me
      JOIN investigations i ON me.investigation_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (investigation_id) {
      const inv = isNaN(investigation_id)
        ? db.get('SELECT id FROM investigations WHERE investigation_id = ?', [investigation_id])
        : { id: investigation_id };
      if (inv) {
        query += ` AND me.investigation_id = ?`;
        params.push(inv.id);
      }
    }

    if (search) {
      query += ` AND (me.canonical_name LIKE ? OR me.entity_id LIKE ? OR i.investigation_id LIKE ? OR i.title LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (entity_type) {
      query += ` AND me.entity_type = ?`;
      params.push(entity_type);
    }

    query += ` ORDER BY me.mention_count DESC, me.id ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const entities = db.all(query, params);
    const totalCount = db.get(`SELECT COUNT(*) as count FROM master_entities`).count;

    return res.json({
      total: totalCount,
      entities
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load master entities directory.' });
  }
}

export function getEntityStats(req, res) {
  try {
    const { id } = req.params;
    const inv = isNaN(id)
      ? db.get('SELECT id FROM investigations WHERE investigation_id = ?', [id])
      : db.get('SELECT id FROM investigations WHERE id = ?', [id]);

    if (!inv) {
      return res.status(404).json({ error: 'Investigation container not found.' });
    }

    const totalMentions = db.get(`SELECT COUNT(*) as count FROM entity_mentions WHERE investigation_id = ?`, [inv.id]).count;
    const totalMasterEntities = db.get(`SELECT COUNT(*) as count FROM master_entities WHERE investigation_id = ?`, [inv.id]).count;
    const pendingReviewCount = db.get(`SELECT COUNT(*) as count FROM entity_mentions WHERE investigation_id = ? AND status = 'POSSIBLE_MATCH'`, [inv.id]).count;

    // Type counts
    const typeCounts = db.all(`
      SELECT entity_type, COUNT(*) as count 
      FROM master_entities 
      WHERE investigation_id = ? 
      GROUP BY entity_type
    `, [inv.id]);

    const typeBreakdown = {
      PERSON: 0,
      PHONE_NUMBER: 0,
      LOCATION: 0,
      VEHICLE: 0,
      ORGANIZATION: 0,
      ACCOUNT_NUMBER: 0,
      TRANSACTION: 0,
      DEVICE_IDENTIFIER: 0,
      DATE: 0,
      TIME: 0,
      EVENT: 0
    };

    typeCounts.forEach(t => {
      typeBreakdown[t.entity_type] = t.count;
    });

    return res.json({
      total_mentions: totalMentions,
      total_master_entities: totalMasterEntities,
      pending_review_count: pendingReviewCount,
      type_breakdown: typeBreakdown
    });
  } catch (error) {
    console.error('Error calculating entity stats:', error);
    return res.status(500).json({ error: 'Failed to calculate entity metrics.' });
  }
}

export function getEntityProfile(req, res) {
  try {
    const { id } = req.params;
    const master = isNaN(id)
      ? db.get(`
          SELECT me.*, i.investigation_id as inv_code, i.title as inv_title 
          FROM master_entities me 
          JOIN investigations i ON me.investigation_id = i.id 
          WHERE me.entity_id = ?
        `, [id])
      : db.get(`
          SELECT me.*, i.investigation_id as inv_code, i.title as inv_title 
          FROM master_entities me 
          JOIN investigations i ON me.investigation_id = i.id 
          WHERE me.id = ?
        `, [id]);

    if (!master) {
      return res.status(404).json({ error: 'Master Entity not found.' });
    }

    // Fetch aliases
    const aliases = db.all(`SELECT * FROM entity_aliases WHERE master_entity_id = ? ORDER BY id ASC`, [master.id]);

    // Fetch all connected mentions with source traceability
    const mentions = db.all(`
      SELECT 
        em.*, 
        map.resolution_score, 
        map.resolution_method, 
        map.resolution_status as mapping_status,
        ds.data_source_id as source_code,
        ds.file_name as source_file_name,
        ds.source_type as ds_type
      FROM entity_mappings map
      JOIN entity_mentions em ON map.entity_mention_id = em.id
      JOIN data_sources ds ON em.data_source_id = ds.id
      WHERE map.master_entity_id = ?
      ORDER BY em.created_at ASC
    `, [master.id]);

    // Fetch distinct connected data sources
    const connectedSources = db.all(`
      SELECT DISTINCT ds.id, ds.data_source_id, ds.file_name, ds.source_type, ds.sha256_hash, ds.uploaded_at
      FROM entity_mappings map
      JOIN entity_mentions em ON map.entity_mention_id = em.id
      JOIN data_sources ds ON em.data_source_id = ds.id
      WHERE map.master_entity_id = ?
    `, [master.id]);

    return res.json({
      profile: {
        ...master,
        masked_canonical: maskSensitiveValue(master.entity_type, master.canonical_name)
      },
      aliases,
      mentions,
      connected_sources: connectedSources
    });
  } catch (error) {
    console.error('Error fetching entity profile:', error);
    return res.status(500).json({ error: 'Failed to load entity profile.' });
  }
}

export function getEntityReviewQueue(req, res) {
  try {
    const { id } = req.params;
    const inv = isNaN(id)
      ? db.get('SELECT id, investigation_id FROM investigations WHERE investigation_id = ?', [id])
      : db.get('SELECT id, investigation_id FROM investigations WHERE id = ?', [id]);

    if (!inv) {
      return res.status(404).json({ error: 'Investigation not found.' });
    }

    const queueItems = db.all(`
      SELECT 
        em.id as mention_db_id,
        em.entity_mention_id,
        em.entity_type,
        em.original_value,
        em.normalized_value,
        em.canonical_candidate,
        em.confidence_score as extraction_confidence,
        em.source_context,
        em.source_reference,
        em.extraction_method,
        ds.data_source_id as source_code,
        ds.file_name as source_file_name,
        ds.source_type as ds_type,
        map.id as mapping_id,
        map.master_entity_id,
        map.resolution_score,
        map.resolution_method,
        me.entity_id as candidate_master_code,
        me.canonical_name as candidate_master_name,
        me.entity_type as candidate_master_type
      FROM entity_mentions em
      JOIN data_sources ds ON em.data_source_id = ds.id
      LEFT JOIN entity_mappings map ON em.id = map.entity_mention_id
      LEFT JOIN master_entities me ON map.master_entity_id = me.id
      WHERE em.investigation_id = ? AND em.status = 'POSSIBLE_MATCH'
      ORDER BY map.resolution_score DESC, em.id ASC
    `, [inv.id]);

    return res.json({
      investigation_id: inv.investigation_id,
      count: queueItems.length,
      queue: queueItems
    });
  } catch (error) {
    console.error('Error loading review queue:', error);
    return res.status(500).json({ error: 'Failed to retrieve entity review queue.' });
  }
}

export function confirmEntityMerge(req, res) {
  try {
    const { mention_id, master_entity_id, notes } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    const mention = db.get('SELECT * FROM entity_mentions WHERE id = ?', [mention_id]);
    const master = db.get('SELECT * FROM master_entities WHERE id = ?', [master_entity_id]);

    if (!mention || !master) {
      return res.status(404).json({ error: 'Entity mention or Master Entity target not found.' });
    }

    // 1. Update mapping status
    db.run(`
      INSERT OR REPLACE INTO entity_mappings (
        entity_mention_id, master_entity_id, resolution_score, resolution_method, resolution_status
      ) VALUES (?, ?, 1.0, 'INVESTIGATOR_CONFIRMED_MERGE', 'INVESTIGATOR_MERGED')
    `, [mention.id, master.id]);

    // 2. Add Alias
    db.run(`
      INSERT OR IGNORE INTO entity_aliases (master_entity_id, alias_value, normalized_value)
      VALUES (?, ?, ?)
    `, [master.id, mention.original_value, mention.normalized_value]);

    // 3. Update mention status
    db.run(`UPDATE entity_mentions SET status = 'CONFIRMED' WHERE id = ?`, [mention.id]);

    // 4. Update master entity stats
    updateMasterEntityStats(master.id);

    // 5. Record Review Action & Audit Log
    db.run(`
      INSERT INTO entity_review_actions (investigation_id, entity_mention_id, master_entity_id, reviewed_by, action, notes)
      VALUES (?, ?, ?, ?, 'CONFIRM_MERGE', ?)
    `, [mention.investigation_id, mention.id, master.id, req.user.id, notes || 'Investigator confirmed entity equivalence.']);

    recordAuditLog({
      investigationId: mention.investigation_id,
      userId: req.user.id,
      action: 'INVESTIGATOR_MERGE',
      details: `Investigator ${req.user.name} confirmed merge of mention "${mention.original_value}" into Master Entity ${master.entity_id} ("${master.canonical_name}").`,
      ipAddress: ip
    });

    return res.json({
      success: true,
      message: `Entity mention merged into ${master.canonical_name} (${master.entity_id}).`,
      master_entity_id: master.id
    });
  } catch (error) {
    console.error('Error confirming merge:', error);
    return res.status(500).json({ error: 'Failed to confirm entity merge.' });
  }
}

export function keepEntitySeparate(req, res) {
  try {
    const { mention_id, canonical_name, notes } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    const mention = db.get('SELECT * FROM entity_mentions WHERE id = ?', [mention_id]);
    if (!mention) {
      return res.status(404).json({ error: 'Entity mention not found.' });
    }

    // 1. Create new standalone Master Entity
    const newMasterCode = generateMasterEntityId();
    const finalCanonical = canonical_name || mention.canonical_candidate;

    db.run(`
      INSERT INTO master_entities (
        entity_id, investigation_id, entity_type, canonical_name,
        confidence_score, resolution_status, mention_count, source_count
      ) VALUES (?, ?, ?, ?, ?, 'CONFIRMED', 1, 1)
    `, [newMasterCode, mention.investigation_id, mention.entity_type, finalCanonical, mention.confidence_score]);

    const created = db.get('SELECT id FROM master_entities WHERE entity_id = ?', [newMasterCode]);

    // 2. Insert Alias & Mapping
    db.run(`
      INSERT OR IGNORE INTO entity_aliases (master_entity_id, alias_value, normalized_value)
      VALUES (?, ?, ?)
    `, [created.id, mention.original_value, mention.normalized_value]);

    db.run(`
      INSERT OR REPLACE INTO entity_mappings (
        entity_mention_id, master_entity_id, resolution_score, resolution_method, resolution_status
      ) VALUES (?, ?, 1.0, 'INVESTIGATOR_SEPARATED', 'CONFIRMED')
    `, [mention.id, created.id]);

    // 3. Update mention status
    db.run(`UPDATE entity_mentions SET status = 'CONFIRMED' WHERE id = ?`, [mention.id]);

    // 4. Record action and audit log
    db.run(`
      INSERT INTO entity_review_actions (investigation_id, entity_mention_id, master_entity_id, reviewed_by, action, notes)
      VALUES (?, ?, ?, ?, 'KEEP_SEPARATE', ?)
    `, [mention.investigation_id, mention.id, created.id, req.user.id, notes || 'Investigator designated as independent entity.']);

    recordAuditLog({
      investigationId: mention.investigation_id,
      userId: req.user.id,
      action: 'INVESTIGATOR_SEPARATE',
      details: `Investigator ${req.user.name} designated "${finalCanonical}" as a separate Master Entity (${newMasterCode}).`,
      ipAddress: ip
    });

    return res.json({
      success: true,
      message: `Independent Master Entity created: ${finalCanonical} (${newMasterCode}).`,
      master_entity_id: created.id,
      master_entity_code: newMasterCode
    });
  } catch (error) {
    console.error('Error keeping entity separate:', error);
    return res.status(500).json({ error: 'Failed to split entity into separate Master Entity.' });
  }
}

export function editCanonicalName(req, res) {
  try {
    const { master_entity_id, canonical_name } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    if (!canonical_name || !canonical_name.trim()) {
      return res.status(400).json({ error: 'Canonical name cannot be blank.' });
    }

    const master = db.get('SELECT * FROM master_entities WHERE id = ?', [master_entity_id]);
    if (!master) {
      return res.status(404).json({ error: 'Master Entity not found.' });
    }

    const oldName = master.canonical_name;
    const newName = canonical_name.trim();

    db.run(`
      UPDATE master_entities 
      SET canonical_name = ?, resolution_status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [newName, master.id]);

    db.run(`
      INSERT OR IGNORE INTO entity_aliases (master_entity_id, alias_value, normalized_value)
      VALUES (?, ?, ?)
    `, [master.id, newName, newName]);

    db.run(`
      INSERT INTO entity_review_actions (investigation_id, master_entity_id, reviewed_by, action, notes)
      VALUES (?, ?, ?, 'EDIT_CANONICAL', ?)
    `, [master.investigation_id, master.id, req.user.id, `Canonical name modified: "${oldName}" ➔ "${newName}"`]);

    recordAuditLog({
      investigationId: master.investigation_id,
      userId: req.user.id,
      action: 'CANONICAL_NAME_UPDATED',
      details: `Investigator ${req.user.name} updated Master Entity ${master.entity_id} canonical name from "${oldName}" to "${newName}".`,
      ipAddress: ip
    });

    return res.json({
      success: true,
      message: `Master Entity canonical name updated to "${newName}".`,
      master_entity_id: master.id,
      canonical_name: newName
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update canonical name.' });
  }
}

export function rejectEntityMention(req, res) {
  try {
    const { mention_id, notes } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    const mention = db.get('SELECT * FROM entity_mentions WHERE id = ?', [mention_id]);
    if (!mention) {
      return res.status(404).json({ error: 'Entity mention not found.' });
    }

    db.run(`UPDATE entity_mentions SET status = 'REJECTED' WHERE id = ?`, [mention.id]);
    db.run(`DELETE FROM entity_mappings WHERE entity_mention_id = ?`, [mention.id]);

    db.run(`
      INSERT INTO entity_review_actions (investigation_id, entity_mention_id, reviewed_by, action, notes)
      VALUES (?, ?, ?, 'MARK_INCORRECT', ?)
    `, [mention.investigation_id, mention.id, req.user.id, notes || 'Investigator marked mention as false positive extraction.']);

    recordAuditLog({
      investigationId: mention.investigation_id,
      userId: req.user.id,
      action: 'MENTION_REJECTED',
      details: `Investigator ${req.user.name} marked entity mention "${mention.original_value}" (${mention.entity_mention_id}) as invalid extraction.`,
      ipAddress: ip
    });

    return res.json({
      success: true,
      message: `Mention ${mention.entity_mention_id} marked as rejected.`
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reject entity mention.' });
  }
}
