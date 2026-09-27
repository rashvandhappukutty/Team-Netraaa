import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateInvestigation from './pages/CreateInvestigation';
import InvestigationWorkspace from './pages/InvestigationWorkspace';
import GlobalDataSources from './pages/GlobalDataSources';
import GlobalNormalizedData from './pages/GlobalNormalizedData';
import GlobalEntities from './pages/GlobalEntities';
import GlobalEntityReview from './pages/GlobalEntityReview';
import AuditLogs from './pages/AuditLogs';
import AdminUsers from './pages/AdminUsers';

export function App() {
  const { isAuthenticated, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/dashboard');

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        color: 'var(--text-secondary)'
      }}>
        <div className="pulse-indicator" style={{ width: '24px', height: '24px' }} />
        <div style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', fontSize: '1rem' }}>
          INITIALIZING NETRA INTELLIGENCE ENCLAVE...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => navigate('/dashboard')} />;
  }

  // Routing Resolution
  const renderContent = () => {
    if (currentPath === '/investigations/create' || currentPath === '/cases/create') {
      return <CreateInvestigation navigate={navigate} />;
    }

    if (currentPath.startsWith('/investigations/')) {
      const invId = currentPath.replace('/investigations/', '');
      if (invId) {
        return <InvestigationWorkspace investigationId={invId} navigate={navigate} />;
      }
    }

    if (currentPath.startsWith('/cases/')) {
      const caseId = currentPath.replace('/cases/', '');
      if (caseId) {
        return <InvestigationWorkspace investigationId={caseId} navigate={navigate} />;
      }
    }

    if (currentPath === '/data-sources' || currentPath === '/evidence') {
      return <GlobalDataSources navigate={navigate} />;
    }

    if (currentPath === '/normalized-data') {
      return <GlobalNormalizedData navigate={navigate} />;
    }

    if (currentPath === '/entities') {
      return <GlobalEntities navigate={navigate} />;
    }

    if (currentPath === '/entity-review') {
      return <GlobalEntityReview navigate={navigate} />;
    }

    if (currentPath === '/audit') {
      return <AuditLogs navigate={navigate} />;
    }

    if (currentPath === '/admin/users') {
      return <AdminUsers navigate={navigate} />;
    }

    // Default to Dashboard
    return <Dashboard navigate={navigate} />;
  };

  return (
    <div className="app-container">
      <Sidebar currentPath={currentPath} navigate={navigate} />
      <div className="main-content">
        <Header />
        <main className="content-body">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
