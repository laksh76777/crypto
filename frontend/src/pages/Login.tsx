import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

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

  const handleQuickLogin = async (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
    setLoading(true);
    try {
      await login(userEmail, userPass);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center px-4 py-4 sm:py-6 relative z-10">
      {/* Hero Headline Section */}
      <div className="max-w-3xl mx-auto text-center mb-6 space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-[10px] font-mono tracking-widest text-[#a2a9b8] uppercase anim-lift">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Zero-Knowledge Hybrid Cryptography Architecture
        </div>
        
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.12] font-['Sora'] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] anim-wipe">
          <span className="block">World-Class Digital Security</span>
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-amber-200">
            Work on Time, Right on Target.
          </span>
        </h1>
        
        <p className="text-xs sm:text-sm text-[#a2a9b8] max-w-lg mx-auto font-light leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] anim-lift">
          Protect mission-critical files with multi-layer hybrid cryptography:
          AES-256-GCM payload encryption, RSA-OAEP key wrapping, and RSA-PSS signatures.
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="w-full max-w-md neural-card p-6 sm:p-7 anim-settle shadow-2xl">
        {/* Card Header */}
        <div className="text-center mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide font-['Sora']">
            Portal Access
          </h2>
          <p className="text-xs text-[#a2a9b8] mt-0.5">
            Authenticate to decrypt session keys and verify integrity
          </p>
        </div>

        {/* 1-Click Demo Accounts */}
        <div className="mb-5 p-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-semibold">
              ⚡ Demo Accounts (1-Click Login):
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Password123!</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('laksh@gmail.com', 'Password123!')}
              className={`pill-glass py-2 px-2 text-center flex flex-col items-center gap-0.5 transition-all text-xs ${
                email === 'laksh@gmail.com' ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200' : 'hover:border-cyan-400 hover:text-cyan-200'
              }`}
            >
              <span className="font-bold text-cyan-300">Laksh</span>
              <span className="text-[9px] text-[#a2a9b8]">Sender</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('paritosh@gmail.com', 'Password123!')}
              className={`pill-glass py-2 px-2 text-center flex flex-col items-center gap-0.5 transition-all text-xs ${
                email === 'paritosh@gmail.com' ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200' : 'hover:border-emerald-400 hover:text-emerald-200'
              }`}
            >
              <span className="font-bold text-emerald-300">Paritosh</span>
              <span className="text-[9px] text-[#a2a9b8]">Receiver</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('admin@gmail.com', 'Password123!')}
              className={`pill-glass py-2 px-2 text-center flex flex-col items-center gap-0.5 transition-all text-xs ${
                email === 'admin@gmail.com' ? 'border-amber-400 bg-amber-950/40 text-amber-200' : 'hover:border-amber-400 hover:text-amber-200'
              }`}
            >
              <span className="font-bold text-amber-300">Admin</span>
              <span className="text-[9px] text-[#a2a9b8]">Auditor</span>
            </button>
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 font-['Sora']">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="laksh@gmail.com"
                className="w-full pl-10 pr-4 py-2 neural-input text-sm focus:border-cyan-400 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 font-['Sora']">
              Account Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2 neural-input text-sm focus:border-cyan-400 font-mono"
                required
              />
            </div>
          </div>

          {/* CTA Glass Button with Signature Arrow */}
          <button
            type="submit"
            disabled={loading}
            className="cta-glass w-full py-3 text-sm font-bold tracking-wide mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Identity...</span>
              </>
            ) : (
              <>
                <span>Sign in to Dashboard</span>
                <svg className="w-4 h-3 ml-1 stroke-current fill-none" viewBox="0 0 16 11">
                  <path d="M0 5.5 H14.6 M10.3 1.2 L14.9 5.5 L10.3 9.8" strokeWidth="1.6" strokeLinecap="square" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Card Footer */}
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-[#a2a9b8]">
            Need a new cryptographic identity?{' '}
            <Link to="/register" className="text-cyan-300 hover:text-white font-semibold underline underline-offset-4 transition-colors">
              Register RSA Keypair
            </Link>
          </p>
        </div>
      </div>

      {/* Feature Pills at Base */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] font-mono text-[#e2ebf5]/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-1.5">
          <svg className="w-2.5 h-3.5 stroke-[#d6e8fa] fill-none stroke-[1.75]" viewBox="0 0 11 20">
            <path d="M1.15 1.15 L9.6 10 L1.15 18.85" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>AES-256-GCM Encryption</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-2.5 h-3.5 stroke-[#d6e8fa] fill-none stroke-[1.75]" viewBox="0 0 11 20">
            <path d="M1.15 1.15 L9.6 10 L1.15 18.85" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>RSA-OAEP Key Protection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-2.5 h-3.5 stroke-[#d6e8fa] fill-none stroke-[1.75]" viewBox="0 0 11 20">
            <path d="M1.15 1.15 L9.6 10 L1.15 18.85" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>SHA-256 Integrity Verification</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-2.5 h-3.5 stroke-[#d6e8fa] fill-none stroke-[1.75]" viewBox="0 0 11 20">
            <path d="M1.15 1.15 L9.6 10 L1.15 18.85" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>RSA-PSS Digital Signatures</span>
        </div>
      </div>
    </div>
  );
};
