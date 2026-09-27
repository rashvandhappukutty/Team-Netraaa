import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, ChevronDown, Info, Loader2 } from 'lucide-react';
import { api } from '../api/client';

const SUGGESTED_QUERIES = [
  'Show all entities connected to Person A.',
  'What suspicious patterns were detected?',
  'Summarize the investigation.',
  'Show the timeline of events.',
  'Who are the most connected individuals?',
  'What financial transactions were flagged?',
  'What leads require investigator review?',
  'Show me the connection between Person A and Person B.',
];

function AnswerCard({ message }) {
  const [showEvidence, setShowEvidence] = useState(false);

  if (message.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <div style={{
          maxWidth: '72%',
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(0,229,255,0.1)',
          border: '1px solid rgba(0,229,255,0.25)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)',
          color: '#f0f4fc', fontSize: '0.875rem', lineHeight: 1.5
        }}>
          {message.content}
        </div>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '0.5rem', flexShrink: 0, alignSelf: 'flex-end' }}>
          <User size={14} color="var(--cyan-primary)" />
        </div>
      </div>
    );
  }

  if (message.role === 'loading') {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(101,31,255,0.15)', border: '1px solid rgba(101,31,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={15} color="#a78bfa" />
        </div>
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Loader2 size={14} color="#a78bfa" className="animate-spin" />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Analyzing investigation data...</span>
        </div>
      </div>
    );
  }

  const data = message.data || {};
  const confidence = Math.round((data.confidence || 0) * 100);

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'flex-start' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(101,31,255,0.15)', border: '1px solid rgba(101,31,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
        <Bot size={15} color="#a78bfa" />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {/* Title */}
        {data.title && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={12} color="#a78bfa" />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a78bfa' }}>
              {data.title}
            </span>
          </div>
        )}

        {/* Main answer */}
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
          fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6
        }}>
          {data.answer || message.content}

          {/* Confidence indicator */}
          {confidence > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Analysis Confidence:</span>
              <div style={{ width: '80px', height: '4px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${confidence}%`, backgroundColor: confidence >= 90 ? '#34d399' : confidence >= 75 ? '#fbbf24' : '#f87171', borderRadius: '2px' }} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{confidence}%</span>
            </div>
          )}
        </div>

        {/* Supporting evidence */}
        {data.supporting_evidence && data.supporting_evidence.length > 0 && (
          <div>
            <button
              onClick={() => setShowEvidence(e => !e)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '0.25rem 0' }}
            >
              <Info size={12} />
              <span>{showEvidence ? 'Hide' : 'Show'} supporting evidence ({data.supporting_evidence.length})</span>
              <ChevronDown size={12} style={{ transform: showEvidence ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {showEvidence && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                {data.supporting_evidence.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.65rem', padding: '0.6rem 0.85rem', backgroundColor: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ color: 'var(--cyan-primary)', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{ev}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Source IDs */}
        {data.source_ids && data.source_ids.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Sources:</span>
            {data.source_ids.map(sid => (
              <span key={sid} className="mono" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', backgroundColor: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 'var(--radius-full)', color: 'var(--text-dim)' }}>
                {sid}
              </span>
            ))}
          </div>
        )}

        {/* Recommended action */}
        {data.recommended_action && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.73rem', color: '#fbbf24' }}>
            <AlertCircle size={12} />
            <span>Recommended follow-up: <strong>{data.recommended_action?.replace(/_/g, ' ')}</strong></span>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
          AI analysis is based on available investigation data only. Investigators make final decisions.
        </div>
      </div>
    </div>
  );
}

export function AIAssistant({ investigationId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'NETRA Intelligence Assistant online. I can answer questions about this investigation based on verified evidence records, extracted entities, detected patterns, and the investigation timeline. What would you like to know?',
      data: {
        answer: 'NETRA Intelligence Assistant online. I can answer questions about this investigation based on verified evidence records, extracted entities, detected patterns, and the investigation timeline. What would you like to know?',
        title: 'NETRA GROUNDED INTELLIGENCE ASSISTANT',
        confidence: 0
      }
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuery = async (query) => {
    if (!query.trim() || sending) return;

    const userMsg = { role: 'user', content: query };
    const loadingMsg = { role: 'loading', content: '' };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await api.queryAssistant(investigationId, query);
      setMessages(prev => [
        ...prev.filter(m => m.role !== 'loading'),
        { role: 'assistant', content: res.answer || '', data: res }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => m.role !== 'loading'),
        {
          role: 'assistant',
          content: 'Unable to process query. Please ensure the analysis pipeline has been run.',
          data: {
            answer: `Query failed: ${err.message}. Ensure the investigation has been analyzed first.`,
            title: 'QUERY ERROR',
            confidence: 0
          }
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery(input);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '680px', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', backgroundColor: 'rgba(101,31,255,0.08)', border: '1px solid rgba(101,31,255,0.2)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(101,31,255,0.2)', border: '1px solid rgba(101,31,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={18} color="#a78bfa" />
        </div>
        <div>
          <div style={{ fontWeight: 700, color: '#a78bfa', fontSize: '0.9rem' }}>NETRA Intelligence Assistant</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Grounded · Evidence-backed · Human-in-the-Loop</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', backgroundColor: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 'var(--radius-full)' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399' }} />
          <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700 }}>ONLINE</span>
        </div>
      </div>

      {/* Suggested queries */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {SUGGESTED_QUERIES.slice(0, 4).map(q => (
          <button
            key={q}
            onClick={() => sendQuery(q)}
            disabled={sending}
            style={{
              fontSize: '0.73rem', padding: '0.3rem 0.7rem',
              backgroundColor: 'rgba(101,31,255,0.08)', border: '1px solid rgba(101,31,255,0.2)',
              borderRadius: 'var(--radius-full)', color: '#a78bfa', cursor: 'pointer',
              transition: 'all 0.15s ease', whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => { e.target.style.backgroundColor = 'rgba(101,31,255,0.18)'; }}
            onMouseLeave={e => { e.target.style.backgroundColor = 'rgba(101,31,255,0.08)'; }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {messages.map((msg, i) => <AnswerCard key={i} message={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)' }}>
        <textarea
          className="form-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about entities, patterns, timeline, financial connections, or request an investigation summary..."
          rows={2}
          disabled={sending}
          style={{ flex: 1, resize: 'none', fontSize: '0.875rem', border: 'none', backgroundColor: 'transparent', padding: 0, outline: 'none', color: 'var(--text-primary)' }}
        />
        <button
          onClick={() => sendQuery(input)}
          disabled={sending || !input.trim()}
          className="btn btn-primary"
          style={{ alignSelf: 'flex-end', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      {/* Disclaimer footer */}
      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textAlign: 'center' }}>
        NETRA assistant provides grounded analytical assistance only. All responses are based on verified investigation data. Investigators retain final decision authority.
      </div>
    </div>
  );
}

export default AIAssistant;
