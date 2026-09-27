import db from '../config/db.js';

export function initializeDatabase() {
  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('INVESTIGATOR', 'ADMIN')) NOT NULL DEFAULT 'INVESTIGATOR',
      badge_number TEXT NOT NULL,
      department TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Investigation Containers Table
  db.run(`
    CREATE TABLE IF NOT EXISTS investigations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investigation_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      investigation_type TEXT NOT NULL,
      priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) NOT NULL DEFAULT 'MEDIUM',
      status TEXT CHECK(status IN ('ACTIVE', 'UNDER_INVESTIGATION', 'PENDING', 'CLOSED')) NOT NULL DEFAULT 'ACTIVE',
      start_date DATE NOT NULL,
      primary_location TEXT NOT NULL,
      lead_investigator_id INTEGER NOT NULL,
      entity_processing_status TEXT CHECK(entity_processing_status IN ('NOT_STARTED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED')) DEFAULT 'NOT_STARTED',
      entity_processed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_investigator_id) REFERENCES users(id)
    );
  `);

  // Investigation Team Members Table
  db.run(`
    CREATE TABLE IF NOT EXISTS investigation_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investigation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(investigation_id, user_id)
    );
  `);

  // Multi-Source Data Sources Table (Preserved Read-Only)
  db.run(`
    CREATE TABLE IF NOT EXISTS data_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_source_id TEXT UNIQUE NOT NULL,
      investigation_id INTEGER NOT NULL,
      source_type TEXT CHECK(source_type IN (
        'FIR_POLICE_REPORT',
        'CDR',
        'FINANCIAL_TRANSACTIONS',
        'SURVEILLANCE_REPORT',
        'CRIMINAL_HISTORY',
        'SOCIAL_MEDIA_INTEL',
        'OTHER'
      )) NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_extension TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      sha256_hash TEXT NOT NULL,
      integrity_status TEXT CHECK(integrity_status IN ('VERIFIED', 'VERIFICATION_FAILED')) NOT NULL DEFAULT 'VERIFIED',
      uploaded_by INTEGER NOT NULL,
      processing_status TEXT CHECK(processing_status IN ('UPLOADED', 'VALIDATING', 'VALIDATED', 'EXTRACTING', 'NORMALIZING', 'NORMALIZED', 'READY_FOR_AI', 'FAILED')) NOT NULL DEFAULT 'UPLOADED',
      record_count INTEGER NOT NULL DEFAULT 0,
      extraction_status TEXT DEFAULT 'PENDING',
      entity_extracted_count INTEGER NOT NULL DEFAULT 0,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );
  `);

  // Extracted Content Table
  db.run(`
    CREATE TABLE IF NOT EXISTS extracted_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_source_id INTEGER UNIQUE NOT NULL,
      investigation_id INTEGER NOT NULL,
      content_type TEXT,
      raw_content TEXT,
      original_reference TEXT,
      extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
    );
  `);

  // Normalized Records Table
  db.run(`
    CREATE TABLE IF NOT EXISTS normalized_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investigation_id INTEGER NOT NULL,
      data_source_id INTEGER NOT NULL,
      source_type TEXT NOT NULL,
      record_id TEXT UNIQUE NOT NULL,
      original_record_reference TEXT NOT NULL,
      raw_content TEXT NOT NULL,
      normalized_content TEXT NOT NULL,
      processing_status TEXT CHECK(processing_status IN ('VALIDATED', 'NORMALIZED', 'READY_FOR_AI', 'ERROR')) NOT NULL DEFAULT 'READY_FOR_AI',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
      FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE
    );
  `);

  // -------------------------------------------------------------
  // PHASE 2 SCHEMA: AI ENTITY EXTRACTION & RESOLUTION LAYER
  // -------------------------------------------------------------

  // Raw Entity Mentions extracted from documents/records
  db.run(`
    CREATE TABLE IF NOT EXISTS entity_mentions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_mention_id TEXT UNIQUE NOT NULL,
      investigation_id INTEGER NOT NULL,
      data_source_id INTEGER NOT NULL,
      normalized_record_id INTEGER,
      entity_type TEXT CHECK(entity_type IN (
        'PERSON',
        'ORGANIZATION',
        'PHONE_NUMBER',
        'LOCATION',
        'VEHICLE',
        'ACCOUNT_NUMBER',
        'TRANSACTION',
        'DEVICE_IDENTIFIER',
        'DATE',
        'TIME',
        'EVENT'
      )) NOT NULL,
      original_value TEXT NOT NULL,
      normalized_value TEXT NOT NULL,
      canonical_candidate TEXT NOT NULL,
      confidence_score REAL NOT NULL DEFAULT 0.85,
      extraction_method TEXT NOT NULL,
      source_context TEXT,
      source_reference TEXT NOT NULL,
      status TEXT CHECK(status IN ('EXTRACTED', 'NORMALIZED', 'RESOLVED', 'POSSIBLE_MATCH', 'CONFIRMED', 'REJECTED')) NOT NULL DEFAULT 'EXTRACTED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
      FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE,
      FOREIGN KEY (normalized_record_id) REFERENCES normalized_records(id) ON DELETE SET NULL
    );
  `);

  // Master Entities (Unique real-world canonical entities)
  db.run(`
    CREATE TABLE IF NOT EXISTS master_entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id TEXT UNIQUE NOT NULL,
      investigation_id INTEGER NOT NULL,
      entity_type TEXT CHECK(entity_type IN (
        'PERSON',
        'ORGANIZATION',
        'PHONE_NUMBER',
        'LOCATION',
        'VEHICLE',
        'ACCOUNT_NUMBER',
        'TRANSACTION',
        'DEVICE_IDENTIFIER',
        'DATE',
        'TIME',
        'EVENT'
      )) NOT NULL,
      canonical_name TEXT NOT NULL,
      confidence_score REAL NOT NULL DEFAULT 0.90,
      resolution_status TEXT CHECK(resolution_status IN ('RESOLVED', 'POSSIBLE_MATCH', 'CONFIRMED', 'INVESTIGATOR_REVIEW')) NOT NULL DEFAULT 'RESOLVED',
      mention_count INTEGER NOT NULL DEFAULT 1,
      source_count INTEGER NOT NULL DEFAULT 1,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
    );
  `);

  // Entity Aliases (Known variants, aliases, and misspellings)
  db.run(`
    CREATE TABLE IF NOT EXISTS entity_aliases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      master_entity_id INTEGER NOT NULL,
      alias_value TEXT NOT NULL,
      normalized_value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (master_entity_id) REFERENCES master_entities(id) ON DELETE CASCADE,
      UNIQUE(master_entity_id, alias_value)
    );
  `);

  // Entity Mappings (Connects Mentions to Master Entities)
  db.run(`
    CREATE TABLE IF NOT EXISTS entity_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_mention_id INTEGER NOT NULL,
      master_entity_id INTEGER NOT NULL,
      resolution_score REAL NOT NULL DEFAULT 0.90,
      resolution_method TEXT NOT NULL,
      resolution_status TEXT CHECK(resolution_status IN ('AUTOMATIC_MATCH', 'POSSIBLE_MATCH', 'INVESTIGATOR_MERGED', 'CONFIRMED', 'SEPARATED')) NOT NULL DEFAULT 'AUTOMATIC_MATCH',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (entity_mention_id) REFERENCES entity_mentions(id) ON DELETE CASCADE,
      FOREIGN KEY (master_entity_id) REFERENCES master_entities(id) ON DELETE CASCADE,
      UNIQUE(entity_mention_id, master_entity_id)
    );
  `);

  // Entity Review Actions (Investigator decisions ledger)
  db.run(`
    CREATE TABLE IF NOT EXISTS entity_review_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investigation_id INTEGER NOT NULL,
      entity_mention_id INTEGER,
      master_entity_id INTEGER,
      reviewed_by INTEGER NOT NULL,
      action TEXT CHECK(action IN ('CONFIRM_MERGE', 'KEEP_SEPARATE', 'EDIT_CANONICAL', 'MARK_INCORRECT')) NOT NULL,
      notes TEXT,
      reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
      FOREIGN KEY (entity_mention_id) REFERENCES entity_mentions(id) ON DELETE SET NULL,
      FOREIGN KEY (master_entity_id) REFERENCES master_entities(id) ON DELETE SET NULL,
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );
  `);

  // Immutable Audit Logs Table
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investigation_id INTEGER,
      data_source_id INTEGER,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE SET NULL,
      FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // -------------------------------------------------------------
  // MASTER PROTOTYPE SCHEMA: KNOWLEDGE GRAPH, NETWORK, PATTERNS & LEADS
  // -------------------------------------------------------------

  // Inter-Entity Relationships Table (Direct & Derived Intelligence)
  db.run(`
    CREATE TABLE IF NOT EXISTS relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      relationship_id TEXT UNIQUE NOT NULL,
      investigation_id INTEGER NOT NULL,
      source_entity_id INTEGER NOT NULL,
      target_entity_id INTEGER NOT NULL,
      relationship_type TEXT NOT NULL,
      classification TEXT CHECK(classification IN ('DIRECT', 'DERIVED')) NOT NULL DEFAULT 'DIRECT',
      confidence_score REAL NOT NULL DEFAULT 0.90,
      evidence_count INTEGER NOT NULL DEFAULT 1,
      evidence_summary TEXT,
      first_observed DATETIME,
      last_observed DATETIME,
      supporting_sources TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
      FOREIGN KEY (source_entity_id) REFERENCES master_entities(id) ON DELETE CASCADE,
      FOREIGN KEY (target_entity_id) REFERENCES master_entities(id) ON DELETE CASCADE
    );
  `);

  // Relationship Supporting Evidence Lineage Table
  db.run(`
    CREATE TABLE IF NOT EXISTS relationship_evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      relationship_id INTEGER NOT NULL,
      investigation_id INTEGER NOT NULL,
      data_source_id INTEGER NOT NULL,
      normalized_record_id INTEGER,
      evidence_snippet TEXT NOT NULL,
      record_reference TEXT NOT NULL,
      timestamp DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (relationship_id) REFERENCES relationships(id) ON DELETE CASCADE,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
      FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE,
      FOREIGN KEY (normalized_record_id) REFERENCES normalized_records(id) ON DELETE SET NULL
    );
  `);

  // Network Influence & Centrality Metrics Table
  db.run(`
    CREATE TABLE IF NOT EXISTS network_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      investigation_id INTEGER NOT NULL,
      master_entity_id INTEGER NOT NULL,
      degree INTEGER NOT NULL DEFAULT 0,
      betweenness_centrality REAL NOT NULL DEFAULT 0.0,
      pagerank REAL NOT NULL DEFAULT 0.0,
      influence_score INTEGER NOT NULL DEFAULT 0,
      network_role TEXT NOT NULL DEFAULT 'Peripheral',
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
      FOREIGN KEY (master_entity_id) REFERENCES master_entities(id) ON DELETE CASCADE,
      UNIQUE(investigation_id, master_entity_id)
    );
  `);

  // Detected Suspicious Patterns & Anomalies Table
  db.run(`
    CREATE TABLE IF NOT EXISTS detected_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern_id TEXT UNIQUE NOT NULL,
      investigation_id INTEGER NOT NULL,
      pattern_type TEXT NOT NULL,
      title TEXT NOT NULL,
      severity TEXT CHECK(severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')) NOT NULL DEFAULT 'HIGH',
      confidence_score REAL NOT NULL DEFAULT 0.88,
      description TEXT NOT NULL,
      why_flagged TEXT NOT NULL,
      supporting_sources TEXT NOT NULL,
      involved_entity_ids TEXT NOT NULL,
      evidence_summary TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE
    );
  `);

  // Chronological Correlated Timeline Events Table
  db.run(`
    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT UNIQUE NOT NULL,
      investigation_id INTEGER NOT NULL,
      timestamp DATETIME NOT NULL,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      primary_entity_id INTEGER,
      secondary_entity_id INTEGER,
      location_entity_id INTEGER,
      data_source_id INTEGER,
      normalized_record_id INTEGER,
      evidence_snippet TEXT,
      source_reference TEXT,
      severity TEXT DEFAULT 'NORMAL',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
      FOREIGN KEY (primary_entity_id) REFERENCES master_entities(id) ON DELETE SET NULL,
      FOREIGN KEY (secondary_entity_id) REFERENCES master_entities(id) ON DELETE SET NULL,
      FOREIGN KEY (location_entity_id) REFERENCES master_entities(id) ON DELETE SET NULL,
      FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE SET NULL,
      FOREIGN KEY (normalized_record_id) REFERENCES normalized_records(id) ON DELETE SET NULL
    );
  `);

  // Priority Investigative Leads Table (Human-in-the-Loop)
  db.run(`
    CREATE TABLE IF NOT EXISTS priority_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT UNIQUE NOT NULL,
      investigation_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      priority TEXT CHECK(priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')) NOT NULL DEFAULT 'HIGH',
      confidence_score REAL NOT NULL DEFAULT 0.88,
      why_flagged TEXT NOT NULL,
      supporting_sources TEXT NOT NULL,
      involved_entity_ids TEXT NOT NULL,
      evidence_summary TEXT,
      status TEXT CHECK(status IN ('PENDING_REVIEW', 'CONFIRMED', 'REJECTED', 'NEED_MORE_EVIDENCE')) NOT NULL DEFAULT 'PENDING_REVIEW',
      investigator_decision TEXT,
      investigator_notes TEXT,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );
  `);

  // Ensure schema migrations for existing DB instances
  try {
    db.run(`ALTER TABLE investigations ADD COLUMN entity_processing_status TEXT DEFAULT 'NOT_STARTED';`);
  } catch (e) {}

  try {
    db.run(`ALTER TABLE investigations ADD COLUMN entity_processed_at DATETIME;`);
  } catch (e) {}

  try {
    db.run(`ALTER TABLE investigations ADD COLUMN analysis_status TEXT DEFAULT 'NOT_STARTED';`);
  } catch (e) {}

  try {
    db.run(`ALTER TABLE investigations ADD COLUMN analyzed_at DATETIME;`);
  } catch (e) {}

  try {
    db.run(`ALTER TABLE data_sources ADD COLUMN entity_extracted_count INTEGER DEFAULT 0;`);
  } catch (e) {}

  console.log('🛡️  NETRA Relational Schema (Phase 1, Phase 2 & Master Prototype Knowledge Graph) initialized.');
}
