import React from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ComplaintsPrintView({
  isOpen,
  onClose,
  records = [],
  projectName = 'CBDP Women & Girls Empowerment Initiative',
  stats = null
}) {
  if (!isOpen) return null;

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      return format(new Date(d), 'dd/MM/yyyy');
    } catch {
      return String(d);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'S.No',
      'Date Complaint or Feedback Received',
      'Receiving Channel',
      'Feedback/Complainants name & address',
      'Complainant/s contact phone number (and number called from if different)',
      'Complaint type / category',
      'Description of feedback or complaint/allegation/issue',
      'Gender of complainant',
      'Age of complainant',
      'Does complainant have a disability?',
      'Concerned partner/organization Name',
      'What action/s have been taken in response to the feedback or complaint? How has the issue been redressed?',
      'If more than 30 days since complaint, what is the reason for delay in resolving and has complainant been notified of reason for delay?',
      'Current Status [Open / Closed]',
      'Date Complaint Closed',
      'Appeal Date (If needed)',
      'Appeal Outcome',
      'Final Closing Date after Appeal'
    ];

    const rows = records.map(r => {
      const nameAndAddr = `${r.complainantName || ''}${r.complainantAddress ? ` (${r.complainantAddress})` : ''}`;
      const phoneDetails = `${r.complainantPhone || ''}${r.numberCalledFrom ? ` [Called from: ${r.numberCalledFrom}]` : ''}`;
      const delayInfo = r.delayReason ? `${r.delayReason} (Notified: ${r.isComplainantNotifiedOfDelay || 'No'})` : '';

      return [
        `"${(r.sNo || '').replace(/"/g, '""')}"`,
        `"${formatDate(r.dateReceived)}"`,
        `"${(r.receivingChannel || '').replace(/"/g, '""')}"`,
        `"${nameAndAddr.replace(/"/g, '""')}"`,
        `"${phoneDetails.replace(/"/g, '""')}"`,
        `"${(r.complaintCategory || '').replace(/"/g, '""')}"`,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        `"${(r.complainantGender || '').replace(/"/g, '""')}"`,
        `"${(r.complainantAge || '').replace(/"/g, '""')}"`,
        `"${(r.complainantDisability || '').replace(/"/g, '""')}"`,
        `"${(r.partnerOrgName || '').replace(/"/g, '""')}"`,
        `"${(r.actionsTaken || '').replace(/"/g, '""')}"`,
        `"${delayInfo.replace(/"/g, '""')}"`,
        `"${(r.status || 'Open')}"`,
        `"${formatDate(r.dateClosed)}"`,
        `"${formatDate(r.appealDate)}"`,
        `"${(r.appealOutcome || '').replace(/"/g, '""')}"`,
        `"${formatDate(r.finalClosingDateAfterAppeal)}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Complaints_Feedback_Register_${format(new Date(), 'yyyy_MM_dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-[96vw] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Controls Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex-shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Official Register Print &amp; Monthly Hardcopy Filing View
              </h3>
              <p className="text-[11px] text-slate-500">
                Formatted per Oxfam &amp; Partner joint standard for monthly ED review &amp; folder filing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Register Sheet</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white print:p-0 print:overflow-visible">
          
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                  CBDP
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Complaints &amp; Feedback Register
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    Joint Accountability Mechanism — Partner &amp; Oxfam
                  </p>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="font-bold text-slate-900 block">CONFIDENTIAL RECORD</span>
                <span className="text-slate-500 block">Project: {projectName}</span>
                <span className="text-slate-500 block">Printed on: {format(new Date(), 'dd MMMM yyyy, hh:mm a')}</span>
              </div>
            </div>

            {/* Operational Guidelines Box */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-300 rounded-lg text-[10px] text-slate-700 leading-snug space-y-1">
              <p className="font-bold text-slate-900">Complaints &amp; Feedback Register — Operational Guidelines:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>All complaints or feedback received through any complaints channel within the project must be recorded on this log. This log must be maintained by the Partner and Oxfam.</li>
                <li>All complaints or feedback received must be processed appropriately, promptly, and fairly ensuring utmost confidentiality, privacy, and safety of complainants and those affected.</li>
                <li>Hard copies should be printed and filed monthly within a secure Complaints &amp; Feedback folder.</li>
                <li>This register must be reviewed by the ED of partner and Focal persons of Oxfam monthly to ensure open complaints or feedback are being addressed and kept updated.</li>
              </ul>
            </div>
          </div>

          {/* Register Table with All 18 Source Columns */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 text-[10px] leading-tight">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-900 text-center">
                  <th className="border border-slate-300 p-1.5 w-14">1. S.No</th>
                  <th className="border border-slate-300 p-1.5 w-18">2. Date Received</th>
                  <th className="border border-slate-300 p-1.5 w-16">3. Receiving Channel</th>
                  <th className="border border-slate-300 p-1.5 w-28">4. Feedback / Complainant Name &amp; Address</th>
                  <th className="border border-slate-300 p-1.5 w-24">5. Contact Phone &amp; Called From</th>
                  <th className="border border-slate-300 p-1.5 w-24">6. Complaint Type / Category</th>
                  <th className="border border-slate-300 p-1.5">7. Description of Feedback, Complaint / Allegation</th>
                  <th className="border border-slate-300 p-1.5 w-12">8. Gender</th>
                  <th className="border border-slate-300 p-1.5 w-10">9. Age</th>
                  <th className="border border-slate-300 p-1.5 w-14">10. Disability?</th>
                  <th className="border border-slate-300 p-1.5 w-20">11. Concerned Partner / Org</th>
                  <th className="border border-slate-300 p-1.5 w-32">12. Actions Taken / How Redressed</th>
                  <th className="border border-slate-300 p-1.5 w-28">13. Reason for Delay (&gt;30d) &amp; Notification</th>
                  <th className="border border-slate-300 p-1.5 w-14">14. Status</th>
                  <th className="border border-slate-300 p-1.5 w-16">15. Date Closed</th>
                  <th className="border border-slate-300 p-1.5 w-16">16. Appeal Date</th>
                  <th className="border border-slate-300 p-1.5 w-24">17. Appeal Outcome</th>
                  <th className="border border-slate-300 p-1.5 w-16">18. Final Closing Date</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="border border-slate-300 p-6 text-center text-slate-500">
                      No complaint or feedback records match the current view.
                    </td>
                  </tr>
                ) : (
                  records.map((r, idx) => (
                    <tr key={r._id || idx} className="hover:bg-slate-50 align-top">
                      <td className="border border-slate-300 p-1.5 font-mono font-bold text-slate-800 text-center">
                        {r.sNo}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center whitespace-nowrap">
                        {formatDate(r.dateReceived)}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center">
                        {r.receivingChannel}
                        {r.receivingChannelOther ? ` (${r.receivingChannelOther})` : ''}
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        <span className="font-bold block">{r.complainantName || 'Anonymous'}</span>
                        {r.complainantAddress && (
                          <span className="text-slate-500 block text-[9px]">{r.complainantAddress}</span>
                        )}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-mono">
                        <div>{r.complainantPhone || '—'}</div>
                        {r.numberCalledFrom && r.numberCalledFrom !== r.complainantPhone && (
                          <div className="text-[9px] text-slate-500">Call: {r.numberCalledFrom}</div>
                        )}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-medium">
                        {r.complaintCategory}
                        {r.complaintCategoryOther ? ` (${r.complaintCategoryOther})` : ''}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-slate-800">
                        {r.description}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center">
                        {r.complainantGender || '—'}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center">
                        {r.complainantAge || '—'}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center">
                        {r.complainantDisability || 'Not recorded'}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-bold text-slate-800">
                        {r.partnerOrgName}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-slate-700">
                        {r.actionsTaken || '—'}
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        {r.delayReason ? (
                          <div>
                            <span className="font-medium text-slate-800 block">{r.delayReason}</span>
                            <span className="text-[9px] text-indigo-700 block mt-0.5">
                              Notified: {r.isComplainantNotifiedOfDelay}
                            </span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                          r.status === 'Closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center whitespace-nowrap">
                        {formatDate(r.dateClosed)}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center whitespace-nowrap">
                        {formatDate(r.appealDate)}
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        {r.appealOutcome || '—'}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center whitespace-nowrap">
                        {formatDate(r.finalClosingDateAfterAppeal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Monthly ED & Oxfam Review Sign-off Block */}
          <div className="mt-8 pt-6 border-t-2 border-slate-300 break-inside-avoid">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Monthly Operational Review &amp; Secure Filing Verification
            </h4>

            <div className="grid grid-cols-2 gap-8 text-xs">
              <div className="p-4 rounded-lg border border-slate-300 space-y-4">
                <span className="font-bold text-slate-900 block">Reviewed &amp; Verified by Partner Executive Director (ED):</span>
                <div className="pt-6 border-b border-slate-400"></div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Signature &amp; Official Seal</span>
                  <span>Date: _____ / _____ / 2026</span>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-slate-300 space-y-4">
                <span className="font-bold text-slate-900 block">Reviewed &amp; Verified by Oxfam Focal Person:</span>
                <div className="pt-6 border-b border-slate-400"></div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Signature &amp; Official Stamp</span>
                  <span>Date: _____ / _____ / 2026</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-[9px] text-center text-slate-500">
              This document contains confidential beneficiary and community feedback. Must be filed in the designated physical lockable Complaints &amp; Feedback file cabinet.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
