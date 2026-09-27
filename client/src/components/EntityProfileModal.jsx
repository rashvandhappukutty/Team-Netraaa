import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  Database, 
  Link2, 
  Layers, 
  Edit3, 
  Check, 
  Loader2, 
  FileText, 
  Clock, 
  Calendar,
  ExternalLink,
  Code2
} from 'lucide-react';
import { api } from '../api/client';
import EntityTypeBadge from './EntityTypeBadge';
import EntityConfidenceBadge from './EntityConfidenceBadge';
import SourceTypeBadge from './SourceTypeBadge';

export function EntityProfileModal({ entityId, isOpen, onClose, onEntityUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit canonical name state
  const [isEditing, setIsEditing] = useState(false);
  const [newCanonicalName, setNewCanonicalName] = useState('');
  const [savingCanonical, setSavingCanonical] = useState(false);

  useEffect(() => {
    if (!isOpen || !entityId) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.getEntityProfile(entityId);
        setData(res);
        setNewCanonicalName(res.profile.canonical_name);
        setError(null);
      } catch (err) {
        console.error('Failed to load entity profile:', err);
        setError(err.message || 'Could not fetch entity profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, entityId]);

  if (!isOpen) return null;

  const handleSaveCanonical = async (e) => {
    e.preventDefault();
    if (!newCanonicalName.trim()) return;

    try {
      setSavingCanonical(true);
      await api.editCanonicalName({
        master_entity_id: data.profile.id,
        canonical_name: newCanonicalName.trim()
      });
      setData(prev => ({
        ...prev,
        profile: { ...prev.profile, canonical_name: newCanonicalName.trim() }
      }));
      setIsEditing(false);
      if (onEntityUpdated) onEntityUpdated();
    } catch (err) {
      alert(err.message || 'Failed to update canonical name.');
    } finally {
      setSavingCanonical(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-medium)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(0, 229, 255, 0.12)',
              color: 'var(--cyan-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-cyan)'
            }}>
              <User size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {data?.profile ? data.profile.canonical_name : 'Entity Profile'}
                </h3>
                {data?.profile && <EntityTypeBadge type={data.profile.entity_type} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', fontWeight: 700 }}>
                  {data?.profile?.entity_id}
                </span>
                <span style={{ color: 'var(--text-dim)' }}>•</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Enclave: <strong style={{ color: 'var(--text-secondary)' }}>{data?.profile?.inv_code}</strong>
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--cyan-primary)' }} />
              <p>Reconstructing Entity Intelligence & Source Traceability...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--crimson-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--crimson-critical)', textAlign: 'center' }}>
              {error}
            </div>
          ) : (
            <>
              {/* Summary Stats Strip */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '0.85rem'
              }}>
                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Resolution Confidence
                  </div>
                  <div style={{ marginTop: '0.35rem' }}>
                    <EntityConfidenceBadge score={data.profile.confidence_score} />
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Cross-Source Mentions
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                    {data.mentions?.length || 0}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>occurrences</span>
                  </div>
                </div>

                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Connected Data Sources
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cyan-primary)', marginTop: '0.15rem' }}>
                    {data.connected_sources?.length || 0}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.35rem' }}>sources</span>
                  </div>
                </div>
              </div>

              {/* Aliases Section */}
              <div className="netra-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={16} color="var(--cyan-primary)" />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Resolved Aliases & Lexical Variants</h4>
                  </div>

                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)' }}>
                      <Edit3 size={13} />
                      <span>Edit Canonical Name</span>
                    </button>
                  ) : null}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveCanonical} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={newCanonicalName}
                      onChange={(e) => setNewCanonicalName(e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                      required
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={savingCanonical}>
                      <Check size={14} />
                      <span>Save</span>
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm">
                      Cancel
                    </button>
                  </form>
                ) : null}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {data.aliases?.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No additional aliases recorded.</span>
                  ) : (
                    data.aliases?.map(a => (
                      <span
                        key={a.id}
                        className="mono"
                        style={{
                          fontSize: '0.775rem',
                          padding: '0.3rem 0.65rem',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {a.alias_value}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Source Traceability & Mentions Stream */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <Link2 size={16} color="var(--emerald-verified)" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                    Granular Source Mentions & Context Traceability
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.mentions?.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span className="mono" style={{
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            color: 'var(--cyan-primary)',
                            padding: '0.15rem 0.45rem',
                            backgroundColor: 'rgba(0, 229, 255, 0.1)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-cyan)'
                          }}>
                            {m.source_code}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {m.source_file_name}
                          </span>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            ({m.source_reference})
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <SourceTypeBadge type={m.ds_type} />
                          <span className="badge" style={{ backgroundColor: 'rgba(0, 230, 118, 0.1)', color: 'var(--emerald-verified)', fontSize: '0.675rem' }}>
                            {m.resolution_method}
                          </span>
                        </div>
                      </div>

                      {/* Raw Context Snippet */}
                      <div style={{
                        padding: '0.65rem 0.85rem',
                        backgroundColor: '#050810',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.775rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5
                      }}>
                        <strong style={{ color: 'var(--cyan-primary)', marginRight: '0.4rem' }}>Extracted Value:</strong>
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>"{m.original_value}"</span>
                        <div style={{ marginTop: '0.35rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          "{m.source_context}"
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span>Method: <strong>{m.extraction_method}</strong></span>
                        <span className="mono">Extracted at: {m.created_at ? m.created_at.substring(0, 16) : '--'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Data Sources Master Seal */}
              <div className="netra-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Database size={16} color="var(--cyan-primary)" />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Originating Cryptographic Data Sources</h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.connected_sources?.map(ds => (
                    <div key={ds.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', fontWeight: 600 }}>{ds.data_source_id}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{ds.file_name}</span>
                      </div>
                      <div className="mono" style={{ fontSize: '0.675rem', color: 'var(--emerald-verified)' }}>
                        SHA-256: {ds.sha256_hash.substring(0, 16)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-medium)', paddingTop: '1rem' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export default EntityProfileModal;
