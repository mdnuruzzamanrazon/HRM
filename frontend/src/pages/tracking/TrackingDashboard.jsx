import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Loader2, MapPin, MonitorSmartphone, Clock, Crosshair } from 'lucide-react';
import { formatSafeDate } from '../../utils/date';

export default function TrackingDashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'EMPLOYEE' ? '/tracking/my' : '/tracking/all';
      const { data } = await api.get(endpoint);
      setLogs(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user.role]);

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      // Simulate getting geolocation
      const location = "Remote - Corporate VPN Proxy";
      await api.post('/tracking/checkin', { location });
      fetchLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to check in');
    } finally {
      setCheckingIn(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'LOCATION_CHECKIN': return <MapPin className="w-5 h-5 text-emerald-500" />;
      case 'SYSTEM_LOGIN': return <MonitorSmartphone className="w-5 h-5 text-blue-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Employee Tracking</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Monitor remote check-ins and system activity logs.</p>
        </div>
        <button 
          onClick={handleCheckIn}
          disabled={checkingIn}
          className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-brand-700 transition-colors disabled:opacity-70 w-full sm:w-auto"
        >
          {checkingIn ? <Loader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" /> : <Crosshair className="-ml-1 mr-2 h-5 w-5" />}
          Ping Location
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
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                  {isAdmin && <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>}
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Activity</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Network / Device</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatSafeDate(log.createdAt, 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatSafeDate(log.createdAt, 'hh:mm:ss a')}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {log.employeeId?.personalDetails?.firstName} {log.employeeId?.personalDetails?.lastName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{log.employeeId?.employeeCode}</div>
                      </td>
                    )}
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-1.5 rounded-lg bg-gray-50 mr-3 border border-gray-100 shrink-0">
                          {getActivityIcon(log.activityType)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.activityType ? log.activityType.replace('_', ' ') : 'General Activity'}</div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">{log.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5">
                      <div className="text-xs text-gray-700 font-mono bg-gray-50 px-2 py-0.5 rounded inline-block border border-gray-200">
                        {log.ipAddress || '127.0.0.1'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 max-w-xs truncate" title={log.deviceInfo}>
                        {log.deviceInfo || 'Unknown Device'}
                      </div>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="px-4 sm:px-6 py-12 text-center text-gray-500 text-sm">
                      No tracking logs found.
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