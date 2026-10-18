import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Loader2, DollarSign, Download, CheckCircle, 
  CreditCard, TrendingUp, Calendar, AlertCircle, FileText, Check,
  Plus, Edit, Trash2, X, Save, User
} from 'lucide-react';
import { format } from 'date-fns';

export default function PayrollDashboard() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateMonth, setGenerateMonth] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    baseSalary: 5000,
    allowances: 500,
    deductions: 200,
    status: 'PENDING'
  });

  const [editForm, setEditForm] = useState({
    id: '',
    employeeName: '',
    baseSalary: 0,
    allowances: 0,
    deductions: 0,
    status: 'PENDING'
  });

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'EMPLOYEE' ? '/payroll/my' : '/payroll/all';
      const [payRes, empRes] = await Promise.all([
        api.get(endpoint),
        api.get('/employees')
      ]);
      setPayslips(payRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (err) {
      console.error(err);
      notify('error', 'Failed to load payroll statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
    setGenerateMonth(format(new Date(), 'yyyy-MM'));
  }, [user.role]);

  const handleGenerate = async () => {
    if (!generateMonth) return notify('error', 'Select a month to generate payroll');
    const [year, month] = generateMonth.split('-');
    try {
      setGenerating(true);
      await api.post('/payroll/generate', { month: parseInt(month, 10), year: parseInt(year, 10) });
      notify('success', `Batch payroll generated for ${generateMonth}`);
      await fetchPayslips();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.put(`/payroll/${id}/status`, { status: 'PAID' });
      notify('success', 'Payslip marked as PAID');
      await fetchPayslips();
    } catch (err) {
      notify('error', 'Failed to mark as paid');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.employeeId) {
      notify('error', 'Please select an employee');
      return;
    }
    setActionLoading(true);
    try {
      await api.post('/payroll/manual', createForm);
      notify('success', 'Payslip created successfully');
      setIsCreateModalOpen(false);
      await fetchPayslips();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to create payslip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/payroll/${editForm.id}`, {
        baseSalary: Number(editForm.baseSalary),
        allowances: Number(editForm.allowances),
        deductions: Number(editForm.deductions),
        status: editForm.status
      });
      notify('success', 'Payslip breakdown updated');
      setIsEditModalOpen(false);
      await fetchPayslips();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to update payslip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePayslip = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payslip record? This action will be audited.')) return;
    try {
      await api.delete(`/payroll/${id}`);
      notify('success', 'Payslip record removed');
      await fetchPayslips();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to delete payslip');
    }
  };

  const openEditModal = (slip) => {
    const first = slip.employeeId?.personalDetails?.firstName || '';
    const last = slip.employeeId?.personalDetails?.lastName || '';
    setEditForm({
      id: slip._id,
      employeeName: `${first} ${last}`.trim() || 'Staff Member',
      baseSalary: slip.baseSalary || 0,
      allowances: slip.allowances || 0,
      deductions: slip.deductions || 0,
      status: slip.status || 'PENDING'
    });
    setIsEditModalOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const totalDisbursed = payslips
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const totalPending = payslips
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + (p.netSalary || 0), 0);

  const filtered = payslips.filter(p => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium shadow-md transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Payroll & Compensations</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {payslips.length} Statements
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Execute monthly salary disbursement runs, calculate withholdings, and manage compensation payouts
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {['SUPER_ADMIN', 'FINANCE_OFFICER', 'HR_MANAGER'].includes(user.role) && (
            <>
              {/* Create Individual Payslip */}
              <button
                onClick={() => {
                  setCreateForm({
                    employeeId: employees[0]?._id || '',
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                    baseSalary: 5000,
                    allowances: 500,
                    deductions: 200,
                    status: 'PENDING'
                  });
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Single Payslip</span>
              </button>

              {/* Batch Run */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                <input 
                  type="month" 
                  value={generateMonth}
                  onChange={(e) => setGenerateMonth(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button 
                  onClick={handleGenerate} 
                  disabled={generating} 
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-all text-xs cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DollarSign className="h-3.5 w-3.5" />}
                  <span>Run Batch</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Disbursed</span>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(totalDisbursed)}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Settled salaries</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Pending Payouts</span>
            <div className="text-2xl font-black text-amber-600">{formatCurrency(totalPending)}</div>
            <span className="text-[11px] text-amber-600 font-medium">Awaiting disbursement</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Payslip Archive</span>
            <div className="text-2xl font-black text-slate-900">{payslips.length}</div>
            <span className="text-[11px] text-indigo-600 font-medium">Available statements</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Average Salary</span>
            <div className="text-2xl font-black text-purple-600">
              {formatCurrency(payslips.length > 0 ? (totalDisbursed + totalPending) / payslips.length : 5200)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Across active contracts</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card-modern p-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {['ALL', 'PENDING', 'PAID'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? `All Periods (${payslips.length})` : st}
            </button>
          ))}
        </div>
      </div>

      {/* Payslips Table */}
      <div className="card-modern overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center p-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs font-semibold text-slate-400">Loading payroll history...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-6">Employee Profile</th>
                  <th className="py-3.5 px-6">Pay Period</th>
                  <th className="py-3.5 px-6">Base Salary</th>
                  <th className="py-3.5 px-6">Allowances</th>
                  <th className="py-3.5 px-6">Deductions</th>
                  <th className="py-3.5 px-6">Net Payable</th>
                  <th className="py-3.5 px-6">Disbursement Status</th>
                  <th className="py-3.5 px-6 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((slip) => {
                  const first = slip.employeeId?.personalDetails?.firstName || '';
                  const last = slip.employeeId?.personalDetails?.lastName || '';
                  const code = slip.employeeId?.employeeCode || 'EMP';
                  const initials = `${first[0] || '?'}${last[0] || '?'}`;

                  return (
                    <tr key={slip._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{first} {last}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-bold text-slate-800">
                        {slip.payPeriod || (slip.year && slip.month ? new Date(slip.year, slip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'Pay Period')}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-medium text-slate-600">
                        {formatCurrency(slip.baseSalary)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-medium text-emerald-600">
                        +{formatCurrency(slip.allowances)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-medium text-rose-500">
                        -{formatCurrency(slip.deductions)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-black text-slate-900 text-sm">
                        {formatCurrency(slip.netSalary)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          slip.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {slip.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {slip.status === 'PENDING' && (
                            <button
                              onClick={() => handleMarkPaid(slip._id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                              title="Mark as Paid"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Pay</span>
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(slip)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Breakdown & Figures"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePayslip(slip._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Statement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-slate-400">
                      <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <h4 className="text-sm font-bold text-slate-700">No payslips found</h4>
                      <p className="text-xs text-slate-400 mt-1">Issue a single payslip or execute a batch run above.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE SINGLE PAYSLIP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="text-base font-black text-slate-900">Issue Individual Payslip</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Target Employee *</label>
                <select
                  required
                  value={createForm.employeeId}
                  onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.personalDetails?.firstName} {emp.personalDetails?.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Month (1-12) *</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={createForm.month}
                    onChange={(e) => setCreateForm({ ...createForm, month: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Year *</label>
                  <input
                    type="number"
                    min={2020}
                    max={2030}
                    required
                    value={createForm.year}
                    onChange={(e) => setCreateForm({ ...createForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Base ($)</label>
                  <input
                    type="number"
                    required
                    value={createForm.baseSalary}
                    onChange={(e) => setCreateForm({ ...createForm, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Allowances ($)</label>
                  <input
                    type="number"
                    value={createForm.allowances}
                    onChange={(e) => setCreateForm({ ...createForm, allowances: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Deductions ($)</label>
                  <input
                    type="number"
                    value={createForm.deductions}
                    onChange={(e) => setCreateForm({ ...createForm, deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Calculated Net Salary:</span>
                <span className="text-base font-black text-slate-900">
                  {formatCurrency(Math.max(0, createForm.baseSalary + createForm.allowances - createForm.deductions))}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="PENDING">PENDING (Unpaid)</option>
                  <option value="PAID">PAID (Settled)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold bg-primary text-white hover:bg-primary-hover rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Generate Payslip</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PAYSLIP BREAKDOWN MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Edit Payslip Structure</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee</span>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{editForm.employeeName}</div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Base ($)</label>
                  <input
                    type="number"
                    required
                    value={editForm.baseSalary}
                    onChange={(e) => setEditForm({ ...editForm, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Allowances ($)</label>
                  <input
                    type="number"
                    value={editForm.allowances}
                    onChange={(e) => setEditForm({ ...editForm, allowances: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Deductions ($)</label>
                  <input
                    type="number"
                    value={editForm.deductions}
                    onChange={(e) => setEditForm({ ...editForm, deductions: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Updated Net Salary:</span>
                <span className="text-base font-black text-slate-900">
                  {formatCurrency(Math.max(0, editForm.baseSalary + editForm.allowances - editForm.deductions))}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Breakdown</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
