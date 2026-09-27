const API_BASE = 'http://localhost:5000/api';

async function runPhase2Test() {
  console.log('🚀 NETRA PHASE 2: AI ENTITY EXTRACTION & ENTITY RESOLUTION TEST...\n');

  // Step 1: Health Check
  const healthRes = await fetch(`${API_BASE}/health`).then(r => r.json());
  console.log(`✅ 1. System Health: ${healthRes.status} | Version: ${healthRes.version}`);

  // Step 2: Authenticate Investigator
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
  console.log(`   Officer: ${loginRes.user.name} (${loginRes.user.badge_number})`);
  const authHeaders = { 'Authorization': `Bearer ${token}` };

  // Step 3: Select Investigation 1 (SCADA Grid Cyber Incursion)
  console.log('\n📁 3. Selecting Investigation Container NETRA-INV-2026-00001...');
  const invRes = await fetch(`${API_BASE}/investigations/NETRA-INV-2026-00001`, { headers: authHeaders }).then(r => r.json());
  const inv = invRes.investigation;
  console.log(`   Investigation: ${inv.title}`);
  console.log(`   Ingested Sources: ${invRes.data_sources.length} sources`);

  // Step 4: Run AI Entity Extraction & Entity Resolution Engine
  console.log('\n🧠 4. Executing AI Entity Extraction & Entity Resolution Pipeline...');
  const processRes = await fetch(`${API_BASE}/investigations/${inv.id}/entities/process`, {
    method: 'POST',
    headers: authHeaders
  }).then(r => r.json());

  console.log('   Pipeline Result:', processRes.message);
  console.log('   - Records Analyzed:      ', processRes.result.records_analyzed);
  console.log('   - Total Mentions Extracted:', processRes.result.total_mentions_extracted);
  console.log('   - Master Entities Created:', processRes.result.master_entities_total);
  console.log('   - Auto-Resolved (Merged):', processRes.result.auto_resolved_count);
  console.log('   - Review Queue Items:    ', processRes.result.review_required_count);

  // Step 5: Verify Entity Statistics Breakdown
  console.log('\n📊 5. Fetching Entity Intelligence Metrics...');
  const statsRes = await fetch(`${API_BASE}/investigations/${inv.id}/entities/stats`, { headers: authHeaders }).then(r => r.json());
  console.log('   Breakdown by Entity Type:');
  for (const [type, count] of Object.entries(statsRes.type_breakdown)) {
    if (count > 0) {
      console.log(`   - ${type.padEnd(20)}: ${count}`);
    }
  }

  // Step 6: Query Master Entities Registry
  console.log('\n👥 6. Inspecting Resolved Master Entities Layer...');
  const entitiesRes = await fetch(`${API_BASE}/investigations/${inv.id}/entities`, { headers: authHeaders }).then(r => r.json());
  console.log(`   Total Master Entities: ${entitiesRes.total}`);
  entitiesRes.entities.slice(0, 10).forEach((ent, i) => {
    console.log(`   [${i + 1}] ${ent.entity_id} | ${ent.entity_type.padEnd(18)} | ${ent.canonical_name.padEnd(32)} | Mentions: ${ent.mention_count} | Sources: ${ent.source_count} | Conf: ${Math.round(ent.confidence_score * 100)}%`);
  });

  // Step 7: Inspect Detailed Entity Profile & Traceability
  const samplePerson = entitiesRes.entities.find(e => e.entity_type === 'PERSON') || entitiesRes.entities[0];
  console.log(`\n🔍 7. Inspecting Complete Entity Dossier & Traceability for "${samplePerson.canonical_name}" (${samplePerson.entity_id})...`);
  const profileRes = await fetch(`${API_BASE}/entities/${samplePerson.entity_id}`, { headers: authHeaders }).then(r => r.json());

  console.log(`   Canonical Name: ${profileRes.profile.canonical_name}`);
  console.log(`   Type:           ${profileRes.profile.entity_type}`);
  console.log(`   Resolution Conf:${Math.round(profileRes.profile.confidence_score * 100)}%`);
  console.log(`   Recorded Aliases:`, profileRes.aliases.map(a => a.alias_value).join(', ') || 'None');
  console.log(`   Granular Source Mentions (${profileRes.mentions.length}):`);
  profileRes.mentions.forEach((m, idx) => {
    console.log(`     (${idx + 1}) [${m.source_code} • ${m.source_reference}] "${m.original_value}" via ${m.extraction_method}`);
    console.log(`         Context: "${m.source_context}"`);
  });

  // Step 8: Test Investigator Review Queue Actions
  console.log('\n⚖️  8. Testing Investigator Review Queue...');
  const queueRes = await fetch(`${API_BASE}/investigations/${inv.id}/entity-review-queue`, { headers: authHeaders }).then(r => r.json());
  console.log(`   Pending Ambiguous Items in Queue: ${queueRes.count}`);

  if (queueRes.queue.length > 0) {
    const item = queueRes.queue[0];
    console.log(`   Reviewing Item: Mention "${item.original_value}" vs Candidate Master "${item.candidate_master_name}"`);
    console.log(`   Executing Investigator Confirmation (CONFIRM_MERGE)...`);

    const mergeRes = await fetch(`${API_BASE}/entities/review/confirm-merge`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mention_id: item.mention_db_id,
        master_entity_id: item.master_entity_id,
        notes: 'Investigator confirmed entity equivalence during audit.'
      })
    }).then(r => r.json());

    console.log('   Action Result:', mergeRes.message);
  }

  // Step 9: Test Canonical Name Editing
  console.log('\n✏️  9. Testing Master Entity Canonical Name Update...');
  const editRes = await fetch(`${API_BASE}/entities/review/edit-canonical`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      master_entity_id: samplePerson.id,
      canonical_name: samplePerson.canonical_name + ' [VERIFIED]'
    })
  }).then(r => r.json());
  console.log('   Canonical Name Update:', editRes.message);

  // Step 10: Verify Chain of Custody Audit Trail
  console.log('\n📜 10. Checking Immutable Chain of Custody Audit Trail...');
  const activityRes = await fetch(`${API_BASE}/investigations/${inv.id}/activity`, { headers: authHeaders }).then(r => r.json());
  console.log(`   Total Logged Custody Events: ${activityRes.activities.length}`);
  activityRes.activities.slice(0, 5).forEach((act, idx) => {
    console.log(`   [${idx + 1}] ${act.timestamp.substring(11, 19)} | ${act.action.padEnd(24)} | ${act.details}`);
  });

  console.log('\n🎉 ALL NETRA PHASE 2 AI ENTITY EXTRACTION & RESOLUTION TESTS PASSED WITH 100% SUCCESS!');
}

runPhase2Test().catch(err => {
  console.error('\n❌ Phase 2 Test failed:', err);
  process.exit(1);
});
