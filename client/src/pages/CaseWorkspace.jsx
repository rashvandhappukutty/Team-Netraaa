import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Activity as ActivityIcon, 
  FileText, 
  Edit, 
  Database, 
  User, 
  MapPin, 
  Calendar, 
  Lock, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  AlertTriangle,
  Loader2,
  Users,
  Eye,
  Check
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import IntegrityBadge from '../components/IntegrityBadge';
import ProcessingBadge from '../components/ProcessingBadge';
import EvidenceUploadModal from '../components/EvidenceUploadModal';

export function CaseWorkspace({ caseId, navigate }) {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [caseData, setCaseData] = useState(null);
  const [investigators, setInvestigators] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Evidence Upload Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Verification state per evidence item
  const [verifyingId, setVerifyingId] = useState(null);
  const [verificationFeedback, setVerificationFeedback] = useState(null);

  // Edit Case Details State
  const [editFormData, setEditFormData] = useState({});
  const [savingDetails, setSavingDetails] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [allInvestigatorsList, setAllInvestigatorsList] = useState([]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getCaseById(caseId);
      setCaseData(res.case);
      setInvestigators(res.investigators || []);
      setEvidenceList(res.evidence || []);
      setActivities(res.activities || []);

      // Seed edit form
      setEditFormData({
        title: res.case.title,
        case_type: res.case.case_type,
        crime_category: res.case.crime_category,
        description: res.case.description || '',
        incident_date: res.case.incident_date,
        incident_time: res.case.incident_time || '',
        crime_location: res.case.crime_location,
        priority: res.case.priority,
        status: res.case.status,
        lead_investigator_id: res.case.lead_investigator_id
      });
      setError(null);
    } catch (err) {
      console.error('Error loading case workspace:', err);
      setError(err.message || 'Failed to load case workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
    // Load officer directory for case edit lead assignment
    api.getInvestigators().then(res => setAllInvestigatorsList(res.investigators || [])).catch(() => {});
  }, [caseId]);

  const handleVerifyIntegrity = async (evidenceItem) => {
    try {
      setVerifyingId(evidenceItem.id);
      setVerificationFeedback(null);

      const res = await api.verifyEvidence(evidenceItem.id);
      
      // Update evidence item in local state
      setEvidenceList(prev => prev.map(ev => {
        if (ev.id === evidenceItem.id) {
          return { ...ev, integrity_status: res.integrity_status };
        }
        return ev;
      }));

      setVerificationFeedback({
        evidence_id: evidenceItem.evidence_id,
        isMatch: res.verified,
        recalculated_hash: res.recalculated_hash,
        original_hash: res.original_hash,
        timestamp: res.timestamp
      });

      // Refresh activity timeline to reflect the new EVIDENCE_VERIFIED audit log
      const actRes = await api.getCaseActivity(caseId);
      setActivities(actRes.activities || []);
    } catch (err) {
      console.error('Integrity verification failed:', err);
      setVerificationFeedback({
        evidence_id: evidenceItem.evidence_id,
        isMatch: false,
        error: err.message || 'Verification failed.'
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDetailsSave = async (e) => {
    e.preventDefault();
    try {
      setSavingDetails(true);
      setSaveSuccessMsg(null);
      const res = await api.updateCase(caseData.id, editFormData);
      setCaseData(res.case);
      setSaveSuccessMsg('Case details updated and recorded in the audit trail.');
      
      // Refresh activity logs
      const actRes = await api.getCaseActivity(caseId);
      setActivities(actRes.activities || []);
      
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update case.');
    } finally {
      setSavingDetails(false);
    }
  };

  if (loading && !caseData) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        <div className="pulse-indicator" style={{ width: '20px', height: '20px', margin: '0 auto 1rem' }} />
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>Decrypting Case Enclave & Audit Chains...</p>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <div className="netra-card" style={{ borderColor: 'var(--border-crimson)', padding: '2.5rem' }}>
          <ShieldAlert size={48} color="var(--crimson-critical)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--crimson-critical)' }}>Case Access Restricted or Not Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.75rem 0 1.5rem' }}>{error}</p>
          <button onClick={() => navigate('/cases')} className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Return to Case Directory</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/cases')}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--text-secondary)', padding: '0.4rem 0.6rem' }}
          >
            <ArrowLeft size={16} />
            <span>Cases</span>
          </button>
          <span style={{ color: 'var(--text-dim)' }}>/</span>
          {/* Persistent Case ID Badge */}
          <div className="mono" style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: 'var(--cyan-subtle)',
            border: '1px solid var(--border-cyan)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--cyan-primary)',
            boxShadow: '0 0 12px var(--cyan-glow)'
          }}>
            {caseData.case_id}
          </div>
        </div>

        {/* Quick Workspace CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ gap: '0.45rem' }}
          >
            <Upload size={15} />
            <span>Upload Evidence</span>
          </button>
        </div>
      </div>

      {/* Case Header Hero Banner */}
      <div className="netra-card" style={{
        padding: '1.75rem',
        background: 'linear-gradient(135deg, rgba(14, 21, 38, 0.95) 0%, rgba(19, 31, 55, 0.8) 100%)',
        border: '1px solid var(--border-medium)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <StatusBadge status={caseData.status} />
              <PriorityBadge priority={caseData.priority} />
              <span className="badge" style={{ backgroundColor: 'rgba(101, 31, 255, 0.15)', color: '#a78bfa', border: '1px solid rgba(101, 31, 255, 0.3)' }}>
                {caseData.case_type}
              </span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: '0.5rem' }}>
              {caseData.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} color="var(--text-dim)" />
                <span>{caseData.crime_location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} color="var(--text-dim)" />
                <span>Incident: {caseData.incident_date} {caseData.incident_time || ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={14} color="var(--text-dim)" />
                <span>Lead: <strong style={{ color: 'var(--text-primary)' }}>{caseData.lead_investigator_name}</strong> ({caseData.lead_badge})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="tabs-nav">
        <button
          onClick={() => setActiveTab('overview')}
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <FileText size={17} />
          <span>Case Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
        >
          <Database size={17} />
          <span>Evidence ({evidenceList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
        >
          <ActivityIcon size={17} />
          <span>Activity & Audit Trail ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('details')}
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
        >
          <Edit size={17} />
          <span>Case Details & Management</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Description & Modus Operandi */}
            <div className="netra-card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.85rem' }}>Case Intelligence Summary</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {caseData.description || 'No detailed case summary narrative provided yet.'}
              </p>
            </div>

            {/* Quick Evidence Summary Preview */}
            <div className="netra-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem' }}>Digital Evidence Artifacts</h3>
                <button onClick={() => setActiveTab('evidence')} className="btn btn-ghost btn-sm" style={{ color: 'var(--cyan-primary)' }}>
                  View All ({evidenceList.length})
                </button>
              </div>

              {evidenceList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>No evidence artifacts uploaded yet.</p>
                  <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
                    <Upload size={14} />
                    <span>Upload First Item</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {evidenceList.slice(0, 3).map(ev => (
                    <div
                      key={ev.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', fontWeight: 700 }}>
                          {ev.evidence_id}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {ev.title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {ev.file_name} • {(ev.file_size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <IntegrityBadge status={ev.integrity_status} />
                        <ProcessingBadge status={ev.processing_status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Team & Case Parameters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Case Parameters Card */}
            <div className="netra-card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Investigation Parameters</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.825rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Crime Classification</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{caseData.crime_category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Incident Date</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{caseData.incident_date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Registry Timestamp</span>
                  <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {caseData.created_at ? caseData.created_at.substring(0, 16) : '--'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Chain Integrity</span>
                  <span style={{ color: 'var(--emerald-verified)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldCheck size={14} />
                    <span>LOCKED & AUDITED</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Investigative Team */}
            <div className="netra-card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} color="var(--cyan-primary)" />
                <span>Assigned Unit</span>
              </h3>

              {/* Lead Investigator */}
              <div style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid var(--border-cyan)',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cyan-primary)', letterSpacing: '0.05em' }}>
                  Lead Case Officer
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem' }}>
                  {caseData.lead_investigator_name}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                  Badge: {caseData.lead_badge} • {caseData.lead_dept || 'Investigation Unit'}
                </div>
              </div>

              {/* Additional Investigators */}
              {investigators.filter(i => i.id !== caseData.lead_investigator_id).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    Assisting Officers
                  </div>
                  {investigators.filter(i => i.id !== caseData.lead_investigator_id).map(inv => (
                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{inv.name}</span>
                      <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{inv.badge_number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EVIDENCE */}
      {activeTab === 'evidence' && (
        <div className="netra-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Digital Evidence Vault & Custody Repository</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                All artifacts cryptographically indexed with SHA-256 integrity hashes.
              </p>
            </div>
            <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary">
              <Upload size={16} />
              <span>Intake New Evidence</span>
            </button>
          </div>

          {/* Verification Feedback Banner if just executed */}
          {verificationFeedback && (
            <div style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              backgroundColor: verificationFeedback.isMatch ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 23, 68, 0.12)',
              border: `1px solid ${verificationFeedback.isMatch ? 'var(--border-emerald)' : 'var(--border-crimson)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {verificationFeedback.isMatch ? (
                    <ShieldCheck size={24} color="var(--emerald-verified)" />
                  ) : (
                    <ShieldAlert size={24} color="var(--crimson-critical)" />
                  )}
                  <div>
                    <h4 style={{ color: verificationFeedback.isMatch ? 'var(--emerald-verified)' : 'var(--crimson-critical)', fontSize: '0.95rem' }}>
                      {verificationFeedback.isMatch
                        ? `Cryptographic Integrity Confirmed: ${verificationFeedback.evidence_id}`
                        : `INTEGRITY ALERT: Tampering Detected for ${verificationFeedback.evidence_id}`}
                    </h4>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {verificationFeedback.isMatch
                        ? 'Live file SHA-256 recalculated from physical disk exactly matches the registered cryptographic master seal.'
                        : 'Recalculated file hash differs from recorded master hash. Forensic integrity breach recorded.'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setVerificationFeedback(null)} className="btn btn-ghost btn-sm">
                  Dismiss
                </button>
              </div>

              {verificationFeedback.recalculated_hash && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>Recorded Hash: <span style={{ color: 'var(--text-primary)' }}>{verificationFeedback.original_hash}</span></div>
                  <div>Recalculated:  <span style={{ color: verificationFeedback.isMatch ? 'var(--emerald-verified)' : 'var(--crimson-critical)' }}>{verificationFeedback.recalculated_hash}</span></div>
                </div>
              )}
            </div>
          )}

          {evidenceList.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 1rem',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-medium)'
            }}>
              <Database size={44} color="var(--text-dim)" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>No Evidence Attached to Case</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0.35rem auto 1.5rem' }}>
                Upload digital evidence files (PDFs, logs, CCTV clips, audio intercepts, disk images) to begin forensic custody tracking.
              </p>
              <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary">
                <Upload size={16} />
                <span>Upload First Evidence Artifact</span>
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="netra-table">
                <thead>
                  <tr>
                    <th>Evidence ID</th>
                    <th>Artifact Title & File</th>
                    <th>Category</th>
                    <th>File Size</th>
                    <th>Integrity Status</th>
                    <th>AI Pipeline Status</th>
                    <th>Uploaded By</th>
                    <th>Date Collected</th>
                    <th style={{ textAlign: 'right' }}>Forensic Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceList.map((ev) => (
                    <tr key={ev.id}>
                      <td>
                        <span className="mono" style={{
                          fontWeight: 700,
                          color: 'var(--cyan-primary)',
                          padding: '0.2rem 0.5rem',
                          backgroundColor: 'var(--cyan-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-cyan)'
                        }}>
                          {ev.evidence_id}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ev.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                          <span className="mono">{ev.file_name}</span>
                        </div>
                        {/* SHA-256 Preview */}
                        <div className="mono" style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '0.25rem' }} title={ev.sha256_hash}>
                          SHA-256: {ev.sha256_hash.substring(0, 24)}...
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(0, 229, 255, 0.1)', color: 'var(--cyan-primary)' }}>
                          {ev.evidence_type}
                        </span>
                      </td>
                      <td className="mono" style={{ fontSize: '0.8rem' }}>
                        {(ev.file_size / 1024).toFixed(1)} KB
                      </td>
                      <td>
                        <IntegrityBadge status={ev.integrity_status} />
                      </td>
                      <td>
                        <ProcessingBadge status={ev.processing_status} />
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{ev.uploader_name}</div>
                        <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{ev.uploader_badge}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {ev.date_collected}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Verify Hash Button */}
                          <button
                            onClick={() => handleVerifyIntegrity(ev)}
                            disabled={verifyingId === ev.id}
                            className="btn btn-emerald btn-sm"
                            title="Recalculate and verify SHA-256 hash on server storage"
                          >
                            {verifyingId === ev.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <ShieldCheck size={13} />
                            )}
                            <span>Verify Hash</span>
                          </button>

                          {/* Download / View File */}
                          <a
                            href={api.getEvidenceDownloadUrl(ev.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            title="Download/Inspect Evidence"
                          >
                            <Download size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVITY (AUDIT TRAIL) */}
      {activeTab === 'activity' && (
        <div className="netra-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Immutable Chain of Custody & Audit Timeline</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Legally admissible chronological audit trail for Case {caseData.case_id}.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--emerald-verified)', backgroundColor: 'rgba(0, 230, 118, 0.1)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-emerald)' }}>
              <ShieldCheck size={14} />
              <span>CRYPTOGRAPHICALLY LOCKED LOGS</span>
            </div>
          </div>

          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <p>No audit trail events registered yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
              {activities.map((act, index) => {
                const getActionColor = (action) => {
                  switch (action) {
                    case 'CASE_CREATED': return { bg: 'rgba(0, 229, 255, 0.15)', color: 'var(--cyan-primary)', border: 'var(--border-cyan)' };
                    case 'EVIDENCE_UPLOADED': return { bg: 'rgba(101, 31, 255, 0.15)', color: '#a78bfa', border: 'rgba(101, 31, 255, 0.4)' };
                    case 'HASH_GENERATED': return { bg: 'rgba(0, 230, 118, 0.15)', color: 'var(--emerald-verified)', border: 'var(--border-emerald)' };
                    case 'EVIDENCE_VERIFIED': return { bg: 'rgba(0, 230, 118, 0.15)', color: 'var(--emerald-verified)', border: 'var(--border-emerald)' };
                    case 'EVIDENCE_ACCESSED': return { bg: 'rgba(255, 179, 0, 0.15)', color: 'var(--amber-warning)', border: 'rgba(255, 179, 0, 0.4)' };
                    case 'CASE_UPDATED': return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)' };
                    default: return { bg: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)', border: 'var(--border-subtle)' };
                  }
                };

                const actTheme = getActionColor(act.action);

                return (
                  <div
                    key={act.id || index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1.25rem',
                      padding: '1rem 1.25rem',
                      backgroundColor: 'var(--bg-input)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {/* Timestamp Block */}
                    <div style={{ minWidth: '130px', textAlign: 'left' }}>
                      <div className="mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {act.timestamp ? act.timestamp.substring(11, 19) : '--:--:--'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                        {act.timestamp ? act.timestamp.substring(0, 10) : ''}
                      </div>
                    </div>

                    {/* Action Pill */}
                    <div style={{ minWidth: '160px' }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: actTheme.bg,
                          color: actTheme.color,
                          border: `1px solid ${actTheme.border}`,
                          fontSize: '0.725rem'
                        }}
                      >
                        {act.action}
                      </span>
                    </div>

                    {/* Details Message */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {act.details}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', gap: '0.75rem' }}>
                        <span>Actor: <strong style={{ color: 'var(--text-secondary)' }}>{act.user_name}</strong> ({act.badge_number || 'INVESTIGATOR'})</span>
                        <span>•</span>
                        <span className="mono">IP: {act.ip_address || '127.0.0.1'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CASE DETAILS (EDIT FORM) */}
      {activeTab === 'details' && (
        <div className="netra-card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Update Investigation Records</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              All modifications are permanently recorded in the immutable audit log.
            </p>
          </div>

          {saveSuccessMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1.25rem',
              backgroundColor: 'rgba(0, 230, 118, 0.1)',
              border: '1px solid var(--border-emerald)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--emerald-verified)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}>
              <CheckCircle2 size={18} />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleDetailsSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label required">Case Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Investigation Status</label>
                <select
                  className="form-select"
                  value={editFormData.status || 'ACTIVE'}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="UNDER_INVESTIGATION">Under Investigation</option>
                  <option value="PENDING">Pending Inquest</option>
                  <option value="CLOSED">Closed / Resolved</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label required">Crime Category</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.crime_category || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, crime_category: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Priority Level</label>
                <select
                  className="form-select"
                  value={editFormData.priority || 'MEDIUM'}
                  onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                  required
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Lead Investigator</label>
                <select
                  className="form-select"
                  value={editFormData.lead_investigator_id || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, lead_investigator_id: parseInt(e.target.value, 10) })}
                  required
                >
                  {allInvestigatorsList.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.badge_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label required">Crime Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.crime_location || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, crime_location: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Incident Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={editFormData.incident_date || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, incident_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Investigation Narrative & Description</label>
              <textarea
                className="form-textarea"
                rows={5}
                value={editFormData.description || ''}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingDetails}
                style={{ minWidth: '160px' }}
              >
                {savingDetails ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Recording Updates...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Save & Log Updates</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Evidence Upload Modal */}
      <EvidenceUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        caseId={caseData.id}
        caseCode={caseData.case_id}
        onUploadSuccess={(newEvidence) => {
          // Add to local evidence table
          setEvidenceList(prev => [newEvidence, ...prev]);
          // Refresh activity trail
          api.getCaseActivity(caseId).then(res => setActivities(res.activities || [])).catch(() => {});
        }}
      />
    </div>
  );
}

export default CaseWorkspace;
