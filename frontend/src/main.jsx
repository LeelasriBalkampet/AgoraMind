import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';

// Feature Pages
import DashboardHub from './pages/DashboardHub.jsx';
import TopicExplorer from './pages/TopicExplorer.jsx';

import SessionHistory from './pages/SessionHistory.jsx';
import WeakAreasPage from './pages/WeakAreasPage.jsx';
import VoiceTutor from './pages/VoiceTutor.jsx';
import Flashcards from './pages/Flashcards.jsx';
import App from './App.jsx'; // This will become the ChatInterface page

import AdminLayout from './layouts/AdminLayout.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-agora-bg">
        <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) {
    if (user.isAdmin) return <Navigate to="/admin" replace />;
    return <Navigate to="/app" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-agora-bg">
        <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
            <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
            
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<DashboardHub />} />
              <Route path="explore" element={<TopicExplorer />} />

              <Route path="chat" element={<App />} />
              <Route path="voice" element={<VoiceTutor />} />
              <Route path="history" element={<SessionHistory />} />
              <Route path="weak-areas" element={<WeakAreasPage />} />
              <Route path="flashcards" element={<Flashcards />} />
            </Route>
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
