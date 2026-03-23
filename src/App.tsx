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

function SupabaseWarning() {
  const { supabaseConfigured, supabaseStatus } = useApp();
  
  if (supabaseConfigured && supabaseStatus.connected) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white border-2 border-red-100 rounded-2xl shadow-2xl p-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-bold text-gray-900 mb-1">
              {!supabaseConfigured ? 'Supabase Setup Required' : 'Supabase Connection Error'}
            </h3>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-4">
              {!supabaseConfigured ? (
                <>Your database is not connected. Please add <code className="bg-gray-100 px-1 rounded text-red-600 font-mono">SUPABASE_URL</code> and <code className="bg-gray-100 px-1 rounded text-red-600 font-mono">SUPABASE_SERVICE_ROLE_KEY</code> to your AI Studio Secrets.</>
              ) : (
                <>
                  Connected to Supabase but queries are failing with code <code className="bg-gray-100 px-1 rounded text-red-600 font-mono">{supabaseStatus.error?.code || 'unknown'}</code>. 
                  {supabaseStatus.error?.code === '42501' && " This usually means you've provided the 'anon' key instead of the 'service_role' key, or RLS is blocking access."}
                  {supabaseStatus.error?.code === '42P01' && " This means the tables haven't been created yet. Please run the SQL setup script."}
                </>
              )}
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="https://supabase.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600 hover:underline"
              >
                Get Keys <ExternalLink size={12} />
              </a>
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <button 
                onClick={() => window.location.reload()}
                className="text-[12px] font-bold text-gray-600 hover:text-gray-900"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading: isAuthLoading, supabaseConfigured } = useApp();
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
    <>
      <SupabaseWarning />
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
    </>
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
