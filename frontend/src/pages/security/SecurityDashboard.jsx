import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Shield, Key, Lock, Smartphone, ShieldAlert, MonitorSmartphone, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatSafeDistanceToNow } from '../../utils/date';

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
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [verificationToken, setVerificationToken] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, policyRes] = await Promise.all([
        api.get('/security/sessions'),
        ['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role) ? api.get('/security/policies') : Promise.resolve({ data: { data: {} } })
      ]);
      setSessions(sessionsRes.data.data);
      if (policyRes.data.data) setPolicy(policyRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.put('/auth/update-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      alert('Password updated successfully. Please use your new password next time you log in.');
      reset();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update password');
    }
  };

  const handleRevokeSession = async (id) => {
    try {
      await api.delete(`/security/sessions/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to revoke session');
    }
  };

  const handleUpdatePolicy = async (updates) => {
    try {
      const { data } = await api.put('/security/policies', updates);
      setPolicy(data.data);
    } catch (err) {
      alert('Failed to update policy');
    }
  };

  const handleSetup2FA = async () => {
    try {
      const { data } = await api.post('/security/2fa/setup');
      setQrCodeUrl(data.data.qrCodeUrl);
      setIs2FAModalOpen(true);
    } catch (err) {
      alert('Failed to setup 2FA');
    }
  };

  const handleVerify2FA = async () => {
    try {
      await api.post('/security/2fa/verify', { token: verificationToken });
      alert('2FA Enabled Successfully!');
      setIs2FAModalOpen(false);
      window.location.reload(); 
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid code');
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This makes your account less secure.')) return;
    try {
      await api.post('/security/2fa/disable');
      alert('2FA Disabled.');
      window.location.reload();
    } catch (err) {
      alert('Failed to disable 2FA');
    }
  };

  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user.role);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center tracking-tight">
          Security Settings
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage account authentication, active sessions, and security policies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Change Password Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50/50 flex items-center">
              <Key className="w-5 h-5 text-primary mr-3 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Change Password</h3>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input 
                  type="password" 
                  {...register('currentPassword')} 
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm" 
                />
                {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword.message}</p>}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-1">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input 
                    type="password" 
                    {...register('newPassword')} 
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm" 
                  />
                  {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword.message}</p>}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    {...register('confirmPassword')} 
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm" 
                  />
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <div className="pt-4 flex justify-end border-t border-gray-50">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center justify-center cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Device Management */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center">
                <Smartphone className="w-5 h-5 text-gray-500 mr-3 shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Active Sessions</h3>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {loading ? (
                 <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : sessions.map((session, idx) => (
                <div key={session._id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 sm:p-4 border rounded-xl gap-3 ${idx === 0 ? 'border-brand-200 bg-brand-50/50' : 'border-gray-200'}`}>
                  <div className="flex items-center min-w-0">
                    <MonitorSmartphone className={`w-7 h-7 sm:w-8 sm:h-8 ${idx === 0 ? 'text-brand-600' : 'text-gray-400'} mr-3 sm:mr-4 shrink-0`} />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate" title={session.deviceInfo}>{session.deviceInfo || 'Unknown Device'}</h4>
                      <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">IP: {session.ipAddress || '127.0.0.1'} • Last Active: {formatSafeDistanceToNow(session.lastActive)} ago</p>
                    </div>
                  </div>
                  <div className="flex justify-end items-center shrink-0">
                    {idx === 0 ? (
                      <span className="px-2.5 py-0.5 text-xs font-semibold text-brand-700 bg-brand-100 rounded-full border border-brand-200">
                        Active Now
                      </span>
                    ) : (
                      <button onClick={() => handleRevokeSession(session._id)} className="text-xs font-medium text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer">
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
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50/50 flex items-center">
              <Shield className="w-5 h-5 text-primary mr-3 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Security Overview</h3>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="flex items-start">
                <div className="p-2 bg-emerald-50 rounded-lg mr-3 shrink-0">
                  <Lock className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Account Status</h4>
                  <p className="text-xs text-gray-500 mt-1">Your account is fully secured and in good standing.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-3 shrink-0 ${user.isTwoFactorEnabled ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  {user.isTwoFactorEnabled ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <ShieldAlert className="w-5 h-5 text-amber-600" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Two-Factor Auth</h4>
                  <p className="text-xs text-gray-500 mt-1 mb-2">
                    {user.isTwoFactorEnabled ? '2FA is active and securing your account.' : 'Enhance your security by enabling 2FA.'}
                  </p>
                  {user.isTwoFactorEnabled ? (
                    <button onClick={handleDisable2FA} className="text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer">Disable 2FA</button>
                  ) : (
                    <button onClick={handleSetup2FA} className="text-xs font-medium text-brand-600 hover:text-brand-700 cursor-pointer">Setup 2FA</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900">Global Admin Policies</h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm text-gray-700">Enforce Strong Passwords</div>
                  <button 
                    onClick={() => handleUpdatePolicy({ enforceStrongPasswords: !policy.enforceStrongPasswords })}
                    className={`w-10 h-5 rounded-full relative shadow-inner cursor-pointer transition-colors ${policy.enforceStrongPasswords ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${policy.enforceStrongPasswords ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm text-gray-700">Session Timeout (15m)</div>
                  <button className="w-10 h-5 bg-emerald-500 rounded-full relative shadow-inner opacity-70 cursor-not-allowed" title="System default">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm text-gray-700">Require 2FA Globally</div>
                  <button 
                    onClick={() => handleUpdatePolicy({ require2FA: !policy.require2FA })}
                    className={`w-10 h-5 rounded-full relative shadow-inner cursor-pointer transition-colors ${policy.require2FA ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${policy.require2FA ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 2FA Modal */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Setup 2FA</h3>
              <button onClick={() => setIs2FAModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">&times;</button>
            </div>
            <div className="p-4 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-4">Scan this QR code with your Authenticator app (e.g. Google Authenticator).</p>
              {qrCodeUrl && <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto border border-gray-200 rounded-lg shadow-xs mb-4 max-w-[200px] w-full" />}
              <input 
                type="text" 
                placeholder="Enter 6-digit code" 
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                className="w-full text-center tracking-widest text-lg px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary mb-4" 
                maxLength={6}
              />
              <button 
                onClick={handleVerify2FA}
                disabled={verificationToken.length < 6}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-70 cursor-pointer"
              >
                Verify & Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}