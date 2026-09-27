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
  PhoneCall,
  CreditCard,
  Eye,
  UserX,
  Globe
} from 'lucide-react';
import { api } from '../api/client';
import IntegrityBadge from '../components/IntegrityBadge';
import ProcessingBadge from '../components/ProcessingBadge';
import SourceTypeBadge from '../components/SourceTypeBadge';

export function GlobalDataSources({ navigate }) {
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState('');
  const [integrityFilter, setIntegrityFilter] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyAlert, setVerifyAlert] = useState(null);

  const fetchDataSources = async () => {
    try {
      setLoading(true);
      const res = await api.getAllDataSources({
        search,
        source_type: sourceTypeFilter,
        integrity: integrityFilter
      });
      setDataSources(res.data_sources || []);
    } catch (err) {
      console.error('Error fetching global data sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, [search, sourceTypeFilter, integrityFilter]);

  const handleVerify = async (ds) => {
    try {
      setVerifyingId(ds.id);
      setVerifyAlert(null);
      const res = await api.verifyDataSourceIntegrity(ds.id);
      
      setDataSources(prev => prev.map(item => item.id === ds.id ? { ...item, integrity_status: res.integrity_status } : item));
      setVerifyAlert({
        data_source_id: ds.data_source_id,
        isMatch: res.verified,
        message: res.verified ? 'Cryptographic SHA-256 integrity verified against storage disk' : 'INTEGRITY ALERT: File tampering detected'
      });
    } catch (err) {
      setVerifyAlert({
        data_source_id: ds.data_source_id,
        isMatch: false,
        message: err.message || 'Verification failed.'
      });
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Multi-Source Intelligence Vault</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Master preserved source files (FIR, CDR, Financial, Surveillance) with SHA-256 integrity seals.
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
            <span><strong>{verifyAlert.data_source_id}:</strong> {verifyAlert.message}</span>
          </div>
          <button onClick={() => setVerifyAlert(null)} className="btn btn-ghost btn-sm">Dismiss</button>
        </div>
      )}

      <div className="netra-card" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Ingested Sources Registry</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total {dataSources.length} secured intelligence sources
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search ID, file, investigation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.2rem', fontSize: '0.8rem' }}
              />
              <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select
              className="form-select"
              value={sourceTypeFilter}
              onChange={(e) => setSourceTypeFilter(e.target.value)}
              style={{ width: '180px', fontSize: '0.8rem' }}
            >
              <option value="">All Source Types</option>
              <option value="FIR_POLICE_REPORT">FIR / Police Report</option>
              <option value="CDR">Call Detail Records (CDR)</option>
              <option value="FINANCIAL_TRANSACTIONS">Financial Transactions</option>
              <option value="SURVEILLANCE_REPORT">Surveillance Intel</option>
              <option value="CRIMINAL_HISTORY">Criminal History</option>
              <option value="SOCIAL_MEDIA_INTEL">Digital / OSINT Intel</option>
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
            <p>Scanning intelligence vault...</p>
          </div>
        ) : dataSources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No data sources match your search criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="netra-table">
              <thead>
                <tr>
                  <th>Data Source ID</th>
                  <th>Source File</th>
                  <th>Source Type</th>
                  <th>Parent Investigation</th>
                  <th>Extracted Records</th>
                  <th>Integrity</th>
                  <th>AI Pipeline</th>
                  <th>Officer</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dataSources.map((ds) => (
                  <tr key={ds.id}>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>
                        {ds.data_source_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ds.file_name}</div>
                      <div className="mono" style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                        SHA-256: {ds.sha256_hash.substring(0, 20)}...
                      </div>
                    </td>
                    <td>
                      <SourceTypeBadge type={ds.source_type} />
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/investigations/${ds.parent_inv_id}`)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.2rem 0.5rem', color: 'var(--cyan-primary)', fontSize: '0.75rem' }}
                      >
                        <Briefcase size={12} />
                        <span className="mono">{ds.parent_inv_id}</span>
                      </button>
                    </td>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {ds.record_count}
                      </span>
                    </td>
                    <td>
                      <IntegrityBadge status={ds.integrity_status} />
                    </td>
                    <td>
                      <ProcessingBadge status={ds.processing_status} />
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>{ds.uploader_name}</div>
                      <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{ds.uploader_badge}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleVerify(ds)}
                          disabled={verifyingId === ds.id}
                          className="btn btn-emerald btn-sm"
                          title="Verify original file SHA-256 hash"
                        >
                          {verifyingId === ds.id ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                          <span>Verify</span>
                        </button>
                        <a
                          href={api.getDataSourceDownloadUrl(ds.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Download Preserved Original File"
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

export default GlobalDataSources;
