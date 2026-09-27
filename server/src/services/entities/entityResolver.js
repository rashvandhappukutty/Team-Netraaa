import db from '../../config/db.js';
import { generateMasterEntityId } from '../idGenerator.js';

/**
 * Calculates Jaro-Winkler / Levenshtein string similarity (0.0 to 1.0)
 */
export function calculateStringSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();

  if (str1 === str2) return 1.0;

  // Substring or token subset check
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const intersection = words1.filter(w => words2.includes(w));
  if (intersection.length > 0 && (intersection.length === words1.length || intersection.length === words2.length)) {
    return 0.85;
  }

  // Levenshtein distance
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  const distance = track[str2.length][str1.length];
  return Math.max(0, 1 - distance / maxLength);
}

/**
 * Resolves a single entity mention against the existing Master Entity registry in an investigation
 * @param {Object} mention - { id, investigation_id, entity_type, original_value, normalized_value, canonical_candidate, confidence_score }
 * @returns {Object} Resolution result
 */
export async function resolveEntityMention(mention) {
  const { id: mentionDbId, investigation_id, entity_type, original_value, normalized_value, canonical_candidate, confidence_score } = mention;

  // 1. Fetch all existing Master Entities of the same type in this investigation
  const existingMasterEntities = db.all(`
    SELECT * FROM master_entities 
    WHERE investigation_id = ? AND entity_type = ?
  `, [investigation_id, entity_type]);

  let bestMatch = null;
  let highestScore = 0;
  let matchMethod = 'NEW_ENTITY_CREATION';

  for (const master of existingMasterEntities) {
    // Strategy A: Exact Match on Canonical Name or Normalized Value
    if (master.canonical_name.toLowerCase() === canonical_candidate.toLowerCase() ||
        master.canonical_name.toLowerCase() === normalized_value.toLowerCase()) {
      bestMatch = master;
      highestScore = 0.98;
      matchMethod = 'EXACT_CANONICAL_MATCH';
      break;
    }

    // Strategy B: Exact Match against Registered Aliases
    const aliases = db.all(`
      SELECT * FROM entity_aliases WHERE master_entity_id = ?
    `, [master.id]);

    const matchingAlias = aliases.find(a => 
      a.alias_value.toLowerCase() === original_value.toLowerCase() ||
      a.normalized_value.toLowerCase() === normalized_value.toLowerCase() ||
      a.alias_value.toLowerCase() === canonical_candidate.toLowerCase()
    );

    if (matchingAlias) {
      bestMatch = master;
      highestScore = 0.95;
      matchMethod = 'REGISTERED_ALIAS_MATCH';
      break;
    }

    // Strategy C: Deterministic Exact Match for Hard Identifiers (Phone, Vehicle, Account, Device)
    if (['PHONE_NUMBER', 'VEHICLE', 'ACCOUNT_NUMBER', 'DEVICE_IDENTIFIER'].includes(entity_type)) {
      if (master.canonical_name === normalized_value) {
        bestMatch = master;
        highestScore = 0.99;
        matchMethod = 'DETERMINISTIC_IDENTIFIER_MATCH';
        break;
      }
    }

    // Strategy D: Fuzzy & Token Subset Match for Person & Organization
    if (['PERSON', 'ORGANIZATION'].includes(entity_type)) {
      const similarity = calculateStringSimilarity(master.canonical_name, canonical_candidate);
      if (similarity > highestScore) {
        highestScore = similarity;
        bestMatch = master;
        matchMethod = 'FUZZY_STRING_SIMILARITY';
      }
    }
  }

  // -------------------------------------------------------------
  // RESOLUTION DECISION THRESHOLDS
  // -------------------------------------------------------------

  // Threshold 1: High Confidence (>= 0.90) -> Auto-merge into Master Entity
  if (bestMatch && highestScore >= 0.90) {
    // Link mention to Master Entity
    db.run(`
      INSERT OR REPLACE INTO entity_mappings (
        entity_mention_id, master_entity_id, resolution_score, resolution_method, resolution_status
      ) VALUES (?, ?, ?, ?, 'AUTOMATIC_MATCH')
    `, [mentionDbId, bestMatch.id, highestScore, matchMethod]);

    // Register alias if new
    try {
      db.run(`
        INSERT OR IGNORE INTO entity_aliases (master_entity_id, alias_value, normalized_value)
        VALUES (?, ?, ?)
      `, [bestMatch.id, original_value, normalized_value]);
    } catch (e) {}

    // Update mention status to RESOLVED
    db.run(`UPDATE entity_mentions SET status = 'RESOLVED' WHERE id = ?`, [mentionDbId]);

    // Update master entity stats
    updateMasterEntityStats(bestMatch.id);

    return {
      master_entity_id: bestMatch.id,
      master_entity_code: bestMatch.entity_id,
      canonical_name: bestMatch.canonical_name,
      resolution_status: 'RESOLVED',
      resolution_method: matchMethod,
      confidence_score: highestScore,
      is_new: false
    };
  }

  // Threshold 2: Medium Confidence (0.70 - 0.89) -> Flag as POSSIBLE_MATCH for Review Queue
  if (bestMatch && highestScore >= 0.70) {
    // Create mapping as POSSIBLE_MATCH
    db.run(`
      INSERT OR REPLACE INTO entity_mappings (
        entity_mention_id, master_entity_id, resolution_score, resolution_method, resolution_status
      ) VALUES (?, ?, ?, ?, 'POSSIBLE_MATCH')
    `, [mentionDbId, bestMatch.id, highestScore, `POTENTIAL_DUPLICATE (${Math.round(highestScore * 100)}% match)`]);

    // Update mention status to POSSIBLE_MATCH
    db.run(`UPDATE entity_mentions SET status = 'POSSIBLE_MATCH' WHERE id = ?`, [mentionDbId]);

    return {
      candidate_master_id: bestMatch.id,
      candidate_master_code: bestMatch.entity_id,
      candidate_canonical_name: bestMatch.canonical_name,
      resolution_status: 'POSSIBLE_MATCH',
      resolution_method: matchMethod,
      confidence_score: highestScore,
      is_new: false,
      requires_review: true
    };
  }

  // Threshold 3: Low Match / New Entity (< 0.70) -> Create New Master Entity
  const newMasterId = generateMasterEntityId();
  db.run(`
    INSERT INTO master_entities (
      entity_id, investigation_id, entity_type, canonical_name,
      confidence_score, resolution_status, mention_count, source_count
    ) VALUES (?, ?, ?, ?, ?, 'RESOLVED', 1, 1)
  `, [newMasterId, investigation_id, entity_type, canonical_candidate, confidence_score || 0.90]);

  const createdMaster = db.get('SELECT id FROM master_entities WHERE entity_id = ?', [newMasterId]);
  const masterDbId = createdMaster.id;

  // Insert Alias
  db.run(`
    INSERT OR IGNORE INTO entity_aliases (master_entity_id, alias_value, normalized_value)
    VALUES (?, ?, ?)
  `, [masterDbId, original_value, normalized_value]);

  // Insert Mapping
  db.run(`
    INSERT INTO entity_mappings (
      entity_mention_id, master_entity_id, resolution_score, resolution_method, resolution_status
    ) VALUES (?, ?, ?, 'NEW_CANONICAL_CREATION', 'AUTOMATIC_MATCH')
  `, [mentionDbId, masterDbId, confidence_score || 0.90]);

  // Update mention status
  db.run(`UPDATE entity_mentions SET status = 'RESOLVED' WHERE id = ?`, [mentionDbId]);

  return {
    master_entity_id: masterDbId,
    master_entity_code: newMasterId,
    canonical_name: canonical_candidate,
    resolution_status: 'RESOLVED',
    resolution_method: 'NEW_CANONICAL_CREATION',
    confidence_score: confidence_score || 0.90,
    is_new: true
  };
}

/**
 * Updates mention count and distinct source count for a Master Entity
 */
export function updateMasterEntityStats(masterEntityId) {
  const stats = db.get(`
    SELECT 
      COUNT(DISTINCT em.id) as mention_count,
      COUNT(DISTINCT em.data_source_id) as source_count
    FROM entity_mappings map
    JOIN entity_mentions em ON map.entity_mention_id = em.id
    WHERE map.master_entity_id = ? AND map.resolution_status IN ('AUTOMATIC_MATCH', 'INVESTIGATOR_MERGED', 'CONFIRMED')
  `, [masterEntityId]);

  if (stats) {
    db.run(`
      UPDATE master_entities 
      SET mention_count = ?, source_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [stats.mention_count || 1, stats.source_count || 1, masterEntityId]);
  }
}
