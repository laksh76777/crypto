import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fileApi } from '../services/api';
import { FileRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { History, FileText, ExternalLink, Search, RefreshCw } from 'lucide-react';

export const SentFiles: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSentFiles = async () => {
    setLoading(true);
    try {
      const res = await fileApi.getSentFiles();
      if (res.data.success) {
        setFiles(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load sent files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentFiles();
  }, []);

  const filteredFiles = files.filter((f) =>
    f.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (typeof f.receiverId === 'object' && f.receiverId.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
            <History className="w-4 h-4" />
            <span className="tracking-widest uppercase">TRANSMISSION HISTORY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Sent Encrypted Packages</h1>
          <p className="text-xs text-[var(--sub)] mt-1">
            Audit trail of files encrypted with AES-256-GCM, signed with your RSA-PSS key, and transferred across recipients.
          </p>
        </div>

        <button
          onClick={fetchSentFiles}
          className="self-start sm:self-auto pill-glass px-4 py-2 text-xs font-semibold flex items-center gap-2 text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh Feed
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transmissions by file name or recipient email..."
          className="w-full pl-10 pr-4 py-2.5 neural-input rounded-xl text-sm text-white placeholder-white/30 focus:outline-none"
        />
      </div>

      <div className="neural-card rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-16 text-center text-[var(--sub)] text-xs font-mono">
            Loading sent encrypted packages...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-16 text-center text-[var(--sub)] text-xs font-mono">
            {searchQuery ? 'No matching packages found.' : 'You have not dispatched any encrypted files yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-[var(--sub)] font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-6">Encrypted Package</th>
                  <th className="py-3.5 px-6">Recipient Identity</th>
                  <th className="py-3.5 px-6">SHA-256 Digest</th>
                  <th className="py-3.5 px-6">Expiration</th>
                  <th className="py-3.5 px-6">Security State</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredFiles.map((file) => {
                  const isExpired = file.expiresAt ? new Date() > new Date(file.expiresAt) : false;
                  return (
                    <tr key={file._id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-cyan-300 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <Link
                              to={`/files/${file._id}`}
                              className="font-bold text-white hover:text-cyan-300 transition-colors block"
                            >
                              {file.originalFileName}
                            </Link>
                            <span className="text-[11px] font-mono text-[var(--sub)]">
                              {(file.fileSize / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-medium text-white">
                          {typeof file.receiverId === 'object' ? file.receiverId.name : 'Recipient'}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--sub)]">
                          {typeof file.receiverId === 'object' ? file.receiverId.email : ''}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-mono text-[11px] text-cyan-300">
                        <span className="truncate max-w-[140px] block" title={file.sha256Hash}>
                          {file.sha256Hash.substring(0, 16)}...
                        </span>
                      </td>

                      <td className="py-4 px-6 text-[11px] font-mono text-[var(--sub)]">
                        {file.expiresAt ? (
                          <span className={isExpired ? 'text-rose-400' : 'text-slate-300'}>
                            {new Date(file.expiresAt).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-white/30">Never</span>
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
                        <Link
                          to={`/files/${file._id}`}
                          className="pill-glass px-3 py-1.5 text-white hover:bg-white/15 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
