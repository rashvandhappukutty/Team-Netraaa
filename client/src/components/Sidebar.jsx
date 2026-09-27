import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  FolderPlus, 
  Database, 
  Cpu, 
  Sparkles,
  Layers,
  History, 
  Users, 
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ currentPath, navigate }) {
  const { isAdmin } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard
    },
    {
      label: 'Investigations',
      path: '/investigations',
      icon: Briefcase
    },
    {
      label: 'Data Sources Vault',
      path: '/data-sources',
      icon: Database
    },
    {
      label: 'Normalized Data',
      path: '/normalized-data',
      icon: Cpu
    },
    {
      label: 'Master Entities',
      path: '/entities',
      icon: Sparkles
    },
    {
      label: 'Entity Review Queue',
      path: '/entity-review',
      icon: Layers
    },
    {
      label: 'Chain of Custody',
      path: '/audit',
      icon: History
    },
    ...(isAdmin ? [
      {
        label: 'Officer Directory',
        path: '/admin/users',
        icon: Users
      }
    ] : [])
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-medium)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      flexShrink: 0
    }}>
      {/* Branding */}
      <div style={{
        padding: '1.5rem 1.5rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(101, 31, 255, 0.25) 100%)',
            border: '1px solid var(--border-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px var(--cyan-glow)'
          }}>
            <ShieldAlert size={22} color="#00e5ff" />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#ffffff',
              lineHeight: 1.1
            }}>
              NETRA
            </div>
            <div style={{
              fontSize: '0.625rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              color: 'var(--text-cyan)',
              textTransform: 'uppercase'
            }}>
              Entity Intelligence
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div style={{
          marginTop: '0.85rem',
          padding: '0.4rem 0.6rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.675rem',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          textAlign: 'center',
          lineHeight: 1.3
        }}>
          "From Fragmented Data to Actionable Intelligence."
        </div>
      </div>

      {/* Quick Action Button */}
      <div style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
        <button
          onClick={() => navigate('/investigations/create')}
          className="btn btn-primary"
          style={{ width: '100%', gap: '0.6rem' }}
        >
          <FolderPlus size={18} />
          <span>New Investigation</span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ 
          fontSize: '0.65rem', 
          fontWeight: 700, 
          letterSpacing: '0.08em', 
          textTransform: 'uppercase', 
          color: 'var(--text-dim)',
          padding: '0 0.75rem 0.4rem'
        }}>
          Intelligence Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--cyan-subtle)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--border-cyan)' : 'transparent'}`,
                color: isActive ? 'var(--cyan-primary)' : 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-input)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PHASE 2 ENGINE</span>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)' }}>ONLINE</span>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          AI Entity Resolution Active
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
