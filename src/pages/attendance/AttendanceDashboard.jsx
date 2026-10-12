import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatSafeDate } from '../../utils/date';
import { useAuth } from '../../context/AuthContext';

export default function AttendanceDashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [date] = useState(new Date().toISOString().split('T')[0]);

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get(`/attendance/daily?date=${date}`);
      setRecords(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      await api.post('/attendance/clock-in', { employeeId: user.employeeProfileId });
      await fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Error clocking in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      await api.post('/attendance/clock-out', { employeeId: user.employeeProfileId });
      await fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Error clocking out');
    } finally {
      setActionLoading(false);
    }
  };

  // Find my own record
  const myRecord = records.find(r => r.employeeId?._id === user?.employeeProfileId);

  const formatTime = (recordValue) => {
    if (!recordValue) return '-';
    if (typeof recordValue === 'string') return recordValue;
    if (recordValue.timestamp) return formatSafeDate(recordValue.timestamp, 'hh:mm a', '-');
    return '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Daily Attendance</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Track workforce presence for {formatSafeDate(date, 'MMMM dd, yyyy')}</p>
        </div>
        
        {/* ESS Clock In/Out Actions */}
        {user?.role === 'SUPER_ADMIN' || user?.employeeProfileId ? (
          <div className="flex w-full sm:w-auto bg-white p-1.5 sm:p-2 rounded-xl shadow-xs border border-gray-200">
            {!myRecord ? (
              <button onClick={handleClockIn} disabled={actionLoading} className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50 text-sm">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Clock In
              </button>
            ) : !myRecord.checkOut?.timestamp ? (
              <button onClick={handleClockOut} disabled={actionLoading} className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-rose-50 text-rose-700 font-medium rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50 text-sm">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                Clock Out
              </button>
            ) : (
              <div className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-600 font-medium rounded-lg border border-gray-200 text-sm">
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                Shift Completed
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Clock In</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Clock Out</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Hours Worked</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-9 w-9 sm:h-10 sm:w-10">
                          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-primary font-bold text-xs sm:text-sm shadow-xs">
                            {record.employeeId?.personalDetails?.firstName?.[0] || '?'}{record.employeeId?.personalDetails?.lastName?.[0] || '?'}
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {record.employeeId?.personalDetails?.firstName} {record.employeeId?.personalDetails?.lastName}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{record.employeeId?.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-md ${
                        record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        {formatTime(record.checkIn)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        {formatTime(record.checkOut)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-sm text-gray-800 font-semibold">
                      {record.totalWorkMinutes > 0 ? `${(record.totalWorkMinutes / 60).toFixed(1)} hrs` : '-'}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 sm:px-6 py-12 text-center text-gray-500 text-sm">
                      No attendance records found for today.
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
