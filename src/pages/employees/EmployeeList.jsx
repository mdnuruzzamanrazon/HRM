import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Loader2, Users, Building, Mail, 
  Calendar, ChevronRight, Filter, ArrowUpDown, Eye, 
  Edit3, KeyRound, UserX, UserCheck, Trash2, Shield, 
  CheckCircle2, AlertCircle, X, ShieldAlert, Sparkles 
} from 'lucide-react';
import api from '../../services/api';
import { formatSafeDate } from '../../utils/date';

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [editModalEmployee, setEditModalEmployee] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
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
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete confirmation
  const [deleteModalEmployee, setDeleteModalEmployee] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Alert toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/employees');
      setEmployees(data.data || []);
    } catch (error) {
      console.error(error);
      showToast('Failed to load employees', 'error');
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
        personalDetails: {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          phone: editForm.phone,
          contactAddress: editForm.contactAddress
        },
        jobDetails: {
          title: editForm.title,
          status: editForm.status,
          employmentType: editForm.employmentType
        }
      });

      if (res.data?.success) {
        showToast('Employee profile updated successfully');
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
        newPassword
      });

      if (res.data?.success) {
        showToast(`Password reset for ${passwordModalEmployee.personalDetails?.firstName || 'employee'}`);
        setPasswordModalEmployee(null);
        setNewPassword('');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // Toggle Account Access
  const handleToggleAccount = async (emp) => {
    try {
      const res = await api.put(`/employees/${emp._id}/toggle-account`);
      if (res.data?.success) {
        showToast(`Portal access ${res.data.isActive ? 'activated' : 'deactivated'}`);
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
      const res = await api.delete(`/employees/${deleteModalEmployee._id}`);
      if (res.data?.success) {
        showToast('Employee record removed successfully');
        setDeleteModalEmployee(null);
        fetchEmployees();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete employee', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = employees.filter(e => {
    const firstName = e.personalDetails?.firstName || '';
    const lastName = e.personalDetails?.lastName || '';
    const code = e.employeeCode || '';
    const email = e.userAccount?.email || e.personalDetails?.email || '';
    const matchesSearch = firstName.toLowerCase().includes(search.toLowerCase()) || 
      lastName.toLowerCase().includes(search.toLowerCase()) ||
      code.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase());

    const status = e.jobDetails?.status || 'ACTIVE';
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusStyles = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ON_LEAVE: 'bg-amber-50 text-amber-700 border-amber-200',
    PROBATION: 'bg-blue-50 text-blue-700 border-blue-200',
    TERMINATED: 'bg-rose-50 text-rose-700 border-rose-200',
    INACTIVE: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-fadeIn">
      
      {/* Toast Feedback */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold text-white transition-all transform animate-bounce ${
          toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Personnel Directory & Control</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {employees.length} Registered
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centrally manage personnel files, modify designations, control portal credentials, and govern access statuses.
          </p>
        </div>

        <Link 
          to="/employees/new" 
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Employee</span>
        </Link>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            placeholder="Search by name, employee code, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto custom-scrollbar">
          {['ALL', 'ACTIVE', 'ON_LEAVE', 'PROBATION', 'TERMINATED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? `All (${employees.length})` : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Syncing personnel files...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Personnel Record</th>
                  <th className="py-4 px-6">Employee ID</th>
                  <th className="py-4 px-6">Job Title & Unit</th>
                  <th className="py-4 px-6">Employment Status</th>
                  <th className="py-4 px-6">Portal Access</th>
                  <th className="py-4 px-6 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => {
                  const first = emp.personalDetails?.firstName || '';
                  const last = emp.personalDetails?.lastName || '';
                  const email = emp.userAccount?.email || emp.email || 'employee@cbdp.org';
                  const initials = `${first[0] || 'E'}${last[0] || 'M'}`;
                  const status = emp.jobDetails?.status || 'ACTIVE';
                  const isAccountActive = emp.userAccount ? emp.userAccount.isActive : true;

                  return (
                    <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Initials */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs border border-white">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm leading-tight">{first} {last}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-4 px-6 whitespace-nowrap font-mono font-bold text-slate-700 text-xs">
                        {emp.employeeCode || 'EMP-UNKNOWN'}
                      </td>

                      {/* Job title */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">
                          {emp.jobDetails?.title || emp.jobDetails?.designation || 'Team Member'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {emp.jobDetails?.departmentId?.name || 'Operations'} &bull; {emp.jobDetails?.employmentType || 'FULL_TIME'}
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
                        {emp.userAccount ? (
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
                            {isAccountActive ? 'Enabled' : 'Disabled'}
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">No User Account</span>
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
                            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                            title="Edit Personnel Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => setPasswordModalEmployee(emp)}
                            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                            title="Reset Portal Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => setDeleteModalEmployee(emp)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-20 text-center text-slate-400">
                      <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      <h4 className="text-sm font-bold text-slate-700">No personnel records found</h4>
                      <p className="text-xs text-slate-400 mt-1">Try resetting your search query or status filter.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Edit Personnel Profile */}
      {editModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200/80 animate-fadeIn">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/75">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Edit Employee Profile</h3>
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
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Last Name</label>
                  <input 
                    type="text" 
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
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
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Employee Code</label>
                  <input 
                    type="text" 
                    value={editForm.employeeCode}
                    onChange={(e) => setEditForm({ ...editForm, employeeCode: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Employment Status</label>
                  <select 
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-white focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                    <option value="PROBATION">PROBATION</option>
                    <option value="TERMINATED">TERMINATED (Revokes Portal Access)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Employment Type</label>
                  <select 
                    value={editForm.employmentType}
                    onChange={(e) => setEditForm({ ...editForm, employmentType: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-white focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="FULL_TIME">Full-Time</option>
                    <option value="PART_TIME">Part-Time</option>
                    <option value="CONTRACTOR">Contractor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Phone Number</label>
                <input 
                  type="text" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Contact Address</label>
                <textarea 
                  value={editForm.contactAddress}
                  onChange={(e) => setEditForm({ ...editForm, contactAddress: e.target.value })}
                  rows={2}
                  placeholder="Official registered address..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
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
                  className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Personnel Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Reset Portal Password */}
      {passwordModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80 animate-fadeIn">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/75">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Reset Employee Password</h3>
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
                Set a secure replacement password for <strong>{passwordModalEmployee.personalDetails?.firstName} {passwordModalEmployee.personalDetails?.lastName}</strong>. The employee will use this new password immediately to log into the Employee Portal.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">New Password (min 6 characters)</label>
                <input 
                  type="password" 
                  placeholder="Enter new password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

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
                  Confirm Password Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Delete Confirmation */}
      {deleteModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80 animate-fadeIn">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Confirm Record Removal</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to permanently remove <strong>{deleteModalEmployee.personalDetails?.firstName} {deleteModalEmployee.personalDetails?.lastName}</strong> ({deleteModalEmployee.employeeCode})? This will also remove their associated Employee Portal login account.
                </p>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setDeleteModalEmployee(null)}
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
                  Yes, Remove Personnel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
