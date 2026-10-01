import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Send, Inbox, History, ShieldAlert, UserCheck, LogOut, LayoutDashboard, KeyRound } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#060c16]/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand with Signature Double-Slash */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/20 flex items-center justify-center shadow-lg shadow-white/5 group-hover:scale-105 group-hover:border-cyan-400/50 transition-all">
                {/* Signature Stylised Double-Slash Mark */}
                <svg viewBox="0 0 23 17" aria-hidden="true" className="w-5 h-4 fill-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                  <path d="M8.15 0.9 L4.55 0.9 L0.5 9.3 L4.1 9.3 Z" />
                  <path d="M17.0 0 L13.4 0 L6.15 16.4 L9.75 16.4 Z" />
                  <path d="M22.9 0 L19.3 0 L15.0 7.6 L18.6 7.6 Z" />
                  <path d="M22.6 6.9 L19.0 6.9 L14.05 16.4 L17.65 16.4 Z" />
                </svg>
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-[0.16em] uppercase text-white font-['Sora'] drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                  VeriCrypt
                </span>
                <span className="block text-[9px] font-mono tracking-widest text-[#a2a9b8] uppercase">
                  Zero-Knowledge Security
                </span>
              </div>
            </Link>

            {/* Cryptographic Badges */}
            <div className="hidden xl:flex items-center gap-1.5 ml-4 pl-4 border-l border-white/10 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/15 text-slate-300">
                AES-256-GCM
              </span>
              <span className="text-slate-500">•</span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/15 text-slate-300">
                RSA-OAEP
              </span>
              <span className="text-slate-500">•</span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/15 text-slate-300">
                SHA-256
              </span>
              <span className="text-slate-500">•</span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/15 text-slate-300">
                RSA-PSS
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive('/dashboard')
                    ? 'bg-white/15 border border-white/20 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                Dashboard
              </Link>
              <Link
                to="/send"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive('/send')
                    ? 'bg-white/15 border border-white/20 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                Send File
              </Link>
              <Link
                to="/received"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive('/received')
                    ? 'bg-white/15 border border-white/20 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Inbox className="w-3.5 h-3.5 text-cyan-400" />
                Received
              </Link>
              <Link
                to="/sent"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive('/sent')
                    ? 'bg-white/15 border border-white/20 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                Sent
              </Link>
              <Link
                to="/security-logs"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive('/security-logs')
                    ? 'bg-white/15 border border-white/20 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                Security Logs
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive('/admin')
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                      : 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-500/10'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
            </nav>
          )}

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/profile"
                  className="pill-glass px-3 py-1.5 flex items-center gap-2 hover:border-white/40"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="block text-xs font-medium text-white">{user.name}</span>
                    <span className="block text-[9px] font-mono text-cyan-300">{user.role}</span>
                  </div>
                  <KeyRound className="w-3 h-3 text-slate-400 ml-0.5" />
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="pill-glass p-2 text-slate-400 hover:text-red-400 hover:border-red-500/50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="pill-glass px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="cta-glass px-4 py-2 text-xs font-bold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
