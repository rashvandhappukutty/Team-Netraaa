import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Mail, 
  Lock, 
  Building, 
  BadgeCheck, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function AdminUsers({ navigate }) {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'INVESTIGATOR',
    badge_number: '',
    department: 'Cyber Forensics Unit'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getAllUsers();
      setUsers(res.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required account fields.');
      return;
    }

    try {
      setSubmitLoading(true);
      const res = await api.createUser(formData);
      setUsers(prev => [res.user, ...prev]);
      setSuccessMsg(`Officer account ${res.user.name} provisioned successfully.`);
      setIsCreating(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'INVESTIGATOR',
        badge_number: '',
        department: 'Cyber Forensics Unit'
      });
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to create officer account.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <ShieldAlert size={48} color="var(--crimson-critical)" style={{ margin: '0 auto 1rem' }} />
        <h3>Access Restricted</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Only System Administrators can manage officer accounts.</p>
      </div>
    );
  }

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
            <Users size={24} color="var(--crimson-critical)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Investigator & Officer Management</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Provision, inspect, and manage authorized law enforcement personnel credentials.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="btn btn-primary"
          style={{ gap: '0.5rem' }}
        >
          <UserPlus size={16} />
          <span>{isCreating ? 'Close Form' : 'Provision Officer'}</span>
        </button>
      </div>

      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(0, 230, 118, 0.1)',
          border: '1px solid var(--border-emerald)',
          color: 'var(--emerald-verified)',
          fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Creation Drawer */}
      {isCreating && (
        <div className="netra-card" style={{ padding: '1.75rem', borderColor: 'var(--border-cyan)' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={18} color="var(--cyan-primary)" />
            <span>Provision New Officer Profile</span>
          </h3>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--crimson-subtle)',
              border: '1px solid var(--border-crimson)',
              color: 'var(--crimson-critical)',
              fontSize: '0.825rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label required">Full Officer Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Insp. Arjun Verma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Official Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="arjun.verma@netra.gov.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Initial Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label required">System Role</label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="INVESTIGATOR">Investigator (Case & Evidence)</option>
                  <option value="ADMIN">System Administrator (Full Authority)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Badge / Service Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="NETRA-INV-104"
                  value={formData.badge_number}
                  onChange={(e) => setFormData({ ...formData, badge_number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department / Wing</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Special Cyber Cell"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Provisioning Credentials...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Authorize Officer Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Directory Table */}
      <div className="netra-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Active Officers Registry</h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div className="pulse-indicator" style={{ width: '16px', height: '16px', margin: '0 auto 1rem' }} />
            <p>Loading officer personnel...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="netra-table">
              <thead>
                <tr>
                  <th>Officer Name</th>
                  <th>Official Email</th>
                  <th>Role</th>
                  <th>Badge Number</th>
                  <th>Department / Unit</th>
                  <th>Enlistment Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                    </td>
                    <td>
                      <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--cyan-primary)' }}>{u.email}</div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: u.role === 'ADMIN' ? 'rgba(255, 23, 68, 0.15)' : 'rgba(0, 229, 255, 0.12)',
                        color: u.role === 'ADMIN' ? 'var(--crimson-critical)' : 'var(--cyan-primary)',
                        border: `1px solid ${u.role === 'ADMIN' ? 'var(--border-crimson)' : 'var(--border-cyan)'}`
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '0.8rem' }}>{u.badge_number || 'N/A'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.department || 'General'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.created_at ? u.created_at.substring(0, 10) : 'Active'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;
