import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  X, 
  FileText, 
  PhoneCall, 
  CreditCard, 
  Eye, 
  UserX, 
  Globe, 
  ShieldCheck, 
  AlertTriangle,
  Loader2,
  CheckCircle2,
  FileCheck2,
  Cpu
} from 'lucide-react';
import { api } from '../api/client';

export function DataSourceUploadModal({ investigationId, investigationCode, isOpen, onClose, onUploadSuccess }) {
  const [sourceType, setSourceType] = useState('FIR_POLICE_REPORT');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const SOURCE_TYPES = [
    { id: 'FIR_POLICE_REPORT', label: 'FIR / Police Report', icon: FileText, formats: 'PDF, DOCX, TXT', color: '#00e5ff' },
    { id: 'CDR', label: 'Call Detail Records (CDR)', icon: PhoneCall, formats: 'CSV, XLSX', color: '#a78bfa' },
    { id: 'FINANCIAL_TRANSACTIONS', label: 'Financial Transactions', icon: CreditCard, formats: 'CSV, XLSX', color: '#ffb300' },
    { id: 'SURVEILLANCE_REPORT', label: 'Surveillance / Field Intel', icon: Eye, formats: 'PDF, DOCX, TXT', color: '#00e676' },
    { id: 'CRIMINAL_HISTORY', label: 'Criminal History Data', icon: UserX, formats: 'CSV, XLSX, JSON', color: '#ff1744' },
    { id: 'SOCIAL_MEDIA_INTEL', label: 'Digital / OSINT Intelligence', icon: Globe, formats: 'CSV, JSON, TXT', color: '#38bdf8' }
  ];

  const currentTypeConfig = SOURCE_TYPES.find(t => t.id === sourceType) || SOURCE_TYPES[0];

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    
    // Check format compatibility
    let isCompatible = true;
    if (['FIR_POLICE_REPORT', 'SURVEILLANCE_REPORT'].includes(sourceType) && !['pdf', 'docx', 'doc', 'txt', 'log'].includes(ext)) {
      isCompatible = false;
    } else if (['CDR', 'FINANCIAL_TRANSACTIONS'].includes(sourceType) && !['csv', 'tsv', 'xlsx', 'xls', 'txt'].includes(ext)) {
      isCompatible = false;
    } else if (sourceType === 'CRIMINAL_HISTORY' && !['csv', 'xlsx', 'json', 'txt'].includes(ext)) {
      isCompatible = false;
    }

    if (!isCompatible) {
      setError(`Format mismatch: Selected source type (${currentTypeConfig.label}) requires ${currentTypeConfig.formats}. Got .${ext}`);
      setFile(null);
      return;
    }

    setFile({
      raw: selectedFile,
      name: selectedFile.name,
      size: selectedFile.size,
      mime: selectedFile.type || 'application/octet-stream',
      ext: ext.toUpperCase()
    });
    setError(null);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drop an intelligence file to ingest.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = new FormData();
      payload.append('file', file.raw);
      payload.append('source_type', sourceType);

      const response = await api.uploadDataSource(investigationId, payload);
      setUploadResult(response.data_source);

      if (onUploadSuccess) {
        onUploadSuccess(response.data_source);
      }
    } catch (err) {
      setError(err.message || 'Failed to ingest and normalize data source.');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setError(null);
    setUploadResult(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={resetModal}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(0, 229, 255, 0.15)',
              color: 'var(--cyan-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UploadCloud size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Multi-Source Intelligence Ingestion</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Target Container: {investigationCode || investigationId}
              </div>
            </div>
          </div>
          <button onClick={resetModal} className="btn btn-ghost btn-sm">
            <X size={18} />
          </button>
        </div>

        {uploadResult ? (
          /* Success Screen */
          <div className="modal-body">
            <div style={{
              textAlign: 'center',
              padding: '1.75rem 1rem',
              backgroundColor: 'rgba(0, 230, 118, 0.08)',
              border: '1px solid var(--border-emerald)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 230, 118, 0.18)',
                color: 'var(--emerald-verified)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem'
              }}>
                <ShieldCheck size={28} />
              </div>
              <h4 style={{ color: 'var(--emerald-verified)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                Source Ingested & Normalized
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                Original source preserved read-only. Extracted records structured and stamped with <strong style={{ color: 'var(--emerald-verified)' }}>READY_FOR_AI</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assigned Data Source ID</span>
                <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cyan-primary)' }}>
                  {uploadResult.data_source_id}
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Extracted Records</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {uploadResult.record_count} records ready for AI analysis
                </span>
              </div>

              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  SHA-256 Original Master Hash
                </div>
                <div className="mono" style={{ fontSize: '0.725rem', color: 'var(--emerald-verified)', wordBreak: 'break-all' }}>
                  {uploadResult.sha256_hash}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={resetModal} className="btn btn-primary">
                <Cpu size={16} />
                <span>Open Workspace Normalized Data</span>
              </button>
            </div>
          </div>
        ) : (
          /* Intake Form */
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--crimson-subtle)',
                  border: '1px solid var(--border-crimson)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--crimson-critical)',
                  fontSize: '0.825rem',
                  marginBottom: '1.25rem'
                }}>
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Select Source Type */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label required" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  1. Select Source Intelligence Type
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.65rem'
                }}>
                  {SOURCE_TYPES.map(st => {
                    const isSelected = sourceType === st.id;
                    const Icon = st.icon;
                    return (
                      <div
                        key={st.id}
                        onClick={() => {
                          setSourceType(st.id);
                          setFile(null); // Clear selected file if changing source type
                          setError(null);
                        }}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: isSelected ? 'var(--cyan-subtle)' : 'var(--bg-input)',
                          border: `1px solid ${isSelected ? 'var(--border-cyan)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.65rem',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <div style={{
                          padding: '0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.2)' : 'var(--bg-surface)',
                          color: st.color
                        }}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: isSelected ? 'var(--cyan-primary)' : 'var(--text-primary)' }}>
                            {st.label}
                          </div>
                          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {st.formats}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Upload File */}
              <label className="form-label required" style={{ marginBottom: '0.5rem', display: 'block' }}>
                2. Upload Source File ({currentTypeConfig.formats})
              </label>

              {!file ? (
                <div
                  className={`dropzone ${isDragging ? 'active' : ''}`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ marginBottom: '1rem' }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--cyan-subtle)',
                    color: 'var(--cyan-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UploadCloud size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Drag & drop {currentTypeConfig.label} file
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      or click to browse local filesystem
                    </div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    Permitted extensions: {currentTypeConfig.formats} (Max 100MB)
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(0, 229, 255, 0.12)',
                      color: currentTypeConfig.color
                    }}>
                      <currentTypeConfig.icon size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span style={{ color: currentTypeConfig.color, fontWeight: 600 }}>{file.ext}</span>
                        <span>•</span>
                        <span className="mono">{file.mime}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="btn btn-ghost btn-sm"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Preservation Notice */}
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(0, 229, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4
              }}>
                <strong style={{ color: 'var(--cyan-primary)' }}>Preservation Guarantee:</strong> The original uploaded file is permanently stored read-only with a SHA-256 cryptographic master seal. Normalized output will reference original record offsets.
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={resetModal} className="btn btn-secondary" disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || !file}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Extracting & Normalizing...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 size={16} />
                    <span>Ingest, Extract & Normalize</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default DataSourceUploadModal;
