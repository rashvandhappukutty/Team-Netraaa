import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User, Bell, Radio } from 'lucide-react';

export function Header() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-medium)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Left: Tactical Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'rgba(0, 230, 118, 0.08)',
          border: '1px solid rgba(0, 230, 118, 0.25)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--emerald-verified)'
        }}>
          <span className="pulse-indicator" />
          <span>NETRA ENCLAVE // ONLINE</span>
        </div>

        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)'
        }}>
          SHA-256 TAMPER VERIFIED
        </div>
      </div>

      {/* Right: User Profile & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* User Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.35rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: isAdmin ? 'rgba(255, 23, 68, 0.2)' : 'rgba(0, 229, 255, 0.15)',
            color: isAdmin ? 'var(--crimson-critical)' : 'var(--cyan-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.name || 'Authorized User'}
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isAdmin ? 'rgba(255, 23, 68, 0.2)' : 'rgba(0, 229, 255, 0.15)',
                color: isAdmin ? 'var(--crimson-critical)' : 'var(--cyan-primary)',
                border: `1px solid ${isAdmin ? 'var(--border-crimson)' : 'var(--border-cyan)'}`
              }}>
                {user?.role}
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {user?.badge_number || 'NETRA-AGENT'} • {user?.department || 'Intelligence'}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="btn btn-ghost btn-sm"
          title="Secure Logout"
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}
        >
          <LogOut size={16} />
          <span>Exit</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
