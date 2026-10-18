import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Calendar, Plus, CheckCircle2, AlertCircle, XCircle, 
  Clock, Loader2, Sparkles, AlertTriangle, ArrowRight 
} from 'lucide-react';

export default function EmployeeLeave() {
  const [balanceData, setBalanceData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [form, setForm] = useState({
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balRes, leavesRes] = await Promise.all([
        api.get('/leave/balances'),
        api.get('/leave/my')
      ]);

      if (balRes.data?.success) setBalanceData(balRes.data.data);
      if (leavesRes.data?.success) setLeaves(leavesRes.data.data || []);
    } catch (err) {
      console.error('Error fetching leave details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateDays = () => {
    if (!form.startDate || !form.endDate) return 1;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end < start) return 0;
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      alert('Please select both start and end dates.');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      alert('End date cannot be earlier than start date.');
      return;
    }

    try {
      setSubmitting(true);
      const totalDays = calculateDays();
      const res = await api.post('/leave/apply', { ...form, totalDays });

      if (res.data?.success) {
        setMessage({ text: 'Leave application submitted successfully for HR review!', type: 'success' });
        setModalOpen(false);
        setForm({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply for leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw/cancel this leave application?')) return;
    try {
      setCancellingId(id);
      const res = await api.put(`/leave/${id}/cancel`);
      if (res.data?.success) {
        setMessage({ text: 'Leave application cancelled successfully', type: 'success' });
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel application');
    } finally {
      setCancellingId(null);
    }
  };

  const balances = balanceData?.balances || [
    { type: 'Annual Leave', code: 'ANNUAL', total: 20, used: 5, remaining: 15 },
    { type: 'Sick Leave', code: 'SICK', total: 10, used: 2, remaining: 8 },
    { type: 'Casual Leave', code: 'CASUAL', total: 7, used: 1, remaining: 6 },
    { type: 'Unpaid Leave', code: 'UNPAID', total: 30, used: 0, remaining: 30 }
  ];

  const summary = balanceData?.summary;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Leave Management & Requests
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Check your available leave balances, submit vacation or sick leaves, and monitor approval status
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
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

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b) => {
          const percent = b.total > 0 ? Math.round((b.remaining / b.total) * 100) : 100;
          return (
            <div key={b.code} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">{b.type}</span>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {b.code}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{b.remaining}</span>
                  <span className="text-xs text-slate-400">/ {b.total} days left</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                  <span>Used: {b.used} days</span>
                  <span>{percent}% Available</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leave Applications History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Application History</h3>
          </div>
          {summary?.pendingRequests > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {summary.pendingRequests} Pending HR Approval
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Total Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading leave applications...
                  </td>
                </tr>
              ) : leaves.length > 0 ? (
                leaves.map((l) => {
                  const statusBadges = {
                    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
                    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200'
                  };

                  return (
                    <tr key={l._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {l.leaveType || 'ANNUAL'} Leave
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(l.startDate).toLocaleDateString()} &ndash; {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {l.totalDays} {l.totalDays === 1 ? 'day' : 'days'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {l.reason || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadges[l.status] || 'bg-slate-100 text-slate-700'}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {l.status === 'PENDING' ? (
                          <button
                            type="button"
                            disabled={cancellingId === l._id}
                            onClick={() => handleCancelLeave(l._id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-transparent rounded-lg transition-colors cursor-pointer"
                          >
                            {cancellingId === l._id ? 'Cancelling...' : 'Withdraw'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    No leave applications recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Application Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-modal-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Apply for Time Off / Leave</h3>
              <button 
                type="button" 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leave Category</label>
                <select
                  value={form.leaveType}
                  onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-white font-medium text-slate-800"
                >
                  <option value="ANNUAL">Annual Vacation Leave</option>
                  <option value="SICK">Medical / Sick Leave</option>
                  <option value="CASUAL">Casual / Emergency Leave</option>
                  <option value="MATERNITY">Maternity / Parental Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {form.startDate && form.endDate && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 font-semibold flex items-center justify-between">
                  <span>Requested Duration:</span>
                  <span className="font-bold text-sm">{calculateDays()} Days</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Purpose</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Provide reason for time-off request..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
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
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
