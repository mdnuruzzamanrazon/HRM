import React, { useState } from 'react';
import { 
  ShieldCheck, ChevronDown, ChevronUp, Lock, FileText, 
  Users, AlertCircle, CalendarCheck, CheckCircle2, BookOpen,
  Printer
} from 'lucide-react';

export default function ComplaintsGuidance({ defaultCollapsed = false, onOpenPrint }) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl shadow-lg border border-indigo-800/40 overflow-hidden transition-all duration-200">
      {/* Header bar / Toggle */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-5 py-4 flex items-center justify-between cursor-pointer select-none hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-400/30">
                Safeguarding & Accountability
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs font-semibold text-slate-300">Partner & Oxfam Joint Standard</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
              Complaints &amp; Feedback Register — Operational Guidelines
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-semibold text-slate-300 hidden md:inline">
            {isCollapsed ? 'Show Guidelines' : 'Collapse Panel'}
          </span>
          <button 
            type="button"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
            aria-label={isCollapsed ? 'Expand guidelines' : 'Collapse guidelines'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="px-5 pb-5 pt-1 border-t border-indigo-800/30 space-y-4 text-xs sm:text-sm text-slate-200">
          <p className="text-slate-300 leading-relaxed font-medium">
            This register establishes an accountable, transparent, and confidential complaints and feedback response mechanism across all project operational areas. All personnel must strictly observe the following core standards:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* Rule 1 */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                1
              </div>
              <div className="leading-snug">
                <span className="font-bold text-white block mb-0.5">Mandatory Recording of All Feedback</span>
                All complaints or feedback received through any complaints channel within the project must be recorded in this log.
              </div>
            </div>

            {/* Rule 2 */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                2
              </div>
              <div className="leading-snug">
                <span className="font-bold text-white block mb-0.5">Joint Partner &amp; Oxfam Ownership</span>
                The log must be maintained jointly by the Partner and Oxfam.
              </div>
            </div>

            {/* Rule 3 */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                3
              </div>
              <div className="leading-snug">
                <span className="font-bold text-white block mb-0.5">Prompt, Fair &amp; Confidential Processing</span>
                All complaints and feedback must be processed appropriately, promptly, and fairly, ensuring the utmost confidentiality, privacy, and safety of complainants and those affected.
              </div>
            </div>

            {/* Rule 4 */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                4
              </div>
              <div className="leading-snug">
                <span className="font-bold text-white block mb-0.5">Secure Storage &amp; Privacy Protection</span>
                The register must be stored securely to protect the confidentiality, privacy, and safety of complainants.
              </div>
            </div>

            {/* Rule 5 */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-sky-500/30 text-sky-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                5
              </div>
              <div className="leading-snug">
                <span className="font-bold text-white block mb-0.5">Monthly Hard Copy Filing</span>
                Hard copies should be printed and filed monthly in a secure Complaints &amp; Feedback folder.
              </div>
            </div>

            {/* Rule 6 */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-purple-500/30 text-purple-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                6
              </div>
              <div className="leading-snug">
                <span className="font-bold text-white block mb-0.5">Monthly ED &amp; Focal Person Review</span>
                The register must be reviewed monthly by the Partner's Executive Director (ED) and the relevant Oxfam focal persons to ensure open complaints and feedback are appropriately addressed, processed, closed, and kept up to date.
              </div>
            </div>

            {/* Rule 7 */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3 md:col-span-2">
              <div className="w-6 h-6 rounded-lg bg-rose-500/30 text-rose-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                7
              </div>
              <div className="leading-snug">
                <span className="font-bold text-white block mb-0.5">Periodic Community &amp; Vulnerable Group Consultations</span>
                Beneficiaries and communities, especially marginalized and vulnerable people, should be consulted periodically to ensure the complaint and feedback mechanism is accessible, effective, confidential, and safe.
              </div>
            </div>
          </div>

          {/* Quick Filing Footer Bar */}
          <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restricted Access: Authorized HR, ED, and Oxfam Focal Persons only.</span>
            </div>
            {onOpenPrint && (
              <button
                type="button"
                onClick={onOpenPrint}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Monthly Folder Print Sheet</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
