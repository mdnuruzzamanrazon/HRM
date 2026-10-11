import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Attendance</h2>
          <p className="text-gray-500 mt-1">Track workforce presence for {format(new Date(date), 'MMMM dd, yyyy')}</p>
        </div>
        
        {/* ESS Clock In/Out Actions */}
        {user?.role === 'SUPER_ADMIN' || user?.employeeProfileId ? (
          <div className="flex space-x-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            {!myRecord ? (
              <button onClick={handleClockIn} disabled={actionLoading} className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50">
                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                Clock In
              </button>
            ) : !myRecord.checkOut?.timestamp ? (
              <button onClick={handleClockOut} disabled={actionLoading} className="inline-flex items-center px-4 py-2 bg-rose-50 text-rose-700 font-medium rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50">
                {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
                Clock Out
              </button>
            ) : (
              <div className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-500 font-medium rounded-lg border border-gray-200">
                <CheckCircle2 className="h-5 w-5 mr-2 text-gray-400" />
                Shift Completed
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Clock In</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Clock Out</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hours Worked</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-primary font-bold text-sm shadow-sm">
                          {record.employeeId?.personalDetails?.firstName?.[0] || '?'}{record.employeeId?.personalDetails?.lastName?.[0] || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {record.employeeId?.personalDetails?.firstName} {record.employeeId?.personalDetails?.lastName}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{record.employeeId?.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                        record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                        {record.checkIn?.timestamp ? format(new Date(record.checkIn.timestamp), 'hh:mm a') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                        {record.checkOut?.timestamp ? format(new Date(record.checkOut.timestamp), 'hh:mm a') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {record.totalWorkMinutes > 0 ? `${(record.totalWorkMinutes / 60).toFixed(1)} hrs` : '-'}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm">
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
