import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  User, Mail, Phone, MapPin, Building, Briefcase, 
  Calendar, Shield, Lock, CreditCard, CheckCircle2, 
  AlertCircle, Loader2, Save, KeyRound, Sparkles 
} from 'lucide-react';

export default function EmployeeProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Contact info form state
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [contactMessage, setContactMessage] = useState({ text: '', type: '' });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employee-portal/profile');
      if (res.data?.success) {
        const emp = res.data.data;
        setProfile(emp);
        setPhone(emp?.personalDetails?.phone || '');
        setAddress(emp?.personalDetails?.contactAddress || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    try {
      setSavingContact(true);
      setContactMessage({ text: '', type: '' });
      const res = await api.put('/employee-portal/profile', {
        phone,
        contactAddress: address
      });

      if (res.data?.success) {
        setContactMessage({ text: 'Contact details updated successfully!', type: 'success' });
        await fetchProfile();
      }
    } catch (err) {
      setContactMessage({
        text: err.response?.data?.message || 'Failed to update contact info',
        type: 'error'
      });
    } finally {
      setSavingContact(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match!', type: 'error' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ text: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordMessage({ text: '', type: '' });
      const res = await api.put('/auth/update-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (res.data?.success) {
        setPasswordMessage({ text: 'Password successfully updated!', type: 'success' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordMessage({
        text: err.response?.data?.message || 'Failed to update password. Check current password.',
        type: 'error'
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const personal = profile?.personalDetails || {};
  const job = profile?.jobDetails || {};
  const bank = profile?.bankDetails || {};
  const fullName = `${personal.firstName || 'Sarah'} ${personal.lastName || 'Jenkins'}`;

  return (
    <div className="w-full space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Employee Profile & Account Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            View your official organizational record, update verified contact details, and manage password security
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200/80">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
          Loading your employee profile...
        </div>
      ) : (
        <>
          {/* Profile Hero Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white ring-4 ring-emerald-50">
                {personal.firstName?.[0] || 'E'}{personal.lastName?.[0] || 'P'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">{fullName}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {job.status || 'ACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {job.designation || 'Software Engineer'} &bull; {job.departmentId?.name || 'Engineering'}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                  <span>ID: {profile?.employeeCode || 'CBDP-EMP-001'}</span>
                  <span>Joined: {new Date(job.joiningDate || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex flex-wrap gap-2 self-start md:self-auto">
              <span className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200">
                {job.employmentType || 'Full-Time'}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200">
                Shift: Standard (09:00 - 17:00)
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              Information & Employment
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
                activeTab === 'security'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              Security & Password
            </button>
          </div>

          {/* Tab 1: Profile & Contact Details */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Personal & Employment Specs */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Employment Specifications */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">Employment Specifications</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Department</span>
                      <span className="font-bold text-slate-800">{job.departmentId?.name || 'Technology & Engineering'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Designation / Role</span>
                      <span className="font-bold text-slate-800">{job.designation || 'Software Engineer'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Reporting Line / Manager</span>
                      <span className="font-bold text-slate-800">
                        {job.managerId ? `${job.managerId.personalDetails?.firstName || ''} ${job.managerId.personalDetails?.lastName || ''}` : 'Direct HR Lead'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Work Email</span>
                      <span className="font-bold text-slate-800">{personal.email || 'employee@cbdp.org'}</span>
                    </div>
                  </div>
                </div>

                {/* Personal & Biographical Details */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <User className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">Personal & Identity Details</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Gender</span>
                      <span className="font-bold text-slate-800">{personal.gender || 'Female'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Date of Birth</span>
                      <span className="font-bold text-slate-800">{personal.dateOfBirth ? new Date(personal.dateOfBirth).toLocaleDateString() : '1992-04-14'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Blood Group</span>
                      <span className="font-bold text-slate-800">{personal.bloodGroup || 'O+'}</span>
                    </div>
                  </div>
                </div>

                {/* Banking & Remittance Details */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">Disbursement & Banking Details</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Bank Name</span>
                      <span className="font-bold text-slate-800">{bank.bankName || 'JPMorgan Chase'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Account Number</span>
                      <span className="font-mono font-bold text-slate-800">
                        {bank.accountNumber ? `•••• •••• ${bank.accountNumber.slice(-4)}` : '•••• •••• 8821'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-0.5">Routing / Swift</span>
                      <span className="font-mono font-bold text-slate-800">{bank.swiftCode || 'CHASUS33'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Editable Contact Form */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">Contact Information</h4>
                  </div>

                  {contactMessage.text && (
                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      contactMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {contactMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                      <span>{contactMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateContact} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                      <textarea
                        rows="3"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street, City, State, ZIP..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingContact}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {savingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Contact Changes
                    </button>
                  </form>
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Security & Password Settings */}
          {activeTab === 'security' && (
            <div className="max-w-xl bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Change Account Password</h4>
                  <p className="text-[11px] text-slate-400">Keep your portal access secure with a strong password</p>
                </div>
              </div>

              {passwordMessage.text && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Must be at least 6 characters long</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

        </>
      )}

    </div>
  );
}
