import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import api from '../../services/api';
import ProjectCreateModal from './ProjectCreateModal';
import { 
  FolderKanban, ShieldAlert, FolderClock, CalendarDays, HeartHandshake,
  ArrowUpRight, Users, MapPin, Building2, Calendar, Clock, CheckCircle2,
  AlertTriangle, RefreshCw, Layers, TrendingUp, Sparkles, AlertCircle,
  FileText, ExternalLink, Activity, ArrowLeft, Boxes, Briefcase,
  Search, Filter, Plus, Check, X, ChevronRight, SlidersHorizontal,
  FolderOpen, CheckCheck, Eye
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { cn } from '../../utils/cn';

const CHART_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export default function ProjectDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    projects, 
    selectedProject, 
    selectedProjectId, 
    switchProject, 
    loadingProjects, 
    createProject, 
    refreshProjects 
  } = useProject();

  // If URL provides an id, prioritize it; otherwise use active selectedProjectId from context
  const activeId = id || selectedProjectId || (projects.length > 0 ? String(projects[0]._id) : '');

  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [switchingId, setSwitchingId] = useState(null);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Search, filter, and sorting states for the Project Selection section
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');

  const workspaceSectionRef = useRef(null);

  // Fetch project dashboard data
  const fetchProjectDashboard = async (projId) => {
    if (!projId) return;
    try {
      setLoadingDashboard(true);
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
      setLoadingDashboard(false);
    }
  };

  // Sync project context and load dashboard metrics on change
  useEffect(() => {
    if (activeId) {
      if (String(selectedProjectId) !== String(activeId)) {
        switchProject(activeId, { skipConfirm: true });
      }
      fetchProjectDashboard(activeId);
    } else if (!loadingProjects && projects.length > 0) {
      const firstId = String(projects[0]._id);
      switchProject(firstId, { skipConfirm: true });
      fetchProjectDashboard(firstId);
    }
  }, [activeId, projects.length, loadingProjects]);

  // Project Portfolio Summary Statistics
  const portfolioStats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'ACTIVE').length;
    const onHold = projects.filter(p => p.status === 'ON_HOLD').length;
    const completed = projects.filter(p => p.status === 'COMPLETED').length;
    return { total, active, onHold, completed };
  }, [projects]);

  // Filtered & sorted projects list for the in-page selector
  const filteredProjects = useMemo(() => {
    let list = projects.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.projectManager || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.officeResponsible || '').toLowerCase().includes(q)
      );
    });

    if (sortBy === 'NAME_ASC') {
      list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'CODE_ASC') {
      list = [...list].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    } else if (sortBy === 'STATUS') {
      list = [...list].sort((a, b) => (a.status || '').localeCompare(b.status || ''));
    }

    return list;
  }, [projects, statusFilter, searchTerm, sortBy]);

  // Handle instant project workspace switching
  const handleSelectProject = async (projectId) => {
    if (!projectId || String(projectId) === String(activeId)) return;
    setSwitchingId(projectId);
    const switched = switchProject(projectId);
    if (switched !== false) {
      if (id) {
        navigate(`/projects/${projectId}/dashboard`);
      } else {
        await fetchProjectDashboard(projectId);
      }
    }
    setSwitchingId(null);
  };

  // Handle new project creation
  const handleSaveProject = async (formData) => {
    const created = await createProject(formData);
    if (created && created._id) {
      switchProject(created._id);
      if (id) {
        navigate(`/projects/${created._id}/dashboard`);
      } else {
        await fetchProjectDashboard(created._id);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/90';
      case 'ON_HOLD':
        return 'bg-amber-50 text-amber-700 border-amber-200/90';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border-blue-200/90';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Initial loading state when projects list is still being fetched
  if (loadingProjects && projects.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh] gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-xs font-bold text-slate-500">Loading project portfolio...</p>
      </div>
    );
  }

  // Empty state when no projects exist at all in the database
  if (!loadingProjects && projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Project Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-500">Multi-project workspace portfolio &amp; operational control center</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Project</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
            <FolderKanban className="w-7 h-7" />
          </div>
          <h2 className="text-base font-black text-slate-900">No Projects Configured Yet</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Create your first project workspace to activate the 4 project-linked modules (Risk Register, Complaints &amp; Feedback, Event Tracker, Beneficiaries) and manage project-specific operational metrics.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Project</span>
          </button>
        </div>

        <ProjectCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleSaveProject}
        />
      </div>
    );
  }

  const { project, summary, resourceAssignments, distributions, recentActivities } = dashboardData || {};

  // Chart data transformations
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

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* =========================================================================
          SECTION A: MODERN DASHBOARD HEADER WITH PRIMARY ACTIONS
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 flex-shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Project Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Centralized project portfolio &amp; multi-module operational control center
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              refreshProjects();
              if (activeId) fetchProjectDashboard(activeId);
            }}
            disabled={loadingDashboard}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh All Portfolio & Workspace Metrics"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-slate-500", loadingDashboard && "animate-spin text-indigo-600")} />
            <span>Refresh Metrics</span>
          </button>

          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="Manage All Projects, Access Control & Settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage Projects</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION B: PROJECT OVERVIEW SUMMARY (KPI CARDS)
         ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Projects</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{portfolioStats.total}</span>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Portfolio
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total registered organizational projects</p>
        </div>

        {/* Active Workspaces */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Workspaces</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{portfolioStats.active}</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Operational
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Live workspaces accepting module records</p>
        </div>

        {/* On Hold Projects */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">On Hold / Review</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-700">{portfolioStats.onHold}</span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              Pending
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Paused or undergoing quarterly review</p>
        </div>

        {/* Completed Projects */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Completed</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-blue-700">{portfolioStats.completed}</span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Archived
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Fully concluded project lifecycles</p>
        </div>
      </div>

      {/* =========================================================================
          SECTION C: REDESIGNED ENTERPRISE PROJECT SELECTION & TOOLBAR
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 sm:p-7 space-y-6">
        
        {/* Title and Top Search/Sort Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                <FolderKanban className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Select Active Project Workspace
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {projects.length} available
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Choose an active workspace below. The selected project isolates records for the <strong>4 project-linked modules</strong> (Risk Register, Complaints &amp; Feedback, Event Tracker, Beneficiaries). Core HR and Asset Tracker remain organization-wide with individual allocations.
            </p>
          </div>

          {/* Search Bar & Sorter */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, code, lead, location..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer flex-shrink-0"
            >
              <option value="DEFAULT">Sort: Default</option>
              <option value="NAME_ASC">Name (A &rarr; Z)</option>
              <option value="CODE_ASC">Project Code</option>
              <option value="STATUS">Status</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2",
                statusFilter === 'ALL'
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              )}
            >
              <span>All Projects</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-md text-[10px] font-bold",
                statusFilter === 'ALL' ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              )}>
                {portfolioStats.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2",
                statusFilter === 'ACTIVE'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200/70"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Active</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-md text-[10px] font-bold",
                statusFilter === 'ACTIVE' ? "bg-white/20 text-white" : "bg-emerald-200/70 text-emerald-800"
              )}>
                {portfolioStats.active}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('ON_HOLD')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2",
                statusFilter === 'ON_HOLD'
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100/80 border border-amber-200/70"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>On Hold</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-md text-[10px] font-bold",
                statusFilter === 'ON_HOLD' ? "bg-white/20 text-white" : "bg-amber-200/70 text-amber-800"
              )}>
                {portfolioStats.onHold}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETED')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2",
                statusFilter === 'COMPLETED'
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200/70"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>Completed</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-md text-[10px] font-bold",
                statusFilter === 'COMPLETED' ? "bg-white/20 text-white" : "bg-blue-200/70 text-blue-800"
              )}>
                {portfolioStats.completed}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Showing <strong>{filteredProjects.length}</strong> of <strong>{projects.length}</strong></span>
            {(searchTerm || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Project Selection Cards Grid */}
        {filteredProjects.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No projects match your filter criteria</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search keywords or resetting the status filter to view available projects.
            </p>
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
              className="mt-3.5 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-1">
            {filteredProjects.map((p) => {
              const isSelected = String(p._id) === String(activeId);
              const isSwitching = switchingId === p._id;

              return (
                <div
                  key={p._id}
                  onClick={() => handleSelectProject(p._id)}
                  className={cn(
                    "rounded-2xl p-5 sm:p-6 transition-all duration-200 border cursor-pointer relative flex flex-col justify-between group",
                    isSelected
                      ? "bg-gradient-to-b from-indigo-50/70 via-white to-white border-indigo-400/90 shadow-md ring-2 ring-indigo-500/25"
                      : "bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                  )}
                >
                  <div className="space-y-3.5">
                    
                    {/* Card Top: Code badge, Status pill & Active Workspace Indicator */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.code && (
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-lg text-xs font-mono font-black border",
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200/80"
                          )}>
                            {p.code}
                          </span>
                        )}
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border",
                          getStatusBadge(p.status)
                        )}>
                          {p.status}
                        </span>
                      </div>

                      {isSelected ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Active Workspace</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors inline-flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <span>Switch</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    {/* Project Title & Description */}
                    <div>
                      <h3 className={cn(
                        "text-sm sm:text-base font-black line-clamp-2 leading-snug transition-colors",
                        isSelected ? "text-indigo-950 font-black" : "text-slate-900 group-hover:text-indigo-600"
                      )}>
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {p.description || 'Independent multi-module workspace for risk mitigation, stakeholder feedback, event coordination, and beneficiary services.'}
                      </p>
                    </div>

                    {/* Project Metadata Details */}
                    <div className="space-y-1.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                      {p.location && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{p.location}</span>
                        </div>
                      )}
                      {p.projectManager && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">Lead: <strong className="text-slate-700">{p.projectManager}</strong></span>
                        </div>
                      )}
                      {p.period && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{p.period}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: 4 Module Mini Counters & Action Button */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    {/* Live Mini Counters */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span title="Risks Count" className="inline-flex items-center gap-1 font-semibold text-slate-600">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                        <span>{p.stats?.risks?.total ?? 0}</span>
                      </span>
                      <span title="Complaints Count" className="inline-flex items-center gap-1 font-semibold text-slate-600">
                        <FolderClock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{p.stats?.complaints?.total ?? 0}</span>
                      </span>
                      <span title="Events Count" className="inline-flex items-center gap-1 font-semibold text-slate-600">
                        <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{p.stats?.events?.total ?? 0}</span>
                      </span>
                      <span title="Beneficiaries Count" className="inline-flex items-center gap-1 font-semibold text-slate-600">
                        <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                        <span>{p.stats?.beneficiaries?.total ?? 0}</span>
                      </span>
                    </div>

                    {/* Action Pill */}
                    {isSelected ? (
                      <span className="text-[11px] font-black text-indigo-600 inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Selected</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProject(p._id);
                        }}
                        className="text-[11px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isSwitching ? 'Switching...' : 'Select'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION D: SELECTED PROJECT OPERATIONAL WORKSPACE
         ========================================================================= */}
      <div ref={workspaceSectionRef} className="space-y-6">
        
        {loadingDashboard ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-2xs space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Loading operational workspace metrics...</p>
          </div>
        ) : error || !dashboardData ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold">Failed to load project operational workspace</h3>
            <p className="text-xs text-rose-600">{error || 'Project data not found'}</p>
            <button
              type="button"
              onClick={() => fetchProjectDashboard(activeId)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <>
            {/* Active Project Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      {project.code || 'PROJECT'}
                    </span>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase",
                      project.status === 'ACTIVE'
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                        : "bg-slate-700/60 text-slate-300 border border-slate-600"
                    )}>
                      {project.status}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10">
                      Active Operational Workspace
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchProjectDashboard(project._id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all cursor-pointer backdrop-blur-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Workspace</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {project.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                    {project.description || 'Independent multi-module project workspace for risk mitigation, stakeholder feedback, event coordination, and beneficiary services.'}
                  </p>
                </div>

                {/* Project Metadata Row */}
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

            {/* 4 Interactive Project-Linked Modules (Type A) */}
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
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Project-Linked Module 1</p>
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
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Project-Linked Module 2</p>
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
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Project-Linked Module 3</p>
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
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Project-Linked Module 4</p>
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

            {/* Independent Resource Allocations (Type B: Employees & Assets) */}
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
                        Independent Core HR project allocation ledger (master employee records remain organization-wide)
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
                        Equipment &amp; inventory allocated via independent Asset Tracker custody ledger
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
                    <h3 className="text-sm font-black text-slate-900">Complaints by Intake Channel</h3>
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
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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

              {/* Beneficiaries Inclusion & Demographics */}
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

            {/* Recent Project Records Feed across Modules */}
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
          </>
        )}
      </div>

      {/* Project Create Modal */}
      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveProject}
      />
    </div>
  );
}
