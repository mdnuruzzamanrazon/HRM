import React, { useState, useEffect } from 'react';
import { X, Scale, AlertTriangle, Loader2, Save, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AppealModal({
  isOpen,
  onClose,
  complaintRecord,
  onSave,
  isSubmitting = false
}) {
  const [appealDate, setAppealDate] = useState('');
  const [appealOutcome, setAppealOutcome] = useState('');
  const [appealStatus, setAppealStatus] = useState('Pending Review');
  const [finalClosingDateAfterAppeal, setFinalClosingDateAfterAppeal] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (complaintRecord) {
      setAppealDate(
        complaintRecord.appealDate
          ? format(new Date(complaintRecord.appealDate), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd')
      );
      setAppealOutcome(complaintRecord.appealOutcome || '');
      setAppealStatus(complaintRecord.appealStatus || 'Pending Review');
      setFinalClosingDateAfterAppeal(
        complaintRecord.finalClosingDateAfterAppeal
          ? format(new Date(complaintRecord.finalClosingDateAfterAppeal), 'yyyy-MM-dd')
          : ''
      );
      setError('');
    }
  }, [complaintRecord, isOpen]);

  if (!isOpen || !complaintRecord) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const recDate = new Date(complaintRecord.dateReceived);

    if (appealDate) {
      const aDate = new Date(appealDate);
      if (aDate < recDate) {
        setError('Appeal date cannot precede Date Received (' + format(recDate, 'dd MMM yyyy') + ').');
        return;
      }
    }

    if (finalClosingDateAfterAppeal) {
      const fDate = new Date(finalClosingDateAfterAppeal);
      if (fDate < recDate) {
        setError('Final closing date cannot precede Date Received.');
        return;
      }
      if (appealDate) {
        const aDate = new Date(appealDate);
        if (fDate < aDate) {
          setError('Final closing date cannot precede Appeal Date.');
          return;
        }
      }
    }

    onSave({
      appealDate: appealDate || null,
      appealOutcome,
      appealStatus,
      finalClosingDateAfterAppeal: finalClosingDateAfterAppeal || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                {complaintRecord.sNo}
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Manage Complaint Appeal</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 16. Appeal Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              16. Appeal Date (If Needed)
            </label>
            <input
              type="date"
              value={appealDate}
              onChange={(e) => setAppealDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Appeal Review Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Appeal Review Determination
            </label>
            <select
              value={appealStatus}
              onChange={(e) => setAppealStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="Pending Review">Pending Review (ED &amp; Focal Person Review)</option>
              <option value="Upheld">Upheld (Original determination modified in favor of complainant)</option>
              <option value="Overturned">Overturned (Original determination reversed)</option>
              <option value="Dismissed">Dismissed (Original determination confirmed)</option>
            </select>
          </div>

          {/* 17. Appeal Outcome */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              17. Appeal Outcome
            </label>
            <textarea
              rows={3}
              value={appealOutcome}
              onChange={(e) => setAppealOutcome(e.target.value)}
              placeholder="Record findings of the appeal review, committee determinations, or remedies agreed..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-sans"
            />
          </div>

          {/* 18. Final Closing Date After Appeal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              18. Final Closing Date After Appeal
            </label>
            <input
              type="date"
              value={finalClosingDateAfterAppeal}
              onChange={(e) => setFinalClosingDateAfterAppeal(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Leave blank if appeal review is still underway. Must be on or after appeal date.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Appeal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
