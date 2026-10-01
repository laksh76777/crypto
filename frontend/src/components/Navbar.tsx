import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Send, Inbox, History, ShieldAlert, UserCheck, LogOut, LayoutDashboard, KeyRound } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0a0e17]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                  CryptaShare
                </span>
                <span className="block text-[10px] font-mono tracking-widest text-slate-400 -mt-1 uppercase">
                  Hybrid Cryptography
                </span>
              </div>
            </Link>

            {/* Cryptographic Primitive Badges */}
            <div className="hidden lg:flex items-center gap-1.5 ml-6 pl-6 border-l border-slate-800 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300">
                AES-256-GCM
              </span>
              <span className="text-slate-600">+</span>
              <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/50 text-purple-300">
                RSA-OAEP
              </span>
              <span className="text-slate-600">+</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-300">
                SHA-256
              </span>
              <span className="text-slate-600">+</span>
              <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/50 text-amber-300">
                RSA-PSS
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/send"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/send')
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Send className="w-4 h-4" />
                Send File
              </Link>
              <Link
                to="/received"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/received')
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Inbox className="w-4 h-4" />
                Received
              </Link>
              <Link
                to="/sent"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/sent')
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <History className="w-4 h-4" />
                Sent
              </Link>
              <Link
                to="/security-logs"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/security-logs')
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                Security Logs
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin')
                      ? 'bg-amber-950/60 border border-amber-600/50 text-amber-300'
                      : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/30'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </nav>
          )}

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 pl-3 pr-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-600 flex items-center justify-center text-xs font-bold text-black">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="block text-xs font-medium text-slate-200">{user.name}</span>
                    <span className="block text-[10px] font-mono text-cyan-400">{user.role}</span>
                  </div>
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 text-black hover:opacity-95 shadow-md shadow-cyan-500/20 transition-all"
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
