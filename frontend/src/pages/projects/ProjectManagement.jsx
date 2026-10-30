import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  FolderKanban, Plus, Search, Filter, ShieldCheck, 
  MapPin, Calendar, Clock, ArrowUpRight, Users, Edit3, 
  Trash2, RefreshCw, Layers, CheckCircle2, AlertTriangle, 
  FileText, ShieldAlert, FolderClock, CalendarDays, HeartHandshake,
  LayoutGrid, Table as TableIcon, ExternalLink, Sparkles, Building2,
  Lock, Check, AlertCircle, Eye, Archive, Boxes, Power, X
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

import ProjectCreateModal from './ProjectCreateModal';
import ProjectAssignModal from './ProjectAssignModal';

export default function ProjectManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    projects, 
    selectedProjectId, 
    setSelectedProjectId, 
    loadingProjects, 
    refreshProjects,
    createProject,
    updateProject,
    updateProjectStatus,
    archiveProject,
    assignUsers
  } = useProject();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [assigningProject, setAssigningProject] = useState(null);
  const [archiveConfirm, setArchiveConfirm] = useState(null);
  const [unassignedData, setUnassignedData] = useState({ total: 0, risks: [], complaints: [], events: [], beneficiaries: [] });
  const [isUnassignedModalOpen, setIsUnassignedModalOpen] = useState(false);
  const [targetProjectMap, setTargetProjectMap] = useState({});
  const [resolvingId, setResolvingId] = useState(null);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const canManage = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(user?.role);
  const canArchive = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user?.role);

  const fetchUnassignedRecords = useCallback(async () => {
    if (!canArchive) return;
    try {
      const res = await api.get('/projects/unassigned-records');
      if (res.data?.success && res.data.data) {
        setUnassignedData(res.data.data);
      }
    } catch (_) {}
  }, [canArchive]);

  useEffect(() => {
    fetchUnassignedRecords();
  }, [fetchUnassignedRecords]);

  const handleResolveRecord = async (moduleKey, recordId) => {
    const chosenProjectId = targetProjectMap[recordId] || selectedProjectId || projects[0]?._id;
    if (!chosenProjectId) return;
    try {
      setResolvingId(recordId);
      const res = await api.post('/projects/resolve-unassigned', {
        module: moduleKey,
        recordId,
        projectId: chosenProjectId,
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Legacy record linked to project');
        await fetchUnassignedRecords();
        await refreshProjects();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resolve record', 'error');
    } finally {
      setResolvingId(null);
    }
  };

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.officeResponsible || '').toLowerCase().includes(q) ||
        (p.projectManager || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    });
  }, [projects, statusFilter, search]);

  // Overall aggregate counts across all accessible projects
  const overallStats = useMemo(() => {
    let totalRisks = 0;
    let totalComplaints = 0;
    let totalEvents = 0;
    let totalBeneficiaries = 0;
    let activeProjects = 0;

    projects.forEach(p => {
      if (p.status === 'ACTIVE') activeProjects++;
      totalRisks += p.stats?.risks?.total || 0;
      totalComplaints += p.stats?.complaints?.total || 0;
      totalEvents += p.stats?.events?.total || 0;
      totalBeneficiaries += p.stats?.beneficiaries?.total || 0;
    });

    return {
      totalProjects: projects.length,
      activeProjects,
      totalRisks,
      totalComplaints,
      totalEvents,
      totalBeneficiaries,
    };
  }, [projects]);

  const handleOpenProject = (id) => {
    setSelectedProjectId(id);
    showToast('Active workspace project switched successfully');
    navigate(`/projects/${id}/dashboard`);
  };

  const handleSaveProject = async (formData) => {
    if (editingProject) {
      await updateProject(editingProject._id, formData);
      showToast(`Project "${formData.name}" updated successfully`);
    } else {
      const created = await createProject(formData);
      showToast(`Project "${created.name}" created successfully`);
    }
  };

  const handleToggleStatus = async (project) => {
    const nextStatus = project.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateProjectStatus(project._id, nextStatus);
      showToast(`Project marked as ${nextStatus}`);
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveConfirm) return;
    try {
      await archiveProject(archiveConfirm._id);
      showToast(`Project "${archiveConfirm.name}" archived successfully`);
      setArchiveConfirm(null);
    } catch (err) {
      showToast(err.message || 'Failed to archive project', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Alert */}
      {toast.show && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-white transition-all transform animate-in slide-in-from-bottom-5",
          toast.type === 'error' ? 'bg-rose-600 shadow-rose-600/30' : 'bg-emerald-600 shadow-emerald-600/30'
        )}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Project Centralized Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Project Management Panel
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Create, configure, and administer independent projects. Select any project to isolate its Risk Register, Complaints &amp; Feedback, Event Tracker, and Beneficiary records across the platform.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => refreshProjects()}
              disabled={loadingProjects}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all cursor-pointer backdrop-blur-xs"
              title="Refresh projects"
            >
              <RefreshCw className={cn("w-4 h-4", loadingProjects && "animate-spin")} />
              <span>Refresh</span>
            </button>

            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setEditingProject(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Project</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Aggregate Overview Metrics */}
      {canArchive && unassignedData.total > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                {unassignedData.total} Legacy Record{unassignedData.total === 1 ? '' : 's'} Flagged for Project Review
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Ambiguous legacy records are never guessed automatically. Review and explicitly link each record to its rightful project.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsUnassignedModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
          >
            Review Flagged Records
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Total Projects</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl sm:text-2xl font-black text-slate-800">{overallStats.totalProjects}</p>
            <span className="text-[11px] font-bold text-emerald-600">({overallStats.activeProjects} Active)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Total Risks</p>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{overallStats.totalRisks}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Total Complaints</p>
            <FolderClock className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{overallStats.totalComplaints}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Total Events</p>
            <CalendarDays className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{overallStats.totalEvents}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs col-span-2 sm:col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Total Beneficiaries</p>
            <HeartHandshake className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{overallStats.totalBeneficiaries}</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by name, code, manager, location..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-500 hidden md:inline">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses ({projects.length})</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="ON_HOLD">ON_HOLD</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 self-end sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === 'cards' ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              viewMode === 'table' ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Projects Presentation */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Projects Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {search || statusFilter !== 'ALL'
              ? 'No projects match your current filters. Try resetting search or status.'
              : 'No projects have been set up yet. Click below to initialize your first project workspace.'}
          </p>
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setEditingProject(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* Card Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const isCurrentlySelected = String(p._id) === String(selectedProjectId);
            return (
              <div
                key={p._id}
                className={cn(
                  "bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md",
                  isCurrentlySelected
                    ? "border-indigo-500/80 ring-2 ring-indigo-500/15"
                    : "border-slate-200/90 hover:border-slate-300"
                )}
              >
                {/* Top Banner & Status */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {p.code && (
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px] border border-indigo-200/70">
                            {p.code}
                          </span>
                        )}
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
                          p.status === 'ACTIVE'
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : p.status === 'COMPLETED'
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        )}>
                          {p.status}
                        </span>

                        {isCurrentlySelected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-600 text-white">
                            <Check className="w-3 h-3" />
                            <span>Active Context</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 pt-0.5">
                        {p.name}
                      </h3>
                    </div>

                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 flex-shrink-0">
                      <FolderKanban className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>

                  {/* Location & Manager Info */}
                  <div className="space-y-1.5 text-xs text-slate-500 pt-1">
                    {p.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{p.location}</span>
                      </div>
                    )}
                    {p.officeResponsible && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{p.officeResponsible}</span>
                      </div>
                    )}
                    {p.projectManager && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>Lead: <span className="font-semibold text-slate-700">{p.projectManager}</span></span>
                      </div>
                    )}
                    {p.period && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>Period: {p.period}</span>
                      </div>
                    )}
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 pt-1 border-t border-slate-100">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Module Stats Summary Pills */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-b border-slate-100 grid grid-cols-4 gap-2 text-center">
                  <div 
                    onClick={() => { setSelectedProjectId(p._id); navigate('/risk-register'); }}
                    className="cursor-pointer hover:bg-white p-1 rounded-xl transition-colors"
                    title="View Risk Register"
                  >
                    <p className="text-[10px] font-bold text-slate-400">Risks</p>
                    <p className="text-sm font-black text-slate-800">{p.stats?.risks?.total || 0}</p>
                  </div>
                  <div 
                    onClick={() => { setSelectedProjectId(p._id); navigate('/complaints-register'); }}
                    className="cursor-pointer hover:bg-white p-1 rounded-xl transition-colors"
                    title="View Complaints & Feedback"
                  >
                    <p className="text-[10px] font-bold text-slate-400">Complaints</p>
                    <p className="text-sm font-black text-slate-800">{p.stats?.complaints?.total || 0}</p>
                  </div>
                  <div 
                    onClick={() => { setSelectedProjectId(p._id); navigate('/event-tracker'); }}
                    className="cursor-pointer hover:bg-white p-1 rounded-xl transition-colors"
                    title="View Event Tracker"
                  >
                    <p className="text-[10px] font-bold text-slate-400">Events</p>
                    <p className="text-sm font-black text-slate-800">{p.stats?.events?.total || 0}</p>
                  </div>
                  <div 
                    onClick={() => { setSelectedProjectId(p._id); navigate('/beneficiaries'); }}
                    className="cursor-pointer hover:bg-white p-1 rounded-xl transition-colors"
                    title="View Beneficiaries"
                  >
                    <p className="text-[10px] font-bold text-slate-400">Beneficiaries</p>
                    <p className="text-sm font-black text-slate-800">{p.stats?.beneficiaries?.total || 0}</p>
                  </div>
                </div>

                {/* Independent Resource Assignments Summary Strip */}
                <div className="px-5 py-2 bg-indigo-50/40 border-b border-slate-100 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => navigate(`/employees?assignedProjectId=${p._id}`)}
                    className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-indigo-700 cursor-pointer"
                    title="View Core HR staff assigned to this project"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{p.stats?.resourceAssignments?.assignedEmployees || 0} HR Staff Assigned</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/assets?assignedProjectId=${p._id}`)}
                    className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-indigo-700 cursor-pointer"
                    title="View Assets allocated to this project"
                  >
                    <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{p.stats?.resourceAssignments?.assignedAssets || 0} Assets Allocated</span>
                  </button>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 bg-white flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProject(p);
                            setIsCreateModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                          title="Edit Project Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssigningProject(p)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                          title="Manage Access & Assign Users"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                          title={p.status === 'ACTIVE' ? 'Deactivate Project' : 'Activate Project'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {canArchive && (
                      <button
                        type="button"
                        onClick={() => setArchiveConfirm(p)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Archive Project"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${p._id}/dashboard`)}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Dashboard
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenProject(p._id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer",
                        isCurrentlySelected
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      )}
                    >
                      <span>{isCurrentlySelected ? 'Selected' : 'Open Project'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Layout */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/90 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Project &amp; Code</th>
                  <th className="py-3.5 px-4">Location / Office</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Risks</th>
                  <th className="py-3.5 px-4 text-center">Complaints</th>
                  <th className="py-3.5 px-4 text-center">Events</th>
                  <th className="py-3.5 px-4 text-center">Beneficiaries</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProjects.map((p) => {
                  const isCurrentlySelected = String(p._id) === String(selectedProjectId);
                  return (
                    <tr
                      key={p._id}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors",
                        isCurrentlySelected && "bg-indigo-50/50"
                      )}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0",
                            isCurrentlySelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                          )}>
                            {isCurrentlySelected ? <Check className="w-3.5 h-3.5" /> : (p.code?.substring(4, 6) || 'PR')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">{p.name}</p>
                            <span className="font-mono text-[10px] font-bold text-indigo-600">{p.code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <p className="truncate max-w-[180px]">{p.location || 'Not specified'}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{p.officeResponsible}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
                          p.status === 'ACTIVE'
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600"
                        )}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {p.stats?.risks?.total || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {p.stats?.complaints?.total || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {p.stats?.events?.total || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {p.stats?.beneficiaries?.total || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenProject(p._id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                          >
                            {isCurrentlySelected ? 'Selected' : 'Open'}
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/projects/${p._id}/dashboard`)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Dashboard"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Create / Edit Modal */}
      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        project={editingProject}
      />

      {/* User Assignment & Permissions Modal */}
      <ProjectAssignModal
        isOpen={!!assigningProject}
        onClose={() => setAssigningProject(null)}
        onSave={assignUsers}
        project={assigningProject}
      />

      {/* Archive Confirmation Dialog */}
      {isUnassignedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-3xl w-full rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">Review Flagged Legacy Records ({unassignedData.total})</h3>
                <p className="text-xs text-slate-400">Assign unlinked or ambiguous records to their verified project</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUnassignedModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {[
                { key: 'RISK', label: 'Risk Register', items: unassignedData.risks || [], titleFn: (r) => `Risk #${r.riskNo || '—'}: ${r.category || ''} — ${r.description || ''}` },
                { key: 'COMPLAINTS', label: 'Complaints & Feedback', items: unassignedData.complaints || [], titleFn: (c) => `${c.sNo || 'Complaint'} — ${c.complaintCategory || ''} (${c.complainantName || 'Anonymous'})` },
                { key: 'EVENTS', label: 'Event Tracker', items: unassignedData.events || [], titleFn: (e) => `${e.eventId || 'Event'} — ${e.eventTitle || ''}` },
                { key: 'BENEFICIARIES', label: 'Beneficiary Information', items: unassignedData.beneficiaries || [], titleFn: (b) => `${b.beneficiaryId || 'Beneficiary'} — ${b.name || ''}` },
              ].map((group) =>
                group.items.length > 0 ? (
                  <div key={group.key} className="space-y-2">
                    <h4 className="font-extrabold uppercase tracking-wider text-slate-600">{group.label} ({group.items.length})</h4>
                    {group.items.map((item) => (
                      <div key={item._id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{group.titleFn(item)}</p>
                          {item.projectReviewNote && (
                            <p className="text-[11px] text-amber-700 mt-0.5">{item.projectReviewNote}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <select
                            value={targetProjectMap[item._id] || selectedProjectId || projects[0]?._id || ''}
                            onChange={(e) => setTargetProjectMap((prev) => ({ ...prev, [item._id]: e.target.value }))}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-xs"
                          >
                            {projects.map((p) => (
                              <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={resolvingId === item._id}
                            onClick={() => handleResolveRecord(group.key, item._id)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                          >
                            {resolvingId === item._id ? 'Linking...' : 'Link Project'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      {archiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Archive Project?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to archive <strong>{archiveConfirm.name}</strong>? This will remove it from active selector lists while permanently maintaining historical records for audits.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setArchiveConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                Archive Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
