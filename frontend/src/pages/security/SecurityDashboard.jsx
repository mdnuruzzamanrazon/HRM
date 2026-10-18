import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Loader2, Shield, Key, Lock, Smartphone, ShieldAlert, 
  MonitorSmartphone, ShieldCheck, History, Search, Filter, 
  User, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatSafeDistanceToNow, formatSafeDate } from '../../utils/date';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SecurityDashboard() {
  const { user } = useAuth();
  
  const [sessions, setSessions] = useState([]);
  const [policy, setPolicy] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [verificationToken, setVerificationToken] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, policyRes] = await Promise.all([
        api.get('/security/sessions'),
        isAdmin ? api.get('/security/policies') : Promise.resolve({ data: { data: {} } })
      ]);
      setSessions(sessionsRes.data.data || []);
      if (policyRes.data.data) setPolicy(policyRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!isAdmin) return;
    try {
      setAuditLoading(true);
      const { data } = await api.get('/security/audit-logs');
      setAuditLogs(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (isAdmin) {
      fetchAuditLogs();
    }
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.put('/auth/update-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      notify('success', 'Password updated successfully. Please use your new password next time you log in.');
      reset();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to update password');
    }
  };

  const handleRevokeSession = async (id) => {
    try {
      await api.delete(`/security/sessions/${id}`);
      notify('success', 'Session revoked successfully');
      fetchData();
    } catch (err) {
      notify('error', 'Failed to revoke session');
    }
  };

  const handleUpdatePolicy = async (updates) => {
    try {
      const { data } = await api.put('/security/policies', updates);
      setPolicy(data.data);
      notify('success', 'Security policy updated');
    } catch (err) {
      notify('error', 'Failed to update policy');
    }
  };

  const handleSetup2FA = async () => {
    try {
      const { data } = await api.post('/security/2fa/setup');
      setQrCodeUrl(data.data.qrCodeUrl);
      setIs2FAModalOpen(true);
    } catch (err) {
      notify('error', 'Failed to setup 2FA');
    }
  };

  const handleVerify2FA = async () => {
    try {
      await api.post('/security/2fa/verify', { token: verificationToken });
      notify('success', '2FA Enabled Successfully!');
      setIs2FAModalOpen(false);
      window.location.reload(); 
    } catch (err) {
      notify('error', err.response?.data?.message || 'Invalid 2FA code');
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This makes your account less secure.')) return;
    try {
      await api.post('/security/2fa/disable');
      notify('success', '2FA Disabled.');
      window.location.reload();
    } catch (err) {
      notify('error', 'Failed to disable 2FA');
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (auditFilter === 'ALL') return true;
    return log.module === auditFilter;
  });

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium shadow-md transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center tracking-tight">
          Security Settings, Permissions & Audit Trail
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage administrative authentication, enforce cryptographic 2FA policies, supervise sessions, and review immutable audit logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Change Password Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center">
              <Key className="w-5 h-5 text-primary mr-3 shrink-0" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Change Password</h3>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Current Password *</label>
                <input 
                  type="password" 
                  {...register('currentPassword')} 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 text-xs" 
                />
                {errors.currentPassword && <p className="mt-1 text-xs text-rose-500">{errors.currentPassword.message}</p>}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">New Password *</label>
                  <input 
                    type="password" 
                    {...register('newPassword')} 
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 text-xs" 
                  />
                  {errors.newPassword && <p className="mt-1 text-xs text-rose-500">{errors.newPassword.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Confirm New Password *</label>
                  <input 
                    type="password" 
                    {...register('confirmPassword')} 
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 text-xs" 
                  />
                  {errors.confirmPassword && <p className="mt-1 text-xs text-rose-500">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <div className="pt-3 flex justify-end border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-5 py-2.5 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-hover transition-colors shadow-xs flex items-center justify-center cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center">
                <Smartphone className="w-5 h-5 text-slate-500 mr-3 shrink-0" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Active Device Sessions</h3>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {loading ? (
                 <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : sessions.map((session, idx) => (
                <div key={session._id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-xl gap-3 ${idx === 0 ? 'border-brand-200 bg-brand-50/40' : 'border-slate-200/80'}`}>
                  <div className="flex items-center min-w-0">
                    <MonitorSmartphone className={`w-8 h-8 ${idx === 0 ? 'text-primary' : 'text-slate-400'} mr-3 shrink-0`} />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={session.deviceInfo}>{session.deviceInfo || 'Authorized Workstation'}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">IP: {session.ipAddress || '127.0.0.1'} • Last Active: {formatSafeDistanceToNow(session.lastActive)} ago</p>
                    </div>
                  </div>
                  <div className="flex justify-end items-center shrink-0">
                    {idx === 0 ? (
                      <span className="px-2.5 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full border border-emerald-200">
                        Current Session
                      </span>
                    ) : (
                      <button onClick={() => handleRevokeSession(session._id)} className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors border border-rose-200 cursor-pointer">
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Security Policies & 2FA */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center">
              <Shield className="w-5 h-5 text-primary mr-3 shrink-0" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Account Protection</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start">
                <div className="p-2 bg-emerald-50 rounded-xl mr-3 shrink-0">
                  <Lock className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">RBAC Access Control</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Enforced across all backend API endpoints and collections.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className={`p-2 rounded-xl mr-3 shrink-0 ${user.isTwoFactorEnabled ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  {user.isTwoFactorEnabled ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <ShieldAlert className="w-5 h-5 text-amber-600" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Two-Factor Authentication</h4>
                  <p className="text-xs text-slate-400 mt-0.5 mb-2">
                    {user.isTwoFactorEnabled ? '2FA is active and securing your account.' : 'Enhance your security by enabling TOTP 2FA.'}
                  </p>
                  {user.isTwoFactorEnabled ? (
                    <button onClick={handleDisable2FA} className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer">Disable 2FA</button>
                  ) : (
                    <button onClick={handleSetup2FA} className="text-xs font-bold text-primary hover:underline cursor-pointer">Setup 2FA</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
              <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Governance Policies</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-700">Enforce Strong Passwords</div>
                  <button 
                    onClick={() => handleUpdatePolicy({ enforceStrongPasswords: !policy.enforceStrongPasswords })}
                    className={`w-10 h-5 rounded-full relative shadow-inner cursor-pointer transition-colors ${policy.enforceStrongPasswords ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${policy.enforceStrongPasswords ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-700">Inactivity Timeout (15m)</div>
                  <button className="w-10 h-5 bg-emerald-500 rounded-full relative shadow-inner opacity-70 cursor-not-allowed">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-700">Require 2FA for Admins</div>
                  <button 
                    onClick={() => handleUpdatePolicy({ require2FA: !policy.require2FA })}
                    className={`w-10 h-5 rounded-full relative shadow-inner cursor-pointer transition-colors ${policy.require2FA ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${policy.require2FA ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enterprise Administrative Audit Logs */}
      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden space-y-0">
          <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Administrative Audit Logs</h3>
                <p className="text-xs text-slate-400">Chronological history of management actions, overrides, password resets, and deletions.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAuditLogs}
                disabled={auditLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Module Filter */}
          <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto custom-scrollbar">
            {['ALL', 'EMPLOYEE', 'ATTENDANCE', 'LEAVE', 'PAYROLL', 'SHIFT', 'EXPENSE'].map((mod) => (
              <button
                key={mod}
                onClick={() => setAuditFilter(mod)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  auditFilter === mod
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Operator / Admin</th>
                  <th className="py-3.5 px-6">Module</th>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-6">Target Resource</th>
                  <th className="py-3.5 px-6">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const actionColor = {
                    CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
                    DELETE: 'bg-rose-50 text-rose-700 border-rose-200'
                  }[log.action] || 'bg-slate-100 text-slate-700';

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 whitespace-nowrap font-mono text-slate-700">
                        {formatSafeDate(log.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{log.userId?.email || 'System Administrator'}</div>
                        <div className="text-[11px] text-slate-400">{log.userId?.role || 'SUPER_ADMIN'}</div>
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap font-bold text-slate-800">
                        {log.module}
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${actionColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                        {log.resourceId ? String(log.resourceId).slice(-8) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-semibold text-slate-500">No audit records in this category yet.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">All administrative modifications are logged automatically.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Setup Two-Factor Auth</h3>
              <button onClick={() => setIs2FAModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">&times;</button>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-4">Scan this QR code with Google Authenticator or Microsoft Authenticator.</p>
              {qrCodeUrl && <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto border border-slate-200 rounded-xl shadow-xs mb-4 max-w-[180px] w-full" />}
              <input 
                type="text" 
                placeholder="6-digit TOTP code" 
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                className="w-full text-center tracking-widest text-lg px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none mb-4 font-mono font-bold" 
                maxLength={6}
              />
              <button 
                onClick={handleVerify2FA}
                disabled={verificationToken.length < 6}
                className="w-full px-4 py-2.5 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-hover transition-colors shadow-xs disabled:opacity-70 cursor-pointer"
              >
                Verify & Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}