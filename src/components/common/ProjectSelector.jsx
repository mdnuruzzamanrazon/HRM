import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import { 
  FolderKanban, ChevronDown, Check, Plus, Search, 
  ExternalLink, Layers, ShieldCheck, MapPin, Sparkles, Building2,
  FolderOpen
} from 'lucide-react';
import { cn } from '../../utils/cn';

export default function ProjectSelector({ onOpenCreateModal }) {
  const { projects, selectedProject, selectedProjectId, setSelectedProjectId, loadingProjects } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter projects by search query
  const filteredProjects = projects.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q) ||
      (p.projectManager || '').toLowerCase().includes(q)
    );
  });

  const handleSelect = (id) => {
    setSelectedProjectId(id);
    setIsOpen(false);
    setSearch('');
  };

  const handleGoToDashboard = (e, id) => {
    e.stopPropagation();
    setSelectedProjectId(id);
    setIsOpen(false);
    navigate(`/projects/${id}/dashboard`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-left transition-all duration-200 border cursor-pointer group shadow-2xs",
          isOpen
            ? "bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20"
            : "bg-white hover:bg-slate-50/90 border-slate-200/90 hover:border-slate-300"
        )}
        title="Switch Active Project Context"
        aria-expanded={isOpen}
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          <FolderKanban className="w-4 h-4" />
        </div>

        <div className="flex flex-col min-w-0 max-w-[140px] sm:max-w-[210px] md:max-w-[280px]">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
            <span>Current Project:</span>
            {selectedProject?.code && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60">
                {selectedProject.code}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-800 truncate leading-snug">
              {loadingProjects ? 'Loading Projects...' : (selectedProject?.name || 'No Project Selected')}
            </span>
          </div>
        </div>

        <ChevronDown className={cn(
          "w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 group-hover:text-slate-600",
          isOpen && "rotate-180 text-indigo-600"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header & Search */}
          <div className="px-3.5 pb-2.5 border-b border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <FolderKanban className="w-3.5 h-3.5 text-indigo-600" />
                <span>Select Workspace Project</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {projects.length} available
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects by name, code..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Projects List */}
          <div className="max-h-72 overflow-y-auto px-2 py-1.5 space-y-1 custom-scrollbar">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-6 px-4">
                <FolderOpen className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">No matching projects found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different term</p>
              </div>
            ) : (
              filteredProjects.map((p) => {
                const isSelected = String(p._id) === String(selectedProjectId);
                return (
                  <div
                    key={p._id}
                    onClick={() => handleSelect(p._id)}
                    className={cn(
                      "flex items-start justify-between p-2.5 rounded-xl cursor-pointer transition-all group",
                      isSelected
                        ? "bg-indigo-50/90 border border-indigo-200/80 shadow-2xs"
                        : "hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-2">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 transition-colors",
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                      )}>
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : (p.code?.substring(4, 6) || 'PR')}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={cn(
                            "text-xs font-bold truncate leading-tight",
                            isSelected ? "text-indigo-950" : "text-slate-800 group-hover:text-indigo-600"
                          )}>
                            {p.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          {p.code && (
                            <span className="font-semibold text-indigo-600">
                              {p.code}
                            </span>
                          )}
                          {p.location && (
                            <>
                              <span>&bull;</span>
                              <span className="truncate max-w-[120px]">{p.location}</span>
                            </>
                          )}
                          <span className={cn(
                            "px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase",
                            p.status === 'ACTIVE'
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          )}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Jump to Project Dashboard */}
                    <button
                      type="button"
                      onClick={(e) => handleGoToDashboard(e, p._id)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                      title="Open Project Dashboard"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 px-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/projects');
              }}
              className="text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer py-1"
            >
              Manage All Projects &rarr;
            </button>

            {onOpenCreateModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreateModal();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>New Project</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
