import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import api from '../../services/api';
import { 
  FolderKanban, ShieldAlert, FolderClock, CalendarDays, HeartHandshake,
  ArrowUpRight, Users, MapPin, Building2, Calendar, Clock, CheckCircle2,
  AlertTriangle, RefreshCw, Layers, TrendingUp, Sparkles, AlertCircle,
  FileText, ExternalLink, Activity, ArrowLeft, Boxes, Briefcase
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { cn } from '../../utils/cn';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedProjectId, setSelectedProjectId, projects } = useProject();

  // If no ID param provided, use selectedProjectId
  const activeId = id || selectedProjectId;

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeId) {
      // Ensure global project context matches this dashboard
      if (String(selectedProjectId) !== String(activeId)) {
        setSelectedProjectId(activeId);
      }
      fetchProjectDashboard(activeId);
    }
  }, [activeId]);

  const fetchProjectDashboard = async (projId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/projects/${projId}/dashboard`);
      if (res.data?.success) {
        setDashboardData(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Failed to load project dashboard');
      }
    } catch (err) {
      console.error('Error fetching project dashboard:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">Loading project analytics workspace...</p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl p-8 text-center max-w-xl mx-auto my-12 space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold">Failed to load project dashboard</h3>
        <p className="text-xs text-rose-600">{error || 'Project data not found'}</p>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects List</span>
        </button>
      </div>
    );
  }

  const { project, summary, resourceAssignments, distributions, recentActivities } = dashboardData;

  // Chart transformations
  const riskCategoryChartData = (distributions?.risksByCategory || []).map(r => ({
    name: r._id || 'Unassigned',
    count: r.count,
    high: r.highCount || 0
  }));

  const complaintChannelData = (distributions?.complaintsByChannel || []).map(c => ({
    name: c._id || 'Other',
    value: c.count
  }));

  const eventsTypeData = (distributions?.eventsByType || []).map(e => ({
    name: e._id || 'Standard',
    count: e.count
  }));

  const benDivisionData = (distributions?.beneficiariesByDivision || []).map(b => ({
    name: b._id || 'Division',
    count: b.count
  }));

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Project Banner & Quick Module Navigation */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/projects"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-slate-300 border border-white/15 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Projects</span>
              </Link>
              {project.code && (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {project.code}
                </span>
              )}
              <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase",
                project.status === 'ACTIVE'
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : "bg-slate-700/60 text-slate-300 border border-slate-600"
              )}>
                {project.status}
              </span>
            </div>

            <button
              type="button"
              onClick={() => fetchProjectDashboard(project._id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all cursor-pointer backdrop-blur-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {project.description || 'Independent multi-module project workspace for risk mitigation, stakeholder feedback, event coordination, and beneficiary services.'}
            </p>
          </div>

          {/* Project Metadata Pills */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-2 border-t border-slate-800">
            {project.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>Location: <strong className="text-white">{project.location}</strong></span>
              </div>
            )}
            {project.officeResponsible && (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Office: <strong className="text-white">{project.officeResponsible}</strong></span>
              </div>
            )}
            {project.projectManager && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Lead: <strong className="text-white">{project.projectManager}</strong></span>
              </div>
            )}
            {project.period && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Period: <strong className="text-white">{project.period}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Interactive Module Cards with Live Project Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Module 1: Risk Register */}
        <Link
          to="/risk-register"
          className="group p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-400/60 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                <span>Open Module</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Module 1</p>
              <h3 className="text-base font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                Risk Register
              </h3>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900">{summary.risks.total}</p>
                <p className="text-[11px] text-slate-400">Total Risks</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-rose-600">{summary.risks.high} High</p>
                <p className="text-[10px] text-slate-400">{summary.risks.medium} Med &bull; {summary.risks.low} Low</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Module 2: Complaints & Feedback */}
        <Link
          to="/complaints-register"
          className="group p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-400/60 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center">
                <FolderClock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                <span>Open Module</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Module 2</p>
              <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                Complaints &amp; Feedback
              </h3>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900">{summary.complaints.total}</p>
                <p className="text-[11px] text-slate-400">Total Records</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-600">{summary.complaints.closed} Closed</p>
                <p className="text-[10px] text-rose-600 font-semibold">{summary.complaints.open} Open {summary.complaints.overdue > 0 && `(${summary.complaints.overdue} Overdue)`}</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Module 3: Event Tracker */}
        <Link
          to="/event-tracker"
          className="group p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-400/60 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                <span>Open Module</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Module 3</p>
              <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                Event Tracker
              </h3>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900">{summary.events.total}</p>
                <p className="text-[11px] text-slate-400">Total Events</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{summary.events.participants.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">Community Participants</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Module 4: Beneficiary Information */}
        <Link
          to="/beneficiaries"
          className="group p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-rose-400/60 transition-all flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-rose-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                <span>Open Module</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Module 4</p>
              <h3 className="text-base font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                Beneficiary Information
              </h3>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900">{summary.beneficiaries.total}</p>
                <p className="text-[11px] text-slate-400">Total Beneficiaries</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-rose-600">{summary.beneficiaries.female} Female</p>
                <p className="text-[10px] text-slate-400">{summary.beneficiaries.male} Male &bull; {summary.beneficiaries.disability} PWD</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Independent Organizational Resource Assignments (Employees & Assets) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Assigned Core HR Employees */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">Assigned Core HR Employees</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {resourceAssignments?.assignedEmployeesCount || 0} Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Separate Core HR project assignments (master employee records remain organization-wide)
                </p>
              </div>
            </div>

            <Link
              to={`/employees?assignedProjectId=${project._id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors whitespace-nowrap"
            >
              <span>Manage in Core HR</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(resourceAssignments?.assignedEmployees || []).length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
              No Core HR employees are currently assigned to {project.name}. Assign staff from the Core HR Employee Directory.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {resourceAssignments.assignedEmployees.map((item) => {
                const emp = item.employee || {};
                const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email || 'Employee';
                return (
                  <div key={item._id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <Link
                        to={`/employees/${emp._id}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 truncate block"
                      >
                        {fullName} {emp.employeeCode ? <span className="font-mono text-[10px] text-slate-400">({emp.employeeCode})</span> : null}
                      </Link>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.roleInProject || emp.title || 'Project Staff'} &bull; {emp.department || 'HR'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.isPrimary && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Primary
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-lg font-mono font-bold text-[11px] bg-slate-100 text-slate-700">
                        {item.allocationPercentage ?? 100}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel 2: Allocated Project Assets */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900">Allocated Project Assets</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {resourceAssignments?.assignedAssetsCount || 0} Allocated
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Equipment &amp; inventory currently allocated via Asset Tracker custody ledger
                </p>
              </div>
            </div>

            <Link
              to={`/assets?assignedProjectId=${project._id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors whitespace-nowrap"
            >
              <span>Manage in Asset Tracker</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(resourceAssignments?.assignedAssets || []).length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
              No organizational assets are currently allocated to {project.name}. Allocate equipment from Asset Tracker.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {resourceAssignments.assignedAssets.map((asset) => (
                <div key={asset._id || asset.assetId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      <span className="font-mono text-indigo-600 mr-1.5">{asset.assetId}</span>
                      {asset.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {asset.category} &bull; Custodian: {asset.currentAssignment?.custodianName || asset.custodian || 'Unassigned'} &bull; {asset.location || 'Field'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 flex-shrink-0">
                    {asset.status || 'Active'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Categories Chart */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Risk Profile by Category</h3>
              <p className="text-xs text-slate-400">Distribution of risks in {project.name}</p>
            </div>
            <Link to="/risk-register" className="text-xs font-bold text-indigo-600 hover:underline">
              View Register &rarr;
            </Link>
          </div>

          <div className="h-64">
            {riskCategoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No risks registered for this project yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskCategoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                  <Bar dataKey="count" name="Total Risks" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="high" name="High Risks" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Complaints Channel Distribution Chart */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Complaints by Channel</h3>
              <p className="text-xs text-slate-400">Receiving intake channels for feedback</p>
            </div>
            <Link to="/complaints-register" className="text-xs font-bold text-indigo-600 hover:underline">
              View Complaints &rarr;
            </Link>
          </div>

          <div className="h-64 flex items-center justify-center">
            {complaintChannelData.length === 0 ? (
              <div className="text-xs text-slate-400">No complaints recorded for this project yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintChannelData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {complaintChannelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Events Activity Breakdown */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Events by Activity Type</h3>
              <p className="text-xs text-slate-400">Interventions logged under this project</p>
            </div>
            <Link to="/event-tracker" className="text-xs font-bold text-indigo-600 hover:underline">
              View Events &rarr;
            </Link>
          </div>

          <div className="h-64">
            {eventsTypeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No events recorded for this project yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventsTypeData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={110} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                  <Bar dataKey="count" name="Events Count" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Beneficiaries Regional Reach */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Beneficiary Inclusion &amp; Demographics</h3>
              <p className="text-xs text-slate-400">Demographic reach metrics for {project.name}</p>
            </div>
            <Link to="/beneficiaries" className="text-xs font-bold text-indigo-600 hover:underline">
              View Beneficiaries &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <p className="text-[10px] font-extrabold uppercase text-rose-500">Female Participation</p>
              <p className="text-xl font-black text-rose-900 mt-1">
                {summary.beneficiaries.total > 0
                  ? `${((summary.beneficiaries.female / summary.beneficiaries.total) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">{summary.beneficiaries.female} of {summary.beneficiaries.total} participants</p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
              <p className="text-[10px] font-extrabold uppercase text-indigo-500">Persons with Disability</p>
              <p className="text-xl font-black text-indigo-900 mt-1">{summary.beneficiaries.disability}</p>
              <p className="text-[11px] text-indigo-700 mt-0.5">Special inclusion records</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <p className="text-[10px] font-extrabold uppercase text-emerald-500">Adibashi Inclusion</p>
              <p className="text-xl font-black text-emerald-900 mt-1">{summary.beneficiaries.adibashi}</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">Indigenous participants</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-extrabold uppercase text-amber-500">Dalit Community</p>
              <p className="text-xl font-black text-amber-900 mt-1">{summary.beneficiaries.dalit}</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Marginalized representation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Project Records Feed */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900">Recent Project Activity Across Modules</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Risks */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <p className="text-[10px] font-bold uppercase text-amber-600">Latest Risks</p>
            {(recentActivities?.risks || []).length === 0 ? (
              <p className="text-xs text-slate-400">No risks logged</p>
            ) : (
              recentActivities.risks.map(r => (
                <div key={r._id} className="text-xs space-y-0.5 border-b border-slate-200/60 pb-1.5 last:border-none">
                  <p className="font-bold text-slate-800 line-clamp-1">Risk #{r.riskNo}: {r.category}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{r.description}</p>
                </div>
              ))
            )}
          </div>

          {/* Complaints */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <p className="text-[10px] font-bold uppercase text-indigo-600">Latest Complaints</p>
            {(recentActivities?.complaints || []).length === 0 ? (
              <p className="text-xs text-slate-400">No complaints logged</p>
            ) : (
              recentActivities.complaints.map(c => (
                <div key={c._id} className="text-xs space-y-0.5 border-b border-slate-200/60 pb-1.5 last:border-none">
                  <p className="font-bold text-slate-800 line-clamp-1">{c.sNo} &bull; {c.complaintCategory}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{c.complainantName} ({c.status})</p>
                </div>
              ))
            )}
          </div>

          {/* Events */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <p className="text-[10px] font-bold uppercase text-emerald-600">Latest Events</p>
            {(recentActivities?.events || []).length === 0 ? (
              <p className="text-xs text-slate-400">No events logged</p>
            ) : (
              recentActivities.events.map(e => (
                <div key={e._id} className="text-xs space-y-0.5 border-b border-slate-200/60 pb-1.5 last:border-none">
                  <p className="font-bold text-slate-800 line-clamp-1">{e.eventId}: {e.eventTitle}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{e.eventType} &bull; {e.division}</p>
                </div>
              ))
            )}
          </div>

          {/* Beneficiaries */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
            <p className="text-[10px] font-bold uppercase text-rose-600">Latest Beneficiaries</p>
            {(recentActivities?.beneficiaries || []).length === 0 ? (
              <p className="text-xs text-slate-400">No beneficiaries logged</p>
            ) : (
              recentActivities.beneficiaries.map(b => (
                <div key={b._id} className="text-xs space-y-0.5 border-b border-slate-200/60 pb-1.5 last:border-none">
                  <p className="font-bold text-slate-800 line-clamp-1">{b.name} ({b.sex})</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{b.beneficiaryId} &bull; {b.forumName}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
