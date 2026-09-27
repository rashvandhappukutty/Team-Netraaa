import { initDb, db } from './src/config/db.js';
import { processAndNormalizeDataSource } from './src/services/normalizationService.js';
import { runMasterAnalysisPipeline } from './src/services/masterAnalysisPipeline.js';

async function fixDemo() {
  await initDb();
  const inv1 = db.get("SELECT id FROM investigations WHERE investigation_id = 'NETRA-INV-2026-00001'");
  const priya = db.get("SELECT id FROM users WHERE email = 'priya.sharma@netra.gov.in'");

  // Update ds3 to inv1
  db.run("UPDATE data_sources SET investigation_id = ? WHERE data_source_id = 'NETRA-DS-2026-00003'", [inv1.id]);
  db.run("UPDATE normalized_records SET investigation_id = ? WHERE data_source_id = (SELECT id FROM data_sources WHERE data_source_id = 'NETRA-DS-2026-00003')", [inv1.id]);
  db.run("UPDATE extracted_content SET investigation_id = ? WHERE data_source_id = (SELECT id FROM data_sources WHERE data_source_id = 'NETRA-DS-2026-00003')", [inv1.id]);

  const ds3 = db.get("SELECT * FROM data_sources WHERE data_source_id = 'NETRA-DS-2026-00003'");
  await processAndNormalizeDataSource(ds3, priya.id);

  console.log('Running master pipeline on inv1...');
  const result = await runMasterAnalysisPipeline(inv1.id, priya.id);
  console.log('Result metrics:', result.metrics);
}

fixDemo().then(() => {
  console.log('DONE');
  setTimeout(() => process.exit(0), 100);
}).catch(e => {
  console.error(e);
  setTimeout(() => process.exit(1), 100);
});
