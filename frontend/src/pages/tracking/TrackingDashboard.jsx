import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Loader2, MapPin, MonitorSmartphone, Clock, Crosshair, 
  Activity, ShieldCheck, CheckCircle2, Globe2, Radio
} from 'lucide-react';
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
      setLogs(data.data || []);
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
      const location = "Remote - Corporate VPN Gateway";
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
      case 'LOCATION_CHECKIN': 
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <MapPin className="w-4 h-4" />
          </div>
        );
      case 'SYSTEM_LOGIN': 
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <MonitorSmartphone className="w-4 h-4" />
          </div>
        );
      default: 
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
            <Clock className="w-4 h-4" />
          </div>
        );
    }
  };

  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(user.role);
  const checkinLogs = logs.filter(l => l.activityType === 'LOCATION_CHECKIN');
  const loginLogs = logs.filter(l => l.activityType === 'SYSTEM_LOGIN');

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Workforce Telemetry & Remote Check-in
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Supervise geo-verified presence pings, active device sessions, and telecommuting logs.
          </p>
        </div>
        <button 
          onClick={handleCheckIn}
          disabled={checkingIn}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-primary hover:bg-brand-700 shadow-xs transition-colors disabled:opacity-70 cursor-pointer w-full sm:w-auto"
        >
          {checkingIn ? (
            <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="-ml-1 mr-2 h-4 w-4" />
          )}
          Dispatch Telemetry Ping
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Telemetry</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{logs.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location Pings</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">{checkinLogs.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Logins</div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 mt-0.5">{loginLogs.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <MonitorSmartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telemetry Status</div>
            <div className="text-xl sm:text-2xl font-black text-primary mt-0.5">Online</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Streaming Activity Logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75">
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-500">Timestamp</th>
                  {isAdmin && (
                    <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-500">Personnel</th>
                  )}
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-500">Activity Class</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-500">Endpoint / Network Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">
                        {formatSafeDate(log.createdAt, 'MMM dd, yyyy')}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {formatSafeDate(log.createdAt, 'hh:mm:ss a')}
                      </div>
                    </td>

                    {isAdmin && (
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-bold font-mono">
                            {log.employeeId?.personalDetails?.firstName?.[0] || 'E'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {log.employeeId?.personalDetails?.firstName} {log.employeeId?.personalDetails?.lastName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">{log.employeeId?.employeeCode || 'EMP'}</div>
                          </div>
                        </div>
                      </td>
                    )}

                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {getActivityIcon(log.activityType)}
                        <div>
                          <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            {log.activityType ? log.activityType.replace('_', ' ') : 'General Activity'}
                          </div>
                          <div className="text-xs text-slate-500 max-w-xs truncate">{log.description || 'Verified Telemetry Ping'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-xs text-slate-700 font-mono bg-slate-100 px-2.5 py-1 rounded-lg inline-block border border-slate-200">
                        {log.ipAddress || '127.0.0.1 (Localhost)'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 max-w-xs truncate" title={log.deviceInfo}>
                        {log.deviceInfo || 'Standard Web Client'}
                      </div>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="py-16 text-center text-slate-400 text-xs">
                      No telemetry logs recorded. Click "Dispatch Telemetry Ping" above to log initial activity.
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