import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Loader2, Users, Building, Mail, 
  Calendar, ChevronRight, Filter, ArrowUpDown, Eye, 
  Edit3, KeyRound, UserX, UserCheck, Trash2, Shield, 
  CheckCircle2, AlertCircle, X, ShieldAlert, Sparkles,
  Phone, MapPin, Lock, AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import { formatSafeDate } from '../../utils/date';

const DEPARTMENTS = [
  'Engineering & Technology',
  'Human Resources',
  'Finance & Accounts',
  'Executive Management',
  'Operations & Logistics',
  'Marketing & Communications',
  'Product & Design',
  'Legal & Compliance'
];

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dbStatus, setDbStatus] = useState(null);

  // Modals state
  const [editModalEmployee, setEditModalEmployee] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: 'Engineering & Technology',
    title: '',
    employeeCode: '',
    phone: '',
    contactAddress: '',
    status: 'ACTIVE',
    employmentType: 'FULL_TIME'
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Password reset modal state
  const [passwordModalEmployee, setPasswordModalEmployee] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isTemporaryPassword, setIsTemporaryPassword] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete confirmation
  const [deleteModalEmployee, setDeleteModalEmployee] = useState(null);
  const [permanentDelete, setPermanentDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Alert toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4500);
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [empRes, healthRes] = await Promise.all([
        api.get('/employees'),
        api.get('/health').catch(() => null)
      ]);
      setEmployees(empRes.data?.data || []);
      if (healthRes?.data?.database) {
        setDbStatus(healthRes.data.database);
      } else if (empRes.data?.isDemoMode) {
        setDbStatus({ status: 'DEMO_FALLBACK' });
      } else {
        setDbStatus({ status: 'CONNECTED' });
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to load employee records from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Open Edit Modal
  const handleOpenEdit = (emp) => {
    setEditModalEmployee(emp);
    setEditForm({
      firstName: emp.personalDetails?.firstName || '',
      lastName: emp.personalDetails?.lastName || '',
      email: emp.email || emp.personalDetails?.email || emp.userAccount?.email || '',
      department: emp.jobDetails?.department || emp.jobDetails?.departmentId?.name || 'Engineering & Technology',
      title: emp.jobDetails?.title || emp.jobDetails?.designation || '',
      employeeCode: emp.employeeCode || '',
      phone: emp.personalDetails?.phone || '',
      contactAddress: emp.personalDetails?.contactAddress || '',
      status: emp.jobDetails?.status || 'ACTIVE',
      employmentType: emp.jobDetails?.employmentType || 'FULL_TIME'
    });
  };

  // Submit Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setSavingEdit(true);
      const res = await api.put(`/employees/${editModalEmployee._id}`, {
        employeeCode: editForm.employeeCode,
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
          status: editForm.status,
          employmentType: editForm.employmentType
        }
      });

      if (res.data?.success) {
        showToast('Employee profile and credentials synchronized successfully in MongoDB');
        setEditModalEmployee(null);
        fetchEmployees();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update employee', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Submit Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      setSavingPassword(true);
      const res = await api.post(`/employees/${passwordModalEmployee._id}/reset-password`, {
        newPassword,
        isTemporary: isTemporaryPassword
      });

      if (res.data?.success) {
        showToast(res.data.message || `Password for ${passwordModalEmployee.personalDetails?.firstName} updated successfully`);
        setPasswordModalEmployee(null);
        setNewPassword('');
        setIsTemporaryPassword(true);
        fetchEmployees();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset employee password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // Toggle Account Access
  const handleToggleAccount = async (emp) => {
    try {
      const res = await api.put(`/employees/${emp._id}/toggle-account`);
      if (res.data?.success) {
        showToast(`Portal access ${res.data.isActive ? 'activated' : 'deactivated and active sessions invalidated'}`);
        fetchEmployees();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle account', 'error');
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async () => {
    try {
      setDeleting(true);
      const url = permanentDelete 
        ? `/employees/${deleteModalEmployee._id}?force=true&permanent=true` 
        : `/employees/${deleteModalEmployee._id}`;
      
      const res = await api.delete(url);
      if (res.data?.success) {
        showToast(permanentDelete ? 'Employee permanently deleted from database' : 'Employee deactivated and portal access revoked');
        setDeleteModalEmployee(null);
        setPermanentDelete(false);
        fetchEmployees();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete employee', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = employees.filter(e => {
    const firstName = e.personalDetails?.firstName || e.firstName || '';
    const lastName = e.personalDetails?.lastName || e.lastName || '';
    const code = e.employeeCode || e.employeeId || '';
    const email = e.email || e.personalDetails?.email || e.userAccount?.email || '';
    const department = e.jobDetails?.department || e.department || e.jobDetails?.departmentId?.name || '';
    const title = e.jobDetails?.title || e.title || e.jobDetails?.designation || e.designation || '';
    
    const matchesSearch = firstName.toLowerCase().includes(search.toLowerCase()) || 
      lastName.toLowerCase().includes(search.toLowerCase()) ||
      code.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      department.toLowerCase().includes(search.toLowerCase()) ||
      title.toLowerCase().includes(search.toLowerCase());

    const status = e.jobDetails?.status || e.status || 'ACTIVE';
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusStyles = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ON_LEAVE: 'bg-amber-50 text-amber-700 border-amber-200',
    PROBATION: 'bg-blue-50 text-blue-700 border-blue-200',
    TERMINATED: 'bg-rose-50 text-rose-700 border-rose-200',
    INACTIVE: 'bg-slate-100 text-slate-700 border-slate-200',
    DELETED: 'bg-rose-100 text-rose-800 border-rose-300'
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-fadeIn">
      
      {/* Toast Feedback */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold text-white transition-all transform animate-in slide-in-from-top-2 duration-200 ${
          toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
              Workforce Directory
            </h1>
            {dbStatus?.status === 'CONNECTED' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                MongoDB Connected ({dbStatus.host ? dbStatus.host.split('.')[0] : 'Persistent'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 font-mono shadow-xs" title="Add MONGO_URI in Vercel Settings -> Environment Variables to connect MongoDB Atlas">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Serverless Demo Mode (Add MONGO_URI for Atlas)
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Database-backed employee records, mandatory email management, portal access controls, and administrative password tools.
          </p>
        </div>

        <Link
          to="/employees/new" 
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0 active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Employee</span>
        </Link>
      </div>

      {/* Cloud Serverless Notice if not connected to live MongoDB */}
      {dbStatus && dbStatus.status !== 'CONNECTED' && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3.5 text-xs text-amber-900 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1.5 leading-relaxed">
            <p className="font-bold text-amber-950 text-sm">
              Live Vercel Cloud Deployment: MongoDB Connection Required for Permanent Storage
            </p>
            <p className="text-amber-900">
              Your local environment is connected to <span className="font-mono font-semibold bg-amber-100/70 px-1 py-0.5 rounded">mongodb://127.0.0.1:27017/cbdp</span>, but the live Vercel cloud serverless deployment has no <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950">MONGO_URI</code> configured in its Vercel Environment Variables.
            </p>
            <p className="text-amber-900 font-medium">
              Because Vercel serverless containers are ephemeral, in-memory records reset whenever a serverless function cold-starts (e.g. after logout/login or idle periods).
            </p>
            <div className="pt-1 text-[11px] font-semibold text-amber-950 flex flex-wrap gap-2 items-center">
              <span>Quick Fix:</span>
              <span className="bg-white/80 border border-amber-300 px-2 py-0.5 rounded font-mono">1. Vercel Dashboard &rarr; Project Settings &rarr; Environment Variables</span>
              <span className="bg-white/80 border border-amber-300 px-2 py-0.5 rounded font-mono">2. Add MONGO_URI = mongodb+srv://...</span>
              <span className="bg-white/80 border border-amber-300 px-2 py-0.5 rounded font-mono">3. Redeploy</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:border-indigo-600 focus:ring-indigo-100 focus:outline-none transition-shadow"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'ACTIVE', 'PROBATION', 'INACTIVE', 'TERMINATED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status === 'ALL' ? `All (${employees.length})` : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Syncing personnel files with MongoDB...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No personnel records found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search ? 'No employees match your active search criteria.' : 'No personnel have been onboarded yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Personnel Record</th>
                  <th className="py-4 px-6">Employee ID</th>
                  <th className="py-4 px-6">Department &amp; Title</th>
                  <th className="py-4 px-6">Employment Status</th>
                  <th className="py-4 px-6">Portal Account Status</th>
                  <th className="py-4 px-6 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => {
                  const first = emp.personalDetails?.firstName || emp.firstName || '';
                  const last = emp.personalDetails?.lastName || emp.lastName || '';
                  const email = emp.email || emp.personalDetails?.email || emp.userAccount?.email || 'unregistered@cbdp.org';
                  const initials = `${(first[0] || 'E')}${(last[0] || 'M')}`.toUpperCase();
                  const code = emp.employeeCode || emp.employeeId || 'EMP-UNKNOWN';
                  const title = emp.jobDetails?.title || emp.title || emp.jobDetails?.designation || emp.designation || 'Team Member';
                  const department = emp.jobDetails?.department || emp.department || emp.jobDetails?.departmentId?.name || 'General Operations';
                  const employmentType = emp.jobDetails?.employmentType || emp.employmentType || 'FULL_TIME';
                  const status = emp.jobDetails?.status || emp.status || 'ACTIVE';
                  const hasAccount = Boolean(emp.userAccount || emp.userId || emp.email);
                  const isAccountActive = emp.userAccount ? emp.userAccount.isActive : (emp.isActive !== undefined ? emp.isActive : (status === 'ACTIVE'));
                  const mustChangePassword = emp.userAccount ? Boolean(emp.userAccount.mustChangePassword) : Boolean(emp.mustChangePassword);

                  return (
                    <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Official Email */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs border border-white">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                              <span>{first} {last}</span>
                              {mustChangePassword && (
                                <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-medium border border-amber-200" title="Temporary password assigned: Employee must change password on first login">
                                  Temp Pwd
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-600">{email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-4 px-6 whitespace-nowrap font-mono font-bold text-slate-800 text-xs">
                        {code}
                      </td>

                      {/* Job title & Department */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">
                          {title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{department}</span>
                          <span>&bull;</span>
                          <span>{employmentType}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {status}
                        </span>
                      </td>

                      {/* Portal Access Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {hasAccount ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleAccount(emp)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors cursor-pointer ${
                                isAccountActive 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200' 
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                              }`}
                              title="Click to switch portal access on/off"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isAccountActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              {isAccountActive ? 'Authorized' : 'Suspended'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">No Account</span>
                        )}
                      </td>

                      {/* Administrative Actions */}
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link 
                            to={`/employees/${emp._id}`} 
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <button 
                            onClick={() => handleOpenEdit(emp)}
                            className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                            title="Edit Details & Email"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => setPasswordModalEmployee(emp)}
                            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                            title="Set / Reset Portal Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => setDeleteModalEmployee(emp)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                            title="Deactivate or Remove Employee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Edit Personnel Profile & Official Email */}
      {editModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/75">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight font-heading">Edit Personnel Details</h3>
                <p className="text-xs text-slate-500">Updating official records for {editModalEmployee.personalDetails?.firstName} {editModalEmployee.personalDetails?.lastName}</p>
              </div>
              <button 
                onClick={() => setEditModalEmployee(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">First Name</label>
                  <input 
                    type="text" 
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Official Email Address <span className="text-indigo-600">(Synchronizes Portal Account)</span>
                </label>
                <input 
                  type="email" 
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Employee Code</label>
                  <input 
                    type="text" 
                    value={editForm.employeeCode}
                    onChange={(e) => setEditForm({ ...editForm, employeeCode: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Department</label>
                  <select 
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Job Designation</label>
                  <input 
                    type="text" 
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Employment Status</label>
                  <select 
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PROBATION">PROBATION</option>
                    <option value="INACTIVE">INACTIVE (Revokes Access)</option>
                    <option value="TERMINATED">TERMINATED (Revokes Access)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Phone Number</label>
                <input 
                  type="text" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. +880 1712-345678"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setEditModalEmployee(null)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingEdit}
                  className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save &amp; Synchronize Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Admin Set / Reset Portal Password */}
      {passwordModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/75">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight font-heading">Set / Reset Password</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{passwordModalEmployee.email || passwordModalEmployee.personalDetails?.email}</p>
                </div>
              </div>
              <button 
                onClick={() => { setPasswordModalEmployee(null); setNewPassword(''); }} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure credentials for <strong>{passwordModalEmployee.personalDetails?.firstName} {passwordModalEmployee.personalDetails?.lastName}</strong>. Resetting password immediately invalidates all previous sessions and tokens.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  New Password <span className="text-rose-500">* (min 6 characters)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    type="text" 
                    placeholder="Enter temporary or permanent password..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={isTemporaryPassword}
                  onChange={(e) => setIsTemporaryPassword(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Require password change on first login</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">The employee will be prompted to choose their private password immediately upon logging in.</span>
                </div>
              </label>

              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setPasswordModalEmployee(null); setNewPassword(''); }}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingPassword || newPassword.length < 6}
                  className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-70 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  {savingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Update Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Delete / Deactivation Confirmation */}
      {deleteModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 font-heading">Revoke Personnel Record</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to deactivate <strong>{deleteModalEmployee.personalDetails?.firstName} {deleteModalEmployee.personalDetails?.lastName}</strong> ({deleteModalEmployee.employeeCode})?
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-left text-xs text-amber-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Security &amp; Session Invalidation</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Deleting this employee will immediately revoke their Employee Portal authentication, invalidate all active tokens, and prevent future sign-ins.
                </p>
                <label className="flex items-center gap-2 pt-1 font-semibold text-amber-900 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={permanentDelete}
                    onChange={(e) => setPermanentDelete(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span>Permanently purge from MongoDB (instead of soft deactivation)</span>
                </label>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setDeleteModalEmployee(null); setPermanentDelete(false); }}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleDeleteEmployee}
                  disabled={deleting}
                  className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-70 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {permanentDelete ? 'Permanently Purge Record' : 'Deactivate & Revoke Access'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
