import React from 'react';
import { 
  X, ShieldAlert, Calendar, User, Clock, 
  CheckCircle2, AlertTriangle, Edit3, Trash2, ArrowRight, Info 
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          HIGH (15+)
        </span>
      );
    }
    if (rating === 'MEDIUM') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          MEDIUM (8-14)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        LOW (&lt;8)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  Risk #{riskRecord.riskNo}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-800">
                  {riskRecord.categoryCode ? `[${riskRecord.categoryCode}] ` : ''}{riskRecord.category}
                </span>
                {riskRecord.subCategory && (
                  <>
                    <span className="text-slate-300">/</span>
                    <span className="text-xs text-slate-600 font-medium">
                      {riskRecord.subCode ? `[${riskRecord.subCode}] ` : ''}{riskRecord.subCategory}
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                {riskRecord.description}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Top Banner with Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Score Card */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                <span>Current Score</span>
                {getRatingBadge(riskRecord.riskRating)}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 font-heading">{riskRecord.currentScore}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({riskRecord.likelihood} × {riskRecord.impact}) + {riskRecord.impact}
                </span>
              </div>
            </div>

            {/* Target Score Card */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Target Appetite
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 font-heading">
                  {riskRecord.targetScore !== null && riskRecord.targetScore !== undefined ? riskRecord.targetScore : '—'}
                </span>
                <span className="text-[11px] text-slate-400">Target score</span>
              </div>
            </div>

            {/* Variance Card */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Variance
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-black font-heading ${
                  riskRecord.variance > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {riskRecord.variance > 0 ? `+${riskRecord.variance}` : riskRecord.variance}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Current − Target</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Risk Description
            </span>
            <p className="text-xs text-slate-800 leading-relaxed p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 font-medium">
              {riskRecord.description}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200/80 bg-white text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Risk Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">#{riskRecord.riskNo}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Date Added</span>
              <span className="font-semibold text-slate-800">{formatDate(riskRecord.dateAdded)}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Risk Owner</span>
              <span className="font-semibold text-slate-800">{riskRecord.riskOwner || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Status</span>
              <span className="inline-block mt-0.5 px-2 py-0.5 font-bold rounded-md bg-slate-100 text-slate-700 text-[11px]">
                {riskRecord.status}
              </span>
            </div>
          </div>

          {/* Dedicated CBDP Classification & Notes Card */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/80 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  CBDP Classification:
                </span>
                <span className="font-mono text-xs font-bold text-indigo-800 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
                  [{riskRecord.categoryCode || 'CAT'}] {riskRecord.category} › [{riskRecord.subCode || 'SUB'}] {riskRecord.subCategory || 'General'}
                </span>
              </div>
              {riskRecord.ukDirector && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-500">Accountable UK Director:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                    {riskRecord.ukDirector}
                  </span>
                </div>
              )}
            </div>
            {riskRecord.explanatoryNote && (
              <div className="text-[11px] text-slate-600 flex items-start gap-2 pt-0.5">
                <Info className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-700">Official Explanatory Note: </strong>
                  <span className={riskRecord.explanatoryNote.toLowerCase().includes('not specified') ? 'italic text-slate-400' : 'text-slate-700'}>
                    {riskRecord.explanatoryNote}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mitigation Plan */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider">
                Mitigation Plan & Monitoring
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block mb-1">Mitigation Required / Action</span>
              <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed font-medium">
                {riskRecord.mitigationAction || 'No mitigation action specified.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-0.5">Action Due Date</span>
                <span className="font-medium text-slate-800">{formatDate(riskRecord.actionDueDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-0.5">Person Monitoring</span>
                <span className="font-medium text-slate-800">{riskRecord.personMonitoring || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-0.5">Notes</span>
                <span className="font-medium text-slate-800">{riskRecord.notes || '—'}</span>
              </div>
            </div>
          </div>

          {/* Assessment & Review */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider">
                Assessment Result & Re-Review
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-0.5">Assessment Result</span>
                <span className="font-medium text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80 block">
                  {riskRecord.assessmentResult || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-0.5">Review Date</span>
                <span className="font-medium text-slate-800 block pt-1.5">{formatDate(riskRecord.reviewDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-0.5">Assessed L & I</span>
                <span className="font-bold text-slate-800 block pt-1.5">
                  {riskRecord.assessedLikelihood ? `L:${riskRecord.assessedLikelihood} × I:${riskRecord.assessedImpact}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-0.5">Assessed Score</span>
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
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/70 flex-shrink-0">
          <button
            onClick={() => {
              if (onDelete) onDelete(riskRecord);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Record</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                if (onEdit) onEdit(riskRecord);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-colors cursor-pointer"
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
