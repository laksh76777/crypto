import React, { useEffect, useState } from 'react';
import { auditApi } from '../services/api';
import { AuditLog } from '../types';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          SUCCESS
        </span>
      );
    }
    if (result === 'FAILURE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800">
          <XCircle className="w-3 h-3 text-red-400" />
          FAILURE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
        <AlertTriangle className="w-3 h-3 text-amber-400" />
        WARNING
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
            <Terminal className="w-4 h-4" />
            <span>AUDIT & SIEM EVENT LOGGING</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable security event logs tracking authentication, hybrid cryptographic operations, integrity verifications, and intrusion alerts.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, user email, or IP address..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f1422] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono transition-colors"
          />
        </div>

        <div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#0f1422] border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Security Events</option>
            <option value="USER_REGISTERED">USER_REGISTERED</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="FILE_UPLOADED">FILE_UPLOADED</option>
            <option value="FILE_ENCRYPTED">FILE_ENCRYPTED</option>
            <option value="FILE_SHARED">FILE_SHARED</option>
            <option value="FILE_DECRYPTED">FILE_DECRYPTED</option>
            <option value="INTEGRITY_VERIFIED">INTEGRITY_VERIFIED</option>
            <option value="INTEGRITY_FAILED">INTEGRITY_FAILED</option>
            <option value="SIGNATURE_VERIFIED">SIGNATURE_VERIFIED</option>
            <option value="SIGNATURE_FAILED">SIGNATURE_FAILED</option>
            <option value="UNAUTHORIZED_ACCESS">UNAUTHORIZED_ACCESS</option>
            <option value="FILE_EXPIRED">FILE_EXPIRED</option>
            <option value="FILE_TAMPERED_DEMO">FILE_TAMPERED_DEMO</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0f1422] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-mono">
            Fetching security audit trail...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            No audit logs found for current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Event Action</th>
                  <th className="py-3.5 px-6">Result</th>
                  <th className="py-3.5 px-6">Actor</th>
                  <th className="py-3.5 px-6">IP Address</th>
                  <th className="py-3.5 px-6">Contextual Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-6 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-6 font-bold text-white whitespace-nowrap">
                      <span className="text-cyan-400">{log.action}</span>
                    </td>

                    <td className="py-3.5 px-6 whitespace-nowrap">
                      {getResultBadge(log.result)}
                    </td>

                    <td className="py-3.5 px-6 text-slate-300 whitespace-nowrap">
                      {typeof log.userId === 'object' && log.userId
                        ? `${log.userId.name} (${log.userId.email})`
                        : 'System / Guest'}
                    </td>

                    <td className="py-3.5 px-6 text-slate-400 whitespace-nowrap">
                      {log.ipAddress}
                    </td>

                    <td className="py-3.5 px-6 text-slate-400 max-w-xs truncate">
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
