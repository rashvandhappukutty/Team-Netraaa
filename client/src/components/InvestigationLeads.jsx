import React, { useState, useEffect } from 'react';
import {
  Target, CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronRight,
  AlertTriangle, ShieldCheck, Users, FileText, Info, Clock
} from 'lucide-react';
import { api } from '../api/client';

const PRIORITY_STYLES = {
  CRITICAL: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)' },
  HIGH:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)'  },
  MEDIUM:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.3)'   },
  LOW:      { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)'  },
};

const STATUS_STYLES = {
  PENDING_REVIEW:     { color: '#fbbf24', label: 'Pending Review',     icon: Clock       },
  CONFIRMED:          { color: '#34d399', label: 'Confirmed',           icon: CheckCircle },
  REJECTED:           { color: '#f87171', label: 'Dismissed',           icon: XCircle     },
  NEED_MORE_EVIDENCE: { color: '#60a5fa', label: 'Need More Evidence',  icon: HelpCircle  },
};

function LeadCard({ lead, onDecision }) {
  const [expanded, setExpanded] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [notes, setNotes] = useState('');
  const [showDecisionForm, setShowDecisionForm] = useState(false);

  const prStyle = PRIORITY_STYLES[lead.priority] || PRIORITY_STYLES.LOW;
  const stStyle = STATUS_STYLES[lead.status] || STATUS_STYLES.PENDING_REVIEW;
  const StatusIcon = stStyle.icon;
  const confidence = Math.round((lead.confidence_score || 0) * 100);

  const handleDecision = async (decision) => {
    setDeciding(true);
    try {
      await onDecision(lead.lead_id, decision, notes);
      setShowDecisionForm(false);
      setNotes('');
    } finally {
      setDeciding(false);
    }
  };

  return (
    <div style={{
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      border: `1px solid ${expanded ? prStyle.border : 'var(--border-subtle)'}`,
      backgroundColor: 'var(--bg-input)',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      boxShadow: expanded ? `0 0 20px ${prStyle.color}12` : 'none'
    }}>
      {/* Header */}
      <div
        style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Priority indicator */}
        <div style={{ width: '4px', borderRadius: '2px', alignSelf: 'stretch', backgroundColor: prStyle.color, flexShrink: 0 }} />

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0.15rem 0.5rem', backgroundColor: prStyle.bg, border: `1px solid ${prStyle.border}`, borderRadius: 'var(--radius-full)', color: prStyle.color }}>
              {lead.priority}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: stStyle.color }}>
              <StatusIcon size={12} />
              {stStyle.label}
            </span>
            <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{lead.lead_id}</span>
          </div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', lineHeight: 1.3 }}>{lead.title}</div>
        </div>

        {/* Confidence meter */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: prStyle.color }}>{confidence}%</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Confidence</div>
          <div style={{ width: '48px', height: '4px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '0.4rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${confidence}%`, backgroundColor: prStyle.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          {expanded ? <ChevronDown size={16} color="var(--text-dim)" /> : <ChevronRight size={16} color="var(--text-dim)" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Why flagged */}
          {lead.why_flagged && lead.why_flagged.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <Info size={14} color="var(--cyan-primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cyan-primary)' }}>
                  Why This Matters — Analytical Basis
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lead.why_flagged.map((reason, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.65rem 0.85rem', backgroundColor: 'rgba(0,229,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,229,255,0.1)' }}>
                    <span style={{ color: 'var(--cyan-primary)', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0, minWidth: '20px' }}>{i + 1}.</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence summary */}
          {lead.evidence_summary && (
            <div style={{ padding: '0.85rem', backgroundColor: '#050810', borderRadius: 'var(--radius-md)', border: `1px solid ${prStyle.border}`, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>Evidence Summary</div>
              {lead.evidence_summary}
            </div>
          )}

          {/* Supporting sources */}
          {lead.supporting_sources && lead.supporting_sources.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Supporting Intelligence Sources</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {lead.supporting_sources.map(src => (
                  <span key={src} className="mono" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', backgroundColor: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>
                    {src}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Investigator review section */}
          {lead.status === 'PENDING_REVIEW' && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              {!showDecisionForm ? (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={14} color="var(--text-dim)" />
                    <span>Investigator decision required. Review evidence before acting.</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ color: '#fbbf24' }} onClick={e => { e.stopPropagation(); setShowDecisionForm(true); }}>
                    Record Decision
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }} onClick={e => e.stopPropagation()}>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Optional investigator notes..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    style={{ fontSize: '0.82rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-emerald btn-sm" disabled={deciding} onClick={() => handleDecision('CONFIRM_LEAD')}>
                      <CheckCircle size={13} />
                      <span>Confirm Lead</span>
                    </button>
                    <button className="btn btn-sm" style={{ backgroundColor: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }} disabled={deciding} onClick={() => handleDecision('NEED_MORE_EVIDENCE')}>
                      <HelpCircle size={13} />
                      <span>Need More Evidence</span>
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }} disabled={deciding} onClick={() => handleDecision('REJECT')}>
                      <XCircle size={13} />
                      <span>Dismiss</span>
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowDecisionForm(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Already decided */}
          {lead.status !== 'PENDING_REVIEW' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: `${stStyle.color}10`, border: `1px solid ${stStyle.color}30`, borderRadius: 'var(--radius-md)' }}>
              <StatusIcon size={16} color={stStyle.color} />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: stStyle.color }}>Decision: {stStyle.label}</div>
                {lead.reviewer_name && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>by {lead.reviewer_name} ({lead.reviewer_badge})</div>}
                {lead.investigator_notes && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>"{lead.investigator_notes}"</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function InvestigationLeads({ investigationId }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [toast, setToast] = useState(null);

  const loadLeads = () => {
    setLoading(true);
    api.getInvestigationLeads(investigationId)
      .then(res => { setLeads(res.leads || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { if (investigationId) loadLeads(); }, [investigationId]);

  const handleDecision = async (leadId, decision, notes) => {
    await api.recordLeadDecision(leadId, { decision, notes });
    loadLeads();
    setToast(`Decision "${decision}" recorded.`);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = leads.filter(l => {
    if (statusFilter && l.status !== statusFilter) return false;
    if (priorityFilter && l.priority !== priorityFilter) return false;
    return true;
  });

  const pendingCount = leads.filter(l => l.status === 'PENDING_REVIEW').length;
  const confirmedCount = leads.filter(l => l.status === 'CONFIRMED').length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
      <div className="pulse-indicator" style={{ width: '20px', height: '20px' }} />
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem' }}>LOADING INVESTIGATIVE LEADS...</span>
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--crimson-critical)' }}>
      <AlertTriangle size={32} style={{ margin: '0 auto 0.75rem' }} />
      <p>{error}</p>
    </div>
  );

  if (leads.length === 0) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      <Target size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
      <h4>No Investigative Leads</h4>
      <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Run the Analysis Pipeline to generate leads.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast */}
      {toast && (
        <div style={{ padding: '0.75rem 1.25rem', backgroundColor: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 'var(--radius-md)', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={16} />
          {toast}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Leads', value: leads.length, color: 'var(--cyan-primary)' },
          { label: 'Pending Review', value: pendingCount, color: '#fbbf24' },
          { label: 'Confirmed', value: confirmedCount, color: '#34d399' },
          { label: 'Showing', value: filtered.length, color: 'var(--text-secondary)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '0.65rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: '0.8rem', width: '180px' }}>
          <option value="">All Statuses</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="REJECTED">Dismissed</option>
          <option value="NEED_MORE_EVIDENCE">Need More Evidence</option>
        </select>
        <select className="form-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ fontSize: '0.8rem', width: '150px' }}>
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        {(statusFilter || priorityFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}>Clear</button>
        )}
      </div>

      {/* Human-in-the-loop note */}
      <div style={{ display: 'flex', gap: '0.75rem', padding: '0.85rem 1rem', backgroundColor: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <ShieldCheck size={16} color="var(--cyan-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span><strong style={{ color: 'var(--cyan-primary)' }}>Human-in-the-Loop:</strong> These leads are generated by automated analytical inference. Investigators must review all evidence before taking action. System analysis does not determine guilt or legal responsibility.</span>
      </div>

      {/* Leads list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filtered.map(lead => (
          <LeadCard key={lead.id} lead={lead} onDecision={handleDecision} />
        ))}
      </div>
    </div>
  );
}

export default InvestigationLeads;
