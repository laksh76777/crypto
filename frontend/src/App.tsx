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
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const q = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    const v = videoRef.current;
    if (!q || !v) return;

    const sync = () => {
      if (q.matches) {
        v.pause();
      } else {
        const p = v.play();
        if (p) p.catch(() => {});
      }
    };
    sync();

    if (q.addEventListener) {
      q.addEventListener('change', sync);
      return () => q.removeEventListener('change', sync);
    } else {
      q.addListener(sync);
      return () => q.removeListener(sync);
    }
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col text-slate-100 overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Background looping cinematic video */}
      <video
        ref={videoRef}
        className="art"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        poster="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/130837c4-0244-4f37-9c61-8d801d93fd29.jpg"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_104303_0c6d60b2-9353-408e-9449-585108a22fb5.mp4"
      />
      {/* Optical veil gradient overlay */}
      <div className="veil" aria-hidden="true" />

      {/* Main app interactive content */}
      <div className="relative z-10 flex-1 flex flex-col">
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
        
        <footer className="border-t border-white/10 bg-[#02060f]/60 backdrop-blur-md py-6 text-center text-xs text-slate-400 font-mono">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-slate-300 font-medium">
              VeriCrypt — Secure Hybrid Cryptography
            </span>
            <span className="text-slate-400 text-[11px]">
              AES-256-GCM • RSA-OAEP • SHA-256 • RSA-PSS
            </span>
          </div>
        </footer>
      </div>
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
