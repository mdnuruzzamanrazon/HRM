import React from 'react';
import { Printer, X, Building, Calendar, MapPin, Users, ShieldCheck, Radio } from 'lucide-react';

export default function EventPrintView({ event, isOpen, onClose }) {
  if (!isOpen || !event) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const communityCount = Number(event.participantCountCommunity) || 0;
  const govCount = Number(event.govRepresentativeCount) || 0;
  const totalDirect = communityCount + govCount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col">
        
        {/* Screen Action Bar (hidden in actual print) */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold">Printable Event Official Top Sheet</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Document
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-10 space-y-6 bg-white text-gray-900">
          
          {/* Header */}
          <div className="border-b-2 border-indigo-900 pb-4 flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-800">
                Community Based Development Project (CBDP)
              </span>
              <h1 className="text-2xl font-black text-gray-950 mt-0.5 tracking-tight">
                OFFICIAL EVENT RECORD TOP SHEET
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                Monitoring, Evaluation, Accountability, and Learning (MEAL) Documentation Register
              </p>
            </div>

            <div className="text-right">
              <div className="inline-block border-2 border-indigo-800 px-3 py-1 rounded bg-indigo-50 text-indigo-950">
                <span className="text-[10px] font-bold block uppercase text-indigo-800">Unique Event ID</span>
                <span className="text-base font-mono font-black">{event.eventId}</span>
              </div>
              <span className="text-[11px] text-gray-500 block mt-1">SL #{event.sl || 1}</span>
            </div>
          </div>

          {/* Event Title Banner */}
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
              Event Title / Activity Description:
            </span>
            <p className="text-base font-bold text-gray-950 leading-snug">
              {event.eventTitle}
            </p>
          </div>

          {/* Core Grid Information */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            
            {/* Box 1: Organization & Classification */}
            <div className="border border-gray-300 rounded-lg p-3.5 space-y-2">
              <h3 className="font-bold uppercase tracking-wider text-indigo-900 border-b border-gray-200 pb-1 text-[11px]">
                1. Organization & Classification
              </h3>
              <div>
                <span className="text-gray-500 block">Implementing Organization:</span>
                <span className="font-bold text-gray-900">{event.implementingOrg}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Consortium Partner:</span>
                <span className="font-medium text-gray-900">{event.consortiumPartner || 'None (Direct SP)'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-gray-500 block">Event Type:</span>
                  <span className="font-bold text-gray-900">{event.eventType}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Event Theme:</span>
                  <span className="font-bold text-gray-900">{event.eventTheme}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Schedule & Administrative Location */}
            <div className="border border-gray-300 rounded-lg p-3.5 space-y-2">
              <h3 className="font-bold uppercase tracking-wider text-indigo-900 border-b border-gray-200 pb-1 text-[11px]">
                2. Schedule & Administrative Location
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500 block">Date From:</span>
                  <span className="font-bold text-gray-900">{formatDate(event.dateFrom)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Date To:</span>
                  <span className="font-bold text-gray-900">{formatDate(event.dateTo)}</span>
                </div>
              </div>
              <div className="pt-1">
                <span className="text-gray-500 block">Location Hierarchy:</span>
                <span className="font-bold text-gray-900">
                  {[event.union, event.upazila, event.district, event.division].filter(Boolean).join(', ')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Event Operational Level:</span>
                <span className="font-medium text-gray-900">{event.eventLevel || 'Local'}</span>
              </div>
            </div>

            {/* Box 3: Participation & Gov Engagement */}
            <div className="border border-gray-300 rounded-lg p-3.5 space-y-2">
              <h3 className="font-bold uppercase tracking-wider text-indigo-900 border-b border-gray-200 pb-1 text-[11px]">
                3. Direct Participation & Gov Engagement
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-gray-500 block">Community / CBO:</span>
                  <span className="font-bold text-gray-900 text-sm">{communityCount}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Gov Reps:</span>
                  <span className="font-bold text-gray-900 text-sm">{govCount}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Total Direct:</span>
                  <span className="font-black text-indigo-800 text-sm">{totalDirect}</span>
                </div>
              </div>
              <div className="pt-1">
                <span className="text-gray-500 block">Gov Official Response:</span>
                <span className="font-bold text-gray-900">{event.govResponse || 'N/A'}</span>
                {event.govResponseDetails && (
                  <p className="text-[11px] text-gray-700 italic mt-0.5">{event.govResponseDetails}</p>
                )}
              </div>
              {event.actionsAgreed && (
                <div className="pt-1">
                  <span className="text-gray-500 block">Agreed Actions:</span>
                  <p className="text-[11px] text-gray-800">{event.actionsAgreed}</p>
                </div>
              )}
            </div>

            {/* Box 4: Conflict Prevention & Indirect Reach */}
            <div className="border border-gray-300 rounded-lg p-3.5 space-y-2">
              <h3 className="font-bold uppercase tracking-wider text-indigo-900 border-b border-gray-200 pb-1 text-[11px]">
                4. Conflict Prevention & Indirect Reach
              </h3>
              <div>
                <span className="text-gray-500 block">Contributes to Conflict Prevention?</span>
                <span className="font-bold text-gray-900">{event.conflictPrevention || 'No'}</span>
                {event.conflictPreventionDetails && (
                  <p className="text-[11px] text-gray-700 italic mt-0.5">{event.conflictPreventionDetails}</p>
                )}
              </div>
              <div className="pt-1">
                <span className="text-gray-500 block">Indirect Reach Generated?</span>
                <span className="font-bold text-gray-900">
                  {event.indirectReach || 'No'}
                  {event.indirectReach === 'Yes' && (
                    <span className="ml-2 font-normal text-indigo-800">
                      (Est. Audience: {(Number(event.estimatedAudienceReach) || 0).toLocaleString()} via {event.indirectReachChannel || 'N/A'})
                    </span>
                  )}
                </span>
                {event.indirectReachDescription && (
                  <p className="text-[11px] text-gray-700 italic mt-0.5">{event.indirectReachDescription}</p>
                )}
              </div>
            </div>

          </div>

          {/* Official Sign-off Grid */}
          <div className="pt-10 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="border-t border-gray-400 pt-2">
              <span className="font-bold text-gray-900 block">Prepared By</span>
              <span className="text-[11px] text-gray-500">Project Field Officer / Focal Person</span>
            </div>
            <div className="border-t border-gray-400 pt-2">
              <span className="font-bold text-gray-900 block">Verified By</span>
              <span className="text-[11px] text-gray-500">MEAL Specialist / Coordinator</span>
            </div>
            <div className="border-t border-gray-400 pt-2">
              <span className="font-bold text-gray-900 block">Approved By</span>
              <span className="text-[11px] text-gray-500">Project Director / Head of Programs</span>
            </div>
          </div>

          {/* Footer Timestamp */}
          <div className="pt-4 border-t border-gray-200 flex justify-between text-[10px] text-gray-500">
            <span>Printed on: {new Date().toLocaleString()}</span>
            <span>Official CBDP HR Portal System Record</span>
          </div>

        </div>

      </div>
    </div>
  );
}
