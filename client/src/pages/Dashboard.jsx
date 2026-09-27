import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Activity, 
  ShieldCheck, 
  FileText, 
  PhoneCall, 
  CreditCard, 
  Eye, 
  FolderPlus, 
  Database, 
  Search, 
  ArrowRight, 
  Plus, 
  MapPin, 
  Calendar, 
  Cpu,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SourceTypeBadge from '../components/SourceTypeBadge';

export function Dashboard({ navigate }) {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [onlyMyInvestigations, setOnlyMyInvestigations] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, invRes] = await Promise.all([
        api.getDashboardStats(),
        api.getInvestigations({
          search,
          status: statusFilter,
          priority: priorityFilter,
          type: typeFilter,
          my_investigations: onlyMyInvestigations ? 'true' : 'false',
          all: isAdmin && !onlyMyInvestigations ? 'true' : 'false'
        })
      ]);

      setStats(statsRes);
      setInvestigations(invRes.investigations || []);
      setError(null);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Failed to load intelligence telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [search, statusFilter, priorityFilter, typeFilter, onlyMyInvestigations]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(14, 21, 38, 0.95) 0%, rgba(19, 31, 55, 0.8) 100%)',
        border: '1px solid var(--border-medium)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              {isAdmin ? 'National Criminal Network & Intelligence Command' : 'Investigator Intelligence Workspace'}
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>. Active session under Badge <span className="mono" style={{ color: 'var(--cyan-primary)' }}>{user?.badge_number}</span>.
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/investigations/create')}
            className="btn btn-primary"
            style={{ gap: '0.5rem' }}
          >
            <FolderPlus size={17} />
            <span>New Investigation</span>
          </button>

          <button
            onClick={() => navigate('/data-sources')}
            className="btn btn-secondary"
            style={{ gap: '0.5rem' }}
          >
            <Database size={17} />
            <span>Data Sources Vault</span>
          </button>
        </div>
      </div>

      {/* Primary Investigation Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        <StatCard
          title="Total Investigations"
          value={stats?.stats?.totalInvestigations ?? '--'}
          subtitle={isAdmin ? "System-wide Registry" : `${stats?.stats?.myInvestigations ?? 0} assigned to you`}
          icon={Briefcase}
          color="cyan"
          onClick={() => { setStatusFilter(''); setOnlyMyInvestigations(false); }}
        />

        <StatCard
          title="Active Operations"
          value={stats?.stats?.activeInvestigations ?? '--'}
          subtitle="Ongoing criminal network probes"
          icon={Activity}
          color="cyan"
          onClick={() => setStatusFilter('ACTIVE')}
        />

        <StatCard
          title="High Priority"
          value={stats?.stats?.highPriorityInvestigations ?? '--'}
          subtitle="Critical security incidents"
          icon={Activity}
          color="crimson"
          onClick={() => setPriorityFilter('CRITICAL')}
        />

        <StatCard
          title="Normalized for AI"
          value={stats?.stats?.totalNormalizedRecords ?? '--'}
          subtitle="Structured records ready for Phase 2"
          icon={Cpu}
          color="emerald"
          onClick={() => navigate('/normalized-data')}
        />
      </div>

      {/* Multi-Source Ingestion Telemetry Breakdown */}
      <div className="netra-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cyan-primary)' }}>
              Phase 1 Multi-Source Data Ingestion Telemetry
            </span>
            <h3 style={{ fontSize: '1.1rem', marginTop: '0.15rem' }}>Heterogeneous Intelligence Ingestion Streams</h3>
          </div>
          <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total Ingested Sources: <strong style={{ color: 'var(--text-primary)' }}>{stats?.stats?.totalDataSources ?? 0}</strong>
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cyan-primary)', fontSize: '0.775rem', fontWeight: 600 }}>
              <FileText size={16} />
              <span>FIR / Police Reports</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
              {stats?.stats?.firCount ?? 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PDF / DOCX / TXT</div>
          </div>

          <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', fontSize: '0.775rem', fontWeight: 600 }}>
              <PhoneCall size={16} />
              <span>Call Records (CDR)</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
              {stats?.stats?.cdrCount ?? 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CSV / XLSX Relays</div>
          </div>

          <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffb300', fontSize: '0.775rem', fontWeight: 600 }}>
              <CreditCard size={16} />
              <span>Financial Records</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
              {stats?.stats?.financialCount ?? 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bank & Wire Tranches</div>
          </div>

          <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00e676', fontSize: '0.775rem', fontWeight: 600 }}>
              <Eye size={16} />
              <span>Surveillance Intel</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
              {stats?.stats?.surveillanceCount ?? 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Field Recon Notes</div>
          </div>
        </div>
      </div>

      {/* Main Investigations Section */}
      <div className="netra-card" style={{ padding: '1.5rem' }}>
        {/* Table Filter & Search Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Active Investigation Containers</h3>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Showing {investigations.length} investigation {investigations.length === 1 ? 'container' : 'containers'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search ID, title, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.8rem' }}
              />
              <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '150px', fontSize: '0.8rem' }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="UNDER_INVESTIGATION">Under Investigation</option>
              <option value="PENDING">Pending</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              className="form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ width: '140px', fontSize: '0.8rem' }}
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <button
              onClick={() => setOnlyMyInvestigations(!onlyMyInvestigations)}
              className={`btn btn-sm ${onlyMyInvestigations ? 'btn-primary' : 'btn-secondary'}`}
            >
              {onlyMyInvestigations ? '✓ My Investigations' : 'All Investigations'}
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <div className="pulse-indicator" style={{ width: '16px', height: '16px', margin: '0 auto 1rem' }} />
            <p>Scanning intelligence registry...</p>
          </div>
        ) : investigations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3.5rem 1rem',
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)'
          }}>
            <Briefcase size={36} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>No matching investigations found</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0.25rem auto 1.25rem' }}>
              No intelligence files matched the selected filter criteria.
            </p>
            <button onClick={() => navigate('/investigations/create')} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>Create New Investigation</span>
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="netra-table">
              <thead>
                <tr>
                  <th>Investigation ID</th>
                  <th>Title & Classification</th>
                  <th>Primary Location</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Lead Officer</th>
                  <th>Data Sources</th>
                  <th>Normalized Records</th>
                  <th style={{ textAlign: 'right' }}>Workspace</th>
                </tr>
              </thead>
              <tbody>
                {investigations.map((inv) => (
                  <tr 
                    key={inv.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/investigations/${inv.investigation_id}`)}
                  >
                    <td>
                      <span className="mono" style={{ 
                        fontWeight: 700, 
                        color: 'var(--cyan-primary)',
                        padding: '0.2rem 0.5rem',
                        backgroundColor: 'var(--cyan-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-cyan)'
                      }}>
                        {inv.investigation_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                        {inv.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-cyan)' }}>
                        {inv.investigation_type}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={13} color="var(--text-dim)" />
                        <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inv.primary_location}
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td>
                      <PriorityBadge priority={inv.priority} />
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                        {inv.lead_investigator_name}
                      </div>
                      <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {inv.lead_badge || 'OFFICER'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Database size={13} color="var(--cyan-primary)" />
                        <span style={{ fontWeight: 600 }}>{inv.source_count || 0}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>sources</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Cpu size={13} color="var(--emerald-verified)" />
                        <span style={{ fontWeight: 700, color: 'var(--emerald-verified)' }}>{inv.normalized_record_count || 0}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>records</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/investigations/${inv.investigation_id}`);
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--cyan-primary)' }}
                      >
                        <span>Open</span>
                        <ArrowRight size={14} />
                      </button>
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

export default Dashboard;
