import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fileApi } from '../services/api';
import { FileRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { VerificationModal } from '../components/VerificationModal';
import {
  Inbox,
  ShieldCheck,
  FileText,
  Search,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export const ReceivedFiles: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileForModal, setSelectedFileForModal] = useState<FileRecord | null>(null);

  const fetchReceivedFiles = async () => {
    setLoading(true);
    try {
      const res = await fileApi.getReceivedFiles();
      if (res.data.success) {
        setFiles(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load received files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivedFiles();
  }, []);

  const filteredFiles = files.filter((f) =>
    f.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (typeof f.senderId === 'object' && f.senderId.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
            <Inbox className="w-4 h-4" />
            <span>INCOMING SECURE PACKAGES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Sora']">Received Encrypted Files</h1>
          <p className="text-xs text-[#a2a9b8] mt-1 max-w-3xl leading-relaxed">
            Files sent to you are locked using your RSA public key. Verification unlocks your private key to decrypt the AES session key, verifies the ciphertext tag, compares SHA-256 digests, and validates the sender's RSA-PSS signature.
          </p>
        </div>

        <button
          onClick={fetchReceivedFiles}
          className="self-start sm:self-auto pill-glass px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by file name or sender name..."
          className="w-full pl-10 pr-4 py-2.5 neural-input text-sm font-mono"
        />
      </div>

      {/* Table / List */}
      <div className="neural-card shadow-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-mono">
            Loading encrypted packages...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-mono">
            {searchQuery ? 'No matching packages found.' : 'You have not received any encrypted files yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-6">File Package</th>
                  <th className="py-3.5 px-6">Sender Identity</th>
                  <th className="py-3.5 px-6">Cryptographic Security</th>
                  <th className="py-3.5 px-6">Expiration</th>
                  <th className="py-3.5 px-6">Integrity Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredFiles.map((file) => {
                  const isExpired = file.expiresAt ? new Date() > new Date(file.expiresAt) : false;
                  return (
                    <tr key={file._id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-cyan-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <Link
                              to={`/files/${file._id}`}
                              className="font-bold text-white hover:text-cyan-300 transition-colors block font-['Sora']"
                            >
                              {file.originalFileName}
                            </Link>
                            <span className="text-[11px] font-mono text-[#a2a9b8]">
                              {(file.fileSize / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-200 font-['Sora']">
                          {typeof file.senderId === 'object' ? file.senderId.name : 'Unknown Sender'}
                        </div>
                        <div className="text-[11px] font-mono text-cyan-400/80">
                          {typeof file.senderId === 'object' ? file.senderId.email : ''}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-mono text-[11px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-emerald-400">✓ AES-256-GCM</span>
                          <span className="text-purple-400">✓ RSA-OAEP</span>
                          <span className="text-cyan-400">✓ SHA-256 Digest</span>
                          <span className="text-amber-400">✓ RSA-PSS Signature</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-[11px] font-mono text-[#a2a9b8]">
                        {file.expiresAt ? (
                          <span className={isExpired ? 'text-red-400 font-bold' : 'text-slate-300'}>
                            {new Date(file.expiresAt).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-500">Never</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <StatusBadge
                          status={file.status}
                          isTampered={file.isTampered}
                          isExpired={isExpired}
                        />
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/files/${file._id}`}
                            className="pill-glass p-2 text-slate-300 hover:text-white"
                            title="Inspect Cryptographic Package"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {isExpired ? (
                            <button
                              disabled
                              className="pill-glass px-3.5 py-1.5 text-xs text-slate-500 opacity-60 cursor-not-allowed"
                            >
                              Expired
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedFileForModal(file)}
                              className="cta-glass px-3.5 py-1.5 text-xs font-bold"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                              Verify & Download
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {selectedFileForModal && (
        <VerificationModal
          file={selectedFileForModal}
          onClose={() => setSelectedFileForModal(null)}
          onVerified={() => fetchReceivedFiles()}
        />
      )}
    </div>
  );
};
