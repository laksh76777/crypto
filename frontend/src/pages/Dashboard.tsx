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
  Plus,
  RefreshCw,
  Lock,
  ArrowUpRight,
  FileCheck2
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn relative z-10">
      {/* Welcome Banner */}
      <div className="neural-card p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/15 text-cyan-300 text-xs font-mono mb-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Zero-Plaintext Encrypted Payload on Disk
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Sora']">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-amber-200">{user?.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#a2a9b8] mt-1.5 max-w-2xl leading-relaxed">
              VeriCrypt protects your documents with multi-layer hybrid cryptography: symmetric AES-256-GCM data encryption, asymmetric RSA-OAEP key encipherment, SHA-256 integrity digests, and RSA-PSS digital signatures.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/send"
              className="cta-glass px-5 py-2.5 text-xs font-bold"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Send Secure File
            </Link>
            <button
              onClick={fetchDashboardData}
              title="Refresh Stats"
              className="pill-glass p-2.5 text-slate-300 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Files Sent */}
        <div className="neural-card neural-card-hover p-5">
          <div className="flex items-center justify-between text-[#a2a9b8] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-['Sora']">Files Sent</span>
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
        <div className="neural-card neural-card-hover p-5">
          <div className="flex items-center justify-between text-[#a2a9b8] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-['Sora']">Files Received</span>
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
        <div className="neural-card neural-card-hover p-5">
          <div className="flex items-center justify-between text-[#a2a9b8] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-['Sora']">Verified Files</span>
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
        <div className="neural-card neural-card-hover p-5">
          <div className="flex items-center justify-between text-[#a2a9b8] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-['Sora']">Integrity Failures</span>
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
        <div className="neural-card neural-card-hover p-5 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-[#a2a9b8] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-['Sora']">Expired Files</span>
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
      <div className="neural-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/5 text-cyan-400 border border-white/15">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Sora']">
                Hybrid Cryptographic Architecture Pipeline
              </h2>
              <p className="text-xs text-[#a2a9b8]">How VeriCrypt ensures confidentiality, authenticity, and integrity</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            FIPS / RFC-compliant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Box 1 */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 font-mono">STEP 1</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">Confidentiality</span>
            </div>
            <h3 className="text-sm font-semibold text-white font-['Sora']">AES-256-GCM</h3>
            <p className="text-xs text-[#a2a9b8] leading-relaxed">
              Large payload encrypted with a freshly generated random 256-bit symmetric key and 96-bit unique IV.
            </p>
          </div>

          {/* Box 2 */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 font-mono">STEP 2</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300">Key Encapsulation</span>
            </div>
            <h3 className="text-sm font-semibold text-white font-['Sora']">RSA-OAEP (2048-bit)</h3>
            <p className="text-xs text-[#a2a9b8] leading-relaxed">
              The symmetric AES key is encrypted using recipient's public RSA key. Only recipient can recover it.
            </p>
          </div>

          {/* Box 3 */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 font-mono">STEP 3</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">Integrity Digest</span>
            </div>
            <h3 className="text-sm font-semibold text-white font-['Sora']">SHA-256 Hashing</h3>
            <p className="text-xs text-[#a2a9b8] leading-relaxed">
              Original file digest computed before encryption and verified bit-for-bit after recipient decryption.
            </p>
          </div>

          {/* Box 4 */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 font-mono">STEP 4</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300">Authenticity</span>
            </div>
            <h3 className="text-sm font-semibold text-white font-['Sora']">RSA-PSS Signature</h3>
            <p className="text-xs text-[#a2a9b8] leading-relaxed">
              Sender signs the SHA-256 digest using private RSA key, guaranteeing non-repudiation and origin proof.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Received Packages */}
      <div className="neural-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white font-['Sora']">Recent Received Packages</h2>
          </div>
          <Link
            to="/received"
            className="text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            View All Received
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentFiles.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No received file packages yet. Have another user send you a secure file!
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {recentFiles.map((file) => (
              <div key={file._id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-cyan-400 shrink-0">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/files/${file._id}`}
                      className="text-sm font-semibold text-white hover:text-cyan-300 truncate block transition-colors"
                    >
                      {file.originalFileName}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-[#a2a9b8] font-mono">
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
                    className="pill-glass px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white"
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
