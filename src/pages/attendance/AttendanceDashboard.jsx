import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { 
  Clock, CheckCircle2, XCircle, Loader2, Calendar, 
  Users, AlertTriangle, ArrowUpDown, Check, Filter 
} from 'lucide-react';
import { formatSafeDate } from '../../utils/date';
import { useAuth } from '../../context/AuthContext';

export default function AttendanceDashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');
  const [actionLoading, setActionLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reviewingId, setReviewingId] = useState(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [attRes, corrRes] = await Promise.all([
        api.get(`/attendance/daily?date=${date}`),
        api.get('/attendance/corrections')
      ]);
      setRecords(attRes.data?.data || []);
      setCorrections(corrRes.data?.data || []);
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

  const handleReviewCorrection = async (id, status) => {
    try {
      setReviewingId(id);
      await api.put(`/attendance/corrections/${id}/review`, {
        status,
        remarks: status === 'APPROVED' ? 'Approved by HR Lead' : 'Rejected'
      });
      await fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review correction');
    } finally {
      setReviewingId(null);
    }
  };

  const myRecord = records.find(r => r.employeeId?._id === user?.employeeProfileId);

  const formatTime = (recordValue) => {
    if (!recordValue) return '—';
    if (typeof recordValue === 'string') return recordValue;
    if (recordValue.timestamp) return formatSafeDate(recordValue.timestamp, 'hh:mm a', '—');
    return '—';
  };

  const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const lateCount = records.filter(r => r.status === 'LATE').length;
  const pendingCorrectionsCount = corrections.filter(c => c.status === 'PENDING').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Attendance & Punctuality</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time workplace logs, punctuality metrics, and employee punch correction requests
          </p>
        </div>

        {/* ESS Clock In/Out Actions for HR User */}
        {(user?.role === 'SUPER_ADMIN' || user?.employeeProfileId) && (
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
            {!myRecord ? (
              <button 
                onClick={handleClockIn} 
                disabled={actionLoading} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all text-xs cursor-pointer shadow-xs"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Punch In (Self)</span>
              </button>
            ) : !myRecord.checkOut?.timestamp ? (
              <button 
                onClick={handleClockOut} 
                disabled={actionLoading} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all text-xs cursor-pointer shadow-xs"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                <span>Punch Out (Self)</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Today's Shift Logged</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Recorded</span>
            <div className="text-2xl font-black text-slate-900">{records.length}</div>
            <span className="text-[11px] text-slate-400 font-medium">Logged on selected date</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Present</span>
            <div className="text-2xl font-black text-emerald-600">{presentCount}</div>
            <span className="text-[11px] text-emerald-600 font-medium">On site & active</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Late Arrivals</span>
            <div className="text-2xl font-black text-amber-500">{lateCount}</div>
            <span className="text-[11px] text-amber-600 font-medium">Past grace window</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Corrections</span>
            <div className="text-2xl font-black text-purple-600">{pendingCorrectionsCount}</div>
            <span className="text-[11px] text-purple-600 font-medium">Awaiting HR review</span>
          </div>
        </div>
      </div>

      {/* Tabs & Date Toolbar */}
      <div className="card-modern p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Daily Attendance Logs ({records.length})
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === 'corrections'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Punch Corrections ({corrections.length})
            {pendingCorrectionsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                {pendingCorrectionsCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'daily' && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-slate-500">Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Daily Logs Table */}
      {activeTab === 'daily' && (
        <div className="card-modern overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center p-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="text-xs font-semibold text-slate-400">Loading daily attendance records...</span>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-6">Employee</th>
                    <th className="py-3.5 px-6">Employee Code</th>
                    <th className="py-3.5 px-6">Attendance Status</th>
                    <th className="py-3.5 px-6">Check In</th>
                    <th className="py-3.5 px-6">Check Out</th>
                    <th className="py-3.5 px-6 text-right">Hours Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => {
                    const first = record.employeeId?.personalDetails?.firstName || '';
                    const last = record.employeeId?.personalDetails?.lastName || '';
                    const initials = `${first[0] || '?'}${last[0] || '?'}`;
                    const code = record.employeeId?.employeeCode || '—';

                    return (
                      <tr key={record._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {initials}
                            </div>
                            <span className="font-bold text-slate-900 text-xs">{first} {last}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap font-mono font-bold text-slate-600">
                          {code}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            record.status === 'PRESENT' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : record.status === 'LATE'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap font-mono text-slate-700">
                          {formatTime(record.checkIn)}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap font-mono text-slate-700">
                          {formatTime(record.checkOut)}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right font-black text-slate-900">
                          {record.totalWorkMinutes > 0 ? `${(record.totalWorkMinutes / 60).toFixed(1)} hrs` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-slate-400">
                        <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <h4 className="text-sm font-bold text-slate-700">No attendance records on {date}</h4>
                        <p className="text-xs text-slate-400 mt-1">Select another date to view historical attendance logs.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Attendance Corrections Management Table */}
      {activeTab === 'corrections' && (
        <div className="card-modern overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-6">Employee</th>
                  <th className="py-3.5 px-6">Date Requiring Correction</th>
                  <th className="py-3.5 px-6">Requested Times</th>
                  <th className="py-3.5 px-6">Reason / Justification</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {corrections.map((corr) => {
                  const empName = corr.employeeId?.personalDetails 
                    ? `${corr.employeeId.personalDetails.firstName} ${corr.employeeId.personalDetails.lastName}`
                    : 'Staff Member';

                  return (
                    <tr key={corr._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap font-bold text-slate-900">
                        {empName}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-mono text-slate-700">
                        {corr.date}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-mono text-slate-700">
                        {corr.checkInTime} &ndash; {corr.checkOutTime}
                      </td>
                      <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                        {corr.reason || '—'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          corr.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : corr.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {corr.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        {corr.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleReviewCorrection(corr._id, 'APPROVED')}
                              disabled={reviewingId === corr._id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewCorrection(corr._id, 'REJECTED')}
                              disabled={reviewingId === corr._id}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {corrections.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-400">
                      <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <h4 className="text-sm font-bold text-slate-700">No punch corrections filed</h4>
                      <p className="text-xs text-slate-400 mt-1">All employee attendance records are consistent.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
