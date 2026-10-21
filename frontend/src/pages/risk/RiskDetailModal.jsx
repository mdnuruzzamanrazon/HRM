import React from 'react';
import { 
  X, ShieldAlert, Calendar, User, Clock, 
  CheckCircle2, AlertTriangle, Edit3, Trash2, ArrowRight 
} from 'lucide-react';
import { format } from 'date-fns';

export default function RiskDetailModal({
  isOpen,
  onClose,
  riskRecord,
  onEdit,
  onDelete
}) {
  if (!isOpen || !riskRecord) return null;

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return format(new Date(d), 'dd MMM yyyy');
    } catch {
      return String(d);
    }
  };

  const getRatingBadge = (rating) => {
    if (rating === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          HIGH RISK (15+)
        </span>
      );
    }
    if (rating === 'MEDIUM') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs">
          <span className="w-2 h-2 rounded-full bg-white"></span>
          MEDIUM RISK (8-14)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
        <span className="w-2 h-2 rounded-full bg-white"></span>
        LOW RISK (&lt;8)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/30">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-300">Risk #{riskRecord.riskNo}</span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300">{riskRecord.category}</span>
                {riskRecord.subCategory && (
                  <>
                    <span className="text-slate-500">/</span>
                    <span className="text-xs text-slate-400">{riskRecord.subCategory}</span>
                  </>
                )}
              </div>
              <h3 className="text-sm font-bold text-white line-clamp-1">
                {riskRecord.description}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Top Banner with Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Score Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>9. Current Score</span>
                {getRatingBadge(riskRecord.riskRating)}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{riskRecord.currentScore}</span>
                <span className="text-xs text-slate-500">
                  (L:{riskRecord.likelihood} × I:{riskRecord.impact}) + {riskRecord.impact}
                </span>
              </div>
            </div>

            {/* Target Score Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">
                10. Target Score (Appetite)
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {riskRecord.targetScore !== null && riskRecord.targetScore !== undefined ? riskRecord.targetScore : '—'}
                </span>
                <span className="text-xs text-slate-500">Target risk appetite</span>
              </div>
            </div>

            {/* Variance Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">
                11. Variance (Gap)
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-black ${
                  riskRecord.variance > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {riskRecord.variance > 0 ? `+${riskRecord.variance}` : riskRecord.variance}
                </span>
                <span className="text-xs text-slate-500">Current − Target</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              5. Description of Risk
            </span>
            <p className="text-xs text-slate-800 leading-relaxed p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-medium">
              {riskRecord.description}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 bg-white text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">1. Risk No.</span>
              <span className="font-black text-slate-800 text-sm">#{riskRecord.riskNo}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">2. Date Added</span>
              <span className="font-bold text-slate-800">{formatDate(riskRecord.dateAdded)}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">6. Risk Owner</span>
              <span className="font-bold text-slate-800">{riskRecord.riskOwner || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Status</span>
              <span className="inline-block mt-0.5 px-2 py-0.5 font-extrabold rounded-md bg-slate-100 text-slate-700 text-[11px]">
                {riskRecord.status}
              </span>
            </div>
          </div>

          {/* Mitigation Plan */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-black text-slate-800 uppercase tracking-wider">
                Mitigation Plan & Monitoring
              </span>
              <span className="text-slate-500 text-[11px]">Fields 12 – 15</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block mb-1">12. Mitigation Required / Action</span>
              <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed font-medium">
                {riskRecord.mitigationAction || 'No mitigation action specified.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-slate-500 font-bold block mb-0.5">13. Action Due Date</span>
                <span className="font-semibold text-slate-800">{formatDate(riskRecord.actionDueDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-0.5">14. Person Monitoring</span>
                <span className="font-semibold text-slate-800">{riskRecord.personMonitoring || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-0.5">15. Notes</span>
                <span className="font-semibold text-slate-800">{riskRecord.notes || '—'}</span>
              </div>
            </div>
          </div>

          {/* Assessment & Review */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-black text-slate-800 uppercase tracking-wider">
                Assessment Result & Re-Review
              </span>
              <span className="text-slate-500 text-[11px]">Fields 16 – 20</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2">
                <span className="text-slate-500 font-bold block mb-0.5">16. Assessment Result</span>
                <span className="font-semibold text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 block">
                  {riskRecord.assessmentResult || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-0.5">17. Review Date</span>
                <span className="font-semibold text-slate-800 block pt-1.5">{formatDate(riskRecord.reviewDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-0.5">18 & 19. Assessed L & I</span>
                <span className="font-bold text-slate-800 block pt-1.5">
                  {riskRecord.assessedLikelihood ? `L:${riskRecord.assessedLikelihood} × I:${riskRecord.assessedImpact}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-0.5">20. Assessed Score</span>
                <span className="font-black text-slate-900 block pt-1.5">
                  {riskRecord.assessmentScore !== null ? riskRecord.assessmentScore : '—'}
                  {riskRecord.assessmentRating && (
                    <span className="ml-1 text-[10px] font-bold text-indigo-600">({riskRecord.assessmentRating})</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <button
            onClick={() => {
              if (onDelete) onDelete(riskRecord);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Record</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                if (onEdit) onEdit(riskRecord);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Risk Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
