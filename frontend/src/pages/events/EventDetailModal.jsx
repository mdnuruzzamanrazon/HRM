import React, { useState } from 'react';
import {
  X,
  Calendar,
  Building,
  MapPin,
  Users,
  ShieldCheck,
  Radio,
  ExternalLink,
  Edit,
  Printer,
  Copy,
  Check,
  Clock,
  FileText,
  AlertCircle,
  Tag,
  Share2,
  TrendingUp,
  Award,
  Layers,
  CalendarDays,
} from 'lucide-react';

export default function EventDetailModal({
  event,
  isOpen,
  onClose,
  onEdit,
  onPrint,
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'location' | 'outcomes' | 'reach' | 'audit'

  if (!isOpen || !event) return null;

  const handleCopyId = () => {
    if (event.eventId) {
      navigator.clipboard.writeText(event.eventId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            In Progress
          </span>
        );
      case 'Upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Upcoming
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status || 'Recorded'}
          </span>
        );
    }
  };

  const getGovResponseBadge = (res) => {
    switch (res) {
      case 'Positive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Positive
          </span>
        );
      case 'Negative':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Negative
          </span>
        );
      case 'Deferred':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Deferred
          </span>
        );
      case 'No Response':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            No Response
          </span>
        );
      default:
        return <span className="text-slate-400 italic font-medium">{res || 'N/A'}</span>;
    }
  };

  const communityCount = Number(event.participantCountCommunity) || 0;
  const govCount = Number(event.govRepresentativeCount) || 0;
  const totalDirectParticipants = communityCount + govCount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
        
        {/* Top Header Section */}
        <div className="bg-slate-50 border-b border-slate-200/80 p-6 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 font-mono">
                  SL #{event.sl || 1}
                </span>
                
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg text-xs font-mono font-bold bg-white text-indigo-800 border border-slate-300 shadow-2xs">
                  <span>{event.eventId}</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    title="Copy Event ID"
                    className="text-slate-400 hover:text-indigo-700 transition-colors"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {getStatusBadge(event.status)}

                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {event.eventLevel || 'Local'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading leading-snug">
                {event.eventTitle || 'Untitled Event Record'}
              </h2>

              <div className="text-slate-500 text-xs flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
                <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  {event.implementingOrg}
                  {event.consortiumPartner ? ` (${event.consortiumPartner})` : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(event.dateFrom)}
                  {event.dateTo && event.dateTo !== event.dateFrom ? ` → ${formatDate(event.dateTo)}` : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {[event.union, event.upazila, event.district, event.division].filter(Boolean).join(', ')}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
              {onPrint && (
                <button
                  type="button"
                  onClick={() => onPrint(event)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                  title="Print Event Record"
                >
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Print Top Sheet</span>
                </button>
              )}

              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(event);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-200/80">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Direct Participants</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-0.5 flex items-baseline gap-1.5">
                {totalDirectParticipants.toLocaleString()}
                <span className="text-[11px] font-semibold text-slate-400">
                  ({communityCount} comm. + {govCount} gov.)
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Est. Indirect Reach</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-0.5">
                {event.indirectReach === 'Yes' ? (Number(event.estimatedAudienceReach) || 0).toLocaleString() : 'None'}
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Gov. Engagement</span>
              <div className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                {event.govRepresentativePresent === 'Yes' ? (
                  <span className="text-indigo-700 font-semibold">Yes ({event.govResponse || 'Attended'})</span>
                ) : (
                  <span className="text-slate-400 font-medium">No Gov Rep</span>
                )}
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Conflict Prevention</span>
              <div className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                {event.conflictPrevention === 'Yes' ? (
                  <span className="text-indigo-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" /> Yes
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">No</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-white px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            1. Overview &amp; Activity
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'location'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            2. Bangladesh Location
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('outcomes')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'outcomes'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            3. Gov Engagement &amp; Peace
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reach')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'reach'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            4. Indirect Reach &amp; Media
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            5. Audit Trail
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-6 bg-slate-50/50">

          {/* TAB 1: OVERVIEW & ACTIVITY */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Organization & Identification Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    Implementing Organization &amp; Project
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Implementing Org (SP/Grantee)</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {event.implementingOrg || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Consortium Partner</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {event.consortiumPartner || 'Direct'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Project Title</span>
                      <span className="font-semibold text-slate-800">
                        {event.projectName || 'Community Based Development Project (CBDP)'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Operational Level</span>
                      <span className="font-semibold text-slate-800">
                        {event.eventLevel || 'Local (Union and Upazila)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates & Schedule */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Date &amp; Schedule
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Date From (Start Date)</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatDate(event.dateFrom)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Date To (End Date)</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatDate(event.dateTo)}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-slate-400 font-medium block">Current Status</span>
                      <div className="mt-1">{getStatusBadge(event.status)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Classification & Full Description */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  Event Classification &amp; Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Event Type</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {event.eventType}
                    </span>
                    {event.eventTypeOther && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        Specified: {event.eventTypeOther}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Event Theme</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {event.eventTheme}
                    </span>
                    {event.eventThemeOther && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        Specified: {event.eventThemeOther}
                      </p>
                    )}
                  </div>

                  <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-500 block mb-1 font-bold">Event Title / Full Description</span>
                    <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                      {event.eventTitle}
                    </p>
                  </div>

                  {event.remarks && (
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-slate-500 block mb-1 font-bold">Administrative Remarks / Field Notes</span>
                      <p className="text-xs text-slate-700 italic">
                        {event.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BANGLADESH ADMINISTRATIVE LOCATION */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              {/* Location Hierarchy Visual Breadcrumb */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  Hierarchical Administrative Location (4 Levels)
                </h3>

                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 shadow-2xs">
                    Division: <span className="font-bold text-indigo-700">{event.division || 'N/A'}</span>
                  </span>
                  <span className="text-slate-400 font-bold">→</span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 shadow-2xs">
                    District: <span className="font-bold text-indigo-700">{event.district || 'N/A'}</span>
                  </span>
                  <span className="text-slate-400 font-bold">→</span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 shadow-2xs">
                    Upazila: <span className="font-bold text-indigo-700">{event.upazila || 'N/A'}</span>
                  </span>
                  <span className="text-slate-400 font-bold">→</span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 shadow-2xs">
                    Union: <span className="font-bold text-indigo-700">{event.union || 'N/A'}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-medium block">1. Division</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">
                    {event.division}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">1 of 8 Administrative Divisions</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-medium block">2. District (Zila)</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">
                    {event.district}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">1 of 64 Districts</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-medium block">3. Upazila / Thana</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">
                    {event.upazila || '—'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Sub-district level</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-medium block">4. Union Parishad</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">
                    {event.union || '—'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Local community tier</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GOV ENGAGEMENT & PEACE */}
          {activeTab === 'outcomes' && (
            <div className="space-y-6">
              {/* Direct Participants Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Community / CBO / CSO
                  </span>
                  <span className="text-3xl font-extrabold font-mono text-indigo-700 mt-1 block">
                    {communityCount.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block font-medium">Grassroots participants</span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Government Representatives
                  </span>
                  <span className="text-3xl font-extrabold font-mono text-blue-800 mt-1 block">
                    {govCount.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block font-medium">Official representatives</span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Total Direct Attendees
                  </span>
                  <span className="text-3xl font-extrabold font-mono text-slate-900 mt-1 block">
                    {totalDirectParticipants.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block font-medium">All registered attendees</span>
                </div>
              </div>

              {/* Government Response Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    Government Response &amp; Engagement
                  </span>
                  {getGovResponseBadge(event.govResponse)}
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1 font-bold">Government Official Response (Narrative):</span>
                    <p className="text-sm text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      {event.govResponseDetails || 'No specific response narrative recorded.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-1 font-bold">Summarise Actions Agreed During Event:</span>
                    <p className="text-sm text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      {event.actionsAgreed || 'No formal agreed actions logged for this activity.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Conflict Prevention */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Conflict Prevention Contribution
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    event.conflictPrevention === 'Yes'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {event.conflictPrevention || 'No'}
                  </span>
                </h3>

                {event.conflictPrevention === 'Yes' && (
                  <div>
                    <span className="text-slate-500 text-xs block mb-1 font-bold">How this activity prevents conflict:</span>
                    <p className="text-sm text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      {event.conflictPreventionDetails || 'Contribution confirmed.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INDIRECT REACH & MEDIA */}
          {activeTab === 'reach' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Reach Overview Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-indigo-600" />
                    Indirect Reach Metrics
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Generates Indirect Reach?</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {event.indirectReach || 'No'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Estimated Audience Count</span>
                      <span className="font-extrabold font-mono text-indigo-700 text-lg">
                        {(Number(event.estimatedAudienceReach) || 0).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Channel / Medium</span>
                      <span className="font-semibold text-slate-800">
                        {event.indirectReachChannel || 'N/A'}
                        {event.indirectReachChannelOther ? ` (${event.indirectReachChannelOther})` : ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Estimation Source</span>
                      <span className="font-semibold text-slate-800">
                        {event.reachEstimationSource || 'N/A'}
                        {event.reachEstimationSourceOther ? ` (${event.reachEstimationSourceOther})` : ''}
                      </span>
                    </div>
                  </div>

                  {event.mediaLink && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-slate-400 text-xs block mb-1 font-medium">Public Media / Dissemination Link</span>
                      <a
                        href={event.mediaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 break-all underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        {event.mediaLink}
                      </a>
                    </div>
                  )}
                </div>

                {/* Content Description & Rationale */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Narrative &amp; Estimation Rationale
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1 font-bold">Description of Message / Content:</span>
                      <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {event.indirectReachDescription || 'No message description logged.'}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-1 font-bold">Rationale of Reach Count:</span>
                      <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {event.reachRationale || 'Standard MEAL projection methodology.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                  <span className="text-slate-400 font-medium block">Record Created At</span>
                  <span className="font-bold text-slate-900">
                    {event.createdAt ? new Date(event.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Last Updated At</span>
                  <span className="font-bold text-slate-900">
                    {event.updatedAt ? new Date(event.updatedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Historical Audit Log ({event.auditTrail?.length || 0} entries)
                </h3>

                {event.auditTrail && event.auditTrail.length > 0 ? (
                  <div className="space-y-3">
                    {event.auditTrail.slice().reverse().map((entry, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-700">
                              {entry.action}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-700 font-semibold">
                              {entry.performedBy || entry.userEmail || 'System'}
                            </span>
                          </div>
                          {entry.details && (
                            <p className="text-slate-600">{entry.details}</p>
                          )}
                        </div>
                        <span className="text-slate-400 text-[11px] whitespace-nowrap ml-4 font-medium">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                    No historical audit logs recorded for this event.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-400 font-medium">
            Source: CBDP Official Event Tracker System
          </div>

          <div className="flex items-center gap-3">
            {onPrint && (
              <button
                type="button"
                onClick={() => onPrint(event)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                Print Record
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
