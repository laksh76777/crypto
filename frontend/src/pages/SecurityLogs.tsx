import React, { useEffect, useState } from 'react';
import { auditApi } from '../services/api';
import { AuditLog } from '../types';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Terminal,
  Activity
} from 'lucide-react';

export const SecurityLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditApi.getLogs({
        action: filterAction || undefined,
        limit: 150
      });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  const filteredLogs = logs.filter((log) => {
    const search = searchQuery.toLowerCase();
    const actionMatch = log.action.toLowerCase().includes(search);
    const userMatch =
      typeof log.userId === 'object' && log.userId
        ? (log.userId.name?.toLowerCase().includes(search) || log.userId.email?.toLowerCase().includes(search))
        : false;
    const ipMatch = log.ipAddress.includes(search);
    return actionMatch || userMatch || ipMatch;
  });

  const getResultBadge = (result: 'SUCCESS' | 'FAILURE' | 'WARNING') => {
    if (result === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          SUCCESS
        </span>
      );
    }
    if (result === 'FAILURE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/30">
          <XCircle className="w-3 h-3 text-rose-400" />
          FAILURE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30">
        <AlertTriangle className="w-3 h-3 text-amber-400" />
        WARNING
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
            <Terminal className="w-4 h-4" />
            <span className="tracking-widest uppercase">AUDIT & SIEM EVENT LOGGING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Security Audit Logs</h1>
          <p className="text-xs text-[var(--sub)] mt-1">
            Immutable security event ledger recording authentication, cryptographic operations, SHA-256 verification, and tampering detection.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto pill-glass px-4 py-2 text-xs font-semibold flex items-center gap-2 text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, user email, or IP address..."
            className="w-full pl-10 pr-4 py-2.5 neural-input rounded-xl text-sm text-white placeholder-white/30 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-4 py-2.5 neural-input rounded-xl text-sm text-white focus:outline-none font-mono"
          >
            <option value="" className="bg-[#060c16] text-white">All Security Events</option>
            <option value="USER_REGISTERED" className="bg-[#060c16] text-white">USER_REGISTERED</option>
            <option value="LOGIN_SUCCESS" className="bg-[#060c16] text-white">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED" className="bg-[#060c16] text-white">LOGIN_FAILED</option>
            <option value="FILE_UPLOADED" className="bg-[#060c16] text-white">FILE_UPLOADED</option>
            <option value="FILE_ENCRYPTED" className="bg-[#060c16] text-white">FILE_ENCRYPTED</option>
            <option value="FILE_SHARED" className="bg-[#060c16] text-white">FILE_SHARED</option>
            <option value="FILE_DECRYPTED" className="bg-[#060c16] text-white">FILE_DECRYPTED</option>
            <option value="INTEGRITY_VERIFIED" className="bg-[#060c16] text-white">INTEGRITY_VERIFIED</option>
            <option value="INTEGRITY_FAILED" className="bg-[#060c16] text-white">INTEGRITY_FAILED</option>
            <option value="SIGNATURE_VERIFIED" className="bg-[#060c16] text-white">SIGNATURE_VERIFIED</option>
            <option value="SIGNATURE_FAILED" className="bg-[#060c16] text-white">SIGNATURE_FAILED</option>
            <option value="UNAUTHORIZED_ACCESS" className="bg-[#060c16] text-white">UNAUTHORIZED_ACCESS</option>
            <option value="FILE_EXPIRED" className="bg-[#060c16] text-white">FILE_EXPIRED</option>
            <option value="FILE_TAMPERED_DEMO" className="bg-[#060c16] text-white">FILE_TAMPERED_DEMO</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="neural-card rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-16 text-center text-[var(--sub)] text-xs font-mono">
            Fetching security audit trail...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-[var(--sub)] text-xs font-mono">
            No audit records found matching current query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-[var(--sub)] font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Event Action</th>
                  <th className="py-3.5 px-6">Result</th>
                  <th className="py-3.5 px-6">Actor</th>
                  <th className="py-3.5 px-6">IP Address</th>
                  <th className="py-3.5 px-6">Contextual Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-3.5 px-6 text-[var(--sub)] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-6 font-bold text-white whitespace-nowrap">
                      <span className="text-cyan-300">{log.action}</span>
                    </td>

                    <td className="py-3.5 px-6 whitespace-nowrap">
                      {getResultBadge(log.result)}
                    </td>

                    <td className="py-3.5 px-6 text-white whitespace-nowrap">
                      {typeof log.userId === 'object' && log.userId
                        ? `${log.userId.name} (${log.userId.email})`
                        : 'System / Guest'}
                    </td>

                    <td className="py-3.5 px-6 text-[var(--sub)] whitespace-nowrap">
                      {log.ipAddress}
                    </td>

                    <td className="py-3.5 px-6 text-[var(--sub)] max-w-xs truncate">
                      {log.metadata && Object.keys(log.metadata).length > 0
                        ? JSON.stringify(log.metadata)
                        : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
