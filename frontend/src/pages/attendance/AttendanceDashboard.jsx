import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  Clock, CheckCircle2, XCircle, Loader2, Calendar, 
  Users, AlertTriangle, ArrowUpDown, Check, Filter,
  Plus, Trash2, Edit3, X, AlertCircle, Save, Shield, MapPin
} from 'lucide-react';
import { formatSafeDate } from '../../utils/date';
import { useAuth } from '../../context/AuthContext';

export default function AttendanceDashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');
  const [actionLoading, setActionLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reviewingId, setReviewingId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Manual Attendance Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '09:00',
    checkOutTime: '17:00',
    status: 'PRESENT'
  });

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [attRes, corrRes, empRes] = await Promise.all([
        api.get(`/attendance/daily?date=${date}`),
        api.get('/attendance/corrections'),
        api.get('/employees')
      ]);
      setRecords(attRes.data?.data || []);
      setCorrections(corrRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (err) {
      console.error(err);
      notify('error', 'Failed to load attendance records');
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
      notify('success', 'Clocked in successfully');
      await fetchAttendance();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Error clocking in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      await api.post('/attendance/clock-out', { employeeId: user.employeeProfileId });
      notify('success', 'Clocked out successfully');
      await fetchAttendance();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Error clocking out');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewCorrection = async (id, status) => {
    try {
      setReviewingId(id);
      await api.put(`/attendance/corrections/${id}/review`, {
        status,
        remarks: status === 'APPROVED' ? 'Approved by HR Administrator' : 'Rejected by HR Administrator'
      });
      notify('success', `Correction request ${status.toLowerCase()} successfully`);
      await fetchAttendance();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to review correction');
    } finally {
      setReviewingId(null);
    }
  };

  const handleSaveManualAttendance = async (e) => {
    e.preventDefault();
    if (!manualForm.employeeId) {
      notify('error', 'Please select an employee');
      return;
    }
    setActionLoading(true);
    try {
      await api.post('/attendance/manual', manualForm);
      notify('success', 'Attendance record saved and synchronized');
      setIsManualModalOpen(false);
      await fetchAttendance();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to record attendance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this attendance log? This action is audited.')) return;
    try {
      await api.delete(`/attendance/${recordId}`);
      notify('success', 'Attendance record deleted');
      await fetchAttendance();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to delete record');
    }
  };

  const openOverrideModalFor = (record) => {
    setManualForm({
      employeeId: record.employeeId?._id || record.employeeId,
      date: record.date || date,
      checkInTime: record.checkIn?.timestamp ? formatSafeDate(record.checkIn.timestamp, 'HH:mm') : '09:00',
      checkOutTime: record.checkOut?.timestamp ? formatSafeDate(record.checkOut.timestamp, 'HH:mm') : '17:00',
      status: record.status || 'PRESENT'
    });
    setIsManualModalOpen(true);
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
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium shadow-md transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Attendance & Punctuality</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time workplace logs, punctuality metrics, and employee punch correction requests
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Geofence Management Link */}
          <Link
            to="/locations"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition-all text-xs cursor-pointer shadow-xs"
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Workplace Geofences</span>
          </Link>

          {/* Admin Manual Attendance Entry Button */}
          <button
            onClick={() => {
              setManualForm({
                employeeId: employees[0]?._id || '',
                date: date,
                checkInTime: '09:00',
                checkOutTime: '17:00',
                status: 'PRESENT'
              });
              setIsManualModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Entry / Override</span>
          </button>

          {/* Self-Punch In/Out for authenticated HR */}
          {(user?.role === 'SUPER_ADMIN' || user?.employeeProfileId) && (
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              {!myRecord ? (
                <button 
                  onClick={handleClockIn} 
                  disabled={actionLoading} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all text-xs cursor-pointer shadow-xs"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>Punch In</span>
                </button>
              ) : !myRecord.checkOut?.timestamp ? (
                <button 
                  onClick={handleClockOut} 
                  disabled={actionLoading} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all text-xs cursor-pointer shadow-xs"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  <span>Punch Out</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Logged</span>
                </div>
              )}
            </div>
          )}
        </div>
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
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Daily Attendance Logs ({records.length})
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === 'corrections'
                ? 'bg-slate-900 text-white shadow-xs'
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
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Tab 1: Daily Logs Table */}
      {activeTab === 'daily' && (
        <div className="card-modern overflow-hidden">
          {loading ? (
            <div className="flex flex-col justify-center items-center p-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                    <th className="py-3.5 px-6">GPS Geofence Verification</th>
                    <th className="py-3.5 px-6">Check In</th>
                    <th className="py-3.5 px-6">Check Out</th>
                    <th className="py-3.5 px-6">Hours Logged</th>
                    <th className="py-3.5 px-6 text-right">Administrative Actions</th>
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
                              : record.status === 'HALF_DAY'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {record.checkIn?.verificationStatus === 'VERIFIED' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <div>
                                <div className="font-semibold text-emerald-800 text-xs flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-emerald-600" />
                                  {record.checkIn.workplaceName || 'Authorized Workplace'}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {record.checkIn.distanceMeters !== undefined ? `${record.checkIn.distanceMeters}m from center` : 'Verified within perimeter'}
                                  {record.checkIn.accuracy ? ` (±${record.checkIn.accuracy}m)` : ''}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {record.isRemote ? 'Remote VPN' : 'Manual / Legacy'}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap font-mono text-slate-700">
                          {formatTime(record.checkIn)}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap font-mono text-slate-700">
                          {formatTime(record.checkOut)}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap font-black text-slate-900">
                          {record.totalWorkMinutes > 0 ? `${(record.totalWorkMinutes / 60).toFixed(1)} hrs` : '—'}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openOverrideModalFor(record)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Edit / Override Attendance"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-16 text-center text-slate-400">
                        <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <h4 className="text-sm font-bold text-slate-700">No attendance records on {date}</h4>
                        <p className="text-xs text-slate-400 mt-1">Select another date or click "Manual Entry / Override" to record attendance.</p>
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
                  <th className="py-3.5 px-6 text-right">HR Review Decision</th>
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
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewCorrection(corr._id, 'REJECTED')}
                              disabled={reviewingId === corr._id}
                              className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Decision finalized</span>
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

      {/* MANUAL RECORD / OVERRIDE MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Record / Override Attendance</h3>
              </div>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualAttendance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Target Employee *</label>
                <select
                  required
                  value={manualForm.employeeId}
                  onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.personalDetails?.firstName} {emp.personalDetails?.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Check In Time</label>
                  <input
                    type="time"
                    value={manualForm.checkInTime}
                    onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Check Out Time</label>
                  <input
                    type="time"
                    value={manualForm.checkOutTime}
                    onChange={(e) => setManualForm({ ...manualForm, checkOutTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Attendance Status *</label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="PRESENT">PRESENT (Full Day)</option>
                  <option value="LATE">LATE (Late Arrival)</option>
                  <option value="HALF_DAY">HALF_DAY</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
