import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Loader2, Plus, Receipt, Check, X, CreditCard, 
  DollarSign, CheckCircle2, Clock, AlertCircle, Trash2,
  Save, UserCheck, Shield, ExternalLink
} from 'lucide-react';
import { formatSafeDate } from '../../utils/date';

export default function ExpenseDashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAdminRecordModalOpen, setIsAdminRecordModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [submitForm, setSubmitForm] = useState({
    expenseType: 'TRAVEL',
    amount: '',
    dateIncurred: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [adminForm, setAdminForm] = useState({
    employeeId: '',
    expenseType: 'TRAVEL',
    amount: '',
    dateIncurred: new Date().toISOString().split('T')[0],
    description: '',
    status: 'APPROVED'
  });

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'EMPLOYEE' ? '/expenses/my' : '/expenses/all';
      const [expRes, empRes] = await Promise.all([
        api.get(endpoint),
        api.get('/employees')
      ]);
      setExpenses(expRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (err) {
      console.error(err);
      notify('error', 'Failed to load expense records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user.role]);

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!submitForm.amount || Number(submitForm.amount) <= 0) {
      notify('error', 'Please enter a valid amount');
      return;
    }
    setActionLoading(true);
    try {
      await api.post('/expenses/submit', {
        ...submitForm,
        amount: Number(submitForm.amount)
      });
      notify('success', 'Expense claim filed successfully');
      setIsSubmitModalOpen(false);
      setSubmitForm({
        expenseType: 'TRAVEL',
        amount: '',
        dateIncurred: new Date().toISOString().split('T')[0],
        description: ''
      });
      await fetchExpenses();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminRecord = async (e) => {
    e.preventDefault();
    if (!adminForm.employeeId) {
      notify('error', 'Please select an employee');
      return;
    }
    if (!adminForm.amount || Number(adminForm.amount) <= 0) {
      notify('error', 'Please enter a valid amount');
      return;
    }
    setActionLoading(true);
    try {
      await api.post('/expenses/admin-create', {
        ...adminForm,
        amount: Number(adminForm.amount)
      });
      notify('success', 'Expense reimbursement recorded successfully');
      setIsAdminRecordModalOpen(false);
      await fetchExpenses();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to record expense');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this claim as ${status.toLowerCase()}?`)) return;
    try {
      await api.put(`/expenses/${id}/status`, { 
        status,
        remarks: status === 'APPROVED' ? 'Approved by HR Lead' : 'Reviewed and updated by HR'
      });
      notify('success', `Claim updated to ${status}`);
      await fetchExpenses();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record? This action will be audited.')) return;
    try {
      await api.delete(`/expenses/${id}`);
      notify('success', 'Expense record removed');
      await fetchExpenses();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
  };

  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'FINANCE_OFFICER'].includes(user.role);

  const totalClaimed = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const approvedTotal = expenses
    .filter(e => e.status === 'APPROVED' || e.status === 'REIMBURSED')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingCount = expenses.filter(e => e.status === 'PENDING').length;

  const filtered = expenses.filter(e => {
    if (statusFilter === 'ALL') return true;
    return e.status === statusFilter;
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
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
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
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Expense Claims & Reimbursements</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {expenses.length} Filings
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review staff business expenses, approve reimbursements, and process corporate claims
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {isAdmin && (
            <button 
              onClick={() => {
                setAdminForm({
                  employeeId: employees[0]?._id || '',
                  expenseType: 'TRAVEL',
                  amount: '',
                  dateIncurred: new Date().toISOString().split('T')[0],
                  description: '',
                  status: 'APPROVED'
                });
                setIsAdminRecordModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Record for Employee</span>
            </button>
          )}

          <button 
            onClick={() => setIsSubmitModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Claim</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Claimed</span>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(totalClaimed)}</div>
            <span className="text-[11px] text-slate-400 font-medium">Across all submissions</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Approved & Paid</span>
            <div className="text-2xl font-black text-emerald-600">{formatCurrency(approvedTotal)}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Disbursed by finance</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Pending Review</span>
            <div className="text-2xl font-black text-amber-500">{pendingCount}</div>
            <span className="text-[11px] text-amber-600 font-medium">Awaiting audit approval</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Claims Logged</span>
            <div className="text-2xl font-black text-purple-600">{expenses.length}</div>
            <span className="text-[11px] text-purple-600 font-medium">Total registered claims</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card-modern p-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {['ALL', 'PENDING', 'APPROVED', 'REIMBURSED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? `All Claims (${expenses.length})` : st}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card-modern overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center p-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs font-semibold text-slate-400">Loading expense claims...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
                <tr>
                  {isAdmin && <th className="py-3.5 px-6">Claimant</th>}
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Date Incurred</th>
                  <th className="py-3.5 px-6">Business Justification</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((expense) => {
                  const first = expense.employeeId?.personalDetails?.firstName || '';
                  const last = expense.employeeId?.personalDetails?.lastName || '';
                  const code = expense.employeeId?.employeeCode || 'EMP';
                  const initials = `${first[0] || '?'}${last[0] || '?'}`;

                  const statusStyles = {
                    APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
                    REIMBURSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200'
                  };

                  return (
                    <tr key={expense._id} className="hover:bg-slate-50/80 transition-colors">
                      {isAdmin && (
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
                      )}
                      <td className="py-4 px-6 whitespace-nowrap font-bold text-slate-800">
                        {expense.expenseType || expense.category || 'General Expense'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-mono text-slate-700">
                        {formatSafeDate(expense.dateIncurred || expense.createdAt, 'MMM dd, yyyy')}
                      </td>
                      <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                        {expense.description || '—'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-black text-slate-900 text-sm">
                        {formatCurrency(expense.amount, expense.currency)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyles[expense.status] || 'bg-slate-100 text-slate-700'}`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAdmin && expense.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(expense._id, 'APPROVED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(expense._id, 'REJECTED')}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {isAdmin && expense.status === 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateStatus(expense._id, 'REIMBURSED')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition-colors cursor-pointer shadow-xs"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Disburse Pay</span>
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteExpense(expense._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="py-16 text-center text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <h4 className="text-sm font-bold text-slate-700">No expense claims found</h4>
                      <p className="text-xs text-slate-400 mt-1">Try switching to another status tab or record a claim.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADMIN RECORD FOR EMPLOYEE MODAL */}
      {isAdminRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="text-base font-black text-slate-900">Record Employee Expense</h3>
              </div>
              <button onClick={() => setIsAdminRecordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Target Employee *</label>
                <select
                  required
                  value={adminForm.employeeId}
                  onChange={(e) => setAdminForm({ ...adminForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.personalDetails?.firstName} {emp.personalDetails?.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Category *</label>
                  <select
                    value={adminForm.expenseType}
                    onChange={(e) => setAdminForm({ ...adminForm, expenseType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="TRAVEL">Travel & Transit</option>
                    <option value="MEALS">Meals & Dining</option>
                    <option value="SUPPLIES">Office Supplies</option>
                    <option value="TRAINING">Training & Certification</option>
                    <option value="OTHER">Other Discretionary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Amount ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={adminForm.amount}
                    onChange={(e) => setAdminForm({ ...adminForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date Incurred *</label>
                  <input
                    type="date"
                    required
                    value={adminForm.dateIncurred}
                    onChange={(e) => setAdminForm({ ...adminForm, dateIncurred: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Initial Status *</label>
                  <select
                    value={adminForm.status}
                    onChange={(e) => setAdminForm({ ...adminForm, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="APPROVED">APPROVED (Immediate)</option>
                    <option value="REIMBURSED">REIMBURSED (Paid)</option>
                    <option value="PENDING">PENDING (Under Review)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Business Description</label>
                <textarea
                  rows={2}
                  placeholder="Items purchased or justification"
                  value={adminForm.description}
                  onChange={(e) => setAdminForm({ ...adminForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdminRecordModalOpen(false)}
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
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMIT CLAIM MODAL (Self) */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Submit Corporate Expense</h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Expense Category</label>
                  <select
                    value={submitForm.expenseType}
                    onChange={(e) => setSubmitForm({ ...submitForm, expenseType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="TRAVEL">Travel & Transit</option>
                    <option value="MEALS">Meals & Dining</option>
                    <option value="SUPPLIES">Office Supplies</option>
                    <option value="TRAINING">Training & Courses</option>
                    <option value="OTHER">Other Discretionary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Amount ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={submitForm.amount}
                    onChange={(e) => setSubmitForm({ ...submitForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Date Incurred *</label>
                <input
                  type="date"
                  required
                  value={submitForm.dateIncurred}
                  onChange={(e) => setSubmitForm({ ...submitForm, dateIncurred: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Business Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide business justification..."
                  value={submitForm.description}
                  onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
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
                  <span>Submit Claim</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}