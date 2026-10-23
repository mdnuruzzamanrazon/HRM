import React, { useState } from 'react';
import { 
  X, Shield, Calendar, Phone, User, Clock, 
  CheckCircle2, AlertTriangle, Edit3, Trash2, 
  Printer, ArrowRight, Info, Eye, EyeOff, Lock,
  Building2, FileText, History, CheckSquare, MessageSquare, AlertCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function ComplaintDetailModal({
  isOpen,
  onClose,
  complaintRecord,
  onEdit,
  onUpdateStatus,
  onDelete,
  onPrintSingle
}) {
  const [showFullPhone, setShowFullPhone] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'actions' | 'delay' | 'appeal' | 'audit'

  if (!isOpen || !complaintRecord) return null;

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return format(new Date(d), 'dd MMM yyyy');
    } catch {
      return String(d);
    }
  };

  const formatDateTime = (d) => {
    if (!d) return '—';
    try {
      return format(new Date(d), 'dd MMM yyyy, hh:mm a');
    } catch {
      return String(d);
    }
  };

  // Mask phone number for confidentiality unless explicitly unmasked
  const maskPhone = (phone) => {
    if (!phone) return '—';
    if (phone.includes('PROTECTED')) return phone;
    if (showFullPhone) return phone;
    if (phone.length <= 6) return '••••••';
    const firstPart = phone.slice(0, 5);
    const lastPart = phone.slice(-2);
    return `${firstPart}••••${lastPart}`;
  };

  // Overdue calculation (>30 days since received & still open)
  const daysSinceReceived = complaintRecord.dateReceived 
    ? Math.max(0, differenceInDays(new Date(), new Date(complaintRecord.dateReceived)))
    : 0;
  const isOverdue = complaintRecord.status === 'Open' && daysSinceReceived > 30;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              complaintRecord.status === 'Closed'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                : 'bg-amber-50 border border-amber-200 text-amber-600'
            }`}>
              {complaintRecord.status === 'Closed' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                  {complaintRecord.sNo}
                </span>

                {/* Status Badge */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  complaintRecord.status === 'Closed'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    complaintRecord.status === 'Closed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }`} />
                  {complaintRecord.status}
                </span>

                {/* Overdue Badge */}
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-300">
                    <AlertTriangle className="w-3 h-3" />
                    Overdue ({daysSinceReceived}d)
                  </span>
                )}

                {/* Confidentiality Badge */}
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {complaintRecord.confidentialityLevel || 'Confidential'}
                </span>
              </div>

              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate mt-1">
                {complaintRecord.complaintCategory} • {complaintRecord.partnerOrgName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onPrintSingle && (
              <button
                type="button"
                onClick={() => onPrintSingle(complaintRecord)}
                title="Print Case File Sheet"
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(complaintRecord)}
                title="Edit Record"
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 flex-shrink-0 overflow-x-auto custom-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2.5 font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Case Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('complainant')}
            className={`px-3.5 py-2.5 font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'complainant'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Complainant &amp; Contact
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`px-3.5 py-2.5 font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'actions'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Redressal &amp; Response
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('delay')}
            className={`px-3.5 py-2.5 font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'delay'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>30-Day Delay Tracking</span>
            {isOverdue && (
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appeal')}
            className={`px-3.5 py-2.5 font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'appeal'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Appeal &amp; Closure
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2.5 font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">

          {/* ========================================================================= */}
          {/* TAB: OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Key Timeline Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Date Received</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                    {formatDate(complaintRecord.dateReceived)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Receiving Channel</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                    {complaintRecord.receivingChannel}
                    {complaintRecord.receivingChannelOther ? ` (${complaintRecord.receivingChannelOther})` : ''}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Days Open</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                    {daysSinceReceived} day{daysSinceReceived !== 1 ? 's' : ''}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Date Closed</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                    {formatDate(complaintRecord.dateClosed)}
                  </span>
                </div>
              </div>

              {/* Description Box */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  7. Description of Feedback, Complaint or Allegation
                </span>
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {complaintRecord.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Classification Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Complaint Category</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {complaintRecord.complaintCategory}
                    {complaintRecord.complaintCategoryOther ? ` (${complaintRecord.complaintCategoryOther})` : ''}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Concerned Partner / Org</span>
                  <span className="text-xs font-bold text-indigo-700 mt-1 block">
                    {complaintRecord.partnerOrgName}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Assigned Focal Person</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">
                    {complaintRecord.assignedFocalPerson || 'Not yet assigned'}
                  </span>
                </div>
              </div>

              {/* Demographics Summary */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Gender</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 block">
                    {complaintRecord.complainantGender || 'Prefer not to say'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Age</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 block">
                    {complaintRecord.complainantAge || 'Unrecorded'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Disability</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 block">
                    {complaintRecord.complainantDisability || 'Not recorded'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: COMPLAINANT */}
          {/* ========================================================================= */}
          {activeTab === 'complainant' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950">Data Privacy &amp; PII Protection Active</h4>
                    <p className="text-[11px] text-indigo-700">Complainant personal telephone details are masked by default.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullPhone(!showFullPhone)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer shadow-xs"
                >
                  {showFullPhone ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showFullPhone ? 'Mask Numbers' : 'Reveal Contact'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Complainant Name</span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {complaintRecord.complainantName || 'Not recorded'}
                  </span>
                  {complaintRecord.isAnonymous && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-200 text-slate-700">
                      Anonymous Registration
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Address / Operational Zone</span>
                  <span className="text-sm font-medium text-slate-800 mt-1 block">
                    {complaintRecord.complainantAddress || 'Not recorded'}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Complainant Contact Phone</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {maskPhone(complaintRecord.complainantPhone)}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Number Called From (If Different)</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {complaintRecord.numberCalledFrom ? maskPhone(complaintRecord.numberCalledFrom) : 'Same as contact phone / None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: ACTIONS */}
          {/* ========================================================================= */}
          {activeTab === 'actions' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  12. Actions Taken in Response &amp; Issue Redressal
                </span>
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {complaintRecord.actionsTaken || 'No action recorded yet. Use the Update Status or Edit Record action to log redressal steps.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Need to record further action or close this complaint?</span>
                  <span className="text-[11px] text-slate-500">Quickly toggle status or log redressal details.</span>
                </div>
                {onUpdateStatus && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(complaintRecord)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Update Resolution Status
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: 30-DAY DELAY */}
          {/* ========================================================================= */}
          {activeTab === 'delay' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className={`p-4 rounded-xl border ${
                isOverdue ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={`w-4 h-4 ${isOverdue ? 'text-amber-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-slate-900">
                    30-Day Delay Rule Status: {isOverdue ? 'Overdue (>30 Days Unresolved)' : 'Standard Progress'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Complaints exceeding 30 days without resolution require documented delay justifications and verified complainant notification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Reason for Delay</span>
                  <p className="text-xs sm:text-sm text-slate-800 mt-1 whitespace-pre-wrap font-sans">
                    {complaintRecord.delayReason || 'No delay reason recorded.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Complainant Notified of Delay?</span>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold ${
                    complaintRecord.isComplainantNotifiedOfDelay === 'Yes'
                      ? 'bg-emerald-100 text-emerald-800'
                      : complaintRecord.isComplainantNotifiedOfDelay === 'Pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {complaintRecord.isComplainantNotifiedOfDelay || 'Not applicable'}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Delay Notification Date</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    {formatDate(complaintRecord.delayNotificationDate)}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Delay Notification Notes</span>
                  <p className="text-xs text-slate-700 mt-1">
                    {complaintRecord.delayNotificationNotes || 'No notification notes.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: APPEAL & CLOSURE */}
          {/* ========================================================================= */}
          {activeTab === 'appeal' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">15. Date Complaint Closed</span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {formatDate(complaintRecord.dateClosed)}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Appeal Status</span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {complaintRecord.appealStatus || (complaintRecord.hasAppeal ? 'Pending Review' : 'No Appeal Filed')}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">16. Appeal Date (If Needed)</span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {formatDate(complaintRecord.appealDate)}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">18. Final Closing Date After Appeal</span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block">
                    {formatDate(complaintRecord.finalClosingDateAfterAppeal)}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">17. Appeal Outcome</span>
                  <p className="text-xs sm:text-sm text-slate-800 mt-1 whitespace-pre-wrap font-sans leading-relaxed">
                    {complaintRecord.appealOutcome || 'No appeal outcome recorded.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: AUDIT TRAIL */}
          {/* ========================================================================= */}
          {activeTab === 'audit' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700">Chronological Event History</span>
                <span className="text-[11px] text-slate-500">{complaintRecord.auditTrail?.length || 0} logged events</span>
              </div>

              {(!complaintRecord.auditTrail || complaintRecord.auditTrail.length === 0) ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No audit trail recorded.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {complaintRecord.auditTrail.map((ev, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-700">
                            {ev.action}
                          </span>
                          <span className="font-bold text-slate-900">{ev.performedBy || ev.userEmail || 'System'}</span>
                          {ev.role && (
                            <span className="text-[10px] text-slate-500 uppercase">({ev.role})</span>
                          )}
                        </div>
                        <p className="text-slate-700 font-medium">{ev.details}</p>
                      </div>

                      <span className="text-[11px] text-slate-400 whitespace-nowrap font-mono flex-shrink-0">
                        {formatDateTime(ev.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="text-[11px] text-slate-500">
            Registered: {formatDate(complaintRecord.createdAt || complaintRecord.dateReceived)}
          </div>

          <div className="flex items-center gap-2">
            {onUpdateStatus && (
              <button
                type="button"
                onClick={() => onUpdateStatus(complaintRecord)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Change Status
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(complaintRecord)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Edit Record
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
