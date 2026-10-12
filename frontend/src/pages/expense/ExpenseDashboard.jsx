import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Plus, Receipt, Check, X, CreditCard } from 'lucide-react';
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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: { expenseType: 'TRAVEL' }
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'EMPLOYEE' ? '/expenses/my' : '/expenses/all';
      const { data } = await api.get(endpoint);
      setExpenses(data.data);
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
    if (!window.confirm(`Are you sure you want to mark this as ${status.toLowerCase()}?`)) return;
    try {
      await api.put(`/expenses/${id}/status`, { status });
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REIMBURSED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'FINANCE_OFFICER'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Expense Management</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Submit claims and manage reimbursement requests.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-brand-700 transition-colors w-full sm:w-auto"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Submit Expense
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50">
                <tr>
                  {isAdmin && <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>}
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  {isAdmin && <th className="px-4 sm:px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-slate-50 transition-colors">
                    {isAdmin && (
                      <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {expense.employeeId?.personalDetails?.firstName} {expense.employeeId?.personalDetails?.lastName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{expense.employeeId?.employeeCode}</div>
                      </td>
                    )}
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium flex items-center">
                        <Receipt className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                        {expense.expenseType || expense.category || 'Expense'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={expense.description}>
                        {expense.description}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatSafeDate(expense.dateIncurred || expense.createdAt, 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(expense.amount, expense.currency)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-md border ${getStatusColor(expense.status)}`}>
                        {expense.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                        {expense.status === 'PENDING' && (
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => handleUpdateStatus(expense._id, 'APPROVED')} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer" title="Approve">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleUpdateStatus(expense._id, 'REJECTED')} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer" title="Reject">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {expense.status === 'APPROVED' && (
                          <button onClick={() => handleUpdateStatus(expense._id, 'REIMBURSED')} className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-medium border border-emerald-200 cursor-pointer">
                            <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Pay Now
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-4 sm:px-6 py-12 text-center text-gray-500 text-sm">
                      No expenses found.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Submit Expense Claim</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Expense Type</label>
                  <select {...register('expenseType')} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white text-sm">
                    <option value="TRAVEL">Travel</option>
                    <option value="MEALS">Meals & Ent.</option>
                    <option value="SUPPLIES">Supplies</option>
                    <option value="TRAINING">Training</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
                  <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm" />
                  {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date Incurred</label>
                <input type="date" {...register('dateIncurred')} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm" />
                {errors.dateIncurred && <p className="mt-1 text-xs text-red-500">{errors.dateIncurred.message}</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea {...register('description')} rows={3} placeholder="Briefly describe the expense..." className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary resize-none text-sm" />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
              </div>
              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center justify-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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