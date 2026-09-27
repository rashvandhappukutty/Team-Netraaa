import React from 'react';

export function StatCard({ title, value, subtitle, icon: Icon, color = 'cyan', onClick }) {
  const colorMap = {
    cyan: {
      border: 'var(--border-cyan)',
      glow: 'var(--cyan-glow)',
      text: 'var(--cyan-primary)',
      bg: 'var(--cyan-subtle)'
    },
    emerald: {
      border: 'var(--border-emerald)',
      glow: 'var(--emerald-glow)',
      text: 'var(--emerald-verified)',
      bg: 'var(--emerald-subtle)'
    },
    amber: {
      border: 'rgba(255, 179, 0, 0.4)',
      glow: 'var(--amber-glow)',
      text: 'var(--amber-warning)',
      bg: 'var(--amber-subtle)'
    },
    crimson: {
      border: 'var(--border-crimson)',
      glow: 'var(--crimson-glow)',
      text: 'var(--crimson-critical)',
      bg: 'var(--crimson-subtle)'
    },
    indigo: {
      border: 'rgba(101, 31, 255, 0.4)',
      glow: 'rgba(101, 31, 255, 0.25)',
      text: '#a78bfa',
      bg: 'var(--indigo-subtle)'
    }
  };

  const theme = colorMap[color] || colorMap.cyan;

  return (
    <div 
      className="netra-card" 
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `4px solid ${theme.text}`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            letterSpacing: '0.06em', 
            textTransform: 'uppercase', 
            color: 'var(--text-secondary)' 
          }}>
            {title}
          </span>
          <div style={{ 
            fontSize: '2rem', 
            fontWeight: 800, 
            fontFamily: 'var(--font-heading)', 
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            marginTop: '0.25rem'
          }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              {subtitle}
            </div>
          )}
        </div>
        {Icon && (
          <div style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: theme.bg,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={22} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
