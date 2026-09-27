import React, { useState, useEffect } from 'react';
import { 
  History, 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Lock, 
  Briefcase, 
  Database 
} from 'lucide-react';
import { api } from '../api/client';

export function AuditLogs({ navigate }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        action: actionFilter,
        limit: 100
      });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (l.details && l.details.toLowerCase().includes(s)) ||
      (l.user_name && l.user_name.toLowerCase().includes(s)) ||
      (l.case_code && l.case_code.toLowerCase().includes(s)) ||
      (l.action && l.action.toLowerCase().includes(s))
    );
  });

  const getActionTheme = (action) => {
    switch (action) {
      case 'CASE_CREATED': return { bg: 'rgba(0, 229, 255, 0.15)', color: 'var(--cyan-primary)', border: 'var(--border-cyan)' };
      case 'CASE_UPDATED': return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)' };
      case 'EVIDENCE_UPLOADED': return { bg: 'rgba(101, 31, 255, 0.15)', color: '#a78bfa', border: 'rgba(101, 31, 255, 0.4)' };
      case 'HASH_GENERATED': return { bg: 'rgba(0, 230, 118, 0.15)', color: 'var(--emerald-verified)', border: 'var(--border-emerald)' };
      case 'EVIDENCE_VERIFIED': return { bg: 'rgba(0, 230, 118, 0.15)', color: 'var(--emerald-verified)', border: 'var(--border-emerald)' };
      case 'EVIDENCE_ACCESSED': return { bg: 'rgba(255, 179, 0, 0.15)', color: 'var(--amber-warning)', border: 'rgba(255, 179, 0, 0.4)' };
      case 'LOGIN': return { bg: 'rgba(41, 121, 255, 0.15)', color: '#60a5fa', border: 'rgba(41, 121, 255, 0.4)' };
      case 'LOGOUT': return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)' };
      case 'USER_CREATED': return { bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: 'rgba(236, 72, 153, 0.4)' };
      default: return { bg: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)', border: 'var(--border-subtle)' };
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
            <History size={24} color="var(--cyan-primary)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Chain of Custody & Master Audit Log</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Tamper-evident legal audit ledger recording every authentication, case edit, upload, and hash verification.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.85rem',
          backgroundColor: 'rgba(0, 230, 118, 0.08)',
          border: '1px solid var(--border-emerald)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--emerald-verified)',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          <ShieldCheck size={16} />
          <span>IMMUTABLE WRITE-ONCE LEDGER</span>
        </div>
      </div>

      {/* Main Table Card */}
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
            <h3 style={{ fontSize: '1.1rem' }}>Custody Event Stream</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total {total} legal chain events recorded
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '250px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search audit details, officer, case..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.2rem', fontSize: '0.8rem' }}
              />
              <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select
              className="form-select"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{ width: '190px', fontSize: '0.8rem' }}
            >
              <option value="">All Action Types</option>
              <option value="CASE_CREATED">CASE_CREATED</option>
              <option value="CASE_UPDATED">CASE_UPDATED</option>
              <option value="EVIDENCE_UPLOADED">EVIDENCE_UPLOADED</option>
              <option value="HASH_GENERATED">HASH_GENERATED</option>
              <option value="EVIDENCE_VERIFIED">EVIDENCE_VERIFIED</option>
              <option value="EVIDENCE_ACCESSED">EVIDENCE_ACCESSED</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="USER_CREATED">USER_CREATED</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div className="pulse-indicator" style={{ width: '16px', height: '16px', margin: '0 auto 1rem' }} />
            <p>Decrypting chain of custody records...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No audit log entries matching criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="netra-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Case Ref</th>
                  <th>Evidence Ref</th>
                  <th>Custody Action Details</th>
                  <th>Authorized Officer</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const theme = getActionTheme(log.action);
                  return (
                    <tr key={log.id}>
                      <td>
                        <div className="mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.timestamp ? log.timestamp.substring(11, 19) : '--'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {log.timestamp ? log.timestamp.substring(0, 10) : ''}
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: theme.bg,
                            color: theme.color,
                            border: `1px solid ${theme.border}`
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>
                        {log.case_code ? (
                          <button
                            onClick={() => navigate(`/cases/${log.case_code}`)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.2rem 0.5rem', color: 'var(--cyan-primary)' }}
                          >
                            <span className="mono" style={{ fontSize: '0.75rem' }}>{log.case_code}</span>
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        {log.evidence_code ? (
                          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-cyan)' }}>
                            {log.evidence_code}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', maxWidth: '400px', lineHeight: 1.35 }}>
                          {log.details}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{log.user_name}</div>
                        <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {log.badge_number || log.user_role}
                        </div>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {log.ip_address || '127.0.0.1'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogs;
