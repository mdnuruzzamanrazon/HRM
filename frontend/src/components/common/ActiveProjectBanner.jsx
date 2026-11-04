import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ShieldAlert,
  FolderClock,
  CalendarDays,
  HeartHandshake,
  MapPin,
  UserCheck,
  ExternalLink,
  AlertCircle,
  Loader2,
  ChevronDown,
  Check,
  Search,
  Users,
  Boxes,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { cn } from '../../utils/cn';

const LINKED_MODULES = [
  { key: 'RISK', label: 'Risk Register', href: '/risk-register', prefixes: ['/risk'], icon: ShieldAlert },
  { key: 'COMPLAINTS', label: 'Complaints & Feedback', href: '/complaints-register', prefixes: ['/complaint'], icon: FolderClock },
  { key: 'EVENTS', label: 'Event Tracker', href: '/event-tracker', prefixes: ['/event'], icon: CalendarDays },
  { key: 'BENEFICIARIES', label: 'Beneficiary Information', href: '/beneficiaries', prefixes: ['/beneficiar'], icon: HeartHandshake },
];

export default function ActiveProjectBanner({ moduleName = 'Project Module' }) {
  const {
    projects,
    selectedProject,
    selectedProjectId,
    switchProject,
    loadingProjects,
  } = useProject();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [switcherSearch, setSwitcherSearch] = useState('');
  const switcherRef = useRef(null);

  // Close switcher dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setIsSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loadingProjects) {
    return (
      <div className="rounded-3xl bg-white border border-indigo-100 px-6 py-4 shadow-xs flex items-center gap-3 text-sm text-slate-600">
        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
        <span className="font-bold">Loading active project workspace context...</span>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 px-6 py-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-700">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-amber-950">No Active Project Selected</h3>
            <p className="text-xs text-amber-800/90 mt-0.5 max-w-2xl leading-relaxed">
              <strong>{moduleName}</strong> operates strictly within an authorized project context. Select or initialize a project to create, isolate, and manage records.
            </p>
          </div>
        </div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <FolderKanban className="w-4 h-4" />
          <span>Open Project Management</span>
        </Link>
      </div>
    );
  }

  const statusTone =
    selectedProject.status === 'ACTIVE'
      ? {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
          dot: 'bg-emerald-400'
        }
      : selectedProject.status === 'ON_HOLD'
      ? {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
          dot: 'bg-amber-400'
        }
      : {
          badge: 'bg-slate-700/60 text-slate-300 border-slate-600',
          dot: 'bg-slate-400'
        };

  const filteredProjects = projects.filter(p => {
    if (!switcherSearch.trim()) return true;
    const q = switcherSearch.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q)
    );
  });

  const handleSwitchProject = (id) => {
    const success = switchProject(id);
    if (success !== false) {
      setIsSwitcherOpen(false);
      setSwitcherSearch('');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-indigo-900/50">
      {/* Decorative ambient glowing backdrops */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Row: Project Identity + Quick Switcher + Workspace Action */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Project Identity */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                <FolderKanban className="w-6 h-6 text-indigo-300" />
              </div>
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-slate-950",
                statusTone.dot,
                selectedProject.status === 'ACTIVE' && "animate-pulse"
              )} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-indigo-300">
                <span>Selected Project Context:</span>
                {selectedProject.code && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/25 text-indigo-100 border border-indigo-400/40 font-mono font-bold text-[10px]">
                    {selectedProject.code}
                  </span>
                )}
                <span className={cn('px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold border', statusTone.badge)}>
                  {selectedProject.status || 'ACTIVE'}
                </span>
                <span className="text-slate-400 font-semibold normal-case">
                  &bull; Currently Viewing: <strong className="text-white">{moduleName}</strong>
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white truncate mt-1">
                {selectedProject.name}
              </h2>

              {/* Rich Project Metadata Chips */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300 mt-1.5">
                {selectedProject.location && (
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>{selectedProject.location}</span>
                  </span>
                )}
                {(selectedProject.projectManager || selectedProject.responsiblePerson) && (
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Lead: <strong className="text-white">{selectedProject.projectManager || selectedProject.responsiblePerson}</strong></span>
                  </span>
                )}
                {selectedProject.period && (
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>Period: {selectedProject.period}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Area: Modern Custom Project Switcher & Workspace Link */}
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            {/* Custom Interactive Switcher Popover */}
            {projects.length > 1 && (
              <div className="relative" ref={switcherRef}>
                <button
                  type="button"
                  onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                  className={cn(
                    "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                    isSwitcherOpen
                      ? "bg-white text-slate-900 border-white shadow-md"
                      : "bg-white/10 hover:bg-white/15 text-white border-white/20 hover:border-white/30"
                  )}
                  title="Switch to another project"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="max-w-[130px] truncate">Switch Project</span>
                  <ChevronDown className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200",
                    isSwitcherOpen && "rotate-180"
                  )} />
                </button>

                {isSwitcherOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Switch Active Project</span>
                      <span className="text-[10px] text-slate-400">{projects.length} Total</span>
                    </div>

                    {projects.length > 4 && (
                      <div className="p-1.5">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={switcherSearch}
                            onChange={(e) => setSwitcherSearch(e.target.value)}
                            placeholder="Filter projects..."
                            className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                          />
                        </div>
                      </div>
                    )}

                    <div className="max-h-56 overflow-y-auto space-y-1 mt-1 custom-scrollbar">
                      {filteredProjects.map((p) => {
                        const isCurrent = String(p._id) === String(selectedProjectId);
                        return (
                          <div
                            key={p._id}
                            onClick={() => handleSwitchProject(p._id)}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors",
                              isCurrent
                                ? "bg-indigo-50 text-indigo-900 font-bold border border-indigo-200"
                                : "hover:bg-slate-50 text-slate-700"
                            )}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="truncate font-semibold">{p.name}</p>
                              {p.code && (
                                <p className="text-[10px] text-slate-400 font-mono">{p.code}</p>
                              )}
                            </div>
                            {isCurrent && (
                              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 mt-1 border-t border-slate-100 px-1">
                      <Link
                        to="/projects"
                        onClick={() => setIsSwitcherOpen(false)}
                        className="block text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 py-1"
                      >
                        Manage All Projects &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Project Workspace Dashboard Link */}
            <Link
              to={`/projects/${selectedProject._id}/dashboard`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
              title="Open full project workspace dashboard"
            >
              <span>Project Workspace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom Strip: 4 Project-Linked Modules Lateral Tabs + Notice */}
        <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Navigation Pill Strip across the 4 modules */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-indigo-300 mr-1 hidden sm:inline">
              Linked Modules:
            </span>
            {LINKED_MODULES.map((m) => {
              const Icon = m.icon;
              const pathLower = location.pathname.toLowerCase();
              const active = m.prefixes.some((prefix) => pathLower.startsWith(prefix));
              return (
                <Link
                  key={m.key}
                  to={m.href}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/25'
                      : 'bg-white/10 text-indigo-100 hover:bg-white/20 hover:text-white'
                  )}
                  title={`Navigate to ${m.label} under ${selectedProject.name}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Context Guarantee Banner Note */}
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-200/90 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
            <span>
              Records created here automatically belong to <strong className="text-white underline decoration-indigo-400 underline-offset-2">{selectedProject.name}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
