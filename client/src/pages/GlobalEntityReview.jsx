import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Split, 
  Check, 
  Briefcase, 
  Loader2, 
  Search,
  Filter
} from 'lucide-react';
import { api } from '../api/client';
import EntityTypeBadge from '../components/EntityTypeBadge';

export function GlobalEntityReview({ navigate }) {
  const [investigations, setInvestigations] = useState([]);
  const [selectedInv, setSelectedInv] = useState('');
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const invRes = await api.getInvestigations();
      const invList = invRes.investigations || [];
      setInvestigations(invList);

      if (invList.length > 0) {
        setSelectedInv(invList[0].id);
        const qRes = await api.getInvestigationReviewQueue(invList[0].id);
        setQueue(qRes.queue || []);
      }
    } catch (err) {
      console.error('Error fetching global review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleInvChange = async (invId) => {
    setSelectedInv(invId);
    try {
      setLoading(true);
      const qRes = await api.getInvestigationReviewQueue(invId);
      setQueue(qRes.queue || []);
    } catch (err) {
      console.error('Failed to load queue for investigation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMerge = async (item) => {
    try {
      await api.confirmEntityMerge({
        mention_id: item.mention_db_id,
        master_entity_id: item.master_entity_id,
        notes: `Investigator confirmed merge into ${item.candidate_master_name}`
      });
      handleInvChange(selectedInv);
    } catch (err) {
      alert(err.message || 'Failed to confirm merge.');
    }
  };

  const handleKeepSeparate = async (item) => {
    try {
      await api.keepEntitySeparate({
        mention_id: item.mention_db_id,
        canonical_name: item.canonical_candidate,
        notes: 'Investigator designated as independent entity.'
      });
      handleInvChange(selectedInv);
    } catch (err) {
      alert(err.message || 'Failed to keep separate.');
    }
  };

  const handleRejectMention = async (item) => {
    try {
      await api.rejectEntityMention({
        mention_id: item.mention_db_id,
        notes: 'False positive extraction rejected by investigator.'
      });
      handleInvChange(selectedInv);
    } catch (err) {
      alert(err.message || 'Failed to reject mention.');
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
            <Layers size={24} color="#fbbf24" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Investigator Entity Review Queue</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Human-in-the-loop validation for potential duplicate entities and ambiguous matches.
          </p>
        </div>
      </div>

      <div className="netra-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Active Enclave Review Queue</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing {queue.length} pending candidate items
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Investigation:</label>
            <select
              className="form-select"
              value={selectedInv}
              onChange={(e) => handleInvChange(e.target.value)}
              style={{ width: '280px', fontSize: '0.8rem' }}
            >
              {investigations.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.investigation_id}: {inv.title.substring(0, 30)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div className="pulse-indicator" style={{ width: '16px', height: '16px', margin: '0 auto 1rem' }} />
            <p>Loading review items...</p>
          </div>
        ) : queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-lg)' }}>
            <CheckCircle2 size={40} color="var(--emerald-verified)" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontSize: '1.1rem', color: 'var(--emerald-verified)' }}>No Pending Ambiguous Matches</h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0.25rem auto' }}>
              All entity extractions for this investigation have been verified and resolved.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {queue.map((item) => (
              <div
                key={item.mention_db_id}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-amber)',
                  boxShadow: '0 0 15px rgba(245, 158, 11, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <EntityTypeBadge type={item.entity_type} />
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.entity_mention_id}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>•</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Source: <strong style={{ color: 'var(--text-primary)' }}>{item.source_file_name}</strong> ({item.source_reference})
                    </span>
                  </div>

                  <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid var(--border-amber)' }}>
                    {Math.round((item.resolution_score || 0.8) * 100)}% Potential Match
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ padding: '0.85rem 1rem', backgroundColor: '#050810', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--cyan-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Newly Extracted Mention
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                      "{item.original_value}"
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Normalized: <span className="mono" style={{ color: 'var(--cyan-primary)' }}>{item.canonical_candidate}</span>
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.4rem' }}>
                      "{item.source_context}"
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem 1rem', backgroundColor: '#050810', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--emerald-verified)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Candidate Master Entity
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                      {item.candidate_master_name || 'Unresolved'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Master ID: <span className="mono" style={{ color: 'var(--emerald-verified)' }}>{item.candidate_master_code || '--'}</span>
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.4rem' }}>
                      Match Rule: {item.resolution_method || 'Fuzzy Similarity'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                  <button
                    onClick={() => handleRejectMention(item)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--crimson-critical)' }}
                  >
                    <XCircle size={14} />
                    <span>Reject Extraction</span>
                  </button>

                  <button
                    onClick={() => handleKeepSeparate(item)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Split size={14} />
                    <span>Keep Separate</span>
                  </button>

                  {item.master_entity_id && (
                    <button
                      onClick={() => handleConfirmMerge(item)}
                      className="btn btn-emerald btn-sm"
                      style={{ fontWeight: 700 }}
                    >
                      <Check size={14} />
                      <span>Confirm Merge into {item.candidate_master_name}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GlobalEntityReview;
