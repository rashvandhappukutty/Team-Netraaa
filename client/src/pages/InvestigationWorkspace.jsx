import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  UploadCloud, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Activity as ActivityIcon, 
  FileText, 
  Edit, 
  Database, 
  MapPin, 
  Calendar, 
  Download, 
  Loader2, 
  Users, 
  Check, 
  Cpu, 
  Eye, 
  Search, 
  Filter,
  Layers,
  ChevronRight,
  Code2,
  Sparkles,
  User,
  Building2,
  Phone,
  Car,
  CreditCard,
  Zap,
  CheckCircle2,
  XCircle,
  Split,
  Edit3,
  ExternalLink
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import IntegrityBadge from '../components/IntegrityBadge';
import ProcessingBadge from '../components/ProcessingBadge';
import SourceTypeBadge from '../components/SourceTypeBadge';
import EntityTypeBadge from '../components/EntityTypeBadge';
import EntityConfidenceBadge from '../components/EntityConfidenceBadge';
import EntityProfileModal from '../components/EntityProfileModal';
import DataSourceUploadModal from '../components/DataSourceUploadModal';
import InvestigationGraphView from '../components/InvestigationGraphView';
import InvestigationTimeline from '../components/InvestigationTimeline';
import InvestigationLeads from '../components/InvestigationLeads';
import AIAssistant from '../components/AIAssistant';
import { Network, GitMerge, Target, Bot } from 'lucide-react';

export function InvestigationWorkspace({ investigationId, navigate }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [investigation, setInvestigation] = useState(null);
  const [members, setMembers] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [normalizedRecords, setNormalizedRecords] = useState([]);
  const [normalizedCount, setNormalizedCount] = useState(0);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Phase 2: Entity Intelligence State
  const [entities, setEntities] = useState([]);
  const [entityStats, setEntityStats] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [processingEntities, setProcessingEntities] = useState(false);
  const [entitySearch, setEntitySearch] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Normalized search & source filter
  const [normSearch, setNormSearch] = useState('');

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Verify hash state
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyAlert, setVerifyAlert] = useState(null);

  // Selected JSON record modal for inspection
  const [selectedRecordJson, setSelectedRecordJson] = useState(null);

  // Edit details state
  const [editFormData, setEditFormData] = useState({});
  const [savingDetails, setSavingDetails] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
  const [allOfficersList, setAllOfficersList] = useState([]);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      const res = await api.getInvestigationById(investigationId);
      setInvestigation(res.investigation);
      setMembers(res.members || []);
      setDataSources(res.data_sources || []);
      setNormalizedCount(res.normalized_records_count || 0);
      setActivities(res.activities || []);

      setEditFormData({
        title: res.investigation.title,
        investigation_type: res.investigation.investigation_type,
        description: res.investigation.description || '',
        priority: res.investigation.priority,
        status: res.investigation.status,
        start_date: res.investigation.start_date,
        primary_location: res.investigation.primary_location,
        lead_investigator_id: res.investigation.lead_investigator_id
      });

      // Load Phase 2 Entity Data
      loadEntityData(res.investigation.id);

      setError(null);
    } catch (err) {
      console.error('Workspace fetch error:', err);
      setError(err.message || 'Failed to load investigation workspace.');
    } finally {
      setLoading(false);
    }
  };

  const loadEntityData = async (invDbId) => {
    try {
      const [entitiesRes, statsRes, queueRes] = await Promise.all([
        api.getInvestigationEntities(invDbId || investigationId, { search: entitySearch, entity_type: entityTypeFilter }),
        api.getInvestigationEntityStats(invDbId || investigationId),
        api.getInvestigationReviewQueue(invDbId || investigationId)
      ]);

      setEntities(entitiesRes.entities || []);
      setEntityStats(statsRes);
      setReviewQueue(queueRes.queue || []);
    } catch (err) {
      console.warn('Entity data load warning:', err.message);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
    api.getInvestigators().then(r => setAllOfficersList(r.investigators || [])).catch(() => {});
  }, [investigationId]);

  useEffect(() => {
    if (activeTab === 'entities') {
      api.getInvestigationEntities(investigation?.id || investigationId, { search: entitySearch, entity_type: entityTypeFilter })
        .then(res => setEntities(res.entities || []))
        .catch(() => {});
    }
    if (activeTab === 'review') {
      api.getInvestigationReviewQueue(investigation?.id || investigationId)
        .then(res => setReviewQueue(res.queue || []))
        .catch(() => {});
    }
    if (activeTab === 'normalized') {
      api.getNormalizedRecordsByInvestigation(investigation?.id || investigationId, { search: normSearch })
        .then(res => setNormalizedRecords(res.records || []))
        .catch(() => {});
    }
  }, [entitySearch, entityTypeFilter, normSearch, activeTab]);

  const handleProcessEntities = async () => {
    try {
      setProcessingEntities(true);
      const res = await api.processInvestigationEntities(investigation.id);
      await loadEntityData(investigation.id);
      setActiveTab('entities');
      // Refresh activities
      const actRes = await api.getInvestigationActivity(investigationId);
      setActivities(actRes.activities || []);
    } catch (err) {
      alert(err.message || 'Failed to process AI entity extraction.');
    } finally {
      setProcessingEntities(false);
    }
  };

  const handleConfirmMerge = async (item) => {
    try {
      await api.confirmEntityMerge({
        mention_id: item.mention_db_id,
        master_entity_id: item.master_entity_id,
        notes: `Investigator confirmed merge into ${item.candidate_master_name}`
      });
      await loadEntityData(investigation.id);
    } catch (err) {
      alert(err.message || 'Failed to confirm merge.');
    }
  };

  const handleKeepSeparate = async (item) => {
    try {
      await api.keepEntitySeparate({
        mention_id: item.mention_db_id,
        canonical_name: item.canonical_candidate,
        notes: 'Investigator designated as independent entity.'
      });
      await loadEntityData(investigation.id);
    } catch (err) {
      alert(err.message || 'Failed to keep separate.');
    }
  };

  const handleRejectMention = async (item) => {
    try {
      await api.rejectEntityMention({
        mention_id: item.mention_db_id,
        notes: 'False positive extraction rejected by investigator.'
      });
      await loadEntityData(investigation.id);
    } catch (err) {
      alert(err.message || 'Failed to reject mention.');
    }
  };

  const handleVerifyIntegrity = async (ds) => {
    try {
      setVerifyingId(ds.id);
      setVerifyAlert(null);
      const res = await api.verifyDataSourceIntegrity(ds.id);

      setDataSources(prev => prev.map(item => item.id === ds.id ? { ...item, integrity_status: res.integrity_status } : item));
      setVerifyAlert({
        data_source_id: ds.data_source_id,
        isMatch: res.verified,
        recalculated_hash: res.recalculated_hash,
        original_hash: res.original_hash,
        timestamp: res.timestamp
      });

      const actRes = await api.getInvestigationActivity(investigationId);
      setActivities(actRes.activities || []);
    } catch (err) {
      setVerifyAlert({
        data_source_id: ds.data_source_id,
        isMatch: false,
        error: err.message || 'Verification failed.'
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDetailsSave = async (e) => {
    e.preventDefault();
    try {
      setSavingDetails(true);
      setSaveSuccessMsg(null);
      const res = await api.updateInvestigation(investigation.id, editFormData);
      setInvestigation(res.investigation);
      setSaveSuccessMsg('Investigation parameters updated and recorded in the audit trail.');
      const actRes = await api.getInvestigationActivity(investigationId);
      setActivities(actRes.activities || []);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update investigation.');
    } finally {
      setSavingDetails(false);
    }
  };

  if (loading && !investigation) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
        <div className="pulse-indicator" style={{ width: '20px', height: '20px', margin: '0 auto 1rem' }} />
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>Decrypting Investigation Enclave...</p>
      </div>
    );
  }

  if (error && !investigation) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <div className="netra-card" style={{ borderColor: 'var(--border-crimson)', padding: '2.5rem' }}>
          <ShieldAlert size={48} color="var(--crimson-critical)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--crimson-critical)' }}>Investigation Container Not Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.75rem 0 1.5rem' }}>{error}</p>
          <button onClick={() => navigate('/investigations')} className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Return to Registry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/investigations')}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--text-secondary)', padding: '0.4rem 0.6rem' }}
          >
            <ArrowLeft size={16} />
            <span>Investigations</span>
          </button>
          <span style={{ color: 'var(--text-dim)' }}>/</span>
          {/* Prominent Investigation ID */}
          <div className="mono" style={{
            padding: '0.3rem 0.85rem',
            backgroundColor: 'var(--cyan-subtle)',
            border: '1px solid var(--border-cyan)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--cyan-primary)',
            boxShadow: '0 0 12px var(--cyan-glow)'
          }}>
            {investigation.investigation_id}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleProcessEntities}
            disabled={processingEntities}
            className="btn btn-primary btn-sm"
            style={{
              background: 'linear-gradient(135deg, #00e5ff 0%, #651fff 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              gap: '0.45rem',
              boxShadow: '0 0 15px rgba(0, 229, 255, 0.35)'
            }}
          >
            {processingEntities ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            <span>{processingEntities ? 'Extracting & Resolving Entities...' : 'Process Entity Intelligence'}</span>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ gap: '0.45rem' }}
          >
            <UploadCloud size={15} />
            <span>Ingest Source</span>
          </button>
        </div>
      </div>

      {/* Investigation Hero Banner */}
      <div className="netra-card" style={{
        padding: '1.75rem',
        background: 'linear-gradient(135deg, rgba(14, 21, 38, 0.95) 0%, rgba(19, 31, 55, 0.8) 100%)',
        border: '1px solid var(--border-medium)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <StatusBadge status={investigation.status} />
              <PriorityBadge priority={investigation.priority} />
              <span className="badge" style={{ backgroundColor: 'rgba(101, 31, 255, 0.15)', color: '#a78bfa', border: '1px solid rgba(101, 31, 255, 0.3)' }}>
                {investigation.investigation_type}
              </span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2, marginBottom: '0.5rem' }}>
              {investigation.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} color="var(--text-dim)" />
                <span>{investigation.primary_location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} color="var(--text-dim)" />
                <span>Initiated: {investigation.start_date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={14} color="var(--text-dim)" />
                <span>Lead: <strong style={{ color: 'var(--text-primary)' }}>{investigation.lead_investigator_name}</strong> ({investigation.lead_badge})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Tabs Navigation */}
      <div className="tabs-nav">
        <button
          onClick={() => setActiveTab('overview')}
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <FileText size={17} />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
        >
          <Database size={17} />
          <span>Data Sources ({dataSources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('normalized')}
          className={`tab-btn ${activeTab === 'normalized' ? 'active' : ''}`}
        >
          <Cpu size={17} />
          <span>Normalized Data ({normalizedCount})</span>
        </button>

        {/* Phase 2: Entity Intelligence Tab */}
        <button
          onClick={() => setActiveTab('entities')}
          className={`tab-btn ${activeTab === 'entities' ? 'active' : ''}`}
          style={{ position: 'relative' }}
        >
          <Sparkles size={17} color={activeTab === 'entities' ? 'var(--cyan-primary)' : 'var(--text-secondary)'} />
          <span>Entity Intelligence ({entityStats?.total_master_entities ?? 0})</span>
        </button>

        {/* Phase 2: Entity Review Queue Tab */}
        <button
          onClick={() => setActiveTab('review')}
          className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
        >
          <Layers size={17} />
          <span>Review Queue</span>
          {reviewQueue.length > 0 && (
            <span style={{
              marginLeft: '0.35rem',
              padding: '0.1rem 0.45rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(245, 158, 11, 0.25)',
              border: '1px solid var(--border-amber)',
              color: '#fbbf24',
              fontSize: '0.7rem',
              fontWeight: 800
            }}>
              {reviewQueue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('graph')}
          className={`tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
        >
          <Network size={17} />
          <span>Knowledge Graph</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
        >
          <Clock size={17} />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
        >
          <Target size={17} />
          <span>Investigative Leads</span>
        </button>

        <button
          onClick={() => setActiveTab('assistant')}
          className={`tab-btn ${activeTab === 'assistant' ? 'active' : ''}`}
        >
          <Bot size={17} />
          <span>AI Assistant</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
        >
          <ActivityIcon size={17} />
          <span>Activity Log ({activities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('details')}
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
        >
          <Edit size={17} />
          <span>Details</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="netra-card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.85rem' }}>Intelligence Objective & Hypothesis</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {investigation.description || 'No detailed background narrative entered for this container.'}
              </p>
            </div>

            {/* Ingestion Telemetry Preview */}
            <div className="netra-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem' }}>Multi-Source Ingestion Pipeline</h3>
                <button onClick={() => setActiveTab('sources')} className="btn btn-ghost btn-sm" style={{ color: 'var(--cyan-primary)' }}>
                  View All Sources ({dataSources.length})
                </button>
              </div>

              {dataSources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>No data sources attached yet.</p>
                  <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
                    <UploadCloud size={14} />
                    <span>Ingest First Intelligence Source</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {dataSources.map(ds => (
                    <div
                      key={ds.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-input)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)', fontWeight: 700 }}>
                          {ds.data_source_id}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {ds.file_name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                            <span>{(ds.file_size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span style={{ color: 'var(--emerald-verified)', fontWeight: 600 }}>{ds.record_count} records extracted</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <SourceTypeBadge type={ds.source_type} />
                        <ProcessingBadge status={ds.processing_status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="netra-card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Investigation Parameters</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.825rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Investigation Type</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{investigation.investigation_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Master Entities</span>
                  <span style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>{entityStats?.total_master_entities ?? 0} Resolved</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Normalized Records</span>
                  <span style={{ fontWeight: 700, color: 'var(--emerald-verified)' }}>{normalizedCount} Ready for AI</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Traceability Integrity</span>
                  <span style={{ color: 'var(--emerald-verified)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldCheck size={14} />
                    <span>LOCKED & AUDITED</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="netra-card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} color="var(--cyan-primary)" />
                <span>Assigned Unit</span>
              </h3>

              <div style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid var(--border-cyan)',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cyan-primary)', letterSpacing: '0.05em' }}>
                  Lead Officer
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem' }}>
                  {investigation.lead_investigator_name}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                  Badge: {investigation.lead_badge} • {investigation.lead_dept || 'Cyber Directorate'}
                </div>
              </div>

              {members.filter(m => m.id !== investigation.lead_investigator_id).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    Assisting Officers
                  </div>
                  {members.filter(m => m.id !== investigation.lead_investigator_id).map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{m.name}</span>
                      <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.badge_number}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATA SOURCES */}
      {activeTab === 'sources' && (
        <div className="netra-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Multi-Source Intelligence Artifacts</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Preserved original raw files with cryptographic SHA-256 seals.
              </p>
            </div>
            <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary">
              <UploadCloud size={16} />
              <span>Ingest New Source</span>
            </button>
          </div>

          {verifyAlert && (
            <div style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              backgroundColor: verifyAlert.isMatch ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 23, 68, 0.12)',
              border: `1px solid ${verifyAlert.isMatch ? 'var(--border-emerald)' : 'var(--border-crimson)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {verifyAlert.isMatch ? <ShieldCheck size={24} color="var(--emerald-verified)" /> : <ShieldAlert size={24} color="var(--crimson-critical)" />}
                  <div>
                    <h4 style={{ color: verifyAlert.isMatch ? 'var(--emerald-verified)' : 'var(--crimson-critical)', fontSize: '0.95rem' }}>
                      {verifyAlert.isMatch ? `Source Integrity Verified: ${verifyAlert.data_source_id}` : `INTEGRITY ALERT: Tamper Detected`}
                    </h4>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {verifyAlert.isMatch ? 'Original file bytes on disk match the recorded master SHA-256 hash.' : 'Physical file differs from recorded hash.'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setVerifyAlert(null)} className="btn btn-ghost btn-sm">Dismiss</button>
              </div>
            </div>
          )}

          {dataSources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-medium)' }}>
              <Database size={44} color="var(--text-dim)" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>No Data Sources Ingested</h4>
              <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                <UploadCloud size={16} />
                <span>Ingest First Intelligence Source</span>
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="netra-table">
                <thead>
                  <tr>
                    <th>Data Source ID</th>
                    <th>Source File</th>
                    <th>Source Type</th>
                    <th>Records</th>
                    <th>Integrity</th>
                    <th>Processing Status</th>
                    <th>Officer</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dataSources.map((ds) => (
                    <tr key={ds.id}>
                      <td>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>
                          {ds.data_source_id}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ds.file_name}</div>
                        <div className="mono" style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                          SHA-256: {ds.sha256_hash.substring(0, 20)}...
                        </div>
                      </td>
                      <td>
                        <SourceTypeBadge type={ds.source_type} />
                      </td>
                      <td>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {ds.record_count}
                        </span>
                      </td>
                      <td>
                        <IntegrityBadge status={ds.integrity_status} />
                      </td>
                      <td>
                        <ProcessingBadge status={ds.processing_status} />
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>{ds.uploader_name}</div>
                        <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{ds.uploader_badge}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleVerifyIntegrity(ds)}
                            disabled={verifyingId === ds.id}
                            className="btn btn-emerald btn-sm"
                            title="Verify original file SHA-256 hash"
                          >
                            {verifyingId === ds.id ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                            <span>Verify</span>
                          </button>
                          <a
                            href={api.getDataSourceDownloadUrl(ds.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            title="Download Preserved Original File"
                          >
                            <Download size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NORMALIZED DATA */}
      {activeTab === 'normalized' && (
        <div className="netra-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={20} color="var(--emerald-verified)" />
                <h3 style={{ fontSize: '1.2rem' }}>Unified Intelligence Records (Ready for AI Entity Extraction)</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Normalized heterogeneous records with complete source traceability and original offsets.
              </p>
            </div>

            <div style={{ position: 'relative', width: '280px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search records, entities, offsets..."
                value={normSearch}
                onChange={(e) => setNormSearch(e.target.value)}
                style={{ paddingLeft: '2.2rem', fontSize: '0.8rem' }}
              />
              <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {normalizedRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No normalized records found.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="netra-table">
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Source Type</th>
                    <th>Traceability Reference</th>
                    <th>Extracted Raw / Normalized Content</th>
                    <th>AI Status</th>
                    <th style={{ textAlign: 'right' }}>Structured Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedRecords.map((rec) => (
                    <tr key={rec.id}>
                      <td>
                        <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyan-primary)' }}>
                          {rec.record_id}
                        </span>
                      </td>
                      <td>
                        <SourceTypeBadge type={rec.source_type} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="mono" style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.45rem',
                            backgroundColor: 'rgba(0, 229, 255, 0.1)',
                            border: '1px solid var(--border-cyan)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--cyan-primary)'
                          }}>
                            {rec.source_code}
                          </span>
                          <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {rec.original_record_reference}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-primary)',
                          maxWidth: '420px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {rec.raw_content}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(0, 230, 118, 0.15)', color: 'var(--emerald-verified)', border: '1px solid var(--border-emerald)' }}>
                          READY_FOR_AI
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRecordJson(rec)}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '0.35rem' }}
                        >
                          <Code2 size={13} />
                          <span>View JSON</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ENTITY INTELLIGENCE (PHASE 2 MASTER ENTITIES) */}
      {activeTab === 'entities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Entity Statistics Strip */}
          <div className="netra-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.725rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cyan-primary)' }}>
                  Phase 2 AI Entity Intelligence Breakdown
                </span>
                <h3 style={{ fontSize: '1.15rem', marginTop: '0.15rem' }}>
                  Extracted & Resolved Master Entities
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Total Mentions: <strong style={{ color: 'var(--text-primary)' }}>{entityStats?.total_mentions ?? 0}</strong>
                </span>
                <button
                  onClick={handleProcessEntities}
                  disabled={processingEntities}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.4rem' }}
                >
                  {processingEntities ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  <span>Re-extract & Resolve</span>
                </button>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.75rem'
            }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <User size={16} color="#00e5ff" style={{ margin: '0 auto 0.25rem' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{entityStats?.type_breakdown?.PERSON ?? 0}</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Persons</div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <Phone size={16} color="#fbbf24" style={{ margin: '0 auto 0.25rem' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{entityStats?.type_breakdown?.PHONE_NUMBER ?? 0}</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Phones</div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <MapPin size={16} color="#34d399" style={{ margin: '0 auto 0.25rem' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{entityStats?.type_breakdown?.LOCATION ?? 0}</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Locations</div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <Car size={16} color="#fb923c" style={{ margin: '0 auto 0.25rem' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{entityStats?.type_breakdown?.VEHICLE ?? 0}</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Vehicles</div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <Building2 size={16} color="#c084fc" style={{ margin: '0 auto 0.25rem' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{entityStats?.type_breakdown?.ORGANIZATION ?? 0}</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Organizations</div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <CreditCard size={16} color="#fb7185" style={{ margin: '0 auto 0.25rem' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{entityStats?.type_breakdown?.ACCOUNT_NUMBER ?? 0}</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Accounts</div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <Zap size={16} color="#f87171" style={{ margin: '0 auto 0.25rem' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{entityStats?.type_breakdown?.EVENT ?? 0}</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Events</div>
              </div>
            </div>
          </div>

          {/* Master Entities Registry */}
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
                <h3 style={{ fontSize: '1.15rem' }}>Resolved Master Entity Layer</h3>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Showing {entities.length} canonical entities with cross-source references
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ position: 'relative', width: '240px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search name, ID, aliases..."
                    value={entitySearch}
                    onChange={(e) => setEntitySearch(e.target.value)}
                    style={{ paddingLeft: '2.2rem', fontSize: '0.8rem' }}
                  />
                  <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>

                <select
                  className="form-select"
                  value={entityTypeFilter}
                  onChange={(e) => setEntityTypeFilter(e.target.value)}
                  style={{ width: '170px', fontSize: '0.8rem' }}
                >
                  <option value="">All Entity Types</option>
                  <option value="PERSON">Persons</option>
                  <option value="PHONE_NUMBER">Phone Numbers</option>
                  <option value="LOCATION">Locations</option>
                  <option value="VEHICLE">Vehicles</option>
                  <option value="ORGANIZATION">Organizations</option>
                  <option value="ACCOUNT_NUMBER">Financial Accounts</option>
                  <option value="TRANSACTION">Transactions</option>
                  <option value="DEVICE_IDENTIFIER">Device Hardware (IMEI)</option>
                  <option value="EVENT">Events</option>
                  <option value="DATE">Dates</option>
                </select>
              </div>
            </div>

            {entities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-lg)' }}>
                <Sparkles size={40} color="var(--cyan-primary)" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>No Entities Extracted Yet</h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0.25rem auto 1.25rem' }}>
                  Click below to trigger the AI Extraction and Entity Resolution Engine across all normalized records.
                </p>
                <button
                  onClick={handleProcessEntities}
                  disabled={processingEntities}
                  className="btn btn-primary"
                >
                  {processingEntities ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  <span>Run AI Entity Extraction Engine</span>
                </button>
              </div>
            ) : (
              <div className="table-container">
                <table className="netra-table">
                  <thead>
                    <tr>
                      <th>Entity ID</th>
                      <th>Canonical Entity Name</th>
                      <th>Category</th>
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
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {ent.canonical_name}
                          </div>
                        </td>
                        <td>
                          <EntityTypeBadge type={ent.entity_type} />
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
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>mentions</span>
                        </td>
                        <td>
                          <span className="mono" style={{ fontWeight: 700, color: 'var(--cyan-primary)' }}>
                            {ent.source_count}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>sources</span>
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
        </div>
      )}

      {/* TAB 5: ENTITY REVIEW QUEUE (PHASE 2 INVESTIGATOR WORKFLOW) */}
      {activeTab === 'review' && (
        <div className="netra-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={20} color="#fbbf24" />
                <h3 style={{ fontSize: '1.2rem' }}>Investigator Entity Review Queue</h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Human-in-the-loop review for ambiguous extractions, potential duplicate entities, and medium confidence matches.
              </p>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Pending Items: <strong style={{ color: '#fbbf24' }}>{reviewQueue.length}</strong>
            </div>
          </div>

          {reviewQueue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-lg)' }}>
              <CheckCircle2 size={40} color="var(--emerald-verified)" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1.1rem', color: 'var(--emerald-verified)' }}>Review Queue Cleared</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0.25rem auto' }}>
                All extracted entity mentions in this investigation have been resolved or confirmed.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {reviewQueue.map((item) => (
                <div
                  key={item.mention_db_id}
                  style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-amber)',
                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <EntityTypeBadge type={item.entity_type} />
                      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.entity_mention_id}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>•</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        From: <strong style={{ color: 'var(--text-primary)' }}>{item.source_file_name}</strong> ({item.source_reference})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid var(--border-amber)' }}>
                        Potential Match ({Math.round((item.resolution_score || 0.8) * 100)}%)
                      </span>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    {/* Left: Newly Extracted Mention */}
                    <div style={{ padding: '0.85rem 1rem', backgroundColor: '#050810', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--cyan-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        Newly Extracted Mention
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                        "{item.original_value}"
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Normalized Candidate: <span className="mono" style={{ color: 'var(--cyan-primary)' }}>{item.canonical_candidate}</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.4rem' }}>
                        "{item.source_context}"
                      </div>
                    </div>

                    {/* Right: Candidate Master Entity */}
                    <div style={{ padding: '0.85rem 1rem', backgroundColor: '#050810', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--emerald-verified)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        Existing Master Entity Candidate
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                        {item.candidate_master_name || 'No Prior Match'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Master ID: <span className="mono" style={{ color: 'var(--emerald-verified)' }}>{item.candidate_master_code || '--'}</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.4rem' }}>
                        Match Rule: {item.resolution_method || 'Fuzzy Lexical Similarity'}
                      </div>
                    </div>
                  </div>

                  {/* Investigator Action Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                    <button
                      onClick={() => handleRejectMention(item)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--crimson-critical)' }}
                    >
                      <XCircle size={14} />
                      <span>Reject Extraction</span>
                    </button>

                    <button
                      onClick={() => handleKeepSeparate(item)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Split size={14} />
                      <span>Keep as Separate Entity</span>
                    </button>

                    {item.master_entity_id && (
                      <button
                        onClick={() => handleConfirmMerge(item)}
                        className="btn btn-emerald btn-sm"
                        style={{ fontWeight: 700 }}
                      >
                        <Check size={14} />
                        <span>Confirm Merge into {item.candidate_master_name}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: ACTIVITY TIMELINE */}
      {activeTab === 'activity' && (
        <div className="netra-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Chain of Custody & Master Ingestion Stream</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Immutable write-once custody trail for Investigation {investigation.investigation_id}.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--emerald-verified)', backgroundColor: 'rgba(0, 230, 118, 0.1)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-emerald)' }}>
              <ShieldCheck size={14} />
              <span>CRYPTOGRAPHICALLY LOCKED LOGS</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activities.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1.25rem',
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ minWidth: '130px' }}>
                  <div className="mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {act.timestamp ? act.timestamp.substring(11, 19) : '--'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {act.timestamp ? act.timestamp.substring(0, 10) : ''}
                  </div>
                </div>

                <div style={{ minWidth: '160px' }}>
                  <span className="badge" style={{ backgroundColor: 'var(--cyan-subtle)', color: 'var(--cyan-primary)', border: '1px solid var(--border-cyan)' }}>
                    {act.action}
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {act.details}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Officer: <strong>{act.user_name}</strong> ({act.badge_number}) • IP: <span className="mono">{act.ip_address || '127.0.0.1'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: DETAILS & PARAMETERS */}
      {activeTab === 'details' && (
        <div className="netra-card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Update Investigation Parameters</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              All modifications are recorded permanently in the immutable audit log.
            </p>
          </div>

          {saveSuccessMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.25rem', backgroundColor: 'rgba(0, 230, 118, 0.1)', border: '1px solid var(--border-emerald)', borderRadius: 'var(--radius-md)', color: 'var(--emerald-verified)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <Check size={18} />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleDetailsSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label required">Investigation Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Status</label>
                <select
                  className="form-select"
                  value={editFormData.status || 'ACTIVE'}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="UNDER_INVESTIGATION">Under Investigation</option>
                  <option value="PENDING">Pending</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label required">Investigation Type</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.investigation_type || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, investigation_type: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Priority Level</label>
                <select
                  className="form-select"
                  value={editFormData.priority || 'MEDIUM'}
                  onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                  required
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Lead Officer</label>
                <select
                  className="form-select"
                  value={editFormData.lead_investigator_id || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, lead_investigator_id: parseInt(e.target.value, 10) })}
                  required
                >
                  {allOfficersList.map(off => (
                    <option key={off.id} value={off.id}>{off.name} ({off.badge_number})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Primary Location</label>
              <input
                type="text"
                className="form-input"
                value={editFormData.primary_location || ''}
                onChange={(e) => setEditFormData({ ...editFormData, primary_location: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Investigation Background & Notes</label>
              <textarea
                className="form-textarea"
                rows={5}
                value={editFormData.description || ''}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={savingDetails}>
                {savingDetails ? <span>Saving...</span> : <span>Save & Record Delta</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW TABS CONTENT */}
      {activeTab === 'graph' && (
        <div className="netra-card" style={{ padding: '1rem' }}>
          <InvestigationGraphView 
            investigationId={investigation.id} 
            onNodeClick={(eid) => { setSelectedEntityId(eid); setIsProfileOpen(true); }}
          />
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="netra-card" style={{ padding: '1.5rem' }}>
          <InvestigationTimeline investigationId={investigation.id} />
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="netra-card" style={{ padding: '1.5rem' }}>
          <InvestigationLeads investigationId={investigation.id} />
        </div>
      )}

      {activeTab === 'assistant' && (
        <div className="netra-card" style={{ padding: '1rem' }}>
          <AIAssistant investigationId={investigation.id} />
        </div>
      )}

      {/* JSON Record Viewer Modal */}
      {selectedRecordJson && (
        <div className="modal-overlay" onClick={() => setSelectedRecordJson(null)}>
          <div className="modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Normalized Record Payload</h3>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--cyan-primary)' }}>
                  {selectedRecordJson.record_id} • {selectedRecordJson.original_record_reference}
                </div>
              </div>
              <button onClick={() => setSelectedRecordJson(null)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <span className="form-label">Raw Ingestion Stream</span>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}>
                  {selectedRecordJson.raw_content}
                </div>
              </div>

              <div>
                <span className="form-label">Phase 2 AI Normalization Structure</span>
                <pre style={{
                  padding: '1rem',
                  backgroundColor: '#050810',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-cyan)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.775rem',
                  color: '#38bdf8',
                  maxHeight: '280px',
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(selectedRecordJson.normalized_content, null, 2)}
                </pre>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedRecordJson(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Entity Profile Drawer / Modal */}
      <EntityProfileModal
        isOpen={isProfileOpen}
        entityId={selectedEntityId}
        onClose={() => {
          setIsProfileOpen(false);
          setSelectedEntityId(null);
        }}
        onEntityUpdated={() => loadEntityData(investigation.id)}
      />

      {/* Intake Data Source Modal */}
      <DataSourceUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        investigationId={investigation.id}
        investigationCode={investigation.investigation_id}
        onUploadSuccess={() => {
          fetchWorkspaceData();
        }}
      />
    </div>
  );
}

export default InvestigationWorkspace;
