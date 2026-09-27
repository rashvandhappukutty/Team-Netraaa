import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  Loader2, 
  Briefcase,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music
} from 'lucide-react';
import { api } from '../api/client';
import IntegrityBadge from '../components/IntegrityBadge';
import ProcessingBadge from '../components/ProcessingBadge';

export function EvidenceVault({ navigate }) {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [integrityFilter, setIntegrityFilter] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyAlert, setVerifyAlert] = useState(null);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const res = await api.getAllEvidence({
        search,
        type: typeFilter,
        integrity: integrityFilter
      });
      setEvidence(res.evidence || []);
    } catch (err) {
      console.error('Error fetching global evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [search, typeFilter, integrityFilter]);

  const handleVerify = async (ev) => {
    try {
      setVerifyingId(ev.id);
      setVerifyAlert(null);
      const res = await api.verifyEvidence(ev.id);
      
      setEvidence(prev => prev.map(item => item.id === ev.id ? { ...item, integrity_status: res.integrity_status } : item));
      setVerifyAlert({
        evidence_id: ev.evidence_id,
        isMatch: res.verified,
        message: res.verified ? 'Cryptographic SHA-256 integrity verified' : 'INTEGRITY ALERT: Tampering detected'
      });
    } catch (err) {
      setVerifyAlert({
        evidence_id: ev.evidence_id,
        isMatch: false,
        message: err.message || 'Verification failed.'
      });
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(14, 21, 38, 0.95) 0%, rgba(19, 31, 55, 0.8) 100%)',
        border: '1px solid var(--border-medium)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Database size={24} color="var(--cyan-primary)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Global Evidence Vault</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Master digital evidence vault indexed with SHA-256 integrity seals.
          </p>
        </div>
      </div>

      {verifyAlert && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: verifyAlert.isMatch ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 23, 68, 0.15)',
          border: `1px solid ${verifyAlert.isMatch ? 'var(--border-emerald)' : 'var(--border-crimson)'}`,
          color: verifyAlert.isMatch ? 'var(--emerald-verified)' : 'var(--crimson-critical)',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {verifyAlert.isMatch ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
            <span><strong>{verifyAlert.evidence_id}:</strong> {verifyAlert.message}</span>
          </div>
          <button onClick={() => setVerifyAlert(null)} className="btn btn-ghost btn-sm">Dismiss</button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="netra-card" style={{ padding: '1.5rem' }}>
        {/* Filters */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Forensic Artifact Registry</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing {evidence.length} secured evidence artifacts
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search ID, title, filename..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.2rem', fontSize: '0.8rem' }}
              />
              <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: '150px', fontSize: '0.8rem' }}
            >
              <option value="">All Categories</option>
              <option value="DOCUMENT">Document</option>
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
              <option value="AUDIO">Audio</option>
            </select>

            <select
              className="form-select"
              value={integrityFilter}
              onChange={(e) => setIntegrityFilter(e.target.value)}
              style={{ width: '160px', fontSize: '0.8rem' }}
            >
              <option value="">All Integrity States</option>
              <option value="VERIFIED">Verified</option>
              <option value="VERIFICATION_FAILED">Integrity Alert</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div className="pulse-indicator" style={{ width: '16px', height: '16px', margin: '0 auto 1rem' }} />
            <p>Scanning cryptographic vault...</p>
          </div>
        ) : evidence.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No evidence records match your search criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="netra-table">
              <thead>
                <tr>
                  <th>Evidence ID</th>
                  <th>Title & Original File</th>
                  <th>Parent Case</th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Integrity</th>
                  <th>AI Pipeline</th>
                  <th>Officer</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>
                        {ev.evidence_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ev.title}</div>
                      <div className="mono" style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {ev.file_name}
                      </div>
                      <div className="mono" style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                        SHA-256: {ev.sha256_hash.substring(0, 20)}...
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/cases/${ev.parent_case_id}`)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.2rem 0.5rem', color: 'var(--cyan-primary)', fontSize: '0.75rem' }}
                      >
                        <Briefcase size={12} />
                        <span className="mono">{ev.parent_case_id}</span>
                      </button>
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
                      <div style={{ fontSize: '0.8rem' }}>{ev.uploader_name}</div>
                      <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{ev.uploader_badge}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleVerify(ev)}
                          disabled={verifyingId === ev.id}
                          className="btn btn-emerald btn-sm"
                          title="Recalculate and verify SHA-256 against storage disk"
                        >
                          {verifyingId === ev.id ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                          <span>Verify</span>
                        </button>
                        <a
                          href={api.getEvidenceDownloadUrl(ev.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Download Evidence"
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
    </div>
  );
}

export default EvidenceVault;
