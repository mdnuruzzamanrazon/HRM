import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { cn } from '../../utils/cn';

const LINKED_MODULES = [
  { key: 'RISK', label: 'Risk Register', href: '/risk-register', prefixes: ['/risk'], icon: ShieldAlert },
  { key: 'COMPLAINTS', label: 'Complaints & Feedback', href: '/complaints-register', prefixes: ['/complaint'], icon: FolderClock },
  { key: 'EVENTS', label: 'Event Tracker', href: '/event-tracker', prefixes: ['/event'], icon: CalendarDays },
  { key: 'BENEFICIARIES', label: 'Beneficiaries', href: '/beneficiaries', prefixes: ['/beneficiar'], icon: HeartHandshake },
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

  if (loadingProjects) {
    return (
      <div className="rounded-2xl bg-white border border-indigo-100 px-5 py-3.5 shadow-2xs flex items-center gap-3 text-sm text-slate-600">
        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
        <span className="font-semibold">Loading active project context...</span>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="rounded-2xl bg-amber-50/90 border border-amber-200 px-5 py-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">No Active Project Selected</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {moduleName} operates strictly within a selected project context. Create or select an authorized project to view and manage records.
            </p>
          </div>
        </div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors self-start sm:self-auto"
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Open Project Management</span>
        </Link>
      </div>
    );
  }

  const statusTone =
    selectedProject.status === 'ACTIVE'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : selectedProject.status === 'ON_HOLD'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div className="rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white px-5 py-4 shadow-md border border-indigo-800/60">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Selected Project Identity */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-5 h-5 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              <span>Selected Project:</span>
              {selectedProject.code && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/25 text-indigo-100 border border-indigo-400/30 font-extrabold">
                  {selectedProject.code}
                </span>
              )}
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-extrabold border', statusTone)}>
                {selectedProject.status || 'ACTIVE'}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-white truncate mt-0.5">
              {selectedProject.name}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
              {selectedProject.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-300" />
                  {selectedProject.location}
                </span>
              )}
              {(selectedProject.projectManager || selectedProject.responsiblePerson) && (
                <span className="inline-flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                  {selectedProject.projectManager || selectedProject.responsiblePerson}
                </span>
              )}
              <span className="text-indigo-200/80">
                Shared Project Context &bull; {moduleName}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Switcher & Workspace Link */}
        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          {projects.length > 1 && (
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1.5">
              <label htmlFor="banner-project-switch" className="text-[11px] font-bold text-indigo-200 whitespace-nowrap">
                Switch Project:
              </label>
              <select
                id="banner-project-switch"
                value={selectedProjectId}
                onChange={(e) => switchProject(e.target.value)}
                className="bg-slate-900 text-white text-xs font-bold rounded-lg px-2.5 py-1 border border-indigo-400/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 max-w-[210px]"
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} {p.code ? `(${p.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link
            to={`/projects/${selectedProject._id}/dashboard`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition-colors"
          >
            <span>Project Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Sibling Project-Linked Module Strip */}
      <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-indigo-200/80 mr-1">
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
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                  active
                    ? 'bg-indigo-500 text-white shadow-xs'
                    : 'bg-white/5 text-indigo-100 hover:bg-white/15'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </Link>
            );
          })}
        </div>
        <span className="text-[11px] text-indigo-200/70">
          Records created here automatically belong to <strong>{selectedProject.name}</strong>
        </span>
      </div>
    </div>
  );
}
