import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, UserCheck, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[#0f1422] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
              <Shield className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Access CryptaShare</h1>
            <p className="text-xs text-slate-400 mt-1">
              Zero-knowledge hybrid encrypted file sharing portal
            </p>
          </div>

          {/* Quick Demo Logins */}
          <div className="mb-6 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                ⚡ Demo Accounts (One-Click Sign In):
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">Password123!</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={async () => {
                  handleQuickFill('laksh@gmail.com', 'Password123!');
                  setError(null);
                  setLoading(true);
                  try {
                    await login('laksh@gmail.com', 'Password123!');
                    navigate('/dashboard');
                  } catch (err: any) {
                    setError(err.response?.data?.message || err.message || 'Login failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="py-2 px-2 rounded-xl bg-slate-800/90 hover:bg-cyan-950/60 hover:border-cyan-500/50 border border-slate-700/70 text-[11px] font-bold text-cyan-300 transition-all text-center flex flex-col items-center gap-0.5 shadow-sm"
              >
                <span>Laksh</span>
                <span className="text-[9px] font-normal text-slate-400">Sender</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  handleQuickFill('paritosh@gmail.com', 'Password123!');
                  setError(null);
                  setLoading(true);
                  try {
                    await login('paritosh@gmail.com', 'Password123!');
                    navigate('/dashboard');
                  } catch (err: any) {
                    setError(err.response?.data?.message || err.message || 'Login failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="py-2 px-2 rounded-xl bg-slate-800/90 hover:bg-emerald-950/60 hover:border-emerald-500/50 border border-slate-700/70 text-[11px] font-bold text-emerald-300 transition-all text-center flex flex-col items-center gap-0.5 shadow-sm"
              >
                <span>Paritosh</span>
                <span className="text-[9px] font-normal text-slate-400">Receiver</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  handleQuickFill('admin@gmail.com', 'Password123!');
                  setError(null);
                  setLoading(true);
                  try {
                    await login('admin@gmail.com', 'Password123!');
                    navigate('/dashboard');
                  } catch (err: any) {
                    setError(err.response?.data?.message || err.message || 'Login failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="py-2 px-2 rounded-xl bg-slate-800/90 hover:bg-purple-950/60 hover:border-purple-500/50 border border-slate-700/70 text-[11px] font-bold text-purple-300 transition-all text-center flex flex-col items-center gap-0.5 shadow-sm"
              >
                <span>Admin</span>
                <span className="text-[9px] font-normal text-slate-400">Auditor</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-95 text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4">
                Register with RSA Keypair
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
