import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Clock, CheckCircle2, AlertCircle, Calendar, Plus, 
  LogIn, LogOut, ArrowRight, Loader2, Sparkles, Filter 
} from 'lucide-react';

export default function EmployeeAttendance() {
  const [attendanceData, setAttendanceData] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Filter state
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Correction Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    checkInTime: '09:00',
    checkOutTime: '17:00',
    reason: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [todayRes, historyRes, correctionsRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get(`/attendance/my?month=${month}&year=${year}`),
        api.get('/attendance/corrections/my')
      ]);

      if (todayRes.data?.success) setTodayStatus(todayRes.data.data);
      if (historyRes.data?.success) setAttendanceData(historyRes.data.data);
      if (correctionsRes.data?.success) setCorrections(correctionsRes.data.data || []);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const handleClockAction = async (action) => {
    try {
      setClocking(true);
      setMessage({ text: '', type: '' });
      const endpoint = action === 'in' ? '/attendance/clock-in' : '/attendance/clock-out';
      const res = await api.post(endpoint, {});
      if (res.data?.success) {
        setMessage({ text: res.data.message, type: 'success' });
        await fetchData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Attendance action failed', type: 'error' });
    } finally {
      setClocking(false);
    }
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionForm.reason.trim()) {
      alert('Please provide a reason for the correction request.');
      return;
    }
    try {
      setSubmittingCorrection(true);
      const res = await api.post('/attendance/corrections', correctionForm);
      if (res.data?.success) {
        setMessage({ text: 'Attendance correction request submitted to HR for approval!', type: 'success' });
        setModalOpen(false);
        setCorrectionForm({
          date: new Date().toISOString().split('T')[0],
          checkInTime: '09:00',
          checkOutTime: '17:00',
          reason: ''
        });
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit correction request.');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const stats = attendanceData?.stats;
  const records = attendanceData?.records || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      
      {/* Top Header & Correction Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Attendance & Work Hours
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Record daily check-ins, view monthly work records, and submit correction requests
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          Request Attendance Correction
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
          <button onClick={() => setMessage({ text: '', type: '' })} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Today's Terminal Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Attendance</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              todayStatus?.hasCheckedIn 
                ? (todayStatus?.hasCheckedOut ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800') 
                : 'bg-slate-100 text-slate-600'
            }`}>
              {todayStatus?.status || 'NOT_CHECKED_IN'}
            </span>
          </div>
          <p className="text-lg font-extrabold text-slate-900">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
            <span>In: <strong className="text-slate-800">{todayStatus?.checkIn ? new Date(todayStatus.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</strong></span>
            <span>&bull;</span>
            <span>Out: <strong className="text-slate-800">{todayStatus?.checkOut ? new Date(todayStatus.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</strong></span>
            <span>&bull;</span>
            <span>Total: <strong className="text-emerald-700">{todayStatus?.totalWorkMinutes ? `${(todayStatus.totalWorkMinutes / 60).toFixed(1)} hrs` : '0.0 hrs'}</strong></span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {!todayStatus?.hasCheckedIn ? (
            <button
              type="button"
              disabled={clocking}
              onClick={() => handleClockAction('in')}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm flex items-center gap-2.5 transition-all shadow-md shadow-emerald-900/20 cursor-pointer disabled:opacity-50"
            >
              {clocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              Clock In Today
            </button>
          ) : !todayStatus?.hasCheckedOut ? (
            <button
              type="button"
              disabled={clocking}
              onClick={() => handleClockAction('out')}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-sm flex items-center gap-2.5 transition-all shadow-md shadow-rose-900/20 cursor-pointer disabled:opacity-50"
            >
              {clocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
              Clock Out for the Day
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Completed for Today
            </div>
          )}
        </div>
      </div>

      {/* 4 Attendance Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Days Present</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.presentCount ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">In selected period</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Late Arrivals</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats?.lateCount ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Recorded after 09:30 AM</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Total Work Hours</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.totalWorkHours ?? '0.0'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Hours logged</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Avg Hours / Day</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{stats?.avgDailyHours ?? '0.0'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Average daily duration</p>
        </div>
      </div>

      {/* Monthly Attendance Records Table with Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Table Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Attendance Log History</h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Hours</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading records...
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((r) => {
                  const checkInDisplay = r.checkIn?.timestamp 
                    ? new Date(r.checkIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : (r.checkIn || '--:--');

                  const checkOutDisplay = r.checkOut?.timestamp 
                    ? new Date(r.checkOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : (r.checkOut || '--:--');

                  const hours = r.totalWorkMinutes 
                    ? (r.totalWorkMinutes / 60).toFixed(1) 
                    : (r.workHours || '0.0');

                  const statusBadges = {
                    PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    LATE: 'bg-amber-50 text-amber-700 border-amber-200',
                    ABSENT: 'bg-rose-50 text-rose-700 border-rose-200',
                    HALF_DAY: 'bg-blue-50 text-blue-700 border-blue-200'
                  };

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {r.date}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {checkInDisplay}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {checkOutDisplay}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {hours} hrs
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadges[r.status] || 'bg-slate-100 text-slate-700'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                    No attendance records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Correction Requests Status Table */}
      {corrections.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            My Attendance Correction Requests
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Requested Check-In</th>
                  <th className="py-2.5 px-3">Requested Check-Out</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">HR Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {corrections.map((c) => {
                  const statusColors = {
                    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200'
                  };

                  return (
                    <tr key={c._id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{c.date}</td>
                      <td className="py-2.5 px-3 font-mono">{c.checkInTime}</td>
                      <td className="py-2.5 px-3 font-mono">{c.checkOutTime}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{c.reason}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[c.status] || 'bg-slate-100 text-slate-700'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 italic">{c.reviewRemarks || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Correction Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-modal-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Request Attendance Correction</h3>
              <button 
                type="button" 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={correctionForm.date}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Check-In Time</label>
                  <input
                    type="time"
                    required
                    value={correctionForm.checkInTime}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, checkInTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Check-Out Time</label>
                  <input
                    type="time"
                    required
                    value={correctionForm.checkOutTime}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, checkOutTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Correction</label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g., Forgot to clock in due to immediate field deployment..."
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
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
                  disabled={submittingCorrection}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-brand-700 text-white font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingCorrection ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Submit to HR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
