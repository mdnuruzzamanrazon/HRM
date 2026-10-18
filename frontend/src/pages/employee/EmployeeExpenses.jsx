import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Receipt, Plus, DollarSign, CheckCircle2, Clock, 
  XCircle, AlertCircle, Loader2, Calendar, FileText, 
  Tag, CreditCard, ChevronRight, MessageSquare 
} from 'lucide-react';

export default function EmployeeExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [form, setForm] = useState({
    expenseType: 'TRAVEL',
    amount: '',
    dateIncurred: new Date().toISOString().split('T')[0],
    description: ''
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses/my');
      if (res.data?.success) {
        setExpenses(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/expenses/submit', {
        ...form,
        amount: Number(form.amount)
      });

      if (res.data?.success) {
        setMessage({ text: 'Reimbursement claim submitted successfully for HR approval!', type: 'success' });
        setModalOpen(false);
        setForm({
          expenseType: 'TRAVEL',
          amount: '',
          dateIncurred: new Date().toISOString().split('T')[0],
          description: ''
        });
        await fetchExpenses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit expense claim');
    } finally {
      setSubmitting(false);
    }
  };

  const totalClaimed = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const approvedTotal = expenses
    .filter(e => e.status === 'APPROVED' || e.status === 'REIMBURSED')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingCount = expenses.filter(e => e.status === 'PENDING').length;
  const rejectedCount = expenses.filter(e => e.status === 'REJECTED').length;

  const categoryLabels = {
    TRAVEL: 'Travel & Transport',
    MEALS: 'Meals & Entertainment',
    OFFICE_SUPPLIES: 'Office Supplies',
    EQUIPMENT: 'Hardware & Tools',
    TRAINING: 'Training & Books',
    ACCOMMODATION: 'Lodging & Hotel',
    OTHER: 'Other Discretionary'
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Expense Claims & Reimbursement
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Submit business expenses, track approval status, and manage reimbursement payouts
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Submit Claim
        </button>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm animate-fadeIn ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ text: '', type: '' })} className="text-xs font-semibold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Claimed</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ${totalClaimed.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Across {expenses.length} submissions
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved / Paid</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ${approvedTotal.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            Approved by HR & Finance
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Approval</span>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {pendingCount}
          </div>
          <span className="text-[11px] text-amber-600 font-medium">
            Awaiting manager review
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rejected Claims</span>
          <div className="text-2xl font-black text-rose-500 mt-1">
            {rejectedCount}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Requires clarification
          </span>
        </div>
      </div>

      {/* Expense Claims Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Submitted Expense Claims</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Date Incurred</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">HR Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length > 0 ? (
                expenses.map((exp) => {
                  const statusBadges = {
                    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    REIMBURSED: 'bg-blue-50 text-blue-700 border-blue-200',
                    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200'
                  };

                  return (
                    <tr key={exp._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {new Date(exp.dateIncurred || exp.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {categoryLabels[exp.expenseType || exp.category] || exp.expenseType || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {exp.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        ${(exp.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadges[exp.status] || 'bg-slate-100 text-slate-700'}`}>
                          {exp.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 italic text-[11px]">
                        {exp.remarks || '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    No expense claims submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Claim Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-modal-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Submit Reimbursement Claim</h3>
              <button 
                type="button" 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={form.expenseType}
                  onChange={(e) => setForm({ ...form, expenseType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-white font-medium text-slate-800"
                >
                  <option value="TRAVEL">Travel & Local Transport</option>
                  <option value="MEALS">Meals & Business Dining</option>
                  <option value="OFFICE_SUPPLIES">Office Supplies & Stationery</option>
                  <option value="EQUIPMENT">Hardware, Peripherals & Equipment</option>
                  <option value="TRAINING">Course, Conference & Books</option>
                  <option value="ACCOMMODATION">Hotel & Lodging</option>
                  <option value="OTHER">Other Discretionary</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date Incurred</label>
                  <input
                    type="date"
                    required
                    value={form.dateIncurred}
                    onChange={(e) => setForm({ ...form, dateIncurred: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Justification / Details</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Detail the business context, attendees, or items purchased..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-slate-500 text-[11px] leading-relaxed">
                ℹ️ Receipts should be retained for accounting audits. Approved claims are settled in the next monthly payroll run.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
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
