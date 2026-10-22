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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
            In Progress
          </span>
        );
      case 'Upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></span>
            Upcoming
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400"></span>
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-300">
            {status || 'Recorded'}
          </span>
        );
    }
  };

  const getGovResponseBadge = (res) => {
    switch (res) {
      case 'Positive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Positive
          </span>
        );
      case 'Negative':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Negative
          </span>
        );
      case 'Deferred':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Deferred
          </span>
        );
      case 'No Response':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
            No Response
          </span>
        );
      default:
        return <span className="text-gray-500 italic">{res || 'N/A'}</span>;
    }
  };

  const communityCount = Number(event.participantCountCommunity) || 0;
  const govCount = Number(event.govRepresentativeCount) || 0;
  const totalDirectParticipants = communityCount + govCount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden my-8 animate-fadeIn">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white p-6 sm:p-8 relative">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-white/20 text-emerald-100 backdrop-blur-sm border border-white/20">
                  SL #{event.sl || 1}
                </span>
                
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-md text-xs font-mono font-bold bg-white text-emerald-950 shadow-sm">
                  <span>{event.eventId}</span>
                  <button
                    onClick={handleCopyId}
                    title="Copy Event ID"
                    className="text-emerald-700 hover:text-emerald-900 transition-colors"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {getStatusBadge(event.status)}

                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-950/60 text-emerald-200 border border-emerald-700/50">
                  {event.eventLevel || 'Local'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {event.eventTitle || 'Untitled Event Record'}
              </h2>

              <p className="text-emerald-100/90 text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building className="w-4 h-4 text-emerald-300" />
                  {event.implementingOrg}
                  {event.consortiumPartner ? ` (${event.consortiumPartner})` : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-300" />
                  {formatDate(event.dateFrom)}
                  {event.dateTo && event.dateTo !== event.dateFrom ? ` → ${formatDate(event.dateTo)}` : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-300" />
                  {[event.union, event.upazila, event.district, event.division].filter(Boolean).join(', ')}
                </span>
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              {onPrint && (
                <button
                  onClick={() => onPrint(event)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors border border-white/20 shadow-sm"
                  title="Print Event Record"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>
              )}

              {onEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(event);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white shadow-md transition-all"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
            <div className="bg-black/20 backdrop-blur-sm p-3 rounded-xl border border-white/10">
              <span className="text-[11px] uppercase tracking-wider text-emerald-200 block">Total Direct Participants</span>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5 flex items-baseline gap-1.5">
                {totalDirectParticipants.toLocaleString()}
                <span className="text-xs font-normal text-emerald-200">
                  ({communityCount} comm. + {govCount} gov.)
                </span>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm p-3 rounded-xl border border-white/10">
              <span className="text-[11px] uppercase tracking-wider text-emerald-200 block">Indirect Reach</span>
              <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                {event.indirectReach === 'Yes' ? (Number(event.estimatedAudienceReach) || 0).toLocaleString() : 'None'}
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm p-3 rounded-xl border border-white/10">
              <span className="text-[11px] uppercase tracking-wider text-emerald-200 block">Gov. Engagement</span>
              <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                {event.govRepresentativePresent === 'Yes' ? (
                  <span className="text-emerald-300">Yes ({event.govResponse || 'Attended'})</span>
                ) : (
                  <span className="text-gray-300">No Gov Rep</span>
                )}
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm p-3 rounded-xl border border-white/10">
              <span className="text-[11px] uppercase tracking-wider text-emerald-200 block">Conflict Prevention</span>
              <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                {event.conflictPrevention === 'Yes' ? (
                  <span className="text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Yes
                  </span>
                ) : (
                  <span className="text-gray-300">No</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-850 px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            1. Overview & Activity
          </button>

          <button
            onClick={() => setActiveTab('location')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'location'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            2. Bangladesh Location
          </button>

          <button
            onClick={() => setActiveTab('outcomes')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'outcomes'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            3. Gov Engagement & Peace
          </button>

          <button
            onClick={() => setActiveTab('reach')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'reach'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            4. Indirect Reach & Media
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            5. Audit & System Trail
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-6">

          {/* TAB 1: OVERVIEW & ACTIVITY */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Organization & Identification Card */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Implementing Organization & Project
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500 block">Implementing Org (SP/Grantee)</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {event.implementingOrg || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block">Consortium Partner</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {event.consortiumPartner || 'Direct'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block">Project Title</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {event.projectName || 'Community Based Development Project (CBDP)'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block">Operational Level</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {event.eventLevel || 'Local (Union and Upazila)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates & Schedule */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Date & Schedule
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500 block">Date From (Start Date)</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {formatDate(event.dateFrom)}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block">Date To (End Date)</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {formatDate(event.dateTo)}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-gray-500 block">Current Status</span>
                      <div className="mt-1">{getStatusBadge(event.status)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Classification & Full Description */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700/80 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Event Classification & Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 block">Event Type (Activity ID)</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {event.eventType}
                    </span>
                    {event.eventTypeOther && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Specified: {event.eventTypeOther}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-gray-500 block">Event Theme</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {event.eventTheme}
                    </span>
                    {event.eventThemeOther && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Specified: {event.eventThemeOther}
                      </p>
                    )}
                  </div>

                  <div className="col-span-1 sm:col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500 block mb-1 font-medium">Event Title / Full Description</span>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                      {event.eventTitle}
                    </p>
                  </div>

                  {event.remarks && (
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-gray-500 block mb-1">Administrative Remarks / Field Notes</span>
                      <p className="text-xs text-gray-700 dark:text-gray-300 italic">
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
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-blue-950/30 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Hierarchical Administrative Location (4 Levels)
                </h3>

                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 text-emerald-900 dark:text-emerald-200 shadow-sm border border-emerald-300 dark:border-emerald-700">
                    Division: <span className="font-bold">{event.division || 'N/A'}</span>
                  </span>
                  <span className="text-emerald-400 font-bold">→</span>
                  <span className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 text-emerald-900 dark:text-emerald-200 shadow-sm border border-emerald-300 dark:border-emerald-700">
                    District: <span className="font-bold">{event.district || 'N/A'}</span>
                  </span>
                  <span className="text-emerald-400 font-bold">→</span>
                  <span className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 text-emerald-900 dark:text-emerald-200 shadow-sm border border-emerald-300 dark:border-emerald-700">
                    Upazila / Thana: <span className="font-bold">{event.upazila || 'N/A'}</span>
                  </span>
                  <span className="text-emerald-400 font-bold">→</span>
                  <span className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 text-emerald-900 dark:text-emerald-200 shadow-sm border border-emerald-300 dark:border-emerald-700">
                    Union: <span className="font-bold">{event.union || 'N/A'}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 block">1. Division</span>
                  <span className="text-base font-bold text-gray-900 dark:text-white mt-1 block">
                    {event.division}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1 block">1 of 8 Administrative Divisions</span>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 block">2. District (Zila)</span>
                  <span className="text-base font-bold text-gray-900 dark:text-white mt-1 block">
                    {event.district}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1 block">1 of 64 Districts</span>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 block">3. Upazila / Thana</span>
                  <span className="text-base font-bold text-gray-900 dark:text-white mt-1 block">
                    {event.upazila || '—'}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1 block">Sub-district level</span>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 block">4. Union Parishad</span>
                  <span className="text-base font-bold text-gray-900 dark:text-white mt-1 block">
                    {event.union || '—'}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1 block">Local community tier</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GOV ENGAGEMENT & PEACE */}
          {activeTab === 'outcomes' && (
            <div className="space-y-6">
              {/* Direct Participants Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                    Community / CBO / CSO
                  </span>
                  <span className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-1 block">
                    {communityCount.toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 block">Grassroots participants</span>
                </div>

                <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 block">
                    Government Representatives
                  </span>
                  <span className="text-3xl font-extrabold text-blue-900 dark:text-blue-100 mt-1 block">
                    {govCount.toLocaleString()}
                  </span>
                  <span className="text-xs text-blue-700 dark:text-blue-400 mt-1 block">Official representatives</span>
                </div>

                <div className="p-5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                  <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 block">
                    Total Direct Attendees
                  </span>
                  <span className="text-3xl font-extrabold text-purple-900 dark:text-purple-100 mt-1 block">
                    {totalDirectParticipants.toLocaleString()}
                  </span>
                  <span className="text-xs text-purple-700 dark:text-purple-400 mt-1 block">All registered attendees</span>
                </div>
              </div>

              {/* Government Response Card */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700/80 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600" />
                    Government Response & Engagement
                  </span>
                  {getGovResponseBadge(event.govResponse)}
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-gray-500 block mb-1 font-medium">Government Official Response (Narrative):</span>
                    <p className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 p-3.5 rounded-lg border border-gray-200 dark:border-gray-800">
                      {event.govResponseDetails || 'No specific response narrative recorded.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500 block mb-1 font-medium">Summarise Actions Agreed During Event:</span>
                    <p className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 p-3.5 rounded-lg border border-gray-200 dark:border-gray-800">
                      {event.actionsAgreed || 'No formal agreed actions logged for this activity.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Conflict Prevention */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700/80 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Conflict Prevention Contribution
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    event.conflictPrevention === 'Yes'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {event.conflictPrevention || 'No'}
                  </span>
                </h3>

                {event.conflictPrevention === 'Yes' && (
                  <div>
                    <span className="text-gray-500 text-xs block mb-1 font-medium">How this activity prevents conflict:</span>
                    <p className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 p-3.5 rounded-lg border border-gray-200 dark:border-gray-800">
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
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-600" />
                    Indirect Reach Metrics
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500 block">Generates Indirect Reach?</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {event.indirectReach || 'No'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block">Estimated Audience Count</span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-lg">
                        {(Number(event.estimatedAudienceReach) || 0).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block">Channel / Medium</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {event.indirectReachChannel || 'N/A'}
                        {event.indirectReachChannelOther ? ` (${event.indirectReachChannelOther})` : ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block">Estimation Source</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {event.reachEstimationSource || 'N/A'}
                        {event.reachEstimationSourceOther ? ` (${event.reachEstimationSourceOther})` : ''}
                      </span>
                    </div>
                  </div>

                  {event.mediaLink && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-500 text-xs block mb-1">Public Media / Dissemination Link</span>
                      <a
                        href={event.mediaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 break-all underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                        {event.mediaLink}
                      </a>
                    </div>
                  )}
                </div>

                {/* Content Description & Rationale */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Narrative & Estimation Rationale
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-gray-500 block mb-1 font-medium">Description of Message / Content:</span>
                      <p className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                        {event.indirectReachDescription || 'No message description logged.'}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500 block mb-1 font-medium">Rationale of Reach Count:</span>
                      <p className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                        {event.reachRationale || 'Standard MEAL projection methodology.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT & SYSTEM TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-gray-500 block">Record Created At</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {event.createdAt ? new Date(event.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Last Updated At</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {event.updatedAt ? new Date(event.updatedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Historical Audit Log ({event.auditTrail?.length || 0} entries)
                </h3>

                {event.auditTrail && event.auditTrail.length > 0 ? (
                  <div className="space-y-3">
                    {event.auditTrail.slice().reverse().map((entry, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/80 flex items-start justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-800 dark:text-emerald-300">
                              {entry.action}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 dark:text-gray-300 font-medium">
                              {entry.performedBy || entry.userEmail || 'System'}
                            </span>
                          </div>
                          {entry.details && (
                            <p className="text-gray-600 dark:text-gray-400">{entry.details}</p>
                          )}
                        </div>
                        <span className="text-gray-400 text-[11px] whitespace-nowrap ml-4">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs bg-gray-50 dark:bg-gray-800/20 rounded-xl">
                    No historical audit logs recorded for this event.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Source: CBDP Official Event Tracker System
          </div>

          <div className="flex items-center gap-3">
            {onPrint && (
              <button
                onClick={() => onPrint(event)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Record
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
