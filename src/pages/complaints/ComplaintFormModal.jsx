import React, { useState, useEffect } from 'react';
import {
  X, AlertTriangle, CheckCircle2, Calendar, Phone,
  User, Shield, FileText, Building2, Clock, Loader2,
  HelpCircle, AlertCircle, Save, Info, Lock, Eye, EyeOff
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useProject } from '../../context/ProjectContext';

const RECEIVING_CHANNELS = [
  'Phone',
  'Email',
  'In-Person',
  'Suggestion Box',
  'Website / Online Form',
  'Community Helpdesk',
  'SMS / WhatsApp',
  'Other'
];

const COMPLAINT_CATEGORIES = [
  'Staff Conduct & Safeguarding',
  'Programme Quality & Delivery',
  'Procurement & Financial Management',
  'Aid Diversion & Corruption',
  'Harassment & Discrimination',
  'Information Request & Inquiry',
  'Community Relations & Respect',
  'Service Delivery & Assistance',
  'Other'
];

const PARTNER_ORGANIZATIONS = [
  'Oxfam',
  'CBDP Foundation',
  'Rupantar',
  'Coast Foundation',
  'BRAC',
  'ActionAid',
  'Local Partner NGO',
  'Other'
];

export default function ComplaintFormModal({
  isOpen,
  onClose,
  onSave,
  complaintRecord = null,
  projectName = 'CBDP Women & Girls Empowerment Initiative',
  projectId = null,
  isSubmitting = false
}) {
  const isEditMode = Boolean(complaintRecord && complaintRecord._id);
  const { registerUnsavedForm, unregisterUnsavedForm } = useProject();
  const [lockedProjectId, setLockedProjectId] = useState(projectId);

  const [formData, setFormData] = useState({
    sNo: '',
    dateReceived: format(new Date(), 'yyyy-MM-dd'),
    receivingChannel: 'Phone',
    receivingChannelOther: '',
    isAnonymous: false,
    complainantName: '',
    complainantAddress: '',
    complainantPhone: '',
    numberCalledFrom: '',
    complaintCategory: 'Staff Conduct & Safeguarding',
    complaintCategoryOther: '',
    description: '',
    complainantGender: 'Prefer not to say',
    complainantAge: '',
    complainantDisability: 'Not recorded',
    partnerOrgName: 'Oxfam',
    assignedFocalPerson: '',
    actionsTaken: '',
    delayReason: '',
    isComplainantNotifiedOfDelay: 'Not applicable',
    delayNotificationDate: '',
    delayNotificationNotes: '',
    status: 'Open',
    dateClosed: '',
    appealDate: '',
    appealOutcome: '',
    appealStatus: 'None',
    finalClosingDateAfterAppeal: '',
    priority: 'Medium',
    confidentialityLevel: 'Confidential',
    projectName: projectName,
    projectId: projectId
  });

  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('A'); // 'A' | 'B' | 'C' | 'D' | 'E'

  // Initialize or populate form
  useEffect(() => {
    if (complaintRecord) {
      setFormData({
        sNo: complaintRecord.sNo || '',
        dateReceived: complaintRecord.dateReceived ? format(new Date(complaintRecord.dateReceived), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        receivingChannel: complaintRecord.receivingChannel || 'Phone',
        receivingChannelOther: complaintRecord.receivingChannelOther || '',
        isAnonymous: Boolean(complaintRecord.isAnonymous),
        complainantName: complaintRecord.complainantName || '',
        complainantAddress: complaintRecord.complainantAddress || '',
        complainantPhone: complaintRecord.complainantPhone || '',
        numberCalledFrom: complaintRecord.numberCalledFrom || '',
        complaintCategory: complaintRecord.complaintCategory || 'Staff Conduct & Safeguarding',
        complaintCategoryOther: complaintRecord.complaintCategoryOther || '',
        description: complaintRecord.description || '',
        complainantGender: complaintRecord.complainantGender || 'Prefer not to say',
        complainantAge: complaintRecord.complainantAge || '',
        complainantDisability: complaintRecord.complainantDisability || 'Not recorded',
        partnerOrgName: complaintRecord.partnerOrgName || 'Oxfam',
        assignedFocalPerson: complaintRecord.assignedFocalPerson || '',
        actionsTaken: complaintRecord.actionsTaken || '',
        delayReason: complaintRecord.delayReason || '',
        isComplainantNotifiedOfDelay: complaintRecord.isComplainantNotifiedOfDelay || 'Not applicable',
        delayNotificationDate: complaintRecord.delayNotificationDate ? format(new Date(complaintRecord.delayNotificationDate), 'yyyy-MM-dd') : '',
        delayNotificationNotes: complaintRecord.delayNotificationNotes || '',
        status: complaintRecord.status || 'Open',
        dateClosed: complaintRecord.dateClosed ? format(new Date(complaintRecord.dateClosed), 'yyyy-MM-dd') : '',
        appealDate: complaintRecord.appealDate ? format(new Date(complaintRecord.appealDate), 'yyyy-MM-dd') : '',
        appealOutcome: complaintRecord.appealOutcome || '',
        appealStatus: complaintRecord.appealStatus || 'None',
        finalClosingDateAfterAppeal: complaintRecord.finalClosingDateAfterAppeal ? format(new Date(complaintRecord.finalClosingDateAfterAppeal), 'yyyy-MM-dd') : '',
        priority: complaintRecord.priority || 'Medium',
        confidentialityLevel: complaintRecord.confidentialityLevel || 'Confidential',
        projectName: complaintRecord.projectName || projectName,
        projectId: complaintRecord.projectId || projectId
      });
    } else {
      // New record defaults
      setFormData({
        sNo: '',
        dateReceived: format(new Date(), 'yyyy-MM-dd'),
        receivingChannel: 'Phone',
        receivingChannelOther: '',
        isAnonymous: false,
        complainantName: '',
        complainantAddress: '',
        complainantPhone: '',
        numberCalledFrom: '',
        complaintCategory: 'Staff Conduct & Safeguarding',
        complaintCategoryOther: '',
        description: '',
        complainantGender: 'Prefer not to say',
        complainantAge: '',
        complainantDisability: 'Not recorded',
        partnerOrgName: 'Oxfam',
        assignedFocalPerson: '',
        actionsTaken: '',
        delayReason: '',
        isComplainantNotifiedOfDelay: 'Not applicable',
        delayNotificationDate: '',
        delayNotificationNotes: '',
        status: 'Open',
        dateClosed: '',
        appealDate: '',
        appealOutcome: '',
        appealStatus: 'None',
        finalClosingDateAfterAppeal: '',
        priority: 'Medium',
        confidentialityLevel: 'Confidential',
        projectName: projectName,
        projectId: projectId
      });
    }
    setErrors({});
    setActiveTab('A');
    if (isOpen) {
      setLockedProjectId(complaintRecord?.projectId || projectId);
      registerUnsavedForm('complaint-form-modal', 'Complaint & Feedback Form');
    } else {
      unregisterUnsavedForm('complaint-form-modal');
    }
    return () => unregisterUnsavedForm('complaint-form-modal');
  }, [complaintRecord, isOpen, projectName, projectId, registerUnsavedForm, unregisterUnsavedForm]);

  if (!isOpen) return null;

  // Calculate if complaint is older than 30 days
  const calculateDaysSinceReceived = () => {
    if (!formData.dateReceived) return 0;
    try {
      const rec = new Date(formData.dateReceived);
      const diff = differenceInDays(new Date(), rec);
      return Math.max(0, diff);
    } catch {
      return 0;
    }
  };

  const daysSinceReceived = calculateDaysSinceReceived();
  const isOverdue30Days = daysSinceReceived > 30 && formData.status === 'Open';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const next = { ...prev, [name]: val };

      // Handle Anonymous toggle
      if (name === 'isAnonymous' && val === true) {
        if (!next.complainantName) next.complainantName = 'Anonymous Complainant';
      }

      // Handle status change to Closed -> auto prefill dateClosed if empty
      if (name === 'status' && val === 'Closed' && !next.dateClosed) {
        next.dateClosed = format(new Date(), 'yyyy-MM-dd');
      }

      // If status changed to Open, clear dateClosed
      if (name === 'status' && val === 'Open') {
        next.dateClosed = '';
      }

      return next;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Section A
    if (!formData.dateReceived) {
      newErrors.dateReceived = 'Date received is required.';
    }
    if (!formData.receivingChannel) {
      newErrors.receivingChannel = 'Receiving channel is required.';
    }
    if (formData.receivingChannel === 'Other' && (!formData.receivingChannelOther || !formData.receivingChannelOther.trim())) {
      newErrors.receivingChannelOther = 'Please specify the receiving channel.';
    }

    // Section B
    if (!formData.isAnonymous && (!formData.complainantName || !formData.complainantName.trim())) {
      // Name recommended or required if not anonymous
      newErrors.complainantName = 'Complainant name is required unless recorded as anonymous.';
    }

    // Section C
    if (!formData.complaintCategory) {
      newErrors.complaintCategory = 'Complaint category is required.';
    }
    if (formData.complaintCategory === 'Other' && (!formData.complaintCategoryOther || !formData.complaintCategoryOther.trim())) {
      newErrors.complaintCategoryOther = 'Please specify the complaint category.';
    }
    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Description of feedback or complaint is required.';
    }

    // Section D
    if (!formData.partnerOrgName || !formData.partnerOrgName.trim()) {
      newErrors.partnerOrgName = 'Concerned Partner / Organization is required.';
    }

    // Overdue 30 days mandatory requirements
    if (isOverdue30Days) {
      if (!formData.delayReason || !formData.delayReason.trim()) {
        newErrors.delayReason = 'Complaint has been open >30 days. Delay reason is mandatory.';
      }
      if (!formData.isComplainantNotifiedOfDelay || formData.isComplainantNotifiedOfDelay === 'Not applicable') {
        newErrors.isComplainantNotifiedOfDelay = 'Please confirm if complainant was notified of delay.';
      }
    }

    // Section E: Timeline validations
    const recDate = new Date(formData.dateReceived);

    if (formData.status === 'Closed') {
      if (!formData.dateClosed) {
        newErrors.dateClosed = 'Date Complaint Closed is required when marked Closed.';
      } else {
        const closedDate = new Date(formData.dateClosed);
        if (closedDate < recDate) {
          newErrors.dateClosed = 'Date Complaint Closed cannot precede Date Received.';
        }
      }
    }

    if (formData.appealDate) {
      const appDate = new Date(formData.appealDate);
      if (appDate < recDate) {
        newErrors.appealDate = 'Appeal Date cannot precede Date Received.';
      }
    }

    if (formData.finalClosingDateAfterAppeal) {
      const finDate = new Date(formData.finalClosingDateAfterAppeal);
      if (finDate < recDate) {
        newErrors.finalClosingDateAfterAppeal = 'Final Closing Date cannot precede Date Received.';
      }
      if (formData.appealDate) {
        const appDate = new Date(formData.appealDate);
        if (finDate < appDate) {
          newErrors.finalClosingDateAfterAppeal = 'Final Closing Date cannot precede Appeal Date.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const effectiveProjectId = lockedProjectId || projectId;
    if (!effectiveProjectId || (projectId && String(effectiveProjectId) !== String(projectId))) {
      setErrors({ dateReceived: 'Active project changed while form was open. Please reopen the form under the target project.' });
      setActiveTab('A');
      return;
    }
    if (!validate()) {
      // Find which section has error and switch tab
      if (errors.dateReceived || errors.receivingChannel || errors.receivingChannelOther) setActiveTab('A');
      else if (errors.complainantName) setActiveTab('B');
      else if (errors.complaintCategory || errors.complaintCategoryOther || errors.description) setActiveTab('C');
      else if (errors.partnerOrgName || errors.delayReason || errors.isComplainantNotifiedOfDelay) setActiveTab('D');
      else if (errors.dateClosed || errors.appealDate || errors.finalClosingDateAfterAppeal) setActiveTab('E');
      return;
    }

    onSave({
      ...formData,
      projectId: effectiveProjectId,
      projectName,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {isEditMode ? `Edit Record • ${formData.sNo}` : 'New Registration'}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600 truncate max-w-xs">{formData.projectName}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {isEditMode ? 'Update Complaint & Feedback Record' : 'Record New Complaint or Feedback'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-100/70 px-4 overflow-x-auto custom-scrollbar flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('A')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'A'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">A</span>
            <span>Basic Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('B')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'B'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">B</span>
            <span>Complainant Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('C')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'C'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">C</span>
            <span>Classification &amp; Issue</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('D')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'D'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">D</span>
            <span>Response &amp; 30d Delay</span>
            {isOverdue30Days && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('E')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'E'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">E</span>
            <span>Status &amp; Appeal</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar space-y-6">

          {/* Overdue Alert Banner if >30 days open */}
          {isOverdue30Days && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold block text-sm text-amber-900 mb-0.5">
                  Overdue Complaint Notice ({daysSinceReceived} days since received)
                </span>
                This complaint has remained open for more than 30 days. Per operational guidelines, documenting the
                <strong> Reason for Delay</strong> and confirming whether the
                <strong> Complainant was Notified</strong> is mandatory under Section D.
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION A: BASIC INFORMATION */}
          {/* ========================================================================= */}
          {activeTab === 'A' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">A</span>
                  Basic Information
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Capture intake date, receiving channel, and auto-generated register serial number.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Serial Number (S.No) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. Serial Number (S.No.)
                  </label>
                  <input
                    type="text"
                    name="sNo"
                    value={formData.sNo}
                    onChange={handleChange}
                    placeholder="Auto-generated on save (e.g. CFR-2026-0001)"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Leave blank to auto-generate the next sequential identifier.
                  </span>
                </div>

                {/* 2. Date Complaint or Feedback Received */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Date Received <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dateReceived"
                      value={formData.dateReceived}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.dateReceived ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                        } focus:ring-2 focus:ring-indigo-500`}
                    />
                  </div>
                  {errors.dateReceived && (
                    <span className="text-[11px] font-semibold text-rose-600 mt-1 block">{errors.dateReceived}</span>
                  )}
                  {daysSinceReceived > 0 && (
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Received {daysSinceReceived} day{daysSinceReceived > 1 ? 's' : ''} ago
                    </span>
                  )}
                </div>

                {/* 3. Receiving Channel */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. Receiving Channel <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="receivingChannel"
                    value={formData.receivingChannel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {RECEIVING_CHANNELS.map(ch => (
                      <option key={ch} value={ch}>{ch}</option>
                    ))}
                  </select>
                </div>

                {/* Receiving Channel Other (if Other selected) */}
                {formData.receivingChannel === 'Other' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Specify Channel <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="receivingChannelOther"
                      value={formData.receivingChannelOther}
                      onChange={handleChange}
                      placeholder="e.g. Field community meeting, Townhall"
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.receivingChannelOther ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                        } focus:ring-2 focus:ring-indigo-500`}
                    />
                    {errors.receivingChannelOther && (
                      <span className="text-[11px] font-semibold text-rose-600 mt-1 block">{errors.receivingChannelOther}</span>
                    )}
                  </div>
                )}

                {/* Project Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Association
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION B: COMPLAINANT INFORMATION */}
          {/* ========================================================================= */}
          {activeTab === 'B' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">B</span>
                  Complainant Information &amp; Safeguarding Privacy
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Protect complainant confidentiality. Anonymous reporting is explicitly supported.
                </p>
              </div>

              {/* Anonymous Checkbox */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <label htmlFor="isAnonymousToggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Complainant Wishes to Remain Anonymous
                    </label>
                    <p className="text-[11px] text-slate-500">
                      When checked, personal identifiable name &amp; address details are safeguarded.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="isAnonymousToggle"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 4. Feedback / Complainant's Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    4. Complainant's Name {!formData.isAnonymous && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="complainantName"
                    value={formData.complainantName}
                    onChange={handleChange}
                    disabled={formData.isAnonymous}
                    placeholder={formData.isAnonymous ? 'Anonymous Complainant' : 'Full name of complainant'}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.complainantName ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                      } ${formData.isAnonymous ? 'bg-slate-100 text-slate-500' : 'bg-white'} focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.complainantName && (
                    <span className="text-[11px] font-semibold text-rose-600 mt-1 block">{errors.complainantName}</span>
                  )}
                </div>

                {/* 4b. Complainant's Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Complainant's Address / Location
                  </label>
                  <input
                    type="text"
                    name="complainantAddress"
                    value={formData.complainantAddress}
                    onChange={handleChange}
                    placeholder="e.g. Block C, Camp 4, Ukhiya or Village name"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 5. Complainant's Contact Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    5. Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      name="complainantPhone"
                      value={formData.complainantPhone}
                      onChange={handleChange}
                      placeholder="e.g. +880 1712-345678"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Phone numbers are protected and masked in public views.
                  </span>
                </div>

                {/* 5b. Number Called From (if different) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Number Called From (If Different)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      name="numberCalledFrom"
                      value={formData.numberCalledFrom}
                      onChange={handleChange}
                      placeholder="e.g. Caller ID if calling from shared or borrowed phone"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Capture caller ID if complainant called from a neighbor's or community leader's phone.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION C: CLASSIFICATION & DETAILS */}
          {/* ========================================================================= */}
          {activeTab === 'C' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">C</span>
                  Complaint Classification &amp; Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record description, demographic metadata, and safeguarding priority.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 6. Complaint Type / Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    6. Complaint Type / Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="complaintCategory"
                    value={formData.complaintCategory}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {COMPLAINT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Category Other */}
                {formData.complaintCategory === 'Other' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Specify Category <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="complaintCategoryOther"
                      value={formData.complaintCategoryOther}
                      onChange={handleChange}
                      placeholder="Specify custom category"
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.complaintCategoryOther ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                        } focus:ring-2 focus:ring-indigo-500`}
                    />
                    {errors.complaintCategoryOther && (
                      <span className="text-[11px] font-semibold text-rose-600 mt-1 block">{errors.complaintCategoryOther}</span>
                    )}
                  </div>
                )}

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent (Safeguarding / Life-safety)</option>
                  </select>
                </div>

                {/* 7. Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    7. Description of Feedback or Complaint / Allegation / Issue <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Provide a clear, objective, and detailed description of the feedback, complaint, allegation, or issue received..."
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.description ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                      } focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed`}
                  />
                  {errors.description && (
                    <span className="text-[11px] font-semibold text-rose-600 mt-1 block">{errors.description}</span>
                  )}
                </div>

                {/* 8. Gender of Complainant */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    8. Gender of Complainant
                  </label>
                  <select
                    name="complainantGender"
                    value={formData.complainantGender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* 9. Age of Complainant */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    9. Age of Complainant
                  </label>
                  <input
                    type="text"
                    name="complainantAge"
                    value={formData.complainantAge}
                    onChange={handleChange}
                    placeholder="e.g. 32 or 25-34"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Do not guess; leave blank if unrecorded.
                  </span>
                </div>

                {/* 10. Disability */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    10. Does Complainant Have a Disability?
                  </label>
                  <select
                    name="complainantDisability"
                    value={formData.complainantDisability}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Not recorded">Not recorded</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Confidentiality Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confidentiality Classification
                  </label>
                  <select
                    name="confidentialityLevel"
                    value={formData.confidentialityLevel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Confidential">Confidential (Protected)</option>
                    <option value="Strictly Confidential">Strictly Confidential (Safeguarding / Restricted)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION D: RESPONSE & 30-DAY DELAY */}
          {/* ========================================================================= */}
          {activeTab === 'D' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">D</span>
                  Organization, Actions &amp; 30-Day Delay Tracking
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record concerned partner organization, redressal actions taken, and mandatory delay notifications.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 11. Concerned Partner / Organization Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    11. Concerned Partner / Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="partnerOrgName"
                    value={formData.partnerOrgName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    {PARTNER_ORGANIZATIONS.map(org => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                </div>

                {/* Assigned Focal Person */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Focal Person
                  </label>
                  <input
                    type="text"
                    name="assignedFocalPerson"
                    value={formData.assignedFocalPerson}
                    onChange={handleChange}
                    placeholder="e.g. ED of Partner / Oxfam Focal Person"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 12. Actions Taken and Issue Redressal */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    12. Actions Taken in Response &amp; How the Issue Was Redressed
                  </label>
                  <textarea
                    rows={3}
                    name="actionsTaken"
                    value={formData.actionsTaken}
                    onChange={handleChange}
                    placeholder="Detail the steps taken to investigate, address, rectify, or redress the issue..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-sans"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Recording an action does not automatically close the complaint. Status remains Open until formally closed under Section E.
                  </span>
                </div>
              </div>

              {/* 13. Reason for Delay and Complainant Notification (> 30 days) */}
              <div className={`p-4 rounded-xl border ${isOverdue30Days ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20' : 'bg-slate-50 border-slate-200'
                } space-y-3.5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isOverdue30Days ? 'text-amber-600' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold text-slate-900">
                      13. 30-Day Resolution Delay &amp; Complainant Notification Tracking
                    </span>
                  </div>
                  {isOverdue30Days && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                      Mandatory Delay Fields
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Reason for Delay in Resolving {isOverdue30Days && <span className="text-rose-500">*</span>}
                    </label>
                    <textarea
                      rows={2}
                      name="delayReason"
                      value={formData.delayReason}
                      onChange={handleChange}
                      placeholder={isOverdue30Days ? 'Explain why the complaint could not be resolved within 30 days...' : 'Optional if within 30 days of intake'}
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.delayReason ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                        } bg-white focus:ring-2 focus:ring-indigo-500`}
                    />
                    {errors.delayReason && (
                      <span className="text-[11px] font-semibold text-rose-600 mt-1 block">{errors.delayReason}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Has Complainant Been Notified of Delay? {isOverdue30Days && <span className="text-rose-500">*</span>}
                    </label>
                    <select
                      name="isComplainantNotifiedOfDelay"
                      value={formData.isComplainantNotifiedOfDelay}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.isComplainantNotifiedOfDelay ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                        } bg-white focus:ring-2 focus:ring-indigo-500 font-medium`}
                    >
                      <option value="Not applicable">Not applicable (within 30 days)</option>
                      <option value="Yes">Yes (Complainant notified)</option>
                      <option value="No">No (Not yet notified)</option>
                      <option value="Pending">Pending Scheduled Consultation</option>
                    </select>
                    {errors.isComplainantNotifiedOfDelay && (
                      <span className="text-[11px] font-semibold text-rose-600 mt-1 block">{errors.isComplainantNotifiedOfDelay}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Delay Notification Date
                    </label>
                    <input
                      type="date"
                      name="delayNotificationDate"
                      value={formData.delayNotificationDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Delay Notification Notes / Channel Used
                    </label>
                    <input
                      type="text"
                      name="delayNotificationNotes"
                      value={formData.delayNotificationNotes}
                      onChange={handleChange}
                      placeholder="e.g. Notified via phone call; complainant accepted 2-week extension"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION E: STATUS, CLOSURE, AND APPEAL */}
          {/* ========================================================================= */}
          {activeTab === 'E' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">E</span>
                  Status, Closure &amp; Appeal Workflow
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Maintain exact source-defined statuses: Open or Closed. Track appeals and final post-appeal resolution.
                </p>
              </div>

              {/* Status Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    14. Current Status <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-xs transition-all ${formData.status === 'Open'
                      ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-400/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>
                      <input
                        type="radio"
                        name="status"
                        value="Open"
                        checked={formData.status === 'Open'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Open</span>
                    </label>

                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer font-bold text-xs transition-all ${formData.status === 'Closed'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-400/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>
                      <input
                        type="radio"
                        name="status"
                        value="Closed"
                        checked={formData.status === 'Closed'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Closed</span>
                    </label>
                  </div>
                </div>

                {/* 15. Date Complaint Closed */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    15. Date Complaint Closed {formData.status === 'Closed' && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="date"
                    name="dateClosed"
                    value={formData.dateClosed}
                    onChange={handleChange}
                    disabled={formData.status !== 'Closed'}
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.dateClosed ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                      } ${formData.status !== 'Closed' ? 'bg-slate-100 text-slate-400' : 'bg-white'} focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.dateClosed && (
                    <span className="text-[11px] font-semibold text-rose-600 mt-1 block">{errors.dateClosed}</span>
                  )}
                  {formData.status === 'Closed' && (
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Must be on or after received date ({formData.dateReceived}).
                    </span>
                  )}
                </div>
              </div>

              {/* Appeal Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Appeal Tracking (If Applicable)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Optional fields for complainants exercising right of appeal.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* 16. Appeal Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      16. Appeal Date (If Needed)
                    </label>
                    <input
                      type="date"
                      name="appealDate"
                      value={formData.appealDate}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.appealDate ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                        } bg-white focus:ring-2 focus:ring-indigo-500`}
                    />
                    {errors.appealDate && (
                      <span className="text-[11px] font-semibold text-rose-600 mt-1 block">{errors.appealDate}</span>
                    )}
                  </div>

                  {/* Appeal Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Appeal Review Status
                    </label>
                    <select
                      name="appealStatus"
                      value={formData.appealStatus}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="None">None (No Appeal)</option>
                      <option value="Pending Review">Pending Review (ED &amp; Focal Person)</option>
                      <option value="Upheld">Upheld (Decision Modified)</option>
                      <option value="Overturned">Overturned</option>
                      <option value="Dismissed">Dismissed (Original Decision Maintained)</option>
                    </select>
                  </div>

                  {/* 17. Appeal Outcome */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      17. Appeal Outcome
                    </label>
                    <textarea
                      rows={2}
                      name="appealOutcome"
                      value={formData.appealOutcome}
                      onChange={handleChange}
                      placeholder="Detail findings of the appeal review, committee determinations, or modified outcomes..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* 18. Final Closing Date After Appeal */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      18. Final Closing Date After Appeal
                    </label>
                    <input
                      type="date"
                      name="finalClosingDateAfterAppeal"
                      value={formData.finalClosingDateAfterAppeal}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.finalClosingDateAfterAppeal ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                        } bg-white focus:ring-2 focus:ring-indigo-500`}
                    />
                    {errors.finalClosingDateAfterAppeal && (
                      <span className="text-[11px] font-semibold text-rose-600 mt-1 block">{errors.finalClosingDateAfterAppeal}</span>
                    )}
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Record when appeal process reaches final conclusion. Must not precede appeal date.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation & Save */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {activeTab !== 'A' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['A', 'B', 'C', 'D', 'E'];
                    const idx = tabs.indexOf(activeTab);
                    if (idx > 0) setActiveTab(tabs[idx - 1]);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Back
                </button>
              )}

              {activeTab !== 'E' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['A', 'B', 'C', 'D', 'E'];
                    const idx = tabs.indexOf(activeTab);
                    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                >
                  Continue to Next Section
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditMode ? 'Save Changes' : 'Save Complaint Record'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
