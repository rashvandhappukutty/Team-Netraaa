import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  ArrowLeft, 
  MapPin, 
  UserCheck, 
  FileText, 
  AlertCircle,
  Loader2,
  Calendar,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function CreateInvestigation({ navigate }) {
  const { user } = useAuth();
  const [investigators, setInvestigators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    investigation_type: 'Cyber & Critical Infrastructure',
    description: '',
    priority: 'HIGH',
    start_date: new Date().toISOString().split('T')[0],
    primary_location: '',
    lead_investigator_id: '',
    additional_member_ids: []
  });

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await api.getInvestigators();
        setInvestigators(res.investigators || []);
        if (user) {
          setFormData(prev => ({
            ...prev,
            lead_investigator_id: user.id
          }));
        }
      } catch (err) {
        console.error('Failed to load investigator directory:', err);
      }
    };
    fetchTeam();
  }, [user]);

  const handleMemberToggle = (memberId) => {
    setFormData(prev => {
      const current = prev.additional_member_ids;
      if (current.includes(memberId)) {
        return { ...prev, additional_member_ids: current.filter(id => id !== memberId) };
      } else {
        return { ...prev, additional_member_ids: [...current, memberId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Investigation title is required.');
      return;
    }
    if (!formData.primary_location.trim()) {
      setError('Primary location is required.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.createInvestigation(formData);
      const createdInv = res.investigation;
      navigate(`/investigations/${createdInv.investigation_id}`);
    } catch (err) {
      setError(err.message || 'Failed to initialize investigation container.');
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate('/investigations')}
          className="btn btn-ghost btn-sm"
          style={{ gap: '0.4rem', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Investigation Registry</span>
        </button>
      </div>

      <div className="netra-card" style={{ padding: '2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-medium)',
          marginBottom: '1.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(0, 229, 255, 0.15)',
              color: 'var(--cyan-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px var(--cyan-glow)'
            }}>
              <FolderPlus size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>Initialize Investigation Container</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Create a secure intelligence container to aggregate and normalize multi-source evidence.
              </p>
            </div>
          </div>

          <div style={{
            textAlign: 'right',
            padding: '0.5rem 0.85rem',
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-cyan)'
          }}>
            <div style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Allocated Container ID
            </div>
            <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--cyan-primary)' }}>
              NETRA-INV-{currentYear}-XXXXX
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--crimson-subtle)',
            border: '1px solid var(--border-crimson)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--crimson-critical)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1 */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.95rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cyan-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} />
              <span>1. Investigation Scope & Objectives</span>
            </h3>

            <div className="form-group">
              <label className="form-label required">Investigation Title / Codename</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Operation DarkNexus: Critical Infrastructure Malware Incursion"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label required">Investigation Type</label>
                <select
                  className="form-select"
                  value={formData.investigation_type}
                  onChange={(e) => setFormData({ ...formData, investigation_type: e.target.value })}
                  required
                >
                  <option value="Cyber & Critical Infrastructure">Cyber & Critical Infrastructure</option>
                  <option value="Financial Crimes & Laundering">Financial Crimes & Laundering</option>
                  <option value="Forensics & Organized Crime">Forensics & Organized Crime</option>
                  <option value="Narcotics & Smuggling">Narcotics & Smuggling</option>
                  <option value="National Security & Counter-Terror">National Security & Counter-Terror</option>
                  <option value="Special Operations Intel">Special Operations Intel</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Priority Level</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  required
                >
                  <option value="CRITICAL">Critical Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Investigation Background & Intelligence Hypothesis</label>
              <textarea
                className="form-textarea"
                placeholder="Detail suspected crime syndicate, known vectors, initial intelligence leads..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          {/* Section 2 */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.95rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cyan-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} />
              <span>2. Incident Date & Primary Location</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label required">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Primary Location / Jurisdiction</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Northern Power Substation Node 7, Delhi NCR"
                  value={formData.primary_location}
                  onChange={(e) => setFormData({ ...formData, primary_location: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.95rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cyan-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={16} />
              <span>3. Assigned Investigative Team</span>
            </h3>

            <div className="form-group">
              <label className="form-label required">Lead Officer</label>
              <select
                className="form-select"
                value={formData.lead_investigator_id}
                onChange={(e) => setFormData({ ...formData, lead_investigator_id: parseInt(e.target.value, 10) })}
                required
              >
                {investigators.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} ({inv.badge_number} • {inv.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assisting Investigators</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.75rem',
                marginTop: '0.25rem'
              }}>
                {investigators
                  .filter(inv => inv.id !== parseInt(formData.lead_investigator_id, 10))
                  .map((inv) => {
                    const isChecked = formData.additional_member_ids.includes(inv.id);
                    return (
                      <div
                        key={inv.id}
                        onClick={() => handleMemberToggle(inv.id)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: isChecked ? 'var(--cyan-subtle)' : 'var(--bg-input)',
                          border: `1px solid ${isChecked ? 'var(--border-cyan)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ cursor: 'pointer', accentColor: 'var(--cyan-primary)' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {inv.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {inv.badge_number} • {inv.department}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '1rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-medium)'
          }}>
            <button
              type="button"
              onClick={() => navigate('/investigations')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '200px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Initializing Container...</span>
                </>
              ) : (
                <>
                  <FolderPlus size={16} />
                  <span>Create & Open Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateInvestigation;
