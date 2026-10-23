import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Plus, Save, Calendar, Building2, Users, MapPin, 
  Sparkles, CheckCircle2, AlertCircle, Info, ShieldCheck, 
  Radio, Globe, Share2, HelpCircle, FileText, ChevronDown 
} from 'lucide-react';
import LocationSelector from '../../components/common/LocationSelector';
import eventMetadata from '../../data/eventMetadata.json';

export default function EventFormModal({
  isOpen,
  onClose,
  onSave,
  eventRecord,
  isSubmitting = false,
}) {
  const isEditing = Boolean(eventRecord && eventRecord._id);

  // Form State
  const [formData, setFormData] = useState({
    eventId: '',
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: '',
    implementingOrg: 'Manushr_Jonno_Foundation_MJF',
    consortiumPartner: '',
    participantCountCommunity: 0,
    eventType: 'Orientation',
    eventTypeOther: '',
    eventTheme: 'Governance',
    eventThemeOther: '',
    eventTitle: '',
    division: 'Barishal',
    district: 'Barguna',
    upazila: 'Amtali',
    union: '',
    eventLevel: 'Local (Union and Upzila)',
    govRepresentativePresent: 'No',
    govRepresentativeCount: 0,
    govResponse: '',
    govResponseDetails: '',
    actionsAgreed: '',
    conflictPrevention: 'No',
    conflictPreventionDetails: '',
    indirectReach: 'No',
    indirectReachChannel: '',
    indirectReachChannelOther: '',
    indirectReachDescription: '',
    estimatedAudienceReach: 0,
    reachEstimationSource: '',
    reachEstimationSourceOther: '',
    reachRationale: '',
    mediaLink: '',
    status: 'Completed',
    remarks: '',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [activeSection, setActiveSection] = useState('all');

  // Available Consortium Partners based on selected Implementing Org
  const availablePartners = useMemo(() => {
    if (!formData.implementingOrg) return [];
    return eventMetadata.spPartnersMap[formData.implementingOrg] || [];
  }, [formData.implementingOrg]);

  // Reset or Populate form when opened
  useEffect(() => {
    if (isOpen) {
      if (eventRecord) {
        setFormData({
          eventId: eventRecord.eventId || '',
          dateFrom: eventRecord.dateFrom ? eventRecord.dateFrom.split('T')[0] : '',
          dateTo: eventRecord.dateTo ? eventRecord.dateTo.split('T')[0] : '',
          implementingOrg: eventRecord.implementingOrg || 'Manushr_Jonno_Foundation_MJF',
          consortiumPartner: eventRecord.consortiumPartner || '',
          participantCountCommunity: eventRecord.participantCountCommunity || 0,
          eventType: eventRecord.eventType || 'Orientation',
          eventTypeOther: eventRecord.eventTypeOther || '',
          eventTheme: eventRecord.eventTheme || 'Governance',
          eventThemeOther: eventRecord.eventThemeOther || '',
          eventTitle: eventRecord.eventTitle || '',
          division: eventRecord.division || 'Barishal',
          district: eventRecord.district || 'Barguna',
          upazila: eventRecord.upazila || '',
          union: eventRecord.union || '',
          eventLevel: eventRecord.eventLevel || 'Local (Union and Upzila)',
          govRepresentativePresent: eventRecord.govRepresentativePresent || 'No',
          govRepresentativeCount: eventRecord.govRepresentativeCount || 0,
          govResponse: eventRecord.govResponse || '',
          govResponseDetails: eventRecord.govResponseDetails || '',
          actionsAgreed: eventRecord.actionsAgreed || '',
          conflictPrevention: eventRecord.conflictPrevention || 'No',
          conflictPreventionDetails: eventRecord.conflictPreventionDetails || '',
          indirectReach: eventRecord.indirectReach || 'No',
          indirectReachChannel: eventRecord.indirectReachChannel || '',
          indirectReachChannelOther: eventRecord.indirectReachChannelOther || '',
          indirectReachDescription: eventRecord.indirectReachDescription || '',
          estimatedAudienceReach: eventRecord.estimatedAudienceReach || 0,
          reachEstimationSource: eventRecord.reachEstimationSource || '',
          reachEstimationSourceOther: eventRecord.reachEstimationSourceOther || '',
          reachRationale: eventRecord.reachRationale || '',
          mediaLink: eventRecord.mediaLink || '',
          status: eventRecord.status || 'Completed',
          remarks: eventRecord.remarks || '',
        });
      } else {
        // Defaults for new event
        setFormData({
          eventId: '',
          dateFrom: new Date().toISOString().split('T')[0],
          dateTo: '',
          implementingOrg: 'Manushr_Jonno_Foundation_MJF',
          consortiumPartner: '',
          participantCountCommunity: 0,
          eventType: 'Orientation',
          eventTypeOther: '',
          eventTheme: 'Governance',
          eventThemeOther: '',
          eventTitle: '',
          division: 'Barishal',
          district: 'Barguna',
          upazila: 'Amtali',
          union: '',
          eventLevel: 'Local (Union and Upzila)',
          govRepresentativePresent: 'No',
          govRepresentativeCount: 0,
          govResponse: '',
          govResponseDetails: '',
          actionsAgreed: '',
          conflictPrevention: 'No',
          conflictPreventionDetails: '',
          indirectReach: 'No',
          indirectReachChannel: '',
          indirectReachChannelOther: '',
          indirectReachDescription: '',
          estimatedAudienceReach: 0,
          reachEstimationSource: '',
          reachEstimationSourceOther: '',
          reachRationale: '',
          mediaLink: '',
          status: 'Completed',
          remarks: '',
        });
      }
      setValidationErrors({});
    }
  }, [isOpen, eventRecord]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleLocationChange = ({ division, district, upazila, union }) => {
    setFormData(prev => ({
      ...prev,
      division,
      district,
      upazila,
      union,
    }));
    if (validationErrors.division || validationErrors.district) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next.division;
        delete next.district;
        return next;
      });
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.eventTitle.trim()) {
      errors.eventTitle = 'Event Title / Description is required';
    }
    if (!formData.dateFrom) {
      errors.dateFrom = 'Start date (Date from) is required';
    }
    if (!formData.implementingOrg) {
      errors.implementingOrg = 'Implementing Organization is required';
    }
    if (!formData.eventType) {
      errors.eventType = 'Event Type is required';
    }
    if (formData.eventType === 'Other' && !formData.eventTypeOther.trim()) {
      errors.eventTypeOther = 'Please specify the other event type (3-4 words)';
    }
    if (!formData.eventTheme) {
      errors.eventTheme = 'Event Theme is required';
    }
    if (formData.eventTheme === 'Others (Specify)' && !formData.eventThemeOther.trim()) {
      errors.eventThemeOther = 'Please specify the other theme (3-5 words)';
    }
    if (!formData.division) {
      errors.division = 'Division is required';
    }
    if (!formData.district) {
      errors.district = 'District is required';
    }
    if (formData.govRepresentativePresent === 'Yes' && !formData.govResponse) {
      errors.govResponse = 'Please select government response';
    }
    if (formData.conflictPrevention === 'Yes' && !formData.conflictPreventionDetails.trim()) {
      errors.conflictPreventionDetails = 'Please explain how this event addresses conflict prevention';
    }
    if (formData.indirectReach === 'Yes' && !formData.indirectReachChannel) {
      errors.indirectReachChannel = 'Please select the medium/channel of indirect reach';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full my-auto flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-heading">
                  {isEditing ? `Edit Event Record (${formData.eventId || 'Draft'})` : 'Register New Project Event'}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  CBDP Event Tool
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official CBDP Event Tracker data entry conforming to CEF performance indicators.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          
          {/* SECTION 1: EVENT IDENTIFICATION & TITLE */}
          <div className="bg-slate-50/70 rounded-2xl p-4.5 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>1. Event Identification &amp; Basic Information</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Fields 1, 2, 8, 10, 12, 17</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Event ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Event / Activity ID <span className="text-slate-400 font-normal">(YYYYMMXXEVNN)</span>
                </label>
                <input
                  type="text"
                  value={formData.eventId}
                  onChange={(e) => handleChange('eventId', e.target.value.toUpperCase())}
                  placeholder="Auto-generated if left blank"
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 uppercase placeholder-slate-400"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Example: <strong>202511CBOR01</strong> (Year + Month + Org + Type + No)
                </span>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Event Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.eventType}
                    onChange={(e) => handleChange('eventType', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
                  >
                    {eventMetadata.eventTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {validationErrors.eventType && (
                  <span className="text-rose-600 text-[11px] mt-0.5 block">{validationErrors.eventType}</span>
                )}
              </div>

              {/* Event Theme */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Event Theme <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.eventTheme}
                    onChange={(e) => handleChange('eventTheme', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
                  >
                    {eventMetadata.eventThemes.map(th => (
                      <option key={th} value={th}>{th}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {validationErrors.eventTheme && (
                  <span className="text-rose-600 text-[11px] mt-0.5 block">{validationErrors.eventTheme}</span>
                )}
              </div>

              {/* If Other Type */}
              {formData.eventType === 'Other' && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    If Other, Specify Event Type (3-4 words) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.eventTypeOther}
                    onChange={(e) => handleChange('eventTypeOther', e.target.value)}
                    placeholder="e.g. Public Hearing, Social Audit, Folk Song"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  {validationErrors.eventTypeOther && (
                    <span className="text-rose-600 text-[11px] mt-0.5 block">{validationErrors.eventTypeOther}</span>
                  )}
                </div>
              )}

              {/* If Other Theme */}
              {formData.eventTheme === 'Others (Specify)' && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    If Other, Specify Theme (3-5 words) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.eventThemeOther}
                    onChange={(e) => handleChange('eventThemeOther', e.target.value)}
                    placeholder="Specify other thematic focus"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Event Level */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Level of the Event
                </label>
                <div className="relative">
                  <select
                    value={formData.eventLevel}
                    onChange={(e) => handleChange('eventLevel', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
                  >
                    {eventMetadata.eventLevels.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Event Status
                </label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Event Title / Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Event Title / Description <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[10px] font-mono ${
                  formData.eventTitle.length > 250 ? 'text-rose-600 font-bold' : 'text-slate-400'
                }`}>
                  {formData.eventTitle.length}/250 characters
                </span>
              </div>
              <textarea
                rows={2}
                value={formData.eventTitle}
                onChange={(e) => handleChange('eventTitle', e.target.value)}
                placeholder="Brief, specific title of the event (e.g. Day Long Orientation on Leadership, Advocacy and Networking)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 leading-relaxed"
              />
              {validationErrors.eventTitle && (
                <span className="text-rose-600 text-[11px] mt-0.5 block">{validationErrors.eventTitle}</span>
              )}
            </div>
          </div>

          {/* SECTION 2: ORGANIZATIONS & PARTNERS */}
          <div className="bg-slate-50/70 rounded-2xl p-4.5 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>2. Implementing Organization &amp; Consortium Partner</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Fields 5, 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Implementing Org (SP/Grantee) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Implementing Organization (SP / Grantee) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.implementingOrg}
                    onChange={(e) => {
                      handleChange('implementingOrg', e.target.value);
                      handleChange('consortiumPartner', '');
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8 truncate"
                  >
                    {eventMetadata.implementingOrgs.map(org => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {validationErrors.implementingOrg && (
                  <span className="text-rose-600 text-[11px] mt-0.5 block">{validationErrors.implementingOrg}</span>
                )}
              </div>

              {/* Consortium Partner */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  If Implementing Organization is Consortium Partner
                </label>
                <div className="relative">
                  <select
                    value={formData.consortiumPartner}
                    onChange={(e) => handleChange('consortiumPartner', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8 truncate"
                  >
                    <option value="">None (Implemented directly by SP / Grantee)</option>
                    {availablePartners.map(cp => (
                      <option key={cp} value={cp}>{cp}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Select if event is organized by a consortium partner under the lead SP.
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: DATES & SCHEDULE */}
          <div className="bg-slate-50/70 rounded-2xl p-4.5 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>3. Event Date &amp; Schedule</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Fields 3, 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Date From (Start Date) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dateFrom}
                  onChange={(e) => handleChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                />
                {validationErrors.dateFrom && (
                  <span className="text-rose-600 text-[11px] mt-0.5 block">{validationErrors.dateFrom}</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Date To (End Date - Optional for 1-day events)
                </label>
                <input
                  type="date"
                  value={formData.dateTo}
                  onChange={(e) => handleChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Leave blank for single-day events. Fill for multi-day workshops or ongoing campaigns.
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: BANGLADESH ADMINISTRATIVE LOCATION SYSTEM (MANDATORY REQUIREMENT) */}
          <div className="bg-indigo-50/30 rounded-2xl p-4.5 border border-indigo-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>4. Bangladesh Administrative Location Selection System</span>
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                All 64 Districts • 547 Upazilas • 5,161 Unions
              </span>
            </div>

            <LocationSelector
              division={formData.division}
              district={formData.district}
              upazila={formData.upazila}
              union={formData.union}
              onChange={handleLocationChange}
              required
            />
            {validationErrors.district && (
              <span className="text-rose-600 text-[11px] block">{validationErrors.district}</span>
            )}
          </div>

          {/* SECTION 5: PARTICIPANTS, COMMUNITY VOICE & GOVERNMENT RESPONSE */}
          <div className="bg-slate-50/70 rounded-2xl p-4.5 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>5. Participants, Community Voice &amp; Government Engagement</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Fields 7, 18, 19, 20, 21, 22</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Community Participants */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Community / CBO / CSO Participants
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.participantCountCommunity}
                  onChange={(e) => handleChange('participantCountCommunity', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Count from attendance sheet (exclude paid staff).
                </span>
              </div>

              {/* Gov Rep Present */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Gov. Representative Present?
                </label>
                <div className="relative">
                  <select
                    value={formData.govRepresentativePresent}
                    onChange={(e) => handleChange('govRepresentativePresent', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* If Gov Present: Gov Rep Count */}
              {formData.govRepresentativePresent === 'Yes' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Number of Gov. Rep Participants
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.govRepresentativeCount}
                    onChange={(e) => handleChange('govRepresentativeCount', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Gov Response Details */}
            {formData.govRepresentativePresent === 'Yes' && (
              <div className="space-y-3 pt-2 border-t border-slate-200/70">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Government Response
                    </label>
                    <div className="relative">
                      <select
                        value={formData.govResponse}
                        onChange={(e) => handleChange('govResponse', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
                      >
                        <option value="">Select Response</option>
                        {eventMetadata.govResponses.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        What was the response? (Max 250 characters)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formData.govResponseDetails.length}/250
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={formData.govResponseDetails}
                      onChange={(e) => handleChange('govResponseDetails', e.target.value)}
                      placeholder="e.g. UNO committed to assist in resolving local service delivery barriers and pledged inclusion in subsequent meetings."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Summarise actions agreed during the event (Max 250 characters)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formData.actionsAgreed.length}/250
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.actionsAgreed}
                    onChange={(e) => handleChange('actionsAgreed', e.target.value)}
                    placeholder="e.g. Parties agreed to conduct joint monitoring visits next month and streamline widow allowance verification."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: CONFLICT PREVENTION & PEACEBUILDING */}
          <div className="bg-slate-50/70 rounded-2xl p-4.5 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>6. Conflict Prevention &amp; Peacebuilding Contribution</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Fields 23, 24</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Does event contribute to prevent conflicts?
                </label>
                <div className="relative">
                  <select
                    value={formData.conflictPrevention}
                    onChange={(e) => handleChange('conflictPrevention', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {formData.conflictPrevention === 'Yes' && (
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      If yes, How? (Max 250 characters)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formData.conflictPreventionDetails.length}/250
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.conflictPreventionDetails}
                    onChange={(e) => handleChange('conflictPreventionDetails', e.target.value)}
                    placeholder="e.g. Session brought community leaders together to resolve gender-based dispute mechanisms peacefully."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  {validationErrors.conflictPreventionDetails && (
                    <span className="text-rose-600 text-[11px] mt-0.5 block">{validationErrors.conflictPreventionDetails}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 7: INDIRECT REACH & MEDIA DISSEMINATION */}
          <div className="bg-slate-50/70 rounded-2xl p-4.5 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>7. Indirect Reach &amp; Media Dissemination</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Fields 25 to 33</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Does event generate indirect reach?
                </label>
                <div className="relative">
                  <select
                    value={formData.indirectReach}
                    onChange={(e) => handleChange('indirectReach', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {formData.indirectReach === 'Yes' && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Through which channel or medium?
                    </label>
                    <div className="relative">
                      <select
                        value={formData.indirectReachChannel}
                        onChange={(e) => handleChange('indirectReachChannel', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8 truncate"
                      >
                        <option value="">Select Channel</option>
                        {eventMetadata.indirectReachChannels.map(ch => (
                          <option key={ch} value={ch}>{ch}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {formData.indirectReachChannel.includes('Other') && (
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Other Channel / Medium (3-4 words)
                      </label>
                      <input
                        type="text"
                        value={formData.indirectReachChannelOther}
                        onChange={(e) => handleChange('indirectReachChannelOther', e.target.value)}
                        placeholder="Specify channel"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {/* Reach Numbers & Source */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Est. Audience Reach
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.estimatedAudienceReach}
                      onChange={(e) => handleChange('estimatedAudienceReach', Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Source of Estimation
                    </label>
                    <div className="relative">
                      <select
                        value={formData.reachEstimationSource}
                        onChange={(e) => handleChange('reachEstimationSource', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8 truncate"
                      >
                        <option value="">Select Source</option>
                        {eventMetadata.estimationSources.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Online / Media Link
                    </label>
                    <input
                      type="url"
                      value={formData.mediaLink}
                      onChange={(e) => handleChange('mediaLink', e.target.value)}
                      placeholder="https://news-link-or-facebook.com/..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Rationale of Reach Count (Max 250 characters)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.reachRationale}
                      onChange={(e) => handleChange('reachRationale', e.target.value)}
                      placeholder="e.g. 5,000 newspaper daily circulation verified through Ministry of Information records."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Validation Banner if errors */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Please review the highlighted fields before saving.</span>
            </div>
          )}

          {/* MODAL FOOTER */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 stroke-[2.2]" />
              <span>{isSubmitting ? 'Saving Event...' : (isEditing ? 'Save Changes' : 'Register Event')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
