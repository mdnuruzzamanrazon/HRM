import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Clock, Calendar, CreditCard, Receipt, CalendarClock, 
  CheckCircle2, AlertCircle, ArrowRight, UserCheck, 
  LogIn, LogOut, Megaphone, Loader2, Sparkles, Building2, MapPin
} from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employee-portal/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleClockAction = async (action) => {
    try {
      setClocking(true);
      setMessage({ text: '', type: '' });
      const endpoint = action === 'in' ? '/attendance/clock-in' : '/attendance/clock-out';
      const res = await api.post(endpoint, {});
      
      if (res.data?.success) {
        setMessage({ 
          text: res.data.message || (action === 'in' ? 'Clocked in successfully!' : 'Clocked out successfully!'), 
          type: 'success' 
        });
        await fetchDashboardData();
      }
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.message || 'Attendance action failed. Please try again.', 
        type: 'error' 
      });
    } finally {
      setClocking(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Loading your employee portal...</p>
      </div>
    );
  }

  const employee = data?.employee;
  const firstName = employee?.personalDetails?.firstName || user?.email?.split('@')[0] || 'Employee';
  const lastName = employee?.personalDetails?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const title = employee?.jobDetails?.title || 'Staff Member';
  const code = employee?.employeeCode || 'CBDP-EMP';
  const department = employee?.jobDetails?.departmentId?.name || employee?.jobDetails?.department || 'Operations';
  const todayAtt = data?.todayAttendance;
  const leaveSummary = data?.leaveSummary;
  const attSummary = data?.attendanceSummary;
  const shift = data?.assignedShift;
  const recentPayslip = data?.recentPayslip;
  const notices = data?.notices || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-10">
      
      {/* Alert / Notification banner */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm transition-all animate-fadeIn ${
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
          <button 
            onClick={() => setMessage({ text: '', type: '' })}
            className="text-xs font-semibold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Employee Self-Service Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="text-emerald-400">{firstName}</span>!
            </h1>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-slate-300">
              <span className="flex items-center gap-1.5 font-medium text-white">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                {title}
              </span>
              <span className="text-slate-500">&bull;</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {department}
              </span>
              <span className="text-slate-500">&bull;</span>
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-300 text-xs border border-slate-700">
                {code}
              </span>
            </div>
          </div>

          {/* Quick Action Today Clock Card inside Hero */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row items-center gap-4 flex-shrink-0">
            <div className="text-center sm:text-left min-w-[140px]">
              <p className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">Today's Status</p>
              <div className="flex items-center gap-2 mt-0.5 justify-center sm:justify-start">
                <span className={`w-2.5 h-2.5 rounded-full ${todayAtt?.hasCheckedIn ? (todayAtt?.hasCheckedOut ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse') : 'bg-slate-400'}`} />
                <span className="text-sm font-bold text-white">
                  {todayAtt?.hasCheckedIn 
                    ? (todayAtt?.hasCheckedOut ? 'Completed Shift' : 'Clocked In') 
                    : 'Not Checked In'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {todayAtt?.checkIn ? `In at ${new Date(todayAtt.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Shift starts 09:00'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!todayAtt?.hasCheckedIn ? (
                <button
                  type="button"
                  disabled={clocking}
                  onClick={() => handleClockAction('in')}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
                >
                  {clocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  Check In Now
                </button>
              ) : !todayAtt?.hasCheckedOut ? (
                <button
                  type="button"
                  disabled={clocking}
                  onClick={() => handleClockAction('out')}
                  className="px-4 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-rose-950/40 cursor-pointer disabled:opacity-50"
                >
                  {clocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                  Check Out
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                  Recorded Today
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Attendance Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Attendance</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{attSummary?.presentCount ?? 20}</span>
            <span className="text-xs text-slate-500 font-medium">Days Present (This Month)</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Late: <strong className="text-amber-600">{attSummary?.lateCount ?? 0}</strong></span>
            <Link to="/employee/attendance" className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
              History <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Leave Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Leave Balance</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">{leaveSummary?.available ?? 24}</span>
            <span className="text-xs text-slate-500 font-medium">Days Available</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Pending: <strong className="text-amber-600">{leaveSummary?.pending ?? 0}</strong></span>
            <Link to="/employee/leave" className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5">
              Apply Leave <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Latest Payslip */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Salary</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ${recentPayslip?.netSalary?.toLocaleString() || '6,500'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {recentPayslip ? `Month ${recentPayslip.month}/${recentPayslip.year}` : 'Latest Pay'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <CheckCircle2 className="w-3 h-3" /> {recentPayslip?.status || 'PAID'}
            </span>
            <Link to="/employee/payroll" className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
              Payslips <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Assigned Shift */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Work Shift</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 truncate">
              {shift?.name || 'Standard Morning'}
            </span>
            <span className="text-xs text-purple-700 font-medium">
              {shift ? `${shift.startTime} — ${shift.endTime}` : '09:00 — 17:00'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Mon &ndash; Fri (8 hrs)</span>
            <Link to="/employee/shifts" className="font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-0.5">
              Schedule <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Quick Employee Services
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Link
            to="/employee/leave"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-200 transition-all text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Apply Leave</span>
            <span className="text-[10px] text-slate-400">Request time off</span>
          </Link>

          <Link
            to="/employee/attendance"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-200 transition-all text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Attendance</span>
            <span className="text-[10px] text-slate-400">Clock in/out & history</span>
          </Link>

          <Link
            to="/employee/payroll"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-200 transition-all text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">My Payslips</span>
            <span className="text-[10px] text-slate-400">Salary records & slips</span>
          </Link>

          <Link
            to="/employee/expenses"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-200 transition-all text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Claim Expense</span>
            <span className="text-[10px] text-slate-400">Submit reimbursements</span>
          </Link>

          <Link
            to="/employee/shifts"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-200 transition-all text-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <CalendarClock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Work Shifts</span>
            <span className="text-[10px] text-slate-400">View weekly schedule</span>
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Recent Leave & Company Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Leave Requests */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Recent Leave Applications
            </h3>
            <Link to="/employee/leave" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              View All &rarr;
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {data?.recentLeaves && data.recentLeaves.length > 0 ? (
              <div className="space-y-3">
                {data.recentLeaves.map((l) => {
                  const statusColors = {
                    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
                    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
                  };

                  return (
                    <div key={l._id} className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{l.leaveType} Leave</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[l.status] || 'bg-slate-100 text-slate-700'}`}>
                            {l.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {new Date(l.startDate).toLocaleDateString()} &ndash; {new Date(l.endDate).toLocaleDateString()} ({l.totalDays} {l.totalDays === 1 ? 'day' : 'days'})
                        </p>
                        {l.reason && (
                          <p className="text-xs text-slate-600 italic truncate mt-0.5">"{l.reason}"</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No recent leave requests found.
              </div>
            )}
          </div>
        </div>

        {/* Company Announcements / Notices */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-600" />
              HR Announcements & Notices
            </h3>
            <Link to="/employee/notices" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              Notice Board &rarr;
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {notices.length > 0 ? (
              notices.map((n) => (
                <div key={n._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {n.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active announcements right now.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
