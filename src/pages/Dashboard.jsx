import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Users, Clock, Calendar, CheckCircle2, AlertCircle, 
  Loader2, Plus, ArrowUpRight, TrendingUp, DollarSign,
  Megaphone, UserCheck, ChevronRight, Activity, Building2,
  CalendarClock, ShieldCheck, Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard');
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
      <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
      <p className="text-xs font-semibold text-slate-500">Loading enterprise dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 text-center my-6 shadow-xs max-w-xl mx-auto">
      <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
      <h3 className="text-sm font-bold">Failed to load dashboard data</h3>
      <p className="text-xs text-rose-600 mt-1">{error}</p>
    </div>
  );

  const stats = data?.stats || { totalEmployees: 12, presentToday: 10, onLeave: 2, pendingApprovals: 3 };
  const attendanceTrends = data?.attendanceTrends || [
    { name: 'Mon', present: 10, target: 12 },
    { name: 'Tue', present: 11, target: 12 },
    { name: 'Wed', present: 12, target: 12 },
    { name: 'Thu', present: 9, target: 12 },
    { name: 'Fri', present: 11, target: 12 },
    { name: 'Sat', present: 4, target: 4 },
    { name: 'Sun', present: 2, target: 2 }
  ];

  const adminName = user?.email?.split('@')[0] || 'Administrator';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Executive Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>CBDP Executive Management Overview</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white capitalize">
            Good day, {adminName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Here is your live workforce status, daily attendance compliance rate, and operational approval requests.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 sm:gap-3 self-start lg:self-auto">
          <Link
            to="/employees/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </Link>
          <Link
            to="/payroll"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all cursor-pointer backdrop-blur-xs"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Process Payroll</span>
          </Link>
          <Link
            to="/leave"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all cursor-pointer backdrop-blur-xs"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Approvals</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid (4 Cards Optimized for Desktop Width) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Total Employees */}
        <div className="card-modern p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Workforce</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalEmployees ?? 0}</div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Active Staff Members</span>
            </div>
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="card-modern p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Present Today</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.presentToday ?? 0}</div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-1">
              <span>{stats.totalEmployees > 0 ? Math.round(((stats.presentToday || 0) / stats.totalEmployees) * 100) : 100}% Attendance Rate</span>
            </div>
          </div>
        </div>

        {/* Card 3: On Leave */}
        <div className="card-modern p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">On Leave</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.onLeave ?? 0}</div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 mt-1">
              <span>Approved Time Off</span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending Approvals */}
        <div className="card-modern p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Pending Actions</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.pendingApprovals ?? 0}</div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mt-1">
              <span>Awaiting HR Sign-off</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Dual Grid: Attendance Analytics (2/3) & Operational Quick Status (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Attendance Trends & Visual Chart */}
        <div className="lg:col-span-2 card-modern p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Workforce Attendance Performance</h3>
              <p className="text-xs text-slate-500">Daily check-in and punctuality tracking across all departments</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                This Week
              </span>
            </div>
          </div>

          <div className="h-72 sm:h-80 w-full min-w-0 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} 
                />
                <Area type="monotone" dataKey="present" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" name="Check-ins" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Departmental Breakdown & Quick Hub */}
        <div className="card-modern p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Workforce Distribution</h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">4 Divisions</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Technology & Engineering</span>
                  <span className="font-bold text-slate-900">5 Staff (42%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full w-[42%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Human Resources & Admin</span>
                  <span className="font-bold text-slate-900">3 Staff (25%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full w-[25%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Finance & Accounting</span>
                  <span className="font-bold text-slate-900">2 Staff (17%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[17%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Operations & Field Logistics</span>
                  <span className="font-bold text-slate-900">2 Staff (17%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full w-[17%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Nav Shortcut */}
          <div className="pt-4 border-t border-slate-100">
            <Link
              to="/employees"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold transition-all flex items-center justify-between"
            >
              <span>Manage Entire Employee Roster</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>

      </div>

      {/* Bottom Triple Grid: Approvals, Announcements & Operations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Widget 1: Pending Leave Approvals */}
        <div className="card-modern p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-900">Leave Approvals</h4>
              </div>
              <Link to="/leave" className="text-xs font-bold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Sarah Jenkins</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">PENDING</span>
                </div>
                <p className="text-slate-500 text-[11px]">Annual Vacation &bull; 3 Days (Oct 24 - Oct 26)</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Michael Chang</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">PENDING</span>
                </div>
                <p className="text-slate-500 text-[11px]">Medical / Sick &bull; 2 Days (Nov 01 - Nov 02)</p>
              </div>
            </div>
          </div>

          <Link
            to="/leave"
            className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors"
          >
            Review Pending Leave Requests
          </Link>
        </div>

        {/* Widget 2: Attendance Corrections */}
        <div className="card-modern p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Punch Corrections</h4>
              </div>
              <Link to="/attendance" className="text-xs font-bold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Sarah Jenkins</span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">REVIEW</span>
                </div>
                <p className="text-slate-500 text-[11px]">Oct 17 &bull; Requested 09:00 - 17:30 (Badge error)</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>David Smith</span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">REVIEW</span>
                </div>
                <p className="text-slate-500 text-[11px]">Oct 16 &bull; Requested 08:50 - 17:00 (Client visit)</p>
              </div>
            </div>
          </div>

          <Link
            to="/attendance"
            className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200 transition-colors"
          >
            Review Punch Corrections
          </Link>
        </div>

        {/* Widget 3: Digital Notice Board Bulletin */}
        <div className="card-modern p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-bold text-slate-900">Latest Bulletins</h4>
              </div>
              <Link to="/noticeboard" className="text-xs font-bold text-indigo-600 hover:underline">
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Q4 All-Hands Meeting</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">GENERAL</span>
                </div>
                <p className="text-slate-500 text-[11px] line-clamp-1">Company-wide quarterly review on Friday at 3:00 PM</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Healthcare Open Enrollment</span>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">IMPORTANT</span>
                </div>
                <p className="text-slate-500 text-[11px] line-clamp-1">Submit benefit selection changes by end of month</p>
              </div>
            </div>
          </div>

          <Link
            to="/noticeboard"
            className="mt-4 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition-colors"
          >
            Post Notice to Workforce
          </Link>
        </div>

      </div>

    </div>
  );
}
