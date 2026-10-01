import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Shield, User, Copy, Check, Lock, CheckCircle2 } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (user?.publicKey) {
      navigator.clipboard.writeText(user.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
          <KeyRound className="w-4 h-4" />
          <span className="tracking-widest uppercase">CRYPTOGRAPHIC IDENTITY PROFILE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Your Cryptographic Credentials</h1>
        <p className="text-xs text-[var(--sub)] mt-1">
          View your public RSA certificate and verify how your private keys are safeguarded in accordance with CryptaShare security standards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="neural-card rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 via-sky-300 to-indigo-400 flex items-center justify-center text-xl font-bold text-black shadow-lg shadow-cyan-500/20 mx-auto">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">{user?.name}</h2>
            <p className="text-xs text-cyan-300 font-mono">{user?.email}</p>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[var(--sub)]">
              <span>Role:</span>
              <span className="text-white font-bold">{user?.role}</span>
            </div>
            <div className="flex justify-between text-[var(--sub)]">
              <span>Account Status:</span>
              <span className="text-emerald-400 font-bold">Active</span>
            </div>
            <div className="flex justify-between text-[var(--sub)]">
              <span>Algorithm:</span>
              <span className="text-purple-300">RSA-2048</span>
            </div>
          </div>
        </div>

        {/* Security Architecture Box */}
        <div className="md:col-span-2 neural-card rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Private Key Storage Architecture
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              PBKDF2 + AES-GCM
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              Under CryptaShare's zero-plaintext design, your RSA private key is never stored unencrypted. When you registered, your master password was passed through:
            </p>
            <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 font-mono text-[11px] space-y-2 text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. PBKDF2 with 100,000 iterations & cryptographic salt</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Key derivation produces a 256-bit symmetric wrapping key</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. AES-256-GCM encrypts your RSA private key PEM</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>4. Only salt, IV, authTag, and ciphertext are stored in MongoDB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public Key Display */}
      <div className="neural-card rounded-2xl p-6 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Your Public RSA Key (SPKI PEM)
            </h2>
          </div>
          <button
            onClick={handleCopy}
            className="pill-glass px-3.5 py-1.5 text-xs font-semibold text-white flex items-center gap-1.5 hover:bg-white/15 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white/50" />
                <span>Copy Key</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 bg-black/40 rounded-xl border border-white/10 text-[11px] font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap select-all">
          {user?.publicKey || 'Public Key not available.'}
        </pre>
        <p className="text-[11px] text-[var(--sub)] font-mono">
          This public key is distributed across the CryptaShare network. Other users encrypt ephemeral AES session keys with this key when sending files to you.
        </p>
      </div>
    </div>
  );
};
