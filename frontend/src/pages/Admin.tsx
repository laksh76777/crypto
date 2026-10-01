import React, { useEffect, useState } from 'react';
import { adminApi } from '../services/api';
import { User, SystemStats } from '../types';
import {
  UserCheck,
  ShieldAlert,
  Users,
  Lock,
  Activity,
  UserX,
  RefreshCw,
  AlertTriangle,
  KeyRound
} from 'lucide-react';

export const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getStatistics()
      ]);
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const toggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    setActionLoadingId(user.id || user._id || '');
    try {
      await adminApi.updateUserStatus(user.id || user._id || '', newStatus);
      await fetchAdminData();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono mb-1">
            <UserCheck className="w-4 h-4" />
            <span className="tracking-widest uppercase">ADMINISTRATIVE CONTROL CENTER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">System & User Governance</h1>
          <p className="text-xs text-[var(--sub)] mt-1">
            Manage registered cryptographic identities, toggle user access authorization, and audit system-wide cryptographic metrics.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="self-start sm:self-auto pill-glass px-4 py-2 text-xs font-semibold flex items-center gap-2 text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="neural-card rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)] block mb-1">Total Users</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white">{stats ? stats.totalUsers : '--'}</div>
          <span className="text-[11px] font-mono text-cyan-300 mt-1 block">Registered Keypairs</span>
        </div>
        <div className="neural-card rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)] block mb-1">Active Accounts</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">{stats ? stats.activeUsers : '--'}</div>
          <span className="text-[11px] font-mono text-emerald-300 mt-1 block">Authorized to Transfer</span>
        </div>
        <div className="neural-card rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)] block mb-1">Total File Packages</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-indigo-300">{stats ? stats.totalFiles : '--'}</div>
          <span className="text-[11px] font-mono text-indigo-200/80 mt-1 block">Encrypted with AES-256-GCM</span>
        </div>
        <div className="neural-card rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)] block mb-1">Verified Operations</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300">{stats ? stats.verifiedCount : '--'}</div>
          <span className="text-[11px] font-mono text-amber-200/80 mt-1 block">SHA-256 & RSA-PSS Verified</span>
        </div>
      </div>

      {/* User Management Table */}
      <div className="neural-card rounded-2xl shadow-2xl overflow-hidden space-y-4 p-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <Users className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Registered Users & Key Registry</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-[var(--sub)] font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">RSA Public Key</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {users.map((u) => {
                const uId = u.id || u._id || '';
                const isActive = u.status === 'ACTIVE';
                return (
                  <tr key={uId} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[11px] font-mono text-cyan-300">{u.email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30' : 'bg-white/10 text-white/80'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[10px] text-[var(--sub)]">
                      <span className="truncate max-w-[140px] block" title={u.publicKey}>
                        {u.publicKey ? u.publicKey.substring(0, 30) + '...' : 'SPKI Registered'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        isActive
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                      }`}>
                        {u.status || 'ACTIVE'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[var(--sub)] font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toggleUserStatus(u)}
                        disabled={actionLoadingId === uId}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-200 border border-rose-800/40'
                            : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-800/40'
                        }`}
                      >
                        {actionLoadingId === uId
                          ? 'Updating...'
                          : isActive
                          ? 'Disable Access'
                          : 'Activate User'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
