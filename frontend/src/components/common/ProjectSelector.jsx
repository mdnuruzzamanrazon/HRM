import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { 
  FolderKanban, ChevronDown, Check, Plus, Search, 
  ExternalLink, MapPin, FolderOpen, X, 
  ShieldAlert, FolderClock, CalendarDays, HeartHandshake,
  CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { cn } from '../../utils/cn';

export default function ProjectSelector({ onOpenCreateModal }) {
  const { projects, selectedProject, selectedProjectId, switchProject, loadingProjects } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter projects by search query and status filter
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.projectManager || '').toLowerCase().includes(q) ||
        (p.officeResponsible || '').toLowerCase().includes(q)
      );
    });
  }, [projects, statusFilter, search]);

  const handleSelect = (id) => {
    const switched = switchProject(id);
    if (switched !== false) {
      setIsOpen(false);
      setSearch('');
    }
  };

  const handleGoToDashboard = (e, id) => {
    e.stopPropagation();
    const switched = switchProject(id);
    if (switched !== false) {
      setIsOpen(false);
      navigate(`/projects/${id}/dashboard`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return {
          dot: 'bg-emerald-500 shadow-emerald-500/50',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          ring: 'ring-emerald-500/20'
        };
      case 'ON_HOLD':
        return {
          dot: 'bg-amber-500 shadow-amber-500/50',
          badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
          ring: 'ring-amber-500/20'
        };
      case 'COMPLETED':
        return {
          dot: 'bg-blue-500 shadow-blue-500/50',
          badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
          ring: 'ring-blue-500/20'
        };
      default:
        return {
          dot: 'bg-slate-400',
          badge: 'bg-slate-100 text-slate-600 border-slate-200',
          ring: 'ring-slate-500/20'
        };
    }
  };

  const currentStatusTone = getStatusColor(selectedProject?.status || 'ACTIVE');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Modern Capsule Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl text-left transition-all duration-200 border cursor-pointer group shadow-2xs",
          isOpen
            ? "bg-indigo-50/90 border-indigo-300 ring-4 ring-indigo-500/10 shadow-sm"
            : "bg-white hover:bg-slate-50/90 border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
        )}
        title="Switch Active Project Context"
        aria-expanded={isOpen}
      >
        {/* Dynamic Project Avatar with Glowing Live Status Dot */}
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200/80 flex items-center justify-center text-indigo-700 flex-shrink-0 group-hover:from-indigo-600 group-hover:to-indigo-700 group-hover:text-white group-hover:border-indigo-600 transition-all duration-200 shadow-2xs">
            <FolderKanban className="w-4 h-4 transition-transform group-hover:scale-105" />
          </div>
          {selectedProject && (
            <span 
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white",
                currentStatusTone.dot,
                selectedProject.status === 'ACTIVE' && "animate-pulse"
              )} 
              title={`Status: ${selectedProject.status}`}
            />
          )}
        </div>

        {/* Selected Project Text & Badges */}
        <div className="flex flex-col min-w-0 max-w-[130px] sm:max-w-[200px] md:max-w-[270px]">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-slate-400">
            <span className="truncate">Active Project</span>
            {selectedProject?.code && (
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200/70 text-[9px]">
                {selectedProject.code}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug group-hover:text-indigo-600 transition-colors">
              {loadingProjects ? 'Loading Projects...' : (selectedProject?.name || 'Select Project Context')}
            </span>
          </div>
        </div>

        {/* Animated Chevron */}
        <div className="pl-1 border-l border-slate-200/60 ml-0.5">
          <ChevronDown className={cn(
            "w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 group-hover:text-slate-600",
            isOpen && "rotate-180 text-indigo-600"
          )} />
        </div>
      </button>

      {/* Redesigned Floating Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 md:left-0 mt-2.5 w-[360px] sm:w-[420px] rounded-3xl bg-white shadow-2xl shadow-indigo-950/15 border border-slate-200/90 py-3 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden ring-1 ring-black/5">
          
          {/* Header & Status Filter Bar */}
          <div className="px-4 pb-3 border-b border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FolderKanban className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Switch Active Project Context
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                {projects.length} available
              </span>
            </div>

            {/* Quick Search Input with Clear Button */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects by name, code, manager, location..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
              {['ALL', 'ACTIVE', 'ON_HOLD', 'COMPLETED'].map((statusKey) => (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => setStatusFilter(statusKey)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wide cursor-pointer whitespace-nowrap",
                    statusFilter === statusKey
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  )}
                >
                  {statusKey === 'ALL' ? 'All Projects' : statusKey.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Current Active Workspace Highlight Banner */}
          {selectedProject && !search && statusFilter === 'ALL' && (
            <div className="mx-3 mt-3 p-3 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-xs border border-indigo-800/60">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-indigo-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Currently Active Workspace</span>
                  </div>
                  <h4 className="text-xs font-black text-white truncate mt-0.5">
                    {selectedProject.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-300">
                    {selectedProject.code && (
                      <span className="font-mono font-bold text-indigo-200">
                        {selectedProject.code}
                      </span>
                    )}
                    {selectedProject.location && (
                      <>
                        <span>&bull;</span>
                        <span className="truncate max-w-[130px]">{selectedProject.location}</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleGoToDashboard(e, selectedProject._id)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-colors inline-flex items-center gap-1 flex-shrink-0 cursor-pointer border border-white/10"
                  title="Open Project Workspace Dashboard"
                >
                  <span>Dashboard</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Projects List with Custom Scrollbar */}
          <div className="px-2 pt-2 pb-1">
            <p className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {statusFilter === 'ALL' ? 'Select a Project' : `${statusFilter} Projects`} ({filteredProjects.length})
            </p>
          </div>

          <div className="max-h-64 sm:max-h-72 overflow-y-auto px-2 space-y-1.5 custom-scrollbar">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 px-4">
                <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No matching projects found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try searching with a different term or resetting the status filter
                </p>
                {(search || statusFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
                    className="mt-3 px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = String(p._id) === String(selectedProjectId);
                const statusStyle = getStatusColor(p.status);

                return (
                  <div
                    key={p._id}
                    onClick={() => handleSelect(p._id)}
                    className={cn(
                      "flex items-start justify-between p-3 rounded-2xl cursor-pointer transition-all duration-150 group border",
                      isSelected
                        ? "bg-indigo-50/90 border-indigo-200/90 shadow-2xs ring-1 ring-indigo-500/20"
                        : "bg-white hover:bg-slate-50/90 border-slate-100 hover:border-slate-200/80"
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1 pr-2">
                      {/* Monogram / Icon Avatar */}
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 transition-colors shadow-2xs",
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-700"
                      )}>
                        {isSelected ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          p.code?.substring(0, 3) || 'PRJ'
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Title and Code Row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={cn(
                            "text-xs font-bold truncate leading-snug",
                            isSelected ? "text-indigo-950 font-black" : "text-slate-800 group-hover:text-indigo-600"
                          )}>
                            {p.name}
                          </p>
                        </div>

                        {/* Metadata row: Code, Location, Status */}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                          {p.code && (
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50/80 px-1.5 py-0.2 rounded border border-indigo-200/60 text-[10px]">
                              {p.code}
                            </span>
                          )}
                          {p.location && (
                            <span className="truncate max-w-[120px] text-slate-500 inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {p.location}
                            </span>
                          )}
                          <span className={cn(
                            "px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase border",
                            statusStyle.badge
                          )}>
                            {p.status}
                          </span>
                        </div>

                        {/* Live Counts Mini Strip (Risks, Complaints, Events, Beneficiaries) */}
                        {p.stats && (
                          <div className="flex items-center gap-2.5 mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                            <span title="Risks" className="inline-flex items-center gap-1 hover:text-amber-600">
                              <ShieldAlert className="w-3 h-3 text-amber-500" />
                              <strong className="text-slate-600 font-semibold">{p.stats.risks?.total || 0}</strong>
                            </span>
                            <span title="Complaints" className="inline-flex items-center gap-1 hover:text-indigo-600">
                              <FolderClock className="w-3 h-3 text-indigo-500" />
                              <strong className="text-slate-600 font-semibold">{p.stats.complaints?.total || 0}</strong>
                            </span>
                            <span title="Events" className="inline-flex items-center gap-1 hover:text-emerald-600">
                              <CalendarDays className="w-3 h-3 text-emerald-500" />
                              <strong className="text-slate-600 font-semibold">{p.stats.events?.total || 0}</strong>
                            </span>
                            <span title="Beneficiaries" className="inline-flex items-center gap-1 hover:text-rose-600">
                              <HeartHandshake className="w-3 h-3 text-rose-500" />
                              <strong className="text-slate-600 font-semibold">{p.stats.beneficiaries?.total || 0}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Jump to Project Workspace Button */}
                    <button
                      type="button"
                      onClick={(e) => handleGoToDashboard(e, p._id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0 cursor-pointer"
                      title="Open Project Workspace Dashboard"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Context Scope Architectural Notice Callout */}
          <div className="mx-3 mt-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-[10px] text-slate-500 leading-relaxed">
            <span className="font-bold text-indigo-700">Project Context Scope:</span> Isolates records in <strong>Risk Register</strong>, <strong>Complaints &amp; Feedback</strong>, <strong>Event Tracker</strong>, and <strong>Beneficiaries</strong>. Core HR &amp; Assets remain organization-wide.
          </div>

          {/* Footer Navigation & Actions */}
          <div className="mt-2 pt-2.5 px-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/projects');
              }}
              className="text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer py-1 inline-flex items-center gap-1"
            >
              <span>Manage All Projects</span>
              <span>&rarr;</span>
            </button>

            {onOpenCreateModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateModal();
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
