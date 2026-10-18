import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Loader2, Plus, Receipt, Check, X, CreditCard, 
  DollarSign, CheckCircle2, Clock, AlertCircle, XCircle 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatSafeDate } from '../../utils/date';

const expenseSchema = z.object({
  expenseType: z.enum(['TRAVEL', 'MEALS', 'SUPPLIES', 'TRAINING', 'OTHER']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  dateIncurred: z.string().min(1, 'Date is required'),
  description: z.string().min(5, 'Description is too short'),
});

export default function ExpenseDashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: { 
      expenseType: 'TRAVEL',
      dateIncurred: new Date().toISOString().split('T')[0]
    }
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'EMPLOYEE' ? '/expenses/my' : '/expenses/all';
      const { data } = await api.get(endpoint);
      setExpenses(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user.role]);

  const onSubmit = async (data) => {
    try {
      await api.post('/expenses/submit', data);
      reset();
      setIsModalOpen(false);
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit expense');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this claim as ${status.toLowerCase()}?`)) return;
    try {
      await api.put(`/expenses/${id}/status`, { 
        status,
        remarks: status === 'APPROVED' ? 'Approved by HR Lead' : 'Reviewed'
      });
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
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
    <div className="space-y-6 animate-fadeIn">
      
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

        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Expense Claim</span>
        </button>
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
            <span className="text-[11px] text-emerald-600 font-medium">Approved by finance</span>
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
                  ? 'bg-indigo-600 text-white shadow-xs'
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
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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
                  {isAdmin && <th className="py-3.5 px-6 text-right">Review Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((expense) => {
                  const first = expense.employeeId?.personalDetails?.firstName || '';
                  const last = expense.employeeId?.personalDetails?.lastName || '';
                  const code = expense.employeeId?.employeeCode || 'CBDP-EMP';
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
                      {isAdmin && (
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          {expense.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUpdateStatus(expense._id, 'APPROVED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(expense._id, 'REJECTED')}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {expense.status === 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateStatus(expense._id, 'REIMBURSED')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Disburse Pay</span>
                            </button>
                          )}
                          {(expense.status === 'REIMBURSED' || expense.status === 'REJECTED') && (
                            <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="py-16 text-center text-slate-400">
                      <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <h4 className="text-sm font-bold text-slate-700">No expense claims found</h4>
                      <p className="text-xs text-slate-400 mt-1">Try switching to another status tab or file a claim.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-modal-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Submit Corporate Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Category</label>
                  <select {...register('expenseType')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-white font-medium text-slate-800">
                    <option value="TRAVEL">Travel & Transit</option>
                    <option value="MEALS">Meals & Client Dining</option>
                    <option value="SUPPLIES">Office Supplies</option>
                    <option value="TRAINING">Training & Courses</option>
                    <option value="OTHER">Other Discretionary</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount ($ USD)</label>
                  <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none font-bold" />
                  {errors.amount && <p className="mt-1 text-[10px] text-rose-500">{errors.amount.message}</p>}
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date Incurred</label>
                <input type="date" {...register('dateIncurred')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" />
                {errors.dateIncurred && <p className="mt-1 text-[10px] text-rose-500">{errors.dateIncurred.message}</p>}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Description</label>
                <textarea {...register('description')} rows={3} placeholder="Provide business justification and items..." className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" />
                {errors.description && <p className="mt-1 text-[10px] text-rose-500">{errors.description.message}</p>}
              </div>
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}