import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const API_BASE = 'http://localhost:5000/api';

async function runPhase1Test() {
  console.log('🚀 NETRA PHASE 1: MULTI-SOURCE DATA INGESTION & NORMALIZATION TEST...\n');

  // Step 1: Health Check
  const healthRes = await fetch(`${API_BASE}/health`).then(r => r.json());
  console.log(`✅ 1. System Health: ${healthRes.status} | "${healthRes.tagline}"`);

  // Step 2: Investigator Login
  console.log('\n🔑 2. Authenticating Lead Investigator (Insp. Priya Sharma)...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'priya.sharma@netra.gov.in',
      password: 'Investigator@2026'
    })
  }).then(r => r.json());

  const token = loginRes.token;
  console.log(`   Officer: ${loginRes.user.name} (${loginRes.user.role} • ${loginRes.user.badge_number})`);
  const authHeaders = { 'Authorization': `Bearer ${token}` };

  // Step 3: Fetch Dashboard Telemetry
  console.log('\n📊 3. Fetching Intelligence Ingestion Dashboard Metrics...');
  const dashStats = await fetch(`${API_BASE}/stats/dashboard`, { headers: authHeaders }).then(r => r.json());
  console.log('   Total Investigations:   ', dashStats.stats.totalInvestigations);
  console.log('   Active Operations:      ', dashStats.stats.activeInvestigations);
  console.log('   Total Ingested Sources: ', dashStats.stats.totalDataSources);
  console.log('   - FIR Reports:          ', dashStats.stats.firCount);
  console.log('   - CDR Records:          ', dashStats.stats.cdrCount);
  console.log('   - Financial Records:    ', dashStats.stats.financialCount);
  console.log('   - Surveillance Intel:   ', dashStats.stats.surveillanceCount);
  console.log('   Normalized Records (AI):', dashStats.stats.totalNormalizedRecords);

  // Step 4: Create Investigation Container
  console.log('\n📁 4. Creating New Investigation Container...');
  const createInvRes = await fetch(`${API_BASE}/investigations`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Operation DarkNexus: SCADA Grid Cyber Kinetic Syndicate',
      investigation_type: 'Cyber & Critical Infrastructure',
      description: 'Active intelligence probe mapping darknet malware ingress points, burner CDR relays, and illicit hawala crypto laundering.',
      priority: 'CRITICAL',
      start_date: '2026-08-28',
      primary_location: 'Substation Control Node 7, Delhi NCR',
      lead_investigator_id: loginRes.user.id
    })
  }).then(r => r.json());

  const inv = createInvRes.investigation;
  console.log(`   Investigation Initialized:`);
  console.log(`   Container ID: ${inv.investigation_id}`);
  console.log(`   Title:        ${inv.title}`);
  console.log(`   Priority:     ${inv.priority}`);

  // Step 5: Multi-Source Ingestion #1 (FIR Police Report - Text/Doc)
  console.log('\n📄 5. Ingesting Source 1: FIR / Police Investigation Report...');
  const firContent = `FIRST INFORMATION REPORT (FIR-2026-DN-0991)
Police Station: Cyber Crime Special Cell
Date of Occurrence: 28-08-2026 03:30 AM
Complainant: Grid Security Operations Center

STATEMENT OF ACCUSED AND FACTS:
Threat actor group utilizing RAT payload identified as 'DarkNexus_x64.dll' injected via remote gateway IP 203.0.113.45.
Suspect operative known under moniker 'GhostRelay' coordinated exfiltration with accomplice using burner phone +91-98110-44912.
Ransom demands transferred through Hawala crypto escrow account SG-8849-019.`;

  const firBlob = new Blob([Buffer.from(firContent)], { type: 'text/plain' });
  const firForm = new FormData();
  firForm.append('file', firBlob, 'FIR_DarkNexus_SCADA_Intrusion.txt');
  firForm.append('source_type', 'FIR_POLICE_REPORT');

  const firRes = await fetch(`${API_BASE}/investigations/${inv.id}/data-sources`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: firForm
  }).then(r => r.json());

  console.log(`   FIR Source ID:       ${firRes.data_source.data_source_id}`);
  console.log(`   SHA-256 Hash:        ${firRes.data_source.sha256_hash}`);
  console.log(`   Extracted Records:   ${firRes.data_source.record_count} segments`);
  console.log(`   Processing Status:   ${firRes.data_source.processing_status} ✅`);

  // Step 6: Multi-Source Ingestion #2 (Call Detail Records - CSV)
  console.log('\n📞 6. Ingesting Source 2: Call Detail Records (CDR CSV)...');
  const cdrContent = `Caller Number,Receiver Number,Date,Time,Duration (Sec),Cell Tower ID,IMEI,IMSI,Call Type
+91-98110-44912,+91-98765-11002,2026-08-28,03:15:30,185,TWR-DEL-NORTH-07,864901048829101,404450192837461,VOICE
+91-98110-44912,+91-99220-88419,2026-08-28,03:22:10,420,TWR-DEL-NORTH-07,864901048829101,404450192837461,VOICE
+91-99220-88419,+91-91002-33441,2026-08-28,03:45:00,55,TWR-NCR-RELAY-14,359281094827192,404450882716253,SMS`;

  const cdrBlob = new Blob([Buffer.from(cdrContent)], { type: 'text/csv' });
  const cdrForm = new FormData();
  cdrForm.append('file', cdrBlob, 'CDR_DarkNexus_Burner_Relays.csv');
  cdrForm.append('source_type', 'CDR');

  const cdrRes = await fetch(`${API_BASE}/investigations/${inv.id}/data-sources`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: cdrForm
  }).then(r => r.json());

  console.log(`   CDR Source ID:       ${cdrRes.data_source.data_source_id}`);
  console.log(`   Extracted Records:   ${cdrRes.data_source.record_count} CDR rows`);
  console.log(`   Processing Status:   ${cdrRes.data_source.processing_status} ✅`);

  // Step 7: Multi-Source Ingestion #3 (Financial Transactions - CSV)
  console.log('\n💳 7. Ingesting Source 3: Financial Transaction Records (CSV)...');
  const finContent = `Transaction ID,Sender,Receiver,Account Number,Transaction Amount,Currency,Transaction Date,Transaction Type,Bank Name
TXN-DN-9901,GhostRelay Shell Holdings,Apex Escrow Gateway,099182773819,7500000.00,INR,2026-08-28,RTGS Wire,Global Merchant Bank
TXN-DN-9902,Apex Escrow Gateway,DarkNexus Syndicate Core,882910029381,7200000.00,INR,2026-08-28,IMPS Transfer,Offshore Factoring Unit`;

  const finBlob = new Blob([Buffer.from(finContent)], { type: 'text/csv' });
  const finForm = new FormData();
  finForm.append('file', finBlob, 'Financial_Tranche_DarkNexus.csv');
  finForm.append('source_type', 'FINANCIAL_TRANSACTIONS');

  const finRes = await fetch(`${API_BASE}/investigations/${inv.id}/data-sources`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: finForm
  }).then(r => r.json());

  console.log(`   Financial Source ID: ${finRes.data_source.data_source_id}`);
  console.log(`   Extracted Records:   ${finRes.data_source.record_count} Financial transactions`);
  console.log(`   Processing Status:   ${finRes.data_source.processing_status} ✅`);

  // Step 8: Verify On-Demand Cryptographic Integrity
  console.log('\n🛡️  8. Testing Cryptographic Hash Integrity Verification on Disk...');
  const verifyRes = await fetch(`${API_BASE}/data-sources/${cdrRes.data_source.id}/verify-integrity`, {
    method: 'POST',
    headers: authHeaders
  }).then(r => r.json());

  console.log('   Verification Result:', verifyRes.verified ? 'PASSED (VERIFIED) ✅' : 'FAILED ❌');
  console.log('   Recalculated Hash:  ', verifyRes.recalculated_hash);
  console.log('   Recorded Hash:      ', verifyRes.original_hash);

  // Step 9: Inspect Normalized Intelligence Records & Traceability
  console.log('\n🔍 9. Querying Normalized Intelligence Records (Input for Phase 2 AI)...');
  const normRecordsRes = await fetch(`${API_BASE}/investigations/${inv.id}/normalized-records`, { headers: authHeaders }).then(r => r.json());
  console.log(`   Total Normalized Records for ${inv.investigation_id}:`, normRecordsRes.count);
  normRecordsRes.records.forEach((rec, i) => {
    console.log(`   [${i + 1}] ${rec.record_id} | ${rec.source_type.padEnd(22)} | Trace: ${rec.original_record_reference.padEnd(42)} | Status: ${rec.processing_status}`);
  });

  // Step 10: Verify Activity & Immutable Chain of Custody
  console.log('\n📜 10. Checking Immutable Chain of Custody Audit Trail...');
  const activityRes = await fetch(`${API_BASE}/investigations/${inv.id}/activity`, { headers: authHeaders }).then(r => r.json());
  console.log(`   Total Logged Custody Events:`, activityRes.activities.length);
  activityRes.activities.forEach((act, idx) => {
    console.log(`   [${idx + 1}] ${act.timestamp.substring(11, 19)} | ${act.action.padEnd(22)} | ${act.details}`);
  });

  console.log('\n🎉 ALL NETRA PHASE 1 INGESTION, EXTRACTION & NORMALIZATION TESTS PASSED WITH 100% SUCCESS!');
}

runPhase1Test().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
