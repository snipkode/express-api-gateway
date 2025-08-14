import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/pages/LandingPage';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Dashboard } from './components/pages/Dashboard';
import { TenantsPage } from './components/pages/TenantsPage';
import { UsersPage } from './components/pages/UsersPage';
import { ServicesPage } from './components/pages/ServicesPage';
import { ProxyPage } from './components/pages/ProxyPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { LoginPage } from './components/auth/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ApiProvider } from './contexts/ApiContext';

type Page = 'landing' | 'dashboard' | 'tenants' | 'users' | 'services' | 'proxy' | 'settings';

function AuthenticatedContent({ currentPage, setCurrentPage }: { currentPage: Page; setCurrentPage: (page: Page) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          user={user}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-auto p-6">
          {renderPage(currentPage, setCurrentPage)}
        </main>
      </div>
    </div>
  );
}

function renderPage(currentPage: Page, setCurrentPage: (page: Page) => void) {
  switch (currentPage) {
    case 'landing':
      return <LandingPage onGetStarted={() => setCurrentPage('dashboard')} />;
    case 'dashboard':
      return <Dashboard />;
    case 'tenants':
      return <TenantsPage />;
    case 'users':
      return <UsersPage />;
    case 'services':
      return <ServicesPage />;
    case 'proxy':
      return <ProxyPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <Dashboard />;
  }
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  if (!isAuthenticated && currentPage === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentPage('dashboard')} />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedContent currentPage={currentPage} setCurrentPage={setCurrentPage} />;
}

function App() {
  return (
    <ApiProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ApiProvider>
  );
}

export default App;