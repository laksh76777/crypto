import axios from 'axios';
import { User, FileRecord, VerificationResult, AuditLog, SystemStats } from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE
});

// Request Interceptor: inject Bearer JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cryptashare_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post<{ success: boolean; message: string; data: { token: string; user: User } }>('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post<{ success: boolean; message: string; data: { token: string; user: User } }>('/auth/login', data),

  getMe: () =>
    api.get<{ success: boolean; message: string; data: User }>('/auth/me')
};

export const fileApi = {
  shareFile: (formData: FormData) =>
    api.post<{ success: boolean; message: string; data: any }>('/files/share', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  getSentFiles: () =>
    api.get<{ success: boolean; message: string; data: FileRecord[] }>('/files/sent'),

  getReceivedFiles: () =>
    api.get<{ success: boolean; message: string; data: FileRecord[] }>('/files/received'),

  getFileById: (id: string) =>
    api.get<{ success: boolean; message: string; data: FileRecord }>('/files/' + id),

  verifyFile: (id: string, password: string) =>
    api.post<{ success: boolean; message: string; data: VerificationResult }>('/files/' + id + '/verify', { password }),

  downloadFile: (id: string, password: string) =>
    api.post('/files/' + id + '/download', { password }, { responseType: 'blob' }),

  simulateTamper: (id: string) =>
    api.post<{ success: boolean; message: string }>('/files/' + id + '/tamper'),

  restoreTamper: (id: string) =>
    api.post<{ success: boolean; message: string }>('/files/' + id + '/restore')
};

export const userApi = {
  getRecipients: () =>
    api.get<{ success: boolean; message: string; data: User[] }>('/users/recipients'),

  getStatistics: () =>
    api.get<{ success: boolean; message: string; data: SystemStats }>('/users/statistics')
};

export const auditApi = {
  getLogs: (params?: { action?: string; limit?: number }) =>
    api.get<{ success: boolean; message: string; data: AuditLog[] }>('/audit-logs', { params })
};

export const adminApi = {
  getUsers: () =>
    api.get<{ success: boolean; message: string; data: User[] }>('/admin/users'),

  updateUserStatus: (userId: string, status: 'ACTIVE' | 'DISABLED') =>
    api.patch<{ success: boolean; message: string; data: User }>('/admin/users/' + userId + '/status', { status }),

  getStatistics: () =>
    api.get<{ success: boolean; message: string; data: SystemStats }>('/admin/statistics'),

  getAuditLogs: (params?: { userId?: string; action?: string; limit?: number }) =>
    api.get<{ success: boolean; message: string; data: AuditLog[] }>('/admin/audit-logs', { params })
};

export default api;
