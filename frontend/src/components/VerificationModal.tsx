import React, { useState } from 'react';
import { fileApi } from '../services/api';
import { VerificationResult, FileRecord } from '../types';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Lock, Download, KeyRound, Loader2, FileText } from 'lucide-react';

interface VerificationModalProps {
  file: FileRecord;
  onClose: () => void;
  onVerified?: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ file, onClose, onVerified }) => {
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your account password to decrypt your RSA private key.');
      return;
    }

    setVerifying(true);
    setError(null);
    setResult(null);

    try {
      const res = await fileApi.verifyFile(file._id, password);
      setResult(res.data.data);
      if (res.data.data.allChecksPassed && onVerified) {
        onVerified();
      }
    } catch (err: any) {
      const resData = err.response?.data;
      if (resData?.data) {
        setResult(resData.data);
      }
      setError(resData?.message || err.message || 'Verification process encountered an error');
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.allChecksPassed) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await fileApi.downloadFile(file._id, password);
      const blob = res.data instanceof Blob
        ? res.data
        : new Blob([res.data], { type: file.mimeType || 'application/octet-stream' });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', file.originalFileName);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        window.URL.revokeObjectURL(downloadUrl);
      }, 200);
    } catch (err: any) {
      let errorMsg = err.message || 'Download failed';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          errorMsg = parsed.message || errorMsg;
        } catch {}
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setError('Download failed: ' + errorMsg);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl neural-card border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/15 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Sora']">Cryptographic Verification & Decryption</h3>
              <p className="text-xs text-[#a2a9b8]">Multi-layer hybrid integrity pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="pill-glass w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white text-base leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* File summary */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-white/5 text-cyan-400 border border-white/10">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white font-['Sora']">{file.originalFileName}</p>
                <p className="text-xs font-mono text-[#a2a9b8]">{(file.fileSize / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-[#a2a9b8]">Sender: </span>
              <span className="font-semibold text-cyan-300">
                {typeof file.senderId === 'object' ? file.senderId.name : 'Authorized Sender'}
              </span>
            </div>
          </div>

          {/* Password Input to unlock private key */}
          {!result?.allChecksPassed && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5 font-['Sora']">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  Enter Account Password (to unlock your RSA private key)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full px-4 py-2.5 neural-input text-sm font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-[#a2a9b8] mt-1.5">
                  Required to decrypt your private key (PBKDF2 + AES-256-GCM) so it can recover the AES session key.
                </p>
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="cta-glass w-full py-3 text-xs font-bold uppercase tracking-wider"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Executing Cryptographic Pipeline...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-1.5" />
                    Execute Verification & Decrypt
                  </>
                )}
              </button>
            </form>
          )}

          {/* Verification Results Display */}
          {result && (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#a2a9b8] flex items-center justify-between font-['Sora']">
                <span>Cryptographic Verification Pipeline</span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${result.allChecksPassed ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-red-950/80 text-red-400 border border-red-800'}`}>
                  {result.allChecksPassed ? 'ALL CHECKS PASSED' : 'VERIFICATION FAILED'}
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {/* Step 1: RSA-OAEP */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${result.aesKeyDecrypted ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-red-950/20 border-red-800/40 text-red-300'}`}>
                  <div className="flex items-center gap-2.5">
                    {result.aesKeyDecrypted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    <span>1. RSA-OAEP Key Protection</span>
                  </div>
                  <span className="text-[11px]">{result.aesKeyDecrypted ? 'AES Session Key Recovered' : 'Failed to Decrypt Key'}</span>
                </div>

                {/* Step 2: AES-256-GCM */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${result.aesGcmAuthPassed ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-red-950/20 border-red-800/40 text-red-300'}`}>
                  <div className="flex items-center gap-2.5">
                    {result.aesGcmAuthPassed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    <span>2. AES-256-GCM Decryption</span>
                  </div>
                  <span className="text-[11px]">{result.aesGcmAuthPassed ? 'Auth Tag Verified (No Ciphertext Tampering)' : 'Auth Tag Mismatch'}</span>
                </div>

                {/* Step 3: SHA-256 */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${result.sha256Matched ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-red-950/20 border-red-800/40 text-red-300'}`}>
                  <div className="flex items-center gap-2.5">
                    {result.sha256Matched ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    <span>3. SHA-256 File Digest Integrity</span>
                  </div>
                  <span className="text-[11px]">{result.sha256Matched ? 'Original Hash === Decrypted Hash' : 'Hash Mismatch'}</span>
                </div>

                {/* Step 4: RSA-PSS */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${result.signatureVerified ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-red-950/20 border-red-800/40 text-red-300'}`}>
                  <div className="flex items-center gap-2.5">
                    {result.signatureVerified ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    <span>4. RSA-PSS Digital Signature</span>
                  </div>
                  <span className="text-[11px]">{result.signatureVerified ? 'Sender Authenticity Verified' : 'Invalid Signature'}</span>
                </div>
              </div>

              {/* Hash details */}
              <div className="p-3 bg-black/50 rounded-xl border border-white/10 font-mono text-[11px] space-y-1">
                <div className="text-slate-400">Stored SHA-256 Digest:</div>
                <div className="text-cyan-300 truncate">{result.originalHash}</div>
                {result.computedHash && (
                  <>
                    <div className="text-slate-400 pt-1">Decrypted SHA-256 Digest:</div>
                    <div className={`truncate ${result.sha256Matched ? 'text-emerald-400' : 'text-red-400 font-bold'}`}>
                      {result.computedHash}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Prominent Security Warning if Verification Failed */}
          {result && !result.allChecksPassed && (
            <div className="p-5 rounded-2xl bg-red-950/70 border border-red-500/80 text-red-200 space-y-2 animate-shake shadow-2xl shadow-red-950/50">
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
              <div className="text-[11px] font-mono text-red-400/90 bg-black/60 p-2.5 rounded border border-red-900/50">
                Download blocked. {result.errorMessage}
              </div>
            </div>
          )}

          {error && !result && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <button
            onClick={onClose}
            className="pill-glass px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Close
          </button>

          {result?.allChecksPassed && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="cta-glass px-5 py-2.5 text-xs font-bold"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Verified File
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
