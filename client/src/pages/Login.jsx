import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export function Login({ onLoginSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: 'var(--bg-primary)',
      backgroundImage: `
        radial-gradient(circle at 50% 20%, rgba(0, 229, 255, 0.08) 0%, transparent 60%),
        radial-gradient(circle at 80% 80%, rgba(101, 31, 255, 0.06) 0%, transparent 60%)
      `
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.25) 0%, rgba(101, 31, 255, 0.3) 100%)',
            border: '1px solid var(--border-cyan)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px var(--cyan-glow)',
            marginBottom: '1rem'
          }}>
            <ShieldAlert size={32} color="#00e5ff" />
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: '#ffffff',
            lineHeight: 1.1
          }}>
            NETRA
          </h1>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'var(--text-cyan)',
            textTransform: 'uppercase',
            marginTop: '0.35rem'
          }}>
            Criminal Investigation & Evidence Intelligence
          </p>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            marginTop: '0.5rem'
          }}>
            "Evidence to Intelligence. Intelligence to Action."
          </div>
        </div>

        {/* Login Card */}
        <div className="netra-card netra-card-glass" style={{ padding: '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <Lock size={16} color="var(--cyan-primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Restricted Law Enforcement Authentication
            </span>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--crimson-subtle)',
              border: '1px solid var(--border-crimson)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--crimson-critical)',
              fontSize: '0.825rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required">Official Email / ID</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="officer@netra.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <Mail size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label required">Security Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.925rem' }}
              disabled={loading}
            >
              {loading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <span>Access Secure Enclave</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              marginBottom: '0.75rem',
              textAlign: 'center'
            }}>
              Quick-Access Verified Demo Personas
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', width: '100%' }}
                onClick={() => setDemoCredentials('admin@netra.gov.in', 'NetraAdmin@2026')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={14} color="var(--crimson-critical)" />
                  <span>Admin: Dir. Vikram Rathore</span>
                </div>
                <span className="badge" style={{ backgroundColor: 'rgba(255, 23, 68, 0.2)', color: 'var(--crimson-critical)' }}>
                  ADMIN
                </span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', width: '100%' }}
                onClick={() => setDemoCredentials('priya.sharma@netra.gov.in', 'Investigator@2026')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck size={14} color="var(--cyan-primary)" />
                  <span>Lead Inv: Insp. Priya Sharma</span>
                </div>
                <span className="badge" style={{ backgroundColor: 'rgba(0, 229, 255, 0.12)', color: 'var(--cyan-primary)' }}>
                  CYBER
                </span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', width: '100%' }}
                onClick={() => setDemoCredentials('rajesh.kumar@netra.gov.in', 'Investigator@2026')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck size={14} color="var(--amber-warning)" />
                  <span>Lead Inv: Insp. Rajesh Kumar</span>
                </div>
                <span className="badge" style={{ backgroundColor: 'rgba(255, 179, 0, 0.12)', color: 'var(--amber-warning)' }}>
                  FINANCIAL
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.25rem',
          fontSize: '0.7rem',
          color: 'var(--text-dim)'
        }}>
          Protected by SHA-256 Chain of Custody & Role-Based Access Control
        </div>
      </div>
    </div>
  );
}

export default Login;
