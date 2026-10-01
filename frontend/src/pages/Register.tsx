import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, User as UserIcon, ArrowRight, KeyRound, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="neural-card rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 text-cyan-300 mb-4 shadow-lg">
              <KeyRound className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Create Cryptographic Identity</h1>
            <p className="text-xs text-[var(--sub)] mt-1">
              Generates an RSA-2048 keypair shielded with PBKDF2 (100k) + AES-256-GCM
            </p>
          </div>

          {/* Security Features Box */}
          <div className="mb-6 p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-[11px] uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              Cryptographic Security Guarantees:
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>2048-bit RSA Keypair</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>PBKDF2 Key Derivation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>AES-GCM Key Shield</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero Plaintext Storage</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alice Cooper"
                  className="w-full pl-10 pr-4 py-2.5 neural-input rounded-xl text-sm text-white placeholder-white/30 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@cryptashare.io"
                  className="w-full pl-10 pr-4 py-2.5 neural-input rounded-xl text-sm text-white placeholder-white/30 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Master Password (min 8 chars)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong master password"
                  className="w-full pl-10 pr-4 py-2.5 neural-input rounded-xl text-sm text-white placeholder-white/30 focus:outline-none font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-[var(--sub)] mt-1">
                Used to derive the PBKDF2 encryption key that protects your private key.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('USER')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    role === 'USER'
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md'
                      : 'bg-black/30 border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  Standard User
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    role === 'ADMIN'
                      ? 'bg-purple-950/80 border-purple-400 text-purple-300 shadow-md'
                      : 'bg-black/30 border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  System Admin
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 cta-glass text-white font-bold text-sm rounded-full flex items-center justify-center gap-2 shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating RSA Keys & Encrypting...
                </>
              ) : (
                <>
                  <span>Generate Keypair & Register</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-[var(--sub)]">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-300 hover:text-white font-semibold underline underline-offset-4">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
