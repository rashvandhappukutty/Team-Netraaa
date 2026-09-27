import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  User, 
  Briefcase, 
  Database,
  ExternalLink,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import EntityTypeBadge from '../components/EntityTypeBadge';
import EntityConfidenceBadge from '../components/EntityConfidenceBadge';
import EntityProfileModal from '../components/EntityProfileModal';

export function GlobalEntities({ navigate }) {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const res = await api.getAllMasterEntities({
        search,
        entity_type: entityTypeFilter
      });
      setEntities(res.entities || []);
    } catch (err) {
      console.error('Error fetching global master entities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [search, entityTypeFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
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
            <Sparkles size={24} color="var(--cyan-primary)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Master Entity Directory</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Canonical cross-source intelligence entities resolved across all active investigation containers.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.85rem',
          backgroundColor: 'rgba(0, 229, 255, 0.08)',
          border: '1px solid var(--border-cyan)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--cyan-primary)',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          <Layers size={15} />
          <span>PHASE 2 MASTER RESOLUTION LAYER</span>
        </div>
      </div>

      <div className="netra-card" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>Resolved Entities Registry</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Total {entities.length} canonical entity profiles
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search name, ID, alias, investigation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.2rem', fontSize: '0.8rem' }}
              />
              <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select
              className="form-select"
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              style={{ width: '180px', fontSize: '0.8rem' }}
            >
              <option value="">All Categories</option>
              <option value="PERSON">Persons</option>
              <option value="PHONE_NUMBER">Phone Numbers</option>
              <option value="LOCATION">Locations</option>
              <option value="VEHICLE">Vehicles</option>
              <option value="ORGANIZATION">Organizations</option>
              <option value="ACCOUNT_NUMBER">Financial Accounts</option>
              <option value="TRANSACTION">Transactions</option>
              <option value="DEVICE_IDENTIFIER">Device Hardware (IMEI)</option>
              <option value="EVENT">Events</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div className="pulse-indicator" style={{ width: '16px', height: '16px', margin: '0 auto 1rem' }} />
            <p>Querying Master Entity Layer...</p>
          </div>
        ) : entities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No entities found matching search criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="netra-table">
              <thead>
                <tr>
                  <th>Entity ID</th>
                  <th>Canonical Name</th>
                  <th>Category</th>
                  <th>Investigation Container</th>
                  <th>Resolved Aliases</th>
                  <th>Mentions</th>
                  <th>Sources</th>
                  <th>Confidence</th>
                  <th style={{ textAlign: 'right' }}>Dossier</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((ent) => (
                  <tr 
                    key={ent.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedEntityId(ent.entity_id);
                      setIsProfileOpen(true);
                    }}
                  >
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>
                        {ent.entity_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {ent.canonical_name}
                      </div>
                    </td>
                    <td>
                      <EntityTypeBadge type={ent.entity_type} />
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/investigations/${ent.inv_code}`);
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.2rem 0.5rem', color: 'var(--cyan-primary)', fontSize: '0.75rem' }}
                      >
                        <Briefcase size={12} />
                        <span className="mono">{ent.inv_code}</span>
                      </button>
                    </td>
                    <td>
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {ent.aliases_summary || '--'}
                      </div>
                    </td>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {ent.mention_count}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>
                        {ent.source_count}
                      </span>
                    </td>
                    <td>
                      <EntityConfidenceBadge score={ent.confidence_score} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntityId(ent.entity_id);
                          setIsProfileOpen(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '0.35rem' }}
                      >
                        <User size={13} />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Entity Profile Drawer */}
      <EntityProfileModal
        isOpen={isProfileOpen}
        entityId={selectedEntityId}
        onClose={() => {
          setIsProfileOpen(false);
          setSelectedEntityId(null);
        }}
        onEntityUpdated={fetchEntities}
      />
    </div>
  );
}

export default GlobalEntities;
