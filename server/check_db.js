import { initDb, db } from './src/config/db.js';

async function check() {
  await initDb();
  const inv = db.get("SELECT * FROM investigations WHERE investigation_id = 'NETRA-INV-2026-00001'");
  console.log('Investigation:', inv?.investigation_id, inv?.title);

  const sources = db.all('SELECT source_type, file_name, entity_extracted_count FROM data_sources WHERE investigation_id = ?', [inv.id]);
  console.log(`Sources (${sources.length}):`, sources);

  const entities = db.get('SELECT COUNT(*) as c FROM master_entities WHERE investigation_id = ?', [inv.id]);
  console.log('Master Entities:', entities?.c);

  const rels = db.get('SELECT COUNT(*) as c, SUM(CASE WHEN classification = "DIRECT" THEN 1 ELSE 0 END) as direct, SUM(CASE WHEN classification = "DERIVED" THEN 1 ELSE 0 END) as derived FROM relationships WHERE investigation_id = ?', [inv.id]);
  console.log('Relationships:', rels);

  const patterns = db.all('SELECT pattern_type, severity, confidence_score, title FROM detected_patterns WHERE investigation_id = ?', [inv.id]);
  console.log(`Patterns (${patterns.length}):`, patterns);

  const leads = db.all('SELECT lead_id, priority, confidence_score, title, status FROM priority_leads WHERE investigation_id = ?', [inv.id]);
  console.log(`Leads (${leads.length}):`, leads);

  const topKey = db.all('SELECT me.canonical_name, nm.influence_score, nm.degree, nm.network_role FROM network_metrics nm JOIN master_entities me ON nm.master_entity_id = me.id WHERE nm.investigation_id = ? ORDER BY nm.influence_score DESC LIMIT 5', [inv.id]);
  console.log('Top Key Individuals:', topKey);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
