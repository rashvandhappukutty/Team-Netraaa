import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  ArrowLeft, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  MapPin, 
  UserCheck, 
  Users, 
  FileText, 
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function CreateCase({ navigate }) {
  const { user } = useAuth();
  const [investigators, setInvestigators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTeam, setFetchingTeam] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    case_type: 'Cyber Crime',
    crime_category: '',
    description: '',
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: '12:00:00',
    crime_location: '',
    priority: 'HIGH',
    lead_investigator_id: '',
    additional_investigator_ids: []
  });

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setFetchingTeam(true);
        const res = await api.getInvestigators();
        setInvestigators(res.investigators || []);
        // Set default lead investigator to current user if investigator
        if (user) {
          setFormData(prev => ({
            ...prev,
            lead_investigator_id: user.id
          }));
        }
      } catch (err) {
        console.error('Failed to load investigator directory:', err);
      } finally {
        setFetchingTeam(false);
      }
    };
    fetchTeam();
  }, [user]);

  const handleAdditionalInvestigatorToggle = (invId) => {
    setFormData(prev => {
      const current = prev.additional_investigator_ids;
      if (current.includes(invId)) {
        return { ...prev, additional_investigator_ids: current.filter(id => id !== invId) };
      } else {
        return { ...prev, additional_investigator_ids: [...current, invId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Case title is required.');
      return;
    }
    if (!formData.crime_category.trim()) {
      setError('Crime category is required.');
      return;
    }
    if (!formData.crime_location.trim()) {
      setError('Crime location is required.');
      return;
    }
    if (!formData.incident_date) {
      setError('Incident date is required.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.createCase(formData);
      // Successfully created -> Redirect to Case Workspace
      const createdCase = res.case;
      navigate(`/cases/${createdCase.case_id}`);
    } catch (err) {
      setError(err.message || 'Failed to create case.');
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Back Navigation */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          onClick={() => navigate('/cases')}
          className="btn btn-ghost btn-sm"
          style={{ gap: '0.4rem', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Case Repository</span>
        </button>
      </div>

      {/* Main Creation Card */}
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
              <h2 style={{ fontSize: '1.4rem' }}>Register New Criminal Case</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Initialize official investigation file and generate cryptographic chain of custody.
              </p>
            </div>
          </div>

          {/* Uneditable Case ID Preview */}
          <div style={{
            textAlign: 'right',
            padding: '0.5rem 0.85rem',
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-cyan)'
          }}>
            <div style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Auto Case ID Allocation
            </div>
            <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--cyan-primary)' }}>
              NETRA-{currentYear}-XXXXX
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
          {/* Section 1: Basic Information */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.95rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cyan-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} />
              <span>1. Basic Investigation Information</span>
            </h3>

            <div className="form-group">
              <label className="form-label required">Case Title / Operation Codename</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Operation CyberPhantom: Core Banking Ransomware Attack"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label required">Case Type</label>
                <select
                  className="form-select"
                  value={formData.case_type}
                  onChange={(e) => setFormData({ ...formData, case_type: e.target.value })}
                  required
                >
                  <option value="Cyber Crime">Cyber Crime</option>
                  <option value="Financial Fraud">Financial Fraud & Laundering</option>
                  <option value="Homicide">Homicide & Violent Crime</option>
                  <option value="Forensics / Burglary">Forensics / Burglary & Theft</option>
                  <option value="Narcotics">Narcotics & Smuggling</option>
                  <option value="National Security">National Security & Espionage</option>
                  <option value="Corruption / Special">Corruption & Anti-Extortion</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Crime Category / Classification</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ransomware, Hawala, Identity Spoofing"
                  value={formData.crime_category}
                  onChange={(e) => setFormData({ ...formData, crime_category: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Comprehensive Case Description & Background</label>
              <textarea
                className="form-textarea"
                placeholder="Enter detailed facts, modus operandi, intelligence sources, suspect indicators..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          {/* Section 2: Incident Coordinates & Priority */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.95rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cyan-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} />
              <span>2. Incident Timing & Location</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label required">Incident Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.incident_date}
                  onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Incident Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={formData.incident_time}
                  onChange={(e) => setFormData({ ...formData, incident_time: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Investigation Priority</label>
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
              <label className="form-label required">Crime Location / Jurisdiction</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Server Room B, North Zone Data Center, Cyber City"
                value={formData.crime_location}
                onChange={(e) => setFormData({ ...formData, crime_location: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Section 3: Assignment */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.95rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cyan-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={16} />
              <span>3. Assigned Investigative Team</span>
            </h3>

            <div className="form-group">
              <label className="form-label required">Lead Investigator</label>
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

            {/* Additional Investigators Multi-check */}
            <div className="form-group">
              <label className="form-label">Additional Investigators (Optional Team Support)</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.75rem',
                marginTop: '0.25rem'
              }}>
                {investigators
                  .filter(inv => inv.id !== parseInt(formData.lead_investigator_id, 10))
                  .map((inv) => {
                    const isChecked = formData.additional_investigator_ids.includes(inv.id);
                    return (
                      <div
                        key={inv.id}
                        onClick={() => handleAdditionalInvestigatorToggle(inv.id)}
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
              onClick={() => navigate('/cases')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '180px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating Case File...</span>
                </>
              ) : (
                <>
                  <FolderPlus size={16} />
                  <span>Register & Open Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCase;
