import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';
import { processAndNormalizeDataSource } from '../services/normalizationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.resolve(__dirname, '../../uploads/sources');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function seedDatabase(force = false) {
  if (!force) {
    const userCount = db.get('SELECT COUNT(*) as count FROM users');
    const relCount = db.get('SELECT COUNT(*) as count FROM relationships');
    if (userCount && userCount.count > 0 && relCount && relCount.count > 0) {
      return; // Already seeded and analyzed
    }
  }

  console.log('🌱 Seeding initial NETRA Multi-Source Intelligence database...');

  const salt = bcrypt.genSaltSync(10);
  const adminPassHash = bcrypt.hashSync('NetraAdmin@2026', salt);
  const invPassHash = bcrypt.hashSync('Investigator@2026', salt);

  // 1. Insert Users
  db.run(`
    INSERT OR IGNORE INTO users (name, email, password_hash, role, badge_number, department)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['Director Vikram Rathore', 'admin@netra.gov.in', adminPassHash, 'ADMIN', 'NETRA-DIR-001', 'Central Intelligence Directorate']);

  db.run(`
    INSERT OR IGNORE INTO users (name, email, password_hash, role, badge_number, department)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['Inspector Priya Sharma', 'priya.sharma@netra.gov.in', invPassHash, 'INVESTIGATOR', 'NETRA-INV-102', 'Cyber Forensics & Digital Evidence']);

  db.run(`
    INSERT OR IGNORE INTO users (name, email, password_hash, role, badge_number, department)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['Inspector Rajesh Kumar', 'rajesh.kumar@netra.gov.in', invPassHash, 'INVESTIGATOR', 'NETRA-INV-101', 'Financial Crimes Intelligence Unit']);

  db.run(`
    INSERT OR IGNORE INTO users (name, email, password_hash, role, badge_number, department)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['Inspector Vikram Aditya', 'vikram.aditya@netra.gov.in', invPassHash, 'INVESTIGATOR', 'NETRA-INV-103', 'Special Operations & Surveillance']);

  const admin = db.get('SELECT id FROM users WHERE email = ?', ['admin@netra.gov.in']);
  const priya = db.get('SELECT id FROM users WHERE email = ?', ['priya.sharma@netra.gov.in']);
  const rajesh = db.get('SELECT id FROM users WHERE email = ?', ['rajesh.kumar@netra.gov.in']);
  const vikram = db.get('SELECT id FROM users WHERE email = ?', ['vikram.aditya@netra.gov.in']);

  // 2. Insert Investigations
  db.run(`
    INSERT OR IGNORE INTO investigations (investigation_id, title, description, investigation_type, priority, status, start_date, primary_location, lead_investigator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'NETRA-INV-2026-00001',
    'Operation Nexus: Critical Infrastructure SCADA Ransomware Network',
    'Coordinated cyber-kinetic extortion campaign against State Grid SCADA infrastructure involving darknet ransomware groups, burner phone coordination, and illicit offshore money laundering.',
    'Cyber & Critical Infrastructure',
    'CRITICAL',
    'ACTIVE',
    '2026-08-15',
    'State Load Despatch Centre, Northern Grid HQ',
    priya.id
  ]);

  db.run(`
    INSERT OR IGNORE INTO investigations (investigation_id, title, description, investigation_type, priority, status, start_date, primary_location, lead_investigator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'NETRA-INV-2026-00002',
    'Hawala Cross-Border Crypto & Shell Banking Syndicate',
    'Multi-jurisdiction forensic audit of 48 shell entities channeling illicit kickbacks through decentralized mixers and bogus trade invoice factoring.',
    'Financial Crimes & Laundering',
    'HIGH',
    'UNDER_INVESTIGATION',
    '2026-07-28',
    'Bandra Kurla Complex, Mumbai',
    rajesh.id
  ]);

  db.run(`
    INSERT OR IGNORE INTO investigations (investigation_id, title, description, investigation_type, priority, status, start_date, primary_location, lead_investigator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'NETRA-INV-2026-00003',
    'National Highway High-Value Aerospace Freight Interception',
    'Organized criminal syndicate utilizing military-grade GPS jammers and burner relays to hijack prototype avionics equipment in transit.',
    'Forensics & Organized Crime',
    'MEDIUM',
    'PENDING',
    '2026-06-10',
    'NH-48 Transit Corridor Km 142',
    vikram.id
  ]);

  const inv1 = db.get('SELECT id FROM investigations WHERE investigation_id = ?', ['NETRA-INV-2026-00001']);
  const inv2 = db.get('SELECT id FROM investigations WHERE investigation_id = ?', ['NETRA-INV-2026-00002']);
  const inv3 = db.get('SELECT id FROM investigations WHERE investigation_id = ?', ['NETRA-INV-2026-00003']);

  // Assign Members
  db.run('INSERT OR IGNORE INTO investigation_members (investigation_id, user_id) VALUES (?, ?)', [inv1.id, priya.id]);
  db.run('INSERT OR IGNORE INTO investigation_members (investigation_id, user_id) VALUES (?, ?)', [inv1.id, rajesh.id]);
  db.run('INSERT OR IGNORE INTO investigation_members (investigation_id, user_id) VALUES (?, ?)', [inv2.id, rajesh.id]);
  db.run('INSERT OR IGNORE INTO investigation_members (investigation_id, user_id) VALUES (?, ?)', [inv2.id, vikram.id]);
  db.run('INSERT OR IGNORE INTO investigation_members (investigation_id, user_id) VALUES (?, ?)', [inv3.id, vikram.id]);

  // 3. Create Multi-Source Sample Files on Disk
  
  // Sample 1: FIR / Police Report (Text/Doc)
  const firText = `FIRST INFORMATION REPORT (Under Section 154 Cr.P.C)
Police Station: Cyber Crime Special Cell, Northern District
FIR No: CC-2026/0891
Date of Occurrence: 15-08-2026 02:45 AM
Complainant: Dr. Arvind Mehra (Chief Security Officer, Northern Power Grid)

1. ACTS APPLIED: Sections 43, 66, 66F (Cyber Terrorism) Information Technology Act 2000, and Sec 384/120B IPC.

2. SUSPECT / ACCUSED DETAILS:
Unidentified threat actor group operating under the alias 'Nexus Syndicate'. Tactical field operative identified as Devraj Malhotra (alias 'GhostRelay'). Accused intermediary contact identified as telecom engineer Vikram Singhania (alias 'NexusBroker' / 'Vicky'). Offshore funding nexus identified with Elena Rostova representing Zenith Offshore Factoring. Suspect contact identified from ransom note: nexus@onionmail.org and Telegram handle @phantom_relays.

3. BRIEF STATEMENT OF FACTS:
On 15-08-2026 at approximately 02:45 hours, Northern Power Grid Substation 7 experienced unauthorized administrative ingress via gateway IP 198.51.100.44. The intruder deployed custom AES-256 ransomware payload named 'SCADA_Locker_v2.exe', locking 14 supervisory control nodes. A digital extortion note demanded 250 Bitcoins deposited to wallet 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa within 48 hours under threat of permanent grid blackout. Field intelligence notes indicate Devraj Malhotra previously met Vikram Singhania to broker communication relays and secure clandestine transit vehicles.

4. WITNESS STATEMENT:
Shift Supervisor Rajeshwar V. witnessed rapid cursor movement on master terminal console at 02:47 AM accompanied by high volume external outbound traffic to foreign proxy server 185.220.101.5. Target observed utilizing black SUV registration DL-3C-AZ-9912.`;

  const firFilename = 'NETRA-DS-2026-00001_FIR_Nexus_SCADA.txt';
  const firPath = path.join(uploadDir, firFilename);
  fs.writeFileSync(firPath, Buffer.from(firText));
  const firHash = crypto.createHash('sha256').update(firText).digest('hex');

  // Sample 2: CDR Records (CSV) - 14 Records demonstrating Communication Spike
  const cdrCsv = `Caller Number,Receiver Number,Date,Time,Duration (Sec),Cell Tower ID,IMEI,IMSI,Call Type
+91-98110-44912,+91-99220-88419,2026-08-15,02:15:30,145,TWR-DEL-NORTH-04,864901048829101,404450192837461,VOICE
+91-98110-44912,+91-98765-11002,2026-08-15,02:18:40,65,TWR-DEL-NORTH-04,864901048829101,404450192837461,VOICE
+91-98110-44912,+91-99220-88419,2026-08-15,02:22:10,320,TWR-DEL-NORTH-04,864901048829101,404450192837461,VOICE
+91-99220-88419,+91-98110-44912,2026-08-15,02:28:15,80,TWR-NCR-RELAY-09,359281094827192,404450882716253,VOICE
+91-98110-44912,+91-99220-88419,2026-08-15,02:32:00,110,TWR-DEL-NORTH-04,864901048829101,404450192837461,VOICE
+91-99220-88419,+91-98110-44912,2026-08-15,02:38:05,45,TWR-NCR-RELAY-09,359281094827192,404450882716253,SMS
+91-98110-44912,+91-99220-88419,2026-08-15,02:41:20,95,TWR-DEL-NORTH-04,864901048829101,404450192837461,VOICE
+91-98765-11002,+91-97118-99201,2026-08-15,02:48:19,210,TWR-DEL-CENTRAL-01,864901048829101,404450192837461,VOICE
+91-98110-44912,+91-99220-88419,2026-08-15,02:52:45,130,TWR-DEL-NORTH-04,864901048829101,404450192837461,VOICE
+91-99220-88419,+91-91002-33441,2026-08-15,03:10:44,580,TWR-MUM-BKC-12,359281094827192,404450882716253,VOICE
+91-98110-44912,+91-99220-88419,2026-08-15,03:15:20,75,TWR-DEL-NORTH-04,864901048829101,404450192837461,VOICE
+91-99220-88419,+91-98110-44912,2026-08-15,03:22:10,50,TWR-NCR-RELAY-09,359281094827192,404450882716253,SMS
+91-98110-44912,+91-99220-88419,2026-08-15,03:30:12,90,TWR-DEL-NORTH-04,864901048829101,404450192837461,VOICE
+91-99220-88419,+91-98110-44912,2026-08-15,03:45:00,35,TWR-NCR-RELAY-09,359281094827192,404450882716253,SMS`;

  const cdrFilename = 'NETRA-DS-2026-00002_CDR_Intercept_Relays.csv';
  const cdrPath = path.join(uploadDir, cdrFilename);
  fs.writeFileSync(cdrPath, Buffer.from(cdrCsv));
  const cdrHash = crypto.createHash('sha256').update(cdrCsv).digest('hex');

  // Sample 3: Financial Transactions (CSV)
  const finCsv = `Transaction ID,Sender,Receiver,Account Number,Transaction Amount,Currency,Transaction Date,Transaction Type,Bank Name
TXN-2026-8801,Apex Shell Global Ltd,Nexus Escrow,099182773819,4500000.00,INR,2026-08-15,RTGS Wire,Global Merchant Bank
TXN-2026-8802,Nexus Escrow,Zenith Offshore Factoring,882910029381,4250000.00,INR,2026-08-15,IMPS Transfer,State Cooperative Bank
TXN-2026-8803,Zenith Offshore Factoring,Vikram Singhania,882910029381,4250000.00,INR,2026-08-15,RTGS Wire,State Cooperative Bank
TXN-2026-8804,Vortex Trade Logistics,Devraj Crypto Holdings,771920039182,1850000.00,INR,2026-08-16,Crypto Exchange Wire,FinTech Gateway
TXN-2026-8805,Devraj Crypto Holdings,Offshore Mixer Relay,994820194827,1800000.00,INR,2026-08-16,SWIFT Transfer,Swiss Overseas Bank
TXN-2026-8806,Devraj Malhotra,Vikram Singhania,882910029381,500000.00,INR,2026-08-16,IMPS Wire,State Cooperative Bank`;

  const finFilename = 'NETRA-DS-2026-00003_Financial_Transactions_TrancheA.csv';
  const finPath = path.join(uploadDir, finFilename);
  fs.writeFileSync(finPath, Buffer.from(finCsv));
  const finHash = crypto.createHash('sha256').update(finCsv).digest('hex');

  // Sample 4: Surveillance Report (Text)
  const survText = `SPECIAL OPERATIONS SURVEILLANCE & RECONNAISSANCE REPORT
Target: Operative Known as 'GhostRelay' / Devraj Malhotra
Associate: Vikram Singhania (alias 'Vicky' / Telecom Relay Engineer)
Date of Surveillance: 16-08-2026
Observing Unit: Special Surveillance Wing Bravo

06:30 AM: Target Devraj Malhotra observed leaving safehouse in Aerocity in black SUV registration DL-3C-AZ-9912.
07:15 AM: Target arrived at coffee bistro in Sector 29 Gurugram. Met with associate Vikram Singhania carrying silver briefcase who arrived in sedan HR-26-DK-4402.
08:00 AM: Target exchanged encrypted USB thumb drive and burner smartphone (IMEI: 864901048829101). Vikram Singhania placed items inside briefcase.
08:05 AM: Vikram Singhania departed rendezvous point in vehicle HR-26-DK-4402 towards DLF CyberCity.
08:45 AM: Target Devraj Malhotra departed towards IGI Airport Terminal 3 in vehicle DL-3C-AZ-9912. Physical tail maintained.`;

  const survFilename = 'NETRA-DS-2026-00004_Surveillance_Field_Report_Bravo.txt';
  const survPath = path.join(uploadDir, survFilename);
  fs.writeFileSync(survPath, Buffer.from(survText));
  const survHash = crypto.createHash('sha256').update(survText).digest('hex');

  // 4. Insert Data Sources Records (All 4 Sources Assigned to Primary Demo Investigation inv1)
  db.run(`
    INSERT OR IGNORE INTO data_sources (data_source_id, investigation_id, source_type, file_name, file_path, file_extension, mime_type, file_size, sha256_hash, integrity_status, uploaded_by, processing_status, record_count, extraction_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?, 'VALIDATED', 0, 'PENDING')
  `, ['NETRA-DS-2026-00001', inv1.id, 'FIR_POLICE_REPORT', firFilename, firPath, 'txt', 'text/plain', Buffer.byteLength(firText), firHash, priya.id]);

  db.run(`
    INSERT OR IGNORE INTO data_sources (data_source_id, investigation_id, source_type, file_name, file_path, file_extension, mime_type, file_size, sha256_hash, integrity_status, uploaded_by, processing_status, record_count, extraction_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?, 'VALIDATED', 0, 'PENDING')
  `, ['NETRA-DS-2026-00002', inv1.id, 'CDR', cdrFilename, cdrPath, 'csv', 'text/csv', Buffer.byteLength(cdrCsv), cdrHash, priya.id]);

  db.run(`
    INSERT OR IGNORE INTO data_sources (data_source_id, investigation_id, source_type, file_name, file_path, file_extension, mime_type, file_size, sha256_hash, integrity_status, uploaded_by, processing_status, record_count, extraction_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?, 'VALIDATED', 0, 'PENDING')
  `, ['NETRA-DS-2026-00003', inv1.id, 'FINANCIAL_TRANSACTIONS', finFilename, finPath, 'csv', 'text/csv', Buffer.byteLength(finCsv), finHash, rajesh.id]);

  db.run(`
    INSERT OR IGNORE INTO data_sources (data_source_id, investigation_id, source_type, file_name, file_path, file_extension, mime_type, file_size, sha256_hash, integrity_status, uploaded_by, processing_status, record_count, extraction_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?, 'VALIDATED', 0, 'PENDING')
  `, ['NETRA-DS-2026-00004', inv1.id, 'SURVEILLANCE_REPORT', survFilename, survPath, 'txt', 'text/plain', Buffer.byteLength(survText), survHash, vikram.id]);

  // 5. Process & Normalize Seed Data Sources
  const ds1 = db.get('SELECT * FROM data_sources WHERE data_source_id = ?', ['NETRA-DS-2026-00001']);
  const ds2 = db.get('SELECT * FROM data_sources WHERE data_source_id = ?', ['NETRA-DS-2026-00002']);
  const ds3 = db.get('SELECT * FROM data_sources WHERE data_source_id = ?', ['NETRA-DS-2026-00003']);
  const ds4 = db.get('SELECT * FROM data_sources WHERE data_source_id = ?', ['NETRA-DS-2026-00004']);

  await processAndNormalizeDataSource(ds1, priya.id);
  await processAndNormalizeDataSource(ds2, priya.id);
  await processAndNormalizeDataSource(ds3, rajesh.id);
  await processAndNormalizeDataSource(ds4, vikram.id);

  // 6. Pre-Run Master Analysis Pipeline for Instant Evaluator Demo Ready State
  console.log('⚡ Pre-computing Master Analysis Pipeline for demo investigation...');
  const { runMasterAnalysisPipeline } = await import('../services/masterAnalysisPipeline.js');
  await runMasterAnalysisPipeline(inv1.id, priya.id);

  console.log('✅ NETRA Database successfully initialized with multi-source intelligence, knowledge graph & audit chains.');
}
