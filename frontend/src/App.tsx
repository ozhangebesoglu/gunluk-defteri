// ==========================================
// GÜNCE DEFTERI - Main App Component (Context7 Uyumlu)
// Multi-platform sync + authentication
// ==========================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AnimatePresence } from 'framer-motion';
import ErrorFallback from './components/ui/ErrorFallback';
import { Toaster } from 'react-hot-toast';
import * as Sentry from "@sentry/react";

// Pages
import Dashboard from './pages/Dashboard';
import DiaryList from './pages/DiaryList';
import DiaryEntry from './pages/DiaryEntry';
import NewEntry from './pages/NewEntry';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Memories from './pages/Memories';
import Statistics from './pages/Statistics';
import RequestPasswordReset from './pages/RequestPasswordReset';
import UpdatePassword from './pages/UpdatePassword';

// Components
import Layout from './components/Layout/Layout';
import SyncStatus from './components/SyncStatus';
import LoadingSpinner from './components/ui/LoadingSpinner';

const queryClient = new QueryClient();

const PrivateRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-amber-50 dark:bg-rich-brown-900"><LoadingSpinner /></div>;
  }

  return user ? <Outlet /> : <Navigate to="/auth" />;
};

const AppWrapper: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

function App() {
  const { isDarkTheme } = useTheme();

  return (
    <Sentry.ErrorBoundary 
      fallback={({ error, resetError }) => (
        <ErrorFallback 
          error={error} 
          resetErrorBoundary={resetError} 
        />
      )}
    >
        <Router>
          <div className={isDarkTheme ? 'dark' : 'light'}>
            <div className="app-container bg-light-bg dark:bg-dark-bg">
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: isDarkTheme ? '#333' : '#fff',
                      color: isDarkTheme ? '#fff' : '#333',
                    },
                  }}
                />
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/request-reset" element={<RequestPasswordReset />} />
                    <Route path="/update-password" element={<UpdatePassword />} />
                    
                    <Route element={<PrivateRoutes />}>
                      <Route element={<Layout><Outlet /></Layout>}>
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/entries" element={<DiaryList />} />
                        <Route path="/entries/:id" element={<DiaryEntry />} />
                        <Route path="/new" element={<NewEntry />} />
                        <Route path="/memories" element={<Memories />} />
                        <Route path="/stats" element={<Statistics />} />
                        <Route path="/settings" element={<Settings />} />
                      </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </AnimatePresence>
                <SyncStatus />
            </div>
          </div>
        </Router>
    </Sentry.ErrorBoundary>
  );
}

export default AppWrapper;
