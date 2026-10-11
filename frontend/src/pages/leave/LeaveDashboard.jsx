import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-500 mt-1">Manage your time off and team approvals.</p>
        </div>
        <Link 
          to="/leave/apply" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-brand-700 focus:outline-none transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Apply for Leave
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {user.role !== 'EMPLOYEE' && <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  {user.role !== 'EMPLOYEE' && <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50 transition-colors">
                    {user.role !== 'EMPLOYEE' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {leave.employeeId?.personalDetails?.firstName} {leave.employeeId?.personalDetails?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{leave.employeeId?.employeeCode}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{leave.leaveType.replace('_', ' ')}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Applied: {format(new Date(leave.createdAt), 'MMM dd')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(leave.startDate), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        to {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 truncate max-w-xs" title={leave.reason}>{leave.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md border ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </td>
                    {user.role !== 'EMPLOYEE' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {leave.status === 'PENDING' ? (
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => handleUpdateStatus(leave._id, 'APPROVED')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100" title="Approve">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleUpdateStatus(leave._id, 'REJECTED')} className="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100" title="Reject">
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
                    <td colSpan={user.role !== 'EMPLOYEE' ? 6 : 4} className="px-6 py-12 text-center text-gray-500 text-sm">
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
