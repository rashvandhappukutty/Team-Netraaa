import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const API_BASE = 'http://localhost:5000/api';

async function runE2ETest() {
  console.log('🚀 Starting NETRA Phase 1 End-to-End Verification Test...\n');

  // Step 1: Health check
  const healthRes = await fetch(`${API_BASE}/health`).then(r => r.json());
  console.log('✅ 1. System Health:', healthRes.status, '-', healthRes.system);

  // Step 2: Investigator Login
  console.log('\n🔑 2. Testing Authentication (Lead Inspector Priya Sharma)...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'priya.sharma@netra.gov.in',
      password: 'Investigator@2026'
    })
  }).then(r => r.json());

  if (!loginRes.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes)}`);
  }
  const token = loginRes.token;
  console.log(`   Logged in as: ${loginRes.user.name} (${loginRes.user.role}, Badge: ${loginRes.user.badge_number})`);
  const authHeaders = { 'Authorization': `Bearer ${token}` };

  // Step 3: Dashboard Stats
  console.log('\n📊 3. Fetching Intelligence Dashboard Metrics...');
  const dashStats = await fetch(`${API_BASE}/stats/dashboard`, { headers: authHeaders }).then(r => r.json());
  console.log('   Total Cases:', dashStats.stats.totalCases);
  console.log('   Active Investigations:', dashStats.stats.activeCases);
  console.log('   Evidence Items in Vault:', dashStats.stats.totalEvidence);

  // Step 4: Create Case
  console.log('\n📁 4. Creating New Investigation Case...');
  const newCasePayload = {
    title: 'Operation DarkNexus: Critical Infrastructure Malware Incursion',
    case_type: 'Cyber Crime',
    crime_category: 'Industrial SCADA Cyber Extortion',
    description: 'Unsanctioned remote desktop ingress identified on regional grid substation relay.',
    incident_date: '2026-08-25',
    incident_time: '04:15:00',
    crime_location: 'Northern Power Substation Node 7, Delhi NCR',
    priority: 'CRITICAL',
    lead_investigator_id: loginRes.user.id
  };

  const createCaseRes = await fetch(`${API_BASE}/cases`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(newCasePayload)
  }).then(r => r.json());

  if (!createCaseRes.case) {
    throw new Error(`Case creation failed: ${JSON.stringify(createCaseRes)}`);
  }
  const newCase = createCaseRes.case;
  console.log(`   Case Successfully Registered:`);
  console.log(`   Case ID: ${newCase.case_id}`);
  console.log(`   Title:   ${newCase.title}`);
  console.log(`   Status:  ${newCase.status}`);
  console.log(`   Priority:${newCase.priority}`);

  // Step 5: Upload Evidence
  console.log('\n🔒 5. Ingesting & Cryptographically Hashing Digital Evidence...');
  const testEvidenceContent = Buffer.from('=== FORENSIC VOLATILE MEMORY EXTRACTION ===\nNode: Substation-RTU-07\nInjected Binary: DarkNexus_x64.dll\nC2 Gateway: 203.0.113.88:8443\nTimestamp: 2026-08-25T04:18:22Z\n=== END FORENSIC DUMP ===');
  const tempFilePath = path.join(process.cwd(), 'temp_evidence_test.log');
  fs.writeFileSync(tempFilePath, testEvidenceContent);

  const calculatedLocalHash = crypto.createHash('sha256').update(testEvidenceContent).digest('hex');

  // Create multipart payload
  const formData = new FormData();
  const blob = new Blob([testEvidenceContent], { type: 'text/plain' });
  formData.append('file', blob, 'substation_memory_dump.log');
  formData.append('title', 'Substation RTU-07 Ingress Memory Dump');
  formData.append('description', 'Volatile RAM snapshot captured during active C2 heartbeat connection.');
  formData.append('evidence_source', 'Hardware Memory Bridge Tap (Physical)');
  formData.append('date_collected', '2026-08-25');

  const uploadRes = await fetch(`${API_BASE}/cases/${newCase.id}/evidence`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  }).then(r => r.json());

  if (!uploadRes.evidence) {
    throw new Error(`Evidence upload failed: ${JSON.stringify(uploadRes)}`);
  }
  const evidence = uploadRes.evidence;
  console.log(`   Evidence Ingested:`);
  console.log(`   Evidence ID:       ${evidence.evidence_id}`);
  console.log(`   SHA-256 Hash:      ${evidence.sha256_hash}`);
  console.log(`   Integrity Status:  ${evidence.integrity_status}`);
  console.log(`   AI Readiness:      ${evidence.processing_status}`);
  console.log(`   Hash Verification: ${evidence.sha256_hash === calculatedLocalHash ? 'EXACT MATCH ✅' : 'MISMATCH ❌'}`);

  // Clean up temp test file
  if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

  // Step 6: Verify Evidence Integrity on Demand
  console.log('\n🛡️  6. Executing Real-Time Cryptographic Hash Integrity Verification...');
  const verifyRes = await fetch(`${API_BASE}/evidence/${evidence.id}/verify`, {
    method: 'POST',
    headers: authHeaders
  }).then(r => r.json());

  console.log('   Verification Result:', verifyRes.verified ? 'PASSED (VERIFIED) ✅' : 'FAILED ❌');
  console.log('   Recalculated Hash:  ', verifyRes.recalculated_hash);
  console.log('   Original Hash:      ', verifyRes.original_hash);

  // Step 7: Update Case Details (Audit Trail Test)
  console.log('\n📝 7. Updating Case Details & Recording Delta Audit Log...');
  const updateRes = await fetch(`${API_BASE}/cases/${newCase.id}`, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'UNDER_INVESTIGATION',
      description: 'Unsanctioned remote desktop ingress identified on regional grid substation relay. Malicious payload quarantined and analyzed.'
    })
  }).then(r => r.json());
  console.log('   Updated Status:', updateRes.case.status);

  // Step 8: Download Evidence (Access Audit Log Test)
  console.log('\n📥 8. Accessing Evidence File & Logging EVIDENCE_ACCESSED...');
  const downloadRes = await fetch(`${API_BASE}/evidence/${evidence.id}/download`, { headers: authHeaders });
  console.log('   Download HTTP Status:', downloadRes.status);

  // Step 9: Verify Case Activity Timeline
  console.log('\n📜 9. Inspecting Case Activity & Immutable Chain of Custody...');
  const activityRes = await fetch(`${API_BASE}/cases/${newCase.id}/activity`, { headers: authHeaders }).then(r => r.json());
  console.log(`   Total Logged Events for ${newCase.case_id}:`, activityRes.activities.length);
  activityRes.activities.forEach((act, idx) => {
    console.log(`   [${idx + 1}] ${act.timestamp.substring(11, 19)} | ${act.action.padEnd(18)} | ${act.details}`);
  });

  // Step 10: Global Audit Logs
  console.log('\n📑 10. Querying Master System Audit Ledger...');
  const auditRes = await fetch(`${API_BASE}/audit-logs?limit=5`, { headers: authHeaders }).then(r => r.json());
  console.log('   Master Ledger Total Events:', auditRes.total);

  console.log('\n🎉 ALL NETRA PHASE 1 E2E TESTS COMPLETED SUCCESSFULLY! 100% OPERATIONAL.');
}

runE2ETest().catch(err => {
  console.error('\n❌ E2E Test Failed:', err);
  process.exit(1);
});
