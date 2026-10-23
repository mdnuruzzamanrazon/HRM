import React from 'react';
import { 
  BarChart3, PieChart, TrendingUp, Clock, 
  CheckCircle2, AlertTriangle, Scale, Phone, 
  Mail, User, Inbox, Globe, Building2, ShieldCheck,
  Layers, ArrowUpRight
} from 'lucide-react';

export default function ComplaintsAnalyticsView({ stats, complaints = [], onSwitchToRegister }) {
  if (!stats) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <div className="inline-block p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
          <BarChart3 className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Compiling Analytics &amp; Case Statistics...</h3>
        <p className="text-xs text-slate-500 mt-1">Aggregating live intake, channel distribution, and resolution performance.</p>
      </div>
    );
  }

  const {
    totalRecords = 0,
    openComplaints = 0,
    closedComplaints = 0,
    pendingAppeals = 0,
    overdueComplaints = 0,
    byChannel = {},
    byCategory = {},
    byPartner = {}
  } = stats;

  const resolutionRate = totalRecords > 0 ? Math.round((closedComplaints / totalRecords) * 100) : 0;
  const overdueRate = totalRecords > 0 ? Math.round((overdueComplaints / totalRecords) * 100) : 0;

  // Sorted arrays for bar progress
  const channelList = Object.entries(byChannel).sort((a, b) => b[1] - a[1]);
  const categoryList = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const partnerList = Object.entries(byPartner).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Analytics Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Volume */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Total Intake Volume</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{totalRecords}</span>
            <span className="text-xs text-slate-500 block mt-1 font-medium">Logged feedback &amp; grievances</span>
          </div>
        </div>

        {/* Card 2: Resolution Rate */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-700">
            <span>Resolution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700">{resolutionRate}%</span>
              <span className="text-xs font-bold text-slate-600">({closedComplaints} closed)</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${resolutionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: 30-Day Delay Rate */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-700">
            <span>Overdue (&gt;30d) Rate</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-700">{overdueRate}%</span>
              <span className="text-xs font-bold text-slate-600">({overdueComplaints} overdue)</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${overdueRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Appeals In Pipeline */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-purple-700">
            <span>Pending Appeals</span>
            <Scale className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-purple-700">{pendingAppeals}</span>
            <span className="text-xs text-slate-500 block mt-1 font-medium">Under joint ED &amp; Oxfam review</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Intake Channel Distribution */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">Intake Channels Distribution</h4>
            </div>
            <span className="text-xs font-semibold text-slate-500">{channelList.length} Channels Active</span>
          </div>

          <div className="space-y-3 pt-1">
            {channelList.map(([channel, count]) => {
              const pct = totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0;
              return (
                <div key={channel} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{channel}</span>
                    <span className="text-slate-600 font-mono">{count} cases ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Classification Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">Complaint Classification Breakdown</h4>
            </div>
            <span className="text-xs font-semibold text-slate-500">{categoryList.length} Categories</span>
          </div>

          <div className="space-y-3 pt-1">
            {categoryList.map(([cat, count]) => {
              const pct = totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 truncate max-w-[260px]">{cat}</span>
                    <span className="text-slate-600 font-mono">{count} cases ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Partner Caseload Distribution */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">Concerned Partner / Organization Caseload</h4>
          </div>
          <span className="text-xs font-semibold text-slate-500">{partnerList.length} Organizations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {partnerList.map(([org, count]) => {
            const pct = totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0;
            return (
              <div key={org} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">{org}</span>
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-mono">
                    {count}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {pct}% of total project grievances
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
