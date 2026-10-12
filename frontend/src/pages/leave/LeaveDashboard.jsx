import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatSafeDate } from '../../utils/date';
import { Plus, Check, X, Loader2 } from 'lucide-react';

export default function LeaveDashboard() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'EMPLOYEE' ? '/leave/my' : '/leave/all';
      const { data } = await api.get(endpoint);
      setLeaves(data.data);
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
      await api.put(`/leave/${id}/status`, { status });
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update leave status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Leave Management</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage time off, requests, and team approvals.</p>
        </div>
        <Link 
          to="/leave/apply" 
          className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors w-full sm:w-auto"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Apply for Leave
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50">
                <tr>
                  {user.role !== 'EMPLOYEE' && <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>}
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Leave Type</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Reason</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  {user.role !== 'EMPLOYEE' && <th className="px-4 sm:px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50 transition-colors">
                    {user.role !== 'EMPLOYEE' && (
                      <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {leave.employeeId?.personalDetails?.firstName} {leave.employeeId?.personalDetails?.lastName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{leave.employeeId?.employeeCode}</div>
                      </td>
                    )}
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium capitalize">{leave.leaveType ? leave.leaveType.toLowerCase().replace('_', ' ') : 'Leave'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Applied: {formatSafeDate(leave.createdAt || leave.appliedAt, 'MMM dd')}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {formatSafeDate(leave.startDate, 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        to {formatSafeDate(leave.endDate, 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 hidden sm:table-cell">
                      <div className="text-xs sm:text-sm text-gray-700 truncate max-w-xs" title={leave.reason}>{leave.reason}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-md border ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </td>
                    {user.role !== 'EMPLOYEE' && (
                      <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                        {leave.status === 'PENDING' ? (
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => handleUpdateStatus(leave._id, 'APPROVED')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer" title="Approve">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleUpdateStatus(leave._id, 'REJECTED')} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer" title="Reject">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs font-normal bg-gray-100 px-2 py-1 rounded">Processed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr>
                    <td colSpan={user.role !== 'EMPLOYEE' ? 6 : 4} className="px-4 sm:px-6 py-12 text-center text-gray-500 text-sm">
                      No leave applications found.
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
