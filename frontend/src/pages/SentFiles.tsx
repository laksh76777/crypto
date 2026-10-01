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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
            <History className="w-4 h-4" />
            <span>TRANSMISSION HISTORY</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sent Encrypted Packages</h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit history of files you encrypted, signed with your RSA private key, and shared with recipients.
          </p>
        </div>

        <button
          onClick={fetchSentFiles}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by file name or recipient..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#0f1422] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono transition-colors"
        />
      </div>

      <div className="bg-[#0f1422] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-mono">
            Loading sent packages...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            {searchQuery ? 'No matching packages found.' : 'You have not sent any files yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-6">File Package</th>
                  <th className="py-3.5 px-6">Recipient</th>
                  <th className="py-3.5 px-6">SHA-256 Digest</th>
                  <th className="py-3.5 px-6">Expiration</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredFiles.map((file) => {
                  const isExpired = file.expiresAt ? new Date() > new Date(file.expiresAt) : false;
                  return (
                    <tr key={file._id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <Link
                              to={`/files/${file._id}`}
                              className="font-bold text-white hover:text-cyan-400 transition-colors block"
                            >
                              {file.originalFileName}
                            </Link>
                            <span className="text-[11px] font-mono text-slate-400">
                              {(file.fileSize / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-200">
                          {typeof file.receiverId === 'object' ? file.receiverId.name : 'Recipient'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {typeof file.receiverId === 'object' ? file.receiverId.email : ''}
                        </div>
                      </td>

                      <td className="py-4 px-6 font-mono text-[11px] text-cyan-400">
                        <span className="truncate max-w-[140px] block" title={file.sha256Hash}>
                          {file.sha256Hash.substring(0, 16)}...
                        </span>
                      </td>

                      <td className="py-4 px-6 text-[11px] font-mono text-slate-400">
                        {file.expiresAt ? (
                          <span className={isExpired ? 'text-red-400' : 'text-slate-300'}>
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
                        <Link
                          to={`/files/${file._id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
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
