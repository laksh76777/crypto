import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi, fileApi } from '../services/api';
import { SystemStats, FileRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Send,
  Inbox,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  Shield,
  Lock,
  KeyRound,
  FileCheck2,
  RefreshCw,
  Plus
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, filesRes] = await Promise.all([
        userApi.getStatistics(),
        fileApi.getReceivedFiles()
      ]);
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (filesRes.data.success) {
        setRecentFiles(filesRes.data.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0d1424] via-[#0f172a] to-[#0a101f] border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-mono mb-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Cryptographic Engine Active (Zero-Plaintext Storage)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">{user?.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              CryptaShare protects your documents with multi-layer hybrid cryptography: symmetric AES-256-GCM data encryption, asymmetric RSA-OAEP key encipherment, SHA-256 integrity digests, and RSA-PSS digital signatures.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/send"
              className="py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-95 text-black font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Send Secure File
            </Link>
            <button
              onClick={fetchDashboardData}
              title="Refresh Stats"
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Files Sent */}
        <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Files Sent</span>
            <Send className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats ? stats.sentCount : '--'}
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1 flex items-center gap-1 font-mono">
            AES-256-GCM + RSA-PSS
          </div>
        </div>

        {/* Files Received */}
        <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Files Received</span>
            <Inbox className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats ? stats.receivedCount : '--'}
          </div>
          <div className="text-[11px] text-purple-400/80 mt-1 flex items-center gap-1 font-mono">
            RSA-OAEP Protected
          </div>
        </div>

        {/* Verified Files */}
        <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Verified Files</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {stats ? stats.verifiedCount : '--'}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1 font-mono">
            SHA-256 Digest Matched
          </div>
        </div>

        {/* Integrity Failures */}
        <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Integrity Failures</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {stats ? stats.failedVerificationCount : '--'}
          </div>
          <div className="text-[11px] text-red-400/80 mt-1 flex items-center gap-1 font-mono">
            Tampering / Bad Signature
          </div>
        </div>

        {/* Expired Files */}
        <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Expired Files</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-400">
            {stats ? stats.expiredCount : '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
            Access Revoked by Policy
          </div>
        </div>
      </div>

      {/* Cryptographic Hybrid Architecture Flow Visualizer */}
      <div className="bg-[#0f1422] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Hybrid Cryptographic Architecture Pipeline
              </h2>
              <p className="text-xs text-slate-400">How CryptaShare ensures confidentiality, authenticity, and integrity</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
            Standard: FIPS / RFC-compliant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Box 1 */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 font-mono">STEP 1</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300">Confidentiality</span>
            </div>
            <h3 className="text-sm font-semibold text-white">AES-256-GCM</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Large payload encrypted with a freshly generated random 256-bit symmetric key and 96-bit unique IV.
            </p>
          </div>

          {/* Box 2 */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 font-mono">STEP 2</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">Key Encapsulation</span>
            </div>
            <h3 className="text-sm font-semibold text-white">RSA-OAEP (2048-bit)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The symmetric AES key is encrypted using the recipient's public RSA key. Only recipient can recover it.
            </p>
          </div>

          {/* Box 3 */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 font-mono">STEP 3</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">Integrity Digest</span>
            </div>
            <h3 className="text-sm font-semibold text-white">SHA-256 Hashing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Original file digest computed before encryption and verified bit-for-bit after recipient decryption.
            </p>
          </div>

          {/* Box 4 */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 font-mono">STEP 4</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300">Authenticity</span>
            </div>
            <h3 className="text-sm font-semibold text-white">RSA-PSS Digital Signature</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sender signs the SHA-256 digest using their private RSA key, guaranteeing non-repudiation and origin proof.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Received Packages */}
      <div className="bg-[#0f1422] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Recent Received Packages</h2>
          </div>
          <Link
            to="/received"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            View All Received
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentFiles.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No received file packages yet. Have another user send you a secure file!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {recentFiles.map((file) => (
              <div key={file._id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-300 shrink-0">
                    <FileCheck2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/files/${file._id}`}
                      className="text-sm font-semibold text-white hover:text-cyan-400 truncate block transition-colors"
                    >
                      {file.originalFileName}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>From: {typeof file.senderId === 'object' ? file.senderId.name : 'Sender'}</span>
                      <span>•</span>
                      <span>{(file.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge
                    status={file.status}
                    isTampered={file.isTampered}
                    isExpired={file.expiresAt ? new Date() > new Date(file.expiresAt) : false}
                  />
                  <Link
                    to={`/files/${file._id}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    Inspect
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
