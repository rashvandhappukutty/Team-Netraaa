import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Music, 
  ShieldCheck, 
  AlertTriangle,
  Loader2,
  FileCheck
} from 'lucide-react';
import { api } from '../api/client';

export function EvidenceUploadModal({ caseId, caseCode, isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    evidence_source: 'Field Forensics Unit',
    date_collected: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const detectCategory = (mime = '', ext = '') => {
    const cleanExt = ext.toLowerCase().replace('.', '');
    const cleanMime = mime.toLowerCase();

    if (cleanMime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'bmp', 'svg'].includes(cleanExt)) {
      return { type: 'IMAGE', icon: ImageIcon, color: '#38bdf8' };
    }
    if (cleanMime.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(cleanExt)) {
      return { type: 'VIDEO', icon: VideoIcon, color: '#a78bfa' };
    }
    if (cleanMime.startsWith('audio/') || ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'].includes(cleanExt)) {
      return { type: 'AUDIO', icon: Music, color: '#f472b6' };
    }
    return { type: 'DOCUMENT', icon: FileText, color: '#00e5ff' };
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop();
    const categoryInfo = detectCategory(selectedFile.type, ext);

    setFile({
      raw: selectedFile,
      name: selectedFile.name,
      size: selectedFile.size,
      mime: selectedFile.type || 'application/octet-stream',
      ext: ext.toUpperCase(),
      category: categoryInfo.type,
      categoryInfo
    });

    if (!formData.title) {
      // Auto-populate default title from filename without extension
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
      setFormData(prev => ({ ...prev, title: baseName.replace(/[_-]/g, ' ') }));
    }
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
      setError('Please select or drop an evidence file to upload.');
      return;
    }
    if (!formData.title.trim()) {
      setError('Evidence title is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = new FormData();
      payload.append('file', file.raw);
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('evidence_source', formData.evidence_source);
      payload.append('date_collected', formData.date_collected);

      const response = await api.uploadEvidence(caseId, payload);
      setUploadResult(response.evidence);

      if (onUploadSuccess) {
        onUploadSuccess(response.evidence);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload evidence file.');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setFormData({
      title: '',
      description: '',
      evidence_source: 'Field Forensics Unit',
      date_collected: new Date().toISOString().split('T')[0]
    });
    setError(null);
    setUploadResult(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={resetModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(0, 229, 255, 0.15)',
              color: 'var(--cyan-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Upload size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Upload Digital Evidence</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Target Case: {caseCode || caseId}
              </div>
            </div>
          </div>
          <button onClick={resetModal} className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {uploadResult ? (
          /* Success Screen with SHA-256 Hash Display */
          <div className="modal-body">
            <div style={{
              textAlign: 'center',
              padding: '1.5rem 1rem',
              backgroundColor: 'rgba(0, 230, 118, 0.06)',
              border: '1px solid var(--border-emerald)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 230, 118, 0.15)',
                color: 'var(--emerald-verified)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <ShieldCheck size={28} />
              </div>
              <h4 style={{ color: 'var(--emerald-verified)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                Evidence Cryptographically Registered
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                Item assigned unique ID and locked into immutable chain of custody.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assigned Evidence ID</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)' }}>
                  {uploadResult.evidence_id}
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
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Evidence Category</span>
                <span className="badge" style={{ backgroundColor: 'rgba(0, 229, 255, 0.12)', color: 'var(--cyan-primary)' }}>
                  {uploadResult.evidence_type}
                </span>
              </div>

              <div style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  SHA-256 Cryptographic Integrity Hash
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--emerald-verified)',
                  wordBreak: 'break-all',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {uploadResult.sha256_hash}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={resetModal} className="btn btn-primary">
                <FileCheck size={16} />
                <span>Return to Workspace</span>
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

              {/* Drag & Drop Box */}
              {!file ? (
                <div
                  className={`dropzone ${isDragging ? 'active' : ''}`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--cyan-subtle)',
                    color: 'var(--cyan-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Upload size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Drag & Drop Evidence File Here
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      or click to browse secure file system
                    </div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    Supported: PDF, DOCX, TXT, LOG, JPG, PNG, MP4, MOV, WAV, MP3 (Max 100MB)
                  </div>
                </div>
              ) : (
                /* File Selected Banner */
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      padding: '0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(0, 229, 255, 0.12)',
                      color: file.categoryInfo.color
                    }}>
                      <file.categoryInfo.icon size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span style={{ color: file.categoryInfo.color, fontWeight: 600 }}>{file.category}</span>
                        <span>•</span>
                        <span className="mono">{file.mime}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Form Metadata Fields */}
              <div className="form-group">
                <label className="form-label required">Evidence Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CCTV Ingress Footage, Router Syslog Extract"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Evidence Source / Origin</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Physical Seizure, ISP Intercept"
                    value={formData.evidence_source}
                    onChange={(e) => setFormData({ ...formData, evidence_source: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required">Date Collected</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date_collected}
                    onChange={(e) => setFormData({ ...formData, date_collected: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Forensic Description & Notes</label>
                <textarea
                  className="form-textarea"
                  placeholder="Provide context on extraction method, custody transfer, or pertinent indicators..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
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
                    <span>Hashing & Ingesting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Cryptographically Seal & Store</span>
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

export default EvidenceUploadModal;
