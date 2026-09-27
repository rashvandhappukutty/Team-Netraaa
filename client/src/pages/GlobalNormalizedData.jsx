import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Search, 
  Filter, 
  Code2, 
  X, 
  Briefcase, 
  Database,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import SourceTypeBadge from '../components/SourceTypeBadge';

export function GlobalNormalizedData({ navigate }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRecordJson, setSelectedRecordJson] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      // Fetch normalized records globally
      const res = await api.getNormalizedRecordsBySource('', { search });
      setRecords(res.records || []);
    } catch (err) {
      console.error('Error loading normalized intelligence records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [search]);

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
            <Cpu size={24} color="var(--emerald-verified)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Unified Intelligence Repository (Ready for AI)</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Heterogeneous intelligence normalized into machine-readable JSON entities with source traceability.
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
          <Cpu size={15} />
          <span>PHASE 2 AI EXTRACTION INPUT LAYER</span>
        </div>
      </div>

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
            <h3 style={{ fontSize: '1.1rem' }}>Master Normalized Stream</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing {records.length} structured intelligence records
            </span>
          </div>

          <div style={{ position: 'relative', width: '320px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search normalized data, numbers, entities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.2rem', fontSize: '0.8rem' }}
            />
            <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div className="pulse-indicator" style={{ width: '16px', height: '16px', margin: '0 auto 1rem' }} />
            <p>Querying normalized intelligence stream...</p>
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No normalized records found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="netra-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Source Type</th>
                  <th>Traceability Link</th>
                  <th>Parent Investigation</th>
                  <th>Raw Content Segment</th>
                  <th>AI Pipeline Status</th>
                  <th style={{ textAlign: 'right' }}>Payload View</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyan-primary)' }}>
                        {rec.record_id}
                      </span>
                    </td>
                    <td>
                      <SourceTypeBadge type={rec.source_type} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="mono" style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          backgroundColor: 'rgba(0, 229, 255, 0.1)',
                          border: '1px solid var(--border-cyan)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--cyan-primary)'
                        }}>
                          {rec.source_code}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {rec.original_record_reference}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/investigations/${rec.inv_code}`)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.2rem 0.5rem', color: 'var(--cyan-primary)', fontSize: '0.75rem' }}
                      >
                        <Briefcase size={12} />
                        <span className="mono">{rec.inv_code}</span>
                      </button>
                    </td>
                    <td>
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-primary)',
                        maxWidth: '380px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {rec.raw_content}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(0, 230, 118, 0.15)', color: 'var(--emerald-verified)', border: '1px solid var(--border-emerald)' }}>
                        READY_FOR_AI
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedRecordJson(rec)}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '0.35rem' }}
                      >
                        <Code2 size={13} />
                        <span>Inspect JSON</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Record Viewer Modal */}
      {selectedRecordJson && (
        <div className="modal-overlay" onClick={() => setSelectedRecordJson(null)}>
          <div className="modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Normalized Record Payload</h3>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)' }}>
                  {selectedRecordJson.record_id} • {selectedRecordJson.source_code} ({selectedRecordJson.original_record_reference})
                </div>
              </div>
              <button onClick={() => setSelectedRecordJson(null)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <span className="form-label">Raw Source Record</span>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}>
                  {selectedRecordJson.raw_content}
                </div>
              </div>

              <div>
                <span className="form-label">Normalized JSON Schema</span>
                <pre style={{
                  padding: '1rem',
                  backgroundColor: '#050810',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-cyan)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.775rem',
                  color: '#38bdf8',
                  maxHeight: '280px',
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(selectedRecordJson.normalized_content, null, 2)}
                </pre>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedRecordJson(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalNormalizedData;
