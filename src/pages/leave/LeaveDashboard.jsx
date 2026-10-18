import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatSafeDate } from '../../utils/date';
import { 
  Plus, Check, X, Loader2, Calendar, Clock, 
  CheckCircle2, XCircle, AlertCircle, Filter, Search 
} from 'lucide-react';

export default function LeaveDashboard() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'EMPLOYEE' ? '/leave/my' : '/leave/all';
      const { data } = await api.get(endpoint);
      setLeaves(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [user.role]);

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this leave request?`)) return;
    try {
      setProcessingId(id);
      await api.put(`/leave/${id}/status`, { status, comments: `Reviewed as ${status} by HR` });
      await fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update leave status');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredLeaves = leaves.filter(l => {
    if (statusFilter === 'ALL') return true;
    return l.status === statusFilter;
  });

  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;
  const approvedCount = leaves.filter(l => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter(l => l.status === 'REJECTED').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Leave & Time-Off Management</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {leaves.length} Applications
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review time-off requests, vacation approvals, medical leaves, and company leave quotas
          </p>
        </div>

        <Link 
          to="/leave/apply" 
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Leave on Behalf</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Pending Review</span>
            <div className="text-2xl font-black text-amber-500">{pendingCount}</div>
            <span className="text-[11px] text-amber-600 font-medium">Requires supervisor sign-off</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Approved Leaves</span>
            <div className="text-2xl font-black text-emerald-600">{approvedCount}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Recorded in roster</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Rejected Requests</span>
            <div className="text-2xl font-black text-rose-500">{rejectedCount}</div>
            <span className="text-[11px] text-slate-400 font-medium">Denied by management</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Filings</span>
            <div className="text-2xl font-black text-slate-900">{leaves.length}</div>
            <span className="text-[11px] text-indigo-600 font-medium">Fiscal year to date</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-modern p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto custom-scrollbar">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? `All Applications (${leaves.length})` : st}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="card-modern overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center p-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold text-slate-400">Loading leave requests...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-6">Applicant</th>
                  <th className="py-3.5 px-6">Leave Category</th>
                  <th className="py-3.5 px-6">Schedule & Duration</th>
                  <th className="py-3.5 px-6">Reason / Business Context</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaves.map((leave) => {
                  const first = leave.employeeId?.personalDetails?.firstName || '';
                  const last = leave.employeeId?.personalDetails?.lastName || '';
                  const code = leave.employeeId?.employeeCode || 'CBDP-EMP';
                  const initials = `${first[0] || '?'}${last[0] || '?'}`;

                  const statusStyles = {
                    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
                    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200'
                  };

                  return (
                    <tr key={leave._id} className="hover:bg-slate-50/80 transition-colors">
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
                        {leave.leaveType || 'ANNUAL'} Leave
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-slate-800">
                          {formatSafeDate(leave.startDate, 'MMM dd, yyyy')} &ndash; {formatSafeDate(leave.endDate, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {leave.totalDays ? `${leave.totalDays} Days Requested` : 'Multiple Days'}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                        {leave.reason || '—'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyles[leave.status] || 'bg-slate-100 text-slate-700'}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        {leave.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateStatus(leave._id, 'APPROVED')}
                              disabled={processingId === leave._id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(leave._id, 'REJECTED')}
                              disabled={processingId === leave._id}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredLeaves.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-400">
                      <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <h4 className="text-sm font-bold text-slate-700">No leave applications found</h4>
                      <p className="text-xs text-slate-400 mt-1">Try switching to another status tab.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
