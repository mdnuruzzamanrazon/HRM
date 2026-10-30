import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Loader2, ArrowLeft, User, Briefcase, Phone, MapPin, 
  Calendar, Building2, CalendarDays, Shield, Mail, CheckCircle2,
  BadgeCheck, FileText, Clock, Edit, KeyRound, UserX, UserCheck, 
  Trash2, Plus, ExternalLink, X, AlertCircle, Lock, Save, DollarSign,
  FolderKanban, ArrowRightLeft
} from 'lucide-react';
import { formatSafeDate } from '../../utils/date';
import EmployeeProjectAssignModal from './EmployeeProjectAssignModal';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'documents' | 'security'
  const [notification, setNotification] = useState(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: 'Engineering & Technology',
    phone: '',
    contactAddress: '',
    title: '',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    accountNumber: '',
    taxId: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
    isTemporary: true
  });

  const [docForm, setDocForm] = useState({
    title: '',
    fileUrl: ''
  });

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchEmployee = async () => {
    try {
      const { data } = await api.get(`/employees/${id}`);
      setEmployee(data.data);
      if (data.data) {
        setEditForm({
          firstName: data.data.personalDetails?.firstName || data.data.firstName || '',
          lastName: data.data.personalDetails?.lastName || data.data.lastName || '',
          email: data.data.email || data.data.personalDetails?.email || data.data.userAccount?.email || '',
          department: data.data.jobDetails?.department || data.data.department || data.data.jobDetails?.departmentId?.name || 'Engineering & Technology',
          phone: data.data.personalDetails?.phone || '',
          contactAddress: data.data.personalDetails?.contactAddress || '',
          title: data.data.jobDetails?.title || data.data.title || data.data.jobDetails?.designation || data.data.designation || '',
          employmentType: data.data.jobDetails?.employmentType || data.data.employmentType || 'FULL_TIME',
          status: data.data.jobDetails?.status || data.data.status || 'ACTIVE',
          accountNumber: data.data.bankDetails?.accountNumber || '',
          taxId: data.data.bankDetails?.taxId || ''
        });
      }
    } catch (err) {
      console.error(err);
      notify('error', 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const updateRes = await api.put(`/employees/${id}`, {
        email: editForm.email,
        personalDetails: {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone,
          contactAddress: editForm.contactAddress
        },
        jobDetails: {
          title: editForm.title,
          department: editForm.department,
          employmentType: editForm.employmentType,
          status: editForm.status
        },
        bankDetails: {
          accountNumber: editForm.accountNumber,
          taxId: editForm.taxId
        }
      });
      if (updateRes.data?.data) {
        try {
          const cached = JSON.parse(localStorage.getItem('cbdp_persisted_workforce') || '[]');
          const idx = cached.findIndex(e => e._id === id);
          if (idx !== -1) {
            cached[idx] = { ...cached[idx], ...updateRes.data.data };
            localStorage.setItem('cbdp_persisted_workforce', JSON.stringify(cached));
          }
        } catch (e) {}
      }
      notify('success', 'Employee profile and credentials synchronized successfully');
      setIsEditModalOpen(false);
      await fetchEmployee();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to update employee profile');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Quick Status Change
  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      await api.put(`/employees/${id}/status`, { status: newStatus });
      notify('success', `Employee status changed to ${newStatus}`);
      await fetchEmployee();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to update employee status');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Toggle Portal Access
  const handleToggleAccount = async () => {
    setActionLoading(true);
    try {
      const res = await api.put(`/employees/${id}/toggle-account`);
      notify('success', res.data?.message || 'Portal access status toggled successfully');
      await fetchEmployee();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to toggle portal access');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      notify('error', 'Password must be at least 6 characters long');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify('error', 'Passwords do not match');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/employees/${id}/reset-password`, {
        newPassword: passwordForm.newPassword,
        isTemporary: passwordForm.isTemporary
      });
      notify('success', res.data?.message || 'Password successfully updated');
      setIsResetPasswordModalOpen(false);
      setPasswordForm({ newPassword: '', confirmPassword: '', isTemporary: true });
      await fetchEmployee();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Add Document
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docForm.title || !docForm.fileUrl) {
      notify('error', 'Document title and URL are required');
      return;
    }
    setActionLoading(true);
    try {
      await api.post(`/employees/${id}/documents`, docForm);
      notify('success', 'Document attached to personnel record');
      setIsUploadDocModalOpen(false);
      setDocForm({ title: '', fileUrl: '' });
      await fetchEmployee();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to attach document');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Document
  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document from the employee record?')) return;
    try {
      await api.delete(`/employees/${id}/documents/${docId}`);
      notify('success', 'Document removed successfully');
      await fetchEmployee();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to remove document');
    }
  };

  // Handle Delete Employee
  const handleDeleteEmployee = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/employees/${id}`);
      try {
        const cached = JSON.parse(localStorage.getItem('cbdp_persisted_workforce') || '[]');
        const updated = cached.filter(e => e._id !== id);
        localStorage.setItem('cbdp_persisted_workforce', JSON.stringify(updated));
      } catch (e) {}
      notify('success', 'Employee record removed');
      navigate('/employees');
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to delete employee record');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-9 h-9 animate-spin text-primary" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Loading Personnel File...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Employee Record Not Found</h3>
        <Link to="/employees" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Employee Directory
        </Link>
      </div>
    );
  }

  const { personalDetails = {}, jobDetails = {}, bankDetails = {}, employeeCode, user: rawUserAccount, documents = [] } = employee;
  const userAccount = rawUserAccount || employee.userAccount;
  const firstName = personalDetails.firstName || employee.firstName || '';
  const lastName = personalDetails.lastName || employee.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Employee Profile';
  const isAccountActive = userAccount ? userAccount.isActive : true;

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
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <Link 
            to="/employees" 
            className="inline-flex items-center justify-center w-10 h-10 shrink-0 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-primary transition-colors text-slate-600"
            title="Back to Employee Directory"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {fullName}
              </h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                jobDetails.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                jobDetails.status === 'ON_LEAVE' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                jobDetails.status === 'PROBATION' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {jobDetails.status || 'UNKNOWN'}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
                {employeeCode || 'EMP-UNKNOWN'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Centralized administrative control, employment lifecycle management, and portal access configuration.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Quick Switch */}
          <select 
            value={jobDetails.status || 'ACTIVE'}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={actionLoading}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="ACTIVE">Status: ACTIVE</option>
            <option value="ON_LEAVE">Status: ON_LEAVE</option>
            <option value="PROBATION">Status: PROBATION</option>
            <option value="TERMINATED">Status: TERMINATED</option>
          </select>

          {/* Project Assignments Button */}
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold transition-colors cursor-pointer"
            title="Manage Independent Core HR Project Assignments"
          >
            <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
            <span>Project Assignments ({Array.isArray(employee.projectAssignments) ? employee.projectAssignments.length : 0})</span>
          </button>

          {/* Edit Profile Button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          {/* Reset Password Button */}
          <button
            onClick={() => setIsResetPasswordModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition-colors cursor-pointer"
            title="Reset Employee Portal Password"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Reset Password</span>
          </button>

          {/* Toggle Portal Access Button */}
          <button
            onClick={handleToggleAccount}
            disabled={actionLoading}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isAccountActive
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
            title={isAccountActive ? 'Deactivate Employee Login' : 'Activate Employee Login'}
          >
            {isAccountActive ? <UserX className="w-3.5 h-3.5 text-rose-600" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{isAccountActive ? 'Disable Login' : 'Enable Login'}</span>
          </button>

          {/* Delete Employee */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Employee Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Contact Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-md border-4 border-white ring-4 ring-slate-100 uppercase mx-auto">
                {personalDetails.firstName?.charAt(0) || ''}{personalDetails.lastName?.charAt(0) || ''}
              </div>
              <span className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xs ${
                jobDetails.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 truncate">{fullName}</h3>
            <p className="text-xs font-bold text-primary mt-0.5">{jobDetails.title || 'Staff Member'}</p>
            <p className="text-xs text-slate-400 mt-1">{jobDetails.departmentId?.name || 'Department Unassigned'}</p>

            <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employment</div>
                <div className="text-xs font-bold text-slate-700 mt-0.5 truncate">{jobDetails.employmentType || 'FULL_TIME'}</div>
              </div>
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portal Access</div>
                <div className={`text-xs font-bold mt-0.5 truncate ${isAccountActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {isAccountActive ? 'Active' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Contact Details</h4>
              <BadgeCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mr-3">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5 break-all">
                    {personalDetails.phone || 'No phone provided'}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mr-3">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Portal Email</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5 break-all">
                    {userAccount?.email || employee.email || 'No portal account'}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mr-3">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Address</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5 break-words">
                    {personalDetails.contactAddress || 'No residential address on file'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial & Bank Account */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Bank & Tax Details</h4>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="p-5 space-y-3">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Number</div>
                <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                  {bankDetails.accountNumber ? `•••• ${bankDetails.accountNumber.slice(-4)}` : 'Not Provided'}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tax ID / TIN</div>
                <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                  {bankDetails.taxId || 'Not Recorded'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Personnel Records
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'documents'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Official Documents</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/20 text-primary">
                {documents.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Portal & Security
            </button>
          </div>

          {/* TAB 1: Profile Specifications */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Employment Specs */}
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
                <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Employment Specifications</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">Section 01</span>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                        <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Employee Code
                      </dt>
                      <dd className="text-sm font-bold text-slate-900 font-mono">{employeeCode || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                        <Briefcase className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Designation / Title
                      </dt>
                      <dd className="text-sm font-bold text-slate-900">{jobDetails.title || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                        <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Department
                      </dt>
                      <dd className="text-sm font-bold text-slate-900">{jobDetails.departmentId?.name || 'General Operations'}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                        <Shield className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Employment Type
                      </dt>
                      <dd className="text-sm font-bold text-slate-900">{jobDetails.employmentType || 'FULL_TIME'}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Date of Joining
                      </dt>
                      <dd className="text-sm font-bold text-slate-900">
                        {formatSafeDate(jobDetails.joinDate, 'MMM dd, yyyy')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Standard Shift
                      </dt>
                      <dd className="text-sm font-bold text-slate-900">General Corporate (09:00 - 17:00)</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Personal Record & Demographics */}
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
                <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Demographics</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">Section 02</span>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                        <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Date of Birth
                      </dt>
                      <dd className="text-sm font-bold text-slate-900">
                        {formatSafeDate(personalDetails.dob, 'MMM dd, yyyy', 'Not Provided')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</dt>
                      <dd className="text-sm font-bold text-slate-900">{personalDetails.gender || 'Not Specified'}</dd>
                    </div>
                      <div>
                        <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Blood Group</dt>
                        <dd className="text-sm font-bold text-slate-900">{personalDetails.bloodGroup || 'Not Recorded'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Section 03: Independent Project Assignments */}
                <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
                  <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Project Assignments</h3>
                        <p className="text-[11px] text-slate-500">
                          Independent assignment relationship &bull; Removing a project assignment never deletes this Core HR record
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">Section 03</span>
                      <button
                        type="button"
                        onClick={() => setIsProjectModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Assign / Manage Projects</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {Array.isArray(employee.projectAssignments) && employee.projectAssignments.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {employee.projectAssignments.map((asgn) => (
                          <div
                            key={asgn._id}
                            className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 flex flex-col justify-between gap-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {asgn.projectCode && (
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-mono font-black">
                                      {asgn.projectCode}
                                    </span>
                                  )}
                                  <span className="text-sm font-bold text-slate-900">
                                    {asgn.projectName || 'Assigned Project'}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-indigo-700 mt-1">
                                  {asgn.roleInProject || 'Project Team Member'}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                {asgn.allocationPercentage ?? 100}% Alloc
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-indigo-100/70">
                              <span>
                                Since {formatSafeDate(asgn.startDate, 'MMM dd, yyyy', 'Active')}
                              </span>
                              {asgn.isPrimary && (
                                <span className="font-bold text-indigo-700">Primary Project</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1.5">
                        <p className="text-xs font-bold text-slate-700">
                          No active project assignments
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          This employee is managed under Core HR organization-wide operations. Use &ldquo;Assign / Manage Projects&rdquo; to allocate them to one or more projects when required.
                        </p>
                      </div>
                    )}

                    {Array.isArray(employee.projectAssignmentHistory) &&
                      employee.projectAssignmentHistory.filter((h) => h.status !== 'ACTIVE').length > 0 && (
                        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                          <span>
                            Historical / completed project assignments recorded:{' '}
                            <strong className="text-slate-700">
                              {employee.projectAssignmentHistory.filter((h) => h.status !== 'ACTIVE').length}
                            </strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsProjectModalOpen(true)}
                            className="text-indigo-600 hover:underline font-bold cursor-pointer"
                          >
                            View Full Assignment Ledger &rarr;
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

          {/* TAB 2: Official Documents */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Personnel Files & Documents</h3>
                  <p className="text-xs text-slate-500">Official contracts, identification, certifications, and compliance files.</p>
                </div>
                <button
                  onClick={() => setIsUploadDocModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach Document</span>
                </button>
              </div>

              <div className="p-6">
                {documents.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-medium text-slate-500">No documents uploaded for this employee yet.</p>
                    <button
                      onClick={() => setIsUploadDocModalOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Attach First Document
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {documents.map((doc) => (
                      <div key={doc._id} className="p-4 rounded-xl border border-slate-200/90 hover:border-primary/40 bg-slate-50/40 flex items-start justify-between gap-3 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 line-clamp-1">{doc.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Uploaded {formatSafeDate(doc.uploadedAt, 'MMM dd, yyyy')}
                            </p>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline mt-1"
                            >
                              <span>View File</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteDocument(doc._id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Portal & Security */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
              <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Portal Access & Security Governance</h3>
                  <p className="text-xs text-slate-500">Configure authentication credentials and account authorization.</p>
                </div>
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Portal Login Status</span>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-black ${isAccountActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isAccountActive ? 'Account Enabled' : 'Account Disabled'}
                      </span>
                      <button
                        onClick={handleToggleAccount}
                        disabled={actionLoading}
                        className="px-3 py-1 text-xs font-bold rounded-lg border bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {isAccountActive ? 'Deactivate Now' : 'Activate Now'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Portal Security</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">Password Access</span>
                      <button
                        onClick={() => setIsResetPasswordModalOpen(true)}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
                      >
                        Set Password
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Authentication Metadata</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400 font-medium">Username / Login ID:</div>
                      <div className="font-bold text-slate-800 font-mono mt-0.5">{userAccount?.email || employee.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium">Assigned Role:</div>
                      <div className="font-bold text-slate-800 mt-0.5">{userAccount?.role || 'EMPLOYEE'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium">Last Login:</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {userAccount?.lastLoginAt ? formatSafeDate(userAccount.lastLoginAt, 'MMM dd, yyyy HH:mm') : 'Never'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                <h3 className="text-base font-black text-slate-900">Edit Personnel Profile</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Job Title / Designation *</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Employment Type</label>
                  <select
                    value={editForm.employmentType}
                    onChange={(e) => setEditForm({ ...editForm, employmentType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="FULL_TIME">FULL_TIME</option>
                    <option value="PART_TIME">PART_TIME</option>
                    <option value="CONTRACTOR">CONTRACTOR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                    <option value="PROBATION">PROBATION</option>
                    <option value="TERMINATED">TERMINATED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Contact Address</label>
                <input
                  type="text"
                  value={editForm.contactAddress}
                  onChange={(e) => setEditForm({ ...editForm, contactAddress: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bank Account #</label>
                  <input
                    type="text"
                    value={editForm.accountNumber}
                    onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tax ID / TIN</label>
                  <input
                    type="text"
                    value={editForm.taxId}
                    onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold bg-primary text-white hover:bg-primary-hover rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">Reset Portal Password</h3>
              </div>
              <button onClick={() => setIsResetPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Set a new employee password for portal login. The employee will be able to log in to the Employee Portal using this new password.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Confirm New Password *</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-base font-black text-slate-900">Attach Document</h3>
              </div>
              <button onClick={() => setIsUploadDocModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Employment Contract, National ID, Certificate"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">File URL / Storage Link *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={docForm.fileUrl}
                  onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadDocModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold bg-primary text-white hover:bg-primary-hover rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Delete Employee Record</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete <span className="font-bold text-slate-700">{fullName}</span> and remove all linked portal accounts? This action will be audited.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CORE HR PROJECT ASSIGNMENT MODAL */}
      <EmployeeProjectAssignModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        employee={employee}
        onUpdated={() => {
          fetchEmployee();
          notify('success', 'Project assignment records updated');
        }}
      />
    </div>
  );
}
