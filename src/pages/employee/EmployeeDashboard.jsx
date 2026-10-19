import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Clock, Calendar, CreditCard, Receipt, CalendarClock, 
  CheckCircle2, AlertCircle, ArrowRight, UserCheck, 
  LogIn, LogOut, Megaphone, Loader2, Sparkles, Building2, MapPin,
  CheckSquare, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Horizontal Task Scroll Controls
  const taskScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateTaskScrollButtons = () => {
    if (taskScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = taskScrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const handleTaskScroll = (direction) => {
    if (taskScrollRef.current) {
      const scrollAmount = 360;
      taskScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, tasksRes] = await Promise.all([
        api.get('/employee-portal/dashboard'),
        api.get('/tasks')
      ]);
      if (dashRes.data?.success) {
        setData(dashRes.data.data);
      }
      if (tasksRes.data?.success) {
        setTasks(tasksRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTaskFromDashboard = async (taskId) => {
    try {
      const res = await api.put(`/tasks/${taskId}/accept`);
      if (res.data?.success) {
        setMessage({ text: 'Task accepted successfully! Track your deliverable in My Tasks.', type: 'success' });
        await fetchDashboardData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to accept task', type: 'error' });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const el = taskScrollRef.current;
    if (!el) return;

    updateTaskScrollButtons();
    el.addEventListener('scroll', updateTaskScrollButtons, { passive: true });
    window.addEventListener('resize', updateTaskScrollButtons);
    const timer = setTimeout(updateTaskScrollButtons, 350);

    return () => {
      el.removeEventListener('scroll', updateTaskScrollButtons);
      window.removeEventListener('resize', updateTaskScrollButtons);
      clearTimeout(timer);
    };
  }, [tasks]);

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

  const pendingTasks = tasks.filter(t => t.status === 'AWAITING_ACCEPTANCE');
  const activeTasks = tasks.filter(t => ['ACCEPTED', 'IN_PROGRESS', 'REVISION_REQUIRED'].includes(t.status));

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-10">
      
      {/* Prominent Task Notification Banner (Requirement 3) */}
      {pendingTasks.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-4 sm:p-5 text-white shadow-lg shadow-amber-500/20 border border-amber-400/40 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 ring-1 ring-white/30">
                <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-md">
                    Action Required
                  </span>
                  <span className="text-xs font-bold text-amber-100">
                    {pendingTasks.length} task{pendingTasks.length > 1 ? 's' : ''} awaiting your acceptance
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                  {pendingTasks[0].title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-amber-100">
                  <span>Assigned: {pendingTasks[0].createdAt ? format(new Date(pendingTasks[0].createdAt), 'MMM dd, yyyy') : 'Recent'}</span>
                  <span>&bull;</span>
                  <span className="font-bold text-white">Deadline: {pendingTasks[0].dueDate ? format(new Date(pendingTasks[0].dueDate), 'MMM dd, yyyy') : 'N/A'}</span>
                  <span>&bull;</span>
                  <span className="font-extrabold uppercase bg-white text-amber-900 px-2 py-0.2 rounded text-[10px]">
                    {pendingTasks[0].priority} Priority
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
              <button
                onClick={() => handleAcceptTaskFromDashboard(pendingTasks[0]._id)}
                className="px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-900 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Accept Task Now</span>
              </button>
              <Link
                to={`/employee/tasks?taskId=${pendingTasks[0]._id}`}
                className="px-4 py-2.5 bg-amber-700/60 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all border border-white/20 flex items-center gap-1.5"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <Link
            to="/employee/tasks"
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-200 transition-all text-center group cursor-pointer relative"
          >
            {pendingTasks.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {pendingTasks.length}
              </span>
            )}
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">My Tasks</span>
            <span className="text-[10px] text-slate-400">Deliverables & work</span>
          </Link>

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

      {/* Active Tasks Widget - Modern Horizontal Scroll Carousel */}
      {activeTasks.length > 0 && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs relative">
          
          {/* Header Row: Title + Status Badge + Navigation Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Active Tasks & Deliverables</h3>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {activeTasks.length} {activeTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                  Scroll horizontally to browse your assigned deliverables and deadlines
                </p>
              </div>
            </div>

            {/* Controls: Scroll Arrows & "All Tasks" Button */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {/* Arrow navigation buttons */}
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
                <button
                  type="button"
                  onClick={() => handleTaskScroll('left')}
                  disabled={!canScrollLeft}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  title="Scroll left"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTaskScroll('right')}
                  disabled={!canScrollRight}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-emerald-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  title="Scroll right"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* All Tasks Link */}
              <Link 
                to="/employee/tasks" 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-xs font-bold text-slate-700 hover:text-emerald-700 border border-slate-200/80 hover:border-emerald-200 transition-all shadow-2xs group cursor-pointer"
                title="View all tasks in My Tasks portal"
              >
                <span>All Tasks</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Horizontal Scroll Track */}
          <div 
            ref={taskScrollRef}
            className="flex gap-4 overflow-x-auto pb-3 pt-1 px-0.5 custom-scrollbar snap-x snap-mandatory scroll-smooth focus:outline-none"
            tabIndex={0}
            role="region"
            aria-label="Active tasks carousel"
          >
            {activeTasks.map(task => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
              const needsRevision = task.status === 'REVISION_REQUIRED';

              return (
                <Link
                  key={task._id}
                  to={`/employee/tasks?taskId=${task._id}`}
                  className={`min-w-[280px] sm:min-w-[330px] md:min-w-[350px] max-w-[370px] flex-shrink-0 snap-start rounded-2xl p-4.5 bg-gradient-to-b from-white to-slate-50/60 hover:to-emerald-50/20 border transition-all duration-200 flex flex-col justify-between group cursor-pointer relative shadow-2xs hover:shadow-md hover:-translate-y-0.5 ${
                    needsRevision 
                      ? 'border-rose-200 hover:border-rose-400 bg-rose-50/10' 
                      : 'border-slate-200/85 hover:border-emerald-400/90'
                  }`}
                >
                  {/* Card Header: Priority & Status Badges */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        task.priority === 'URGENT' 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : task.priority === 'HIGH' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : task.priority === 'MEDIUM'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {task.priority || 'MEDIUM'}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        needsRevision
                          ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          needsRevision ? 'bg-rose-500' : task.status === 'IN_PROGRESS' ? 'bg-sky-500' : 'bg-emerald-500'
                        }`} />
                        {needsRevision 
                          ? 'Revision Needed' 
                          : task.status === 'IN_PROGRESS' 
                          ? 'In Progress' 
                          : 'Accepted'}
                      </span>
                    </div>

                    {/* Task Title */}
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-snug pt-1">
                      {task.title}
                    </h4>

                    {/* Task Description */}
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {task.description || task.instructions || 'Review assigned deliverable requirements and submit files.'}
                    </p>
                  </div>

                  {/* Card Footer: Due Date + Open Arrow */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                      <span className={`text-[11px] font-medium ${isOverdue ? 'text-rose-600 font-bold' : ''}`}>
                        Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : 'No date'}
                      </span>
                      {isOverdue && (
                        <span className="text-[9px] font-black uppercase bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">
                          Overdue
                        </span>
                      )}
                    </div>

                    <span className="font-bold text-xs text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1 transition-colors">
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

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
