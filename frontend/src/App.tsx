import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { SendFile } from './pages/SendFile';
import { ReceivedFiles } from './pages/ReceivedFiles';
import { SentFiles } from './pages/SentFiles';
import { FileDetails } from './pages/FileDetails';
import { SecurityLogs } from './pages/SecurityLogs';
import { Admin } from './pages/Admin';
import { Profile } from './pages/Profile';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080b11] text-cyan-400 font-mono text-xs">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Initializing cryptographic identity...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080b11] text-cyan-400 font-mono text-xs">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Verifying administrative authorization...
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#080b11] text-slate-100">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/send"
            element={
              <ProtectedRoute>
                <SendFile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/received"
            element={
              <ProtectedRoute>
                <ReceivedFiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sent"
            element={
              <ProtectedRoute>
                <SentFiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/files/:id"
            element={
              <ProtectedRoute>
                <FileDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/security-logs"
            element={
              <ProtectedRoute>
                <SecurityLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      <footer className="border-t border-slate-900 bg-[#0a0d14] py-6 text-center text-xs text-slate-500 font-mono">
        CryptaShare — Secure Hybrid Cryptography • AES-256-GCM • RSA-OAEP • SHA-256 • RSA-PSS
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
