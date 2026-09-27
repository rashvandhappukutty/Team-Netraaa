import React, { useState, useEffect } from 'react';
import {
  Clock, Filter, AlertTriangle, Zap, Phone, DollarSign,
  MapPin, Users, FileText, ChevronDown, ChevronRight, Info
} from 'lucide-react';
import { api } from '../api/client';

const EVENT_TYPE_STYLES = {
  COMMUNICATION:          { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',  icon: Phone,      label: 'Communication'   },
  FINANCIAL_TRANSACTION:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)',  icon: DollarSign, label: 'Financial'        },
  MEETING:                { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.3)', icon: Users,      label: 'Meeting'          },
  INCIDENT:               { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', icon: Zap,        label: 'Incident'         },
  LOCATION_CONVERGENCE:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)',  icon: MapPin,     label: 'Location'         },
  DOCUMENT_EVENT:         { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.25)', icon: FileText,  label: 'Document'         },
};

const SEVERITY_STYLES = {
  CRITICAL: { color: '#f87171', label: 'CRITICAL', dot: '#f87171' },
  WARNING:  { color: '#fbbf24', label: 'WARNING',  dot: '#fbbf24' },
  NORMAL:   { color: '#94a3b8', label: 'NORMAL',   dot: '#64748b' },
};

function getEvtStyle(type) {
  return EVENT_TYPE_STYLES[type] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', icon: FileText, label: type };
}

function formatDateTime(ts) {
  if (!ts) return { date: '--', time: '--' };
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { date, time };
}

function TimelineEvent({ event, expanded, onToggle }) {
  const evtStyle = getEvtStyle(event.event_type);
  const sevStyle = SEVERITY_STYLES[event.severity] || SEVERITY_STYLES.NORMAL;
  const IconComp = evtStyle.icon;
  const { date, time } = formatDateTime(event.timestamp);

  return (
    <div style={{ display: 'flex', gap: '1.25rem', position: 'relative' }}>
      {/* Timeline vertical connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '44px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: evtStyle.bg, border: `2px solid ${evtStyle.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: event.severity === 'CRITICAL' ? `0 0 12px ${evtStyle.color}40` : 'none'
        }}>
          <IconComp size={16} color={evtStyle.color} />
        </div>
        <div style={{ width: '2px', flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.06)', minHeight: '20px', marginTop: '4px' }} />
      </div>

      {/* Event card */}
      <div style={{
        flex: 1, marginBottom: '1.25rem',
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--bg-input)',
        border: `1px solid ${expanded ? evtStyle.border : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: expanded ? `0 0 18px ${evtStyle.color}15` : 'none'
      }} onClick={onToggle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: evtStyle.color }}>
                {evtStyle.label}
              </span>
              {event.severity !== 'NORMAL' && (
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)', backgroundColor: `${sevStyle.dot}20`, color: sevStyle.dot, border: `1px solid ${sevStyle.dot}40` }}>
                  {sevStyle.label}
                </span>
              )}
            </div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', lineHeight: 1.3 }}>{event.title}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{time}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{date}</div>
          </div>
          <div>{expanded ? <ChevronDown size={14} color="var(--text-dim)" /> : <ChevronRight size={14} color="var(--text-dim)" />}</div>
        </div>

        {/* Involved entities summary */}
        <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {event.primary_entity_name && (
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 'var(--radius-full)', color: 'var(--cyan-primary)' }}>
              {event.primary_entity_name}
            </span>
          )}
          {event.secondary_entity_name && (
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(0,229,255,0.07)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>
              {event.secondary_entity_name}
            </span>
          )}
          {event.location_name && (
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--radius-full)', color: '#34d399' }}>
              📍 {event.location_name}
            </span>
          )}
          {event.source_code && (
            <span className="mono" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', backgroundColor: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 'var(--radius-full)', color: 'var(--text-dim)' }}>
              {event.source_code}
            </span>
          )}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{event.description}</p>
            {event.evidence_snippet && (
              <div style={{ padding: '0.75rem', backgroundColor: '#050810', borderRadius: 'var(--radius-md)', border: `1px solid ${evtStyle.border}`, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: evtStyle.color, lineHeight: 1.5 }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>Evidence Snippet</div>
                {event.evidence_snippet}
              </div>
            )}
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Event ID: <span className="mono" style={{ color: 'var(--text-secondary)' }}>{event.event_id}</span></span>
              {event.source_type && <span>Source Type: <strong style={{ color: 'var(--text-primary)' }}>{event.source_type}</strong></span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function InvestigationTimeline({ investigationId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    if (!investigationId) return;
    setLoading(true);
    api.getInvestigationTimeline(investigationId, {})
      .then(res => { setEvents(res.events || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [investigationId]);

  const filteredEvents = events.filter(e => {
    if (typeFilter && e.event_type !== typeFilter) return false;
    if (severityFilter && e.severity !== severityFilter) return false;
    return true;
  });

  const criticalCount = events.filter(e => e.severity === 'CRITICAL').length;
  const warningCount = events.filter(e => e.severity === 'WARNING').length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
      <div className="pulse-indicator" style={{ width: '20px', height: '20px' }} />
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem' }}>RECONSTRUCTING TIMELINE...</span>
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--crimson-critical)' }}>
      <AlertTriangle size={32} style={{ margin: '0 auto 0.75rem' }} />
      <p>{error}</p>
    </div>
  );

  if (events.length === 0) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      <Clock size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
      <h4>No Timeline Events</h4>
      <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Run the Analysis Pipeline to generate the investigation timeline.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stats strip */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Events', value: events.length, color: 'var(--cyan-primary)' },
          { label: 'Critical', value: criticalCount, color: '#f87171' },
          { label: 'Warning', value: warningCount, color: '#fbbf24' },
          { label: 'Showing', value: filteredEvents.length, color: 'var(--text-secondary)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '0.65rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ fontSize: '0.8rem', width: '190px' }}>
          <option value="">All Event Types</option>
          {Object.entries(EVENT_TYPE_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="form-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ fontSize: '0.8rem', width: '150px' }}>
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="WARNING">Warning</option>
          <option value="NORMAL">Normal</option>
        </select>
        {(typeFilter || severityFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setTypeFilter(''); setSeverityFilter(''); }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {filteredEvents.map(evt => (
          <TimelineEvent
            key={evt.id}
            event={evt}
            expanded={expandedId === evt.id}
            onToggle={() => setExpandedId(id => id === evt.id ? null : evt.id)}
          />
        ))}
        {filteredEvents.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No events match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

export default InvestigationTimeline;
