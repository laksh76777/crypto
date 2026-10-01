import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi, fileApi } from '../services/api';
import { User } from '../types';
import {
  Send,
  Upload,
  Clock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Loader2,
  Cpu
} from 'lucide-react';

export const SendFile: React.FC = () => {
  const [recipients, setRecipients] = useState<User[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [expirationHours, setExpirationHours] = useState<string>('24');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const navigate = useNavigate();

  const pipelineSteps = [
    'Preparing secure package',
    'Generating 256-bit AES symmetric key & 96-bit IV',
    'Encrypting payload with AES-256-GCM',
    'Computing SHA-256 cryptographic digest',
    'Signing digest using RSA-PSS with sender private key',
    'Encapsulating AES key using RSA-OAEP with recipient public key',
    'Transmitting zero-plaintext ciphertext package to server',
    'Transfer completed successfully'
  ];

  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const res = await userApi.getRecipients();
        if (res.data.success) {
          setRecipients(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedRecipient(res.data.data[0]._id || res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load recipients:', err);
      }
    };
    fetchRecipients();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to transfer.');
      return;
    }
    if (!selectedRecipient) {
      setError('Please select an active recipient.');
      return;
    }
    if (!password) {
      setError('Please enter your account password to unlock your RSA private key for signing.');
      return;
    }

    setError(null);
    setLoading(true);
    setProgressStep(1);

    // Simulate animated cryptographic progress steps for visual feedback
    const stepInterval = setInterval(() => {
      setProgressStep((prev) => {
        if (prev < 6) return prev + 1;
        return prev;
      });
    }, 350);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', selectedRecipient);
    formData.append('senderPassword', password);
    formData.append('expirationHours', expirationHours);

    try {
      const res = await fileApi.shareFile(formData);
      clearInterval(stepInterval);
      setProgressStep(7);
      setSuccessData(res.data.data);
    } catch (err: any) {
      clearInterval(stepInterval);
      setProgressStep(0);
      setError(err.response?.data?.message || err.message || 'File encryption and transmission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
          <Send className="w-4 h-4" />
          <span>HYBRID CRYPTOGRAPHIC TRANSFER</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Encrypt & Send File</h1>
        <p className="text-xs text-slate-400 mt-1">
          Files are encrypted client-side/session-side using AES-256-GCM, the AES key is protected via RSA-OAEP, and the payload hash is signed using RSA-PSS.
        </p>
      </div>

      {/* Cryptographic Primitives Breakdown Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#0f1422] border border-cyan-900/40 text-center">
          <span className="block text-[10px] font-mono text-cyan-400 uppercase">Encryption</span>
          <span className="block text-xs font-bold text-white mt-0.5">AES-256-GCM</span>
        </div>
        <div className="p-3 rounded-xl bg-[#0f1422] border border-purple-900/40 text-center">
          <span className="block text-[10px] font-mono text-purple-400 uppercase">Key Protection</span>
          <span className="block text-xs font-bold text-white mt-0.5">RSA-OAEP (SPKI)</span>
        </div>
        <div className="p-3 rounded-xl bg-[#0f1422] border border-emerald-900/40 text-center">
          <span className="block text-[10px] font-mono text-emerald-400 uppercase">Integrity</span>
          <span className="block text-xs font-bold text-white mt-0.5">SHA-256 Digest</span>
        </div>
        <div className="p-3 rounded-xl bg-[#0f1422] border border-amber-900/40 text-center">
          <span className="block text-[10px] font-mono text-amber-400 uppercase">Signature</span>
          <span className="block text-xs font-bold text-white mt-0.5">RSA-PSS (Salt Digest)</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-[#0f1422] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successData ? (
          <div className="space-y-6 py-4 text-center">
            <div className="inline-flex p-4 rounded-full bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">File Encrypted and Sent Securely!</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your document has been transformed into AES-256-GCM ciphertext, signed with your RSA private key, and bound to the recipient's public key.
            </p>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-left font-mono text-xs space-y-2 max-w-lg mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">File Name:</span>
                <span className="text-white font-semibold">{successData.originalFileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Package ID:</span>
                <span className="text-cyan-400 truncate max-w-[200px]">{successData.fileId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SHA-256 Digest:</span>
                <span className="text-emerald-400 truncate max-w-[200px]">{successData.sha256Hash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expiration:</span>
                <span className="text-slate-300">
                  {successData.expiresAt ? new Date(successData.expiresAt).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessData(null);
                  setFile(null);
                  setPassword('');
                  setProgressStep(0);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                Send Another File
              </button>
              <button
                type="button"
                onClick={() => navigate('/sent')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all"
              >
                View Sent Packages
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Selection Box */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                1. Select File for Encryption
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-6 transition-colors text-center relative bg-slate-900/50">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="p-3 rounded-full bg-slate-800 text-cyan-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  {file ? (
                    <div>
                      <p className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB • {file.type || 'Binary Document'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-300">
                        Drag and drop a file, or <span className="text-cyan-400 underline">browse</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        Any document type supported (PDF, DOCX, TXT, Images, ZIP up to 50MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recipient & Expiration Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  2. Intended Recipient
                </label>
                <select
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {recipients.length === 0 ? (
                    <option value="">No other registered users found</option>
                  ) : (
                    recipients.map((rec) => (
                      <option key={rec._id || rec.id} value={rec._id || rec.id}>
                        {rec.name} ({rec.email})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Recipient's RSA public key will be used to encapsulate the AES key.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  3. Expiration Timeframe
                </label>
                <select
                  value={expirationHours}
                  onChange={(e) => setExpirationHours(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="1">1 Hour</option>
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="168">7 Days</option>
                  <option value="0">Never Expire</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enforces automated access revocation after expiration.
                </p>
              </div>
            </div>

            {/* Sender Password to Unlock RSA Private Key */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                4. Your Password (to unlock your RSA private key for signing)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Your private key is protected in the database using PBKDF2 + AES-GCM. Your password unlocks it temporarily in memory to generate the RSA-PSS signature.
              </p>
            </div>

            {/* Progress Pipeline Visualization */}
            {loading && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-900/50 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                  <span className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
                    Cryptographic Pipeline in Progress...
                  </span>
                  <span>{progressStep} / 7</span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progressStep / 7) * 100}%` }}
                  />
                </div>

                <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  {pipelineSteps[progressStep]}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:opacity-95 text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Encrypting & Generating Cryptographic Package...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 stroke-[2.5]" />
                  Encrypt & Send Package
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
