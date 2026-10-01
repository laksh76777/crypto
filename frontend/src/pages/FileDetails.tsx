import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fileApi } from '../services/api';
import { FileRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { VerificationModal } from '../components/VerificationModal';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  FileText,
  UserCheck,
  Download,
  AlertTriangle,
  Flame,
  ArrowLeft,
  Copy,
  Check,
  Loader2
} from 'lucide-react';

export const FileDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [file, setFile] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tampering, setTampering] = useState(false);
  const [tamperMessage, setTamperMessage] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchFileDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fileApi.getFileById(id);
      if (res.data.success) {
        setFile(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load file details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFileDetails();
  }, [id]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTamperDemo = async () => {
    if (!file) return;
    setTampering(true);
    setTamperMessage(null);
    try {
      const res = await fileApi.simulateTamper(file._id);
      setTamperMessage(res.data.message);
      await fetchFileDetails();
    } catch (err: any) {
      setError('Tampering simulation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setTampering(false);
    }
  };

  const handleRestoreDemo = async () => {
    if (!file) return;
    setTampering(true);
    setTamperMessage(null);
    try {
      const res = await fileApi.restoreTamper(file._id);
      setTamperMessage(res.data.message);
      await fetchFileDetails();
    } catch (err: any) {
      setError('Tampering restore failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setTampering(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-400 font-mono text-xs relative z-10">
        <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-cyan-400" />
        Inspecting cryptographic file package on disk...
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4 relative z-10">
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs">
          {error || 'File package not found.'}
        </div>
        <Link
          to="/dashboard"
          className="pill-glass px-4 py-2 text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const getEntityId = (entity: any) => {
    if (!entity) return '';
    if (typeof entity === 'string') return entity;
    return (entity.id || entity._id || '').toString();
  };

  const currentUserId = getEntityId(user);
  const senderId = getEntityId(file.senderId);
  const receiverId = getEntityId(file.receiverId);
  const isSender = currentUserId !== '' && senderId === currentUserId;
  const isReceiver = currentUserId !== '' && receiverId === currentUserId;
  const isExpired = file.expiresAt ? new Date() > new Date(file.expiresAt) : false;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn relative z-10">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3 font-['Sora']">
            <span>{file.originalFileName}</span>
            <StatusBadge status={file.status} isTampered={file.isTampered} isExpired={isExpired} />
          </h1>
          <p className="text-xs text-[#a2a9b8] font-mono mt-1">
            Package ID: {file._id} • Storage Ref: {file.storageFileName}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tamper / Restore Demo Controls */}
          {file.isTampered ? (
            <button
              onClick={handleRestoreDemo}
              disabled={tampering}
              title="Restore pristine ciphertext to demonstrate successful verification"
              className="pill-glass border-emerald-500/60 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-950/40 px-4 py-2 text-xs font-bold"
            >
              {tampering ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <ShieldCheck className="w-4 h-4 text-emerald-400 mr-1.5" />}
              Restore Pristine File (Demo)
            </button>
          ) : (
            <button
              onClick={handleTamperDemo}
              disabled={tampering}
              title="Flip bytes in encrypted storage on disk to prove AES-GCM and SHA-256 integrity detection"
              className="pill-glass border-red-500/60 text-red-300 hover:border-red-400 hover:bg-red-950/40 px-4 py-2 text-xs font-bold"
            >
              {tampering ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Flame className="w-4 h-4 text-red-400 mr-1.5" />}
              Simulate File Tampering
            </button>
          )}

          {/* Verify & Download Button (Available to Receiver or Admin) */}
          {(isReceiver || user?.role === 'ADMIN') && !isExpired && (
            <button
              onClick={() => setShowVerifyModal(true)}
              className="cta-glass px-5 py-2.5 text-xs font-bold"
            >
              {file.status === 'VERIFIED' ? (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  Download Decrypted File
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  Verify & Download
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tampering Feedback Banner */}
      {tamperMessage && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="font-bold text-amber-300">College Demo Tampering Active:</div>
            <div>{tamperMessage}</div>
          </div>
        </div>
      )}

      {/* Security alert if file was tampered */}
      {file.isTampered && (
        <div className="p-6 rounded-2xl bg-red-950/70 border border-red-500/80 text-red-200 space-y-2 animate-shake shadow-2xl shadow-red-950/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-red-400 font-extrabold text-base tracking-wide font-['Sora']">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            SECURITY ALERT
          </div>
          <p className="text-sm font-bold text-red-100">
            File integrity verification failed.
          </p>
          <p className="text-xs text-red-300">
            The file may have been modified or corrupted.
          </p>
          <p className="text-[11px] text-red-400/90 font-mono pt-1">
            Tampering detected: Ciphertext modified on disk. AES-256-GCM authentication and SHA-256 verification failed. File download is permanently blocked.
          </p>
        </div>
      )}

      {/* Cryptographic Controls Checklist Card */}
      <div className="neural-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-['Sora']">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Cryptographic Security Controls
          </h2>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            Enterprise Grade
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between hover:border-white/20 transition-colors">
            <span className="text-slate-300 font-semibold">AES-256-GCM</span>
            <span className="text-emerald-400 font-bold text-sm">✓</span>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between hover:border-white/20 transition-colors">
            <span className="text-slate-300 font-semibold">RSA-OAEP</span>
            <span className="text-emerald-400 font-bold text-sm">✓</span>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between hover:border-white/20 transition-colors">
            <span className="text-slate-300 font-semibold">SHA-256</span>
            <span className="text-emerald-400 font-bold text-sm">✓</span>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between hover:border-white/20 transition-colors">
            <span className="text-slate-300 font-semibold">Digital Signature</span>
            <span className="text-emerald-400 font-bold text-sm">✓</span>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between col-span-2 sm:col-span-1 hover:border-white/20 transition-colors">
            <span className="text-slate-300 font-semibold">Access Control</span>
            <span className="text-emerald-400 font-bold text-sm">✓</span>
          </div>
        </div>
      </div>

      {/* Cryptographic Package Architecture Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Metadata & Endpoints */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="neural-card p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-['Sora']">
              <FileText className="w-4 h-4 text-cyan-400" />
              Package Metadata
            </h2>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-[#a2a9b8]">Original File Name</span>
                <span className="text-white font-bold">{file.originalFileName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-[#a2a9b8]">Payload Size</span>
                <span className="text-cyan-300">{(file.fileSize / 1024).toFixed(2)} KB ({file.fileSize} bytes)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-[#a2a9b8]">Content-Type</span>
                <span className="text-slate-300">{file.mimeType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-[#a2a9b8]">Created At</span>
                <span className="text-slate-300">{new Date(file.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-[#a2a9b8]">Expiration</span>
                <span className={isExpired ? 'text-red-400 font-bold' : 'text-slate-300'}>
                  {file.expiresAt ? new Date(file.expiresAt).toLocaleString() : 'Never (Persistent)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#a2a9b8]">Disk Storage Strategy</span>
                <span className="text-emerald-400 font-bold">Zero-Plaintext Encrypted Payload</span>
              </div>
            </div>
          </div>

          {/* Participants Card */}
          <div className="neural-card p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-['Sora']">
              <UserCheck className="w-4 h-4 text-purple-400" />
              Cryptographic Identities
            </h2>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-bold text-cyan-400">Sender (Signed with RSA-PSS):</span>
                  <span>{typeof file.senderId === 'object' ? file.senderId.name : 'Sender'}</span>
                </div>
                <div className="text-slate-300 truncate">
                  {typeof file.senderId === 'object' ? file.senderId.email : ''}
                </div>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-bold text-purple-400">Recipient (Locked with RSA-OAEP):</span>
                  <span>{typeof file.receiverId === 'object' ? file.receiverId.name : 'Recipient'}</span>
                </div>
                <div className="text-slate-300 truncate">
                  {typeof file.receiverId === 'object' ? file.receiverId.email : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cryptographic Package Breakdown */}
        <div className="neural-card p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-['Sora']">
              <Lock className="w-4 h-4 text-emerald-400" />
              Cryptographic Package Internals
            </h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              Zero Plaintext Exposed
            </span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* SHA-256 Digest */}
            <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold text-emerald-400">SHA-256 Integrity Digest (Hex):</span>
                <button
                  onClick={() => handleCopy(file.sha256Hash, 'sha256')}
                  className="text-slate-400 hover:text-white p-1"
                  title="Copy SHA-256"
                >
                  {copiedKey === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-slate-300 break-all select-all text-[11px] bg-black/60 p-2.5 rounded border border-white/5">
                {file.sha256Hash}
              </p>
            </div>

            {/* RSA-PSS Digital Signature */}
            <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold text-amber-400">RSA-PSS Digital Signature (Base64):</span>
                <button
                  onClick={() => handleCopy(file.digitalSignature, 'sig')}
                  className="text-slate-400 hover:text-white p-1"
                  title="Copy Signature"
                >
                  {copiedKey === 'sig' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-slate-400 break-all text-[10px] max-h-16 overflow-y-auto bg-black/60 p-2 rounded border border-white/5">
                {file.digitalSignature}
              </p>
            </div>

            {/* Encrypted AES Key */}
            <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold text-purple-400">Encrypted AES Key (RSA-OAEP Base64):</span>
                <button
                  onClick={() => handleCopy(file.encryptedAESKey, 'aesKey')}
                  className="text-slate-400 hover:text-white p-1"
                  title="Copy Encrypted Key"
                >
                  {copiedKey === 'aesKey' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-slate-400 break-all text-[10px] max-h-16 overflow-y-auto bg-black/60 p-2 rounded border border-white/5">
                {file.encryptedAESKey}
              </p>
            </div>

            {/* AES-GCM IV and AuthTag */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-1">
                <span className="text-slate-400 font-bold text-cyan-400 text-[11px]">AES-GCM IV (96-bit):</span>
                <p className="text-slate-300 break-all text-[11px] bg-black/60 p-2 rounded border border-white/5">
                  {file.iv}
                </p>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-1">
                <span className="text-slate-400 font-bold text-cyan-400 text-[11px]">Auth Tag (128-bit):</span>
                <p className="text-slate-300 break-all text-[11px] bg-black/60 p-2 rounded border border-white/5">
                  {file.authTag}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerifyModal && (
        <VerificationModal
          file={file}
          onClose={() => setShowVerifyModal(false)}
          onVerified={() => fetchFileDetails()}
        />
      )}
    </div>
  );
};
