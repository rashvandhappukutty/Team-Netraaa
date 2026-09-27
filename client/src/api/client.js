const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('netra_auth_token');
  const headers = {
    ...options.headers
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('netra_auth_token');
      localStorage.removeItem('netra_auth_user');
      window.location.href = '/login';
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: Request failed`);
    }
    return data;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Request failed`);
  }

  return response;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Investigations
  getInvestigations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/investigations${query ? `?${query}` : ''}`);
  },
  getInvestigationById: (id) => request(`/investigations/${id}`),
  createInvestigation: (data) => request('/investigations', { method: 'POST', body: JSON.stringify(data) }),
  updateInvestigation: (id, data) => request(`/investigations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getInvestigationActivity: (id) => request(`/investigations/${id}/activity`),

  // Data Sources
  getDataSourcesByInvestigation: (invId) => request(`/investigations/${invId}/data-sources`),
  uploadDataSource: (invId, formData) => request(`/investigations/${invId}/data-sources`, { method: 'POST', body: formData }),
  getAllDataSources: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/data-sources${query ? `?${query}` : ''}`);
  },
  getDataSourceById: (id) => request(`/data-sources/${id}`),
  getDataSourcePreview: (id) => request(`/data-sources/${id}/preview`),
  verifyDataSourceIntegrity: (id) => request(`/data-sources/${id}/verify-integrity`, { method: 'POST' }),
  getDataSourceDownloadUrl: (id) => `${API_BASE}/data-sources/${id}/download`,

  // Normalized Data & Traceability
  getNormalizedRecordsBySource: (sourceId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/data-sources/${sourceId}/normalized-records${query ? `?${query}` : ''}`);
  },
  getNormalizedRecordsByInvestigation: (invId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/investigations/${invId}/normalized-records${query ? `?${query}` : ''}`);
  },

  // Phase 2: AI Entity Extraction & Entity Resolution
  processInvestigationEntities: (invId) => request(`/investigations/${invId}/entities/process`, { method: 'POST' }),
  getInvestigationEntities: (invId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/investigations/${invId}/entities${query ? `?${query}` : ''}`);
  },
  getInvestigationEntityStats: (invId) => request(`/investigations/${invId}/entities/stats`),
  getInvestigationReviewQueue: (invId) => request(`/investigations/${invId}/entity-review-queue`),
  getAllMasterEntities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/entities${query ? `?${query}` : ''}`);
  },
  getEntityProfile: (id) => request(`/entities/${id}`),

  // Entity Review Actions
  confirmEntityMerge: (data) => request('/entities/review/confirm-merge', { method: 'POST', body: JSON.stringify(data) }),
  keepEntitySeparate: (data) => request('/entities/review/keep-separate', { method: 'POST', body: JSON.stringify(data) }),
  editCanonicalName: (data) => request('/entities/review/edit-canonical', { method: 'POST', body: JSON.stringify(data) }),
  rejectEntityMention: (data) => request('/entities/review/reject', { method: 'POST', body: JSON.stringify(data) }),

  // Audit
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit-logs${query ? `?${query}` : ''}`);
  },

  // Master Analysis Pipeline
  runAnalysis: (invId) => request(`/investigations/${invId}/analyze`, { method: 'POST' }),
  getAnalysisStatus: (invId) => request(`/investigations/${invId}/analysis-status`),

  // Knowledge Graph
  getInvestigationGraph: (invId) => request(`/investigations/${invId}/graph`),
  getRelationshipProfile: (relId) => request(`/relationships/${relId}`),

  // Network Influence & Centrality
  getInvestigationInfluence: (invId) => request(`/investigations/${invId}/influence`),

  // Pattern Detection
  getInvestigationPatterns: (invId) => request(`/investigations/${invId}/patterns`),

  // Timeline
  getInvestigationTimeline: (invId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/investigations/${invId}/timeline${query ? `?${query}` : ''}`);
  },

  // Investigative Leads
  getInvestigationLeads: (invId) => request(`/investigations/${invId}/leads`),
  recordLeadDecision: (leadId, data) => request(`/leads/${leadId}/decision`, { method: 'POST', body: JSON.stringify(data) }),

  // AI Assistant
  queryAssistant: (invId, query) => request(`/investigations/${invId}/assistant/query`, { method: 'POST', body: JSON.stringify({ query }) }),

  // Users & Stats
  getInvestigators: () => request('/users/investigators'),
  getAllUsers: () => request('/users'),
  createUser: (userData) => request('/users', { method: 'POST', body: JSON.stringify(userData) }),
  getDashboardStats: () => request('/stats/dashboard')
};

export default api;
