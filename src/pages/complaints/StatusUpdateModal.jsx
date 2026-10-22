import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, AlertTriangle, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';

export default function StatusUpdateModal({
  isOpen,
  onClose,
  complaintRecord,
  onSave,
  isSubmitting = false
}) {
  const [status, setStatus] = useState('Open');
  const [dateClosed, setDateClosed] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [closureNotes, setClosureNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (complaintRecord) {
      setStatus(complaintRecord.status || 'Open');
      setDateClosed(
        complaintRecord.dateClosed
          ? format(new Date(complaintRecord.dateClosed), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd')
      );
      setActionsTaken(complaintRecord.actionsTaken || '');
      setClosureNotes('');
      setError('');
    }
  }, [complaintRecord, isOpen]);

  if (!isOpen || !complaintRecord) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (status === 'Closed') {
      if (!dateClosed) {
        setError('Date closed is required when marking a complaint as Closed.');
        return;
      }
      const recDate = new Date(complaintRecord.dateReceived);
      const closeDate = new Date(dateClosed);
      if (closeDate < recDate) {
        setError('Date closed cannot precede the Date Received (' + format(recDate, 'dd MMM yyyy') + ').');
        return;
      }
    }

    onSave({
      status,
      dateClosed: status === 'Closed' ? dateClosed : null,
      actionsTaken,
      closureNotes
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              status === 'Closed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {status === 'Closed' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                {complaintRecord.sNo}
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Update Resolution &amp; Status</h3>
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

          {/* Status Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Current Status <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-xs transition-all ${
                status === 'Open'
                  ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-400/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="Open"
                  checked={status === 'Open'}
                  onChange={(e) => setStatus(e.target.value)}
                  className="sr-only"
                />
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Open</span>
              </label>

              <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-xs transition-all ${
                status === 'Closed'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-400/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="Closed"
                  checked={status === 'Closed'}
                  onChange={(e) => setStatus(e.target.value)}
                  className="sr-only"
                />
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Closed</span>
              </label>
            </div>
          </div>

          {/* Date Closed (if Closed) */}
          {status === 'Closed' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date Complaint Closed <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dateClosed}
                onChange={(e) => setDateClosed(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Actions Taken */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Actions Taken / How Issue Was Redressed
            </label>
            <textarea
              rows={3}
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              placeholder="Record the redressal steps, community consultation results, or remedial action taken..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Closure Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Internal Audit Notes (Optional)
            </label>
            <input
              type="text"
              value={closureNotes}
              onChange={(e) => setClosureNotes(e.target.value)}
              placeholder="e.g. Approved during monthly ED & Oxfam review"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
            />
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
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Status</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
