import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { Layout } from './components/layout/Layout';
import { AlertCircle, ExternalLink, Settings as SettingsIcon } from 'lucide-react';

import { SplashPage } from './pages/SplashPage';
import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { KanbanPage } from './pages/KanbanPage';
import { TasksPage } from './pages/TasksPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { ClientsPage } from './pages/ClientsPage';
import { DocumentManagerPage } from './pages/DocumentManagerPage';
import { MeetingCalendarPage } from './pages/MeetingCalendarPage';
import { StickyNotesPage } from './pages/StickyNotesPage';
import { PasswordManagerPage } from './pages/PasswordManagerPage';
import { CompliancePage } from './pages/CompliancePage';
import { InboxPage } from './pages/InboxPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const { isAuthenticated, isLoading: isAuthLoading } = useApp();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashPage onComplete={() => setShowSplash(false)} />;
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f5f7]">
        <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="documents" element={<DocumentManagerPage />} />
          <Route path="meetings" element={<MeetingCalendarPage />} />
          <Route path="notes" element={<StickyNotesPage />} />
          <Route path="passwords" element={<PasswordManagerPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppProvider>
          <ConfirmProvider>
            <AppContent />
          </ConfirmProvider>
        </AppProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
