import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, ShieldAlert, CheckCircle2, 
  HelpCircle, Calendar, User, Clock, Loader2, Save, Plus 
} from 'lucide-react';
import { 
  calculateRiskScore, 
  getRiskRating, 
  calculateVariance, 
  LIKELIHOOD_LEVELS, 
  IMPACT_LEVELS 
} from '../../utils/riskCalculations.js';

export default function RiskFormModal({
  isOpen,
  onClose,
  onSave,
  riskRecord = null,
  projectId,
  categories = [],
  onOpenCategoryModal,
  isSubmitting = false
}) {
  const [formData, setFormData] = useState({
    riskNo: '',
    dateAdded: new Date().toISOString().split('T')[0],
    category: '',
    subCategory: '',
    description: '',
    riskOwner: 'Project Manager',
    likelihood: 3,
    impact: 3,
    targetScore: '',
    mitigationAction: '',
    actionDueDate: '',
    personMonitoring: '',
    notes: '',
    assessmentResult: '',
    reviewDate: '',
    assessedLikelihood: '',
    assessedImpact: '',
    status: 'OPEN'
  });

  const [errors, setErrors] = useState({});
  const [availableSubCategories, setAvailableSubCategories] = useState([]);

  useEffect(() => {
    if (riskRecord) {
      setFormData({
        riskNo: riskRecord.riskNo || '',
        dateAdded: riskRecord.dateAdded ? new Date(riskRecord.dateAdded).toISOString().split('T')[0] : '',
        category: riskRecord.category || '',
        subCategory: riskRecord.subCategory || '',
        description: riskRecord.description || '',
        riskOwner: riskRecord.riskOwner || '',
        likelihood: riskRecord.likelihood || 3,
        impact: riskRecord.impact || 3,
        targetScore: riskRecord.targetScore !== null && riskRecord.targetScore !== undefined ? riskRecord.targetScore : '',
        mitigationAction: riskRecord.mitigationAction || '',
        actionDueDate: riskRecord.actionDueDate ? new Date(riskRecord.actionDueDate).toISOString().split('T')[0] : '',
        personMonitoring: riskRecord.personMonitoring || '',
        notes: riskRecord.notes || '',
        assessmentResult: riskRecord.assessmentResult || '',
        reviewDate: riskRecord.reviewDate ? new Date(riskRecord.reviewDate).toISOString().split('T')[0] : '',
        assessedLikelihood: riskRecord.assessedLikelihood || '',
        assessedImpact: riskRecord.assessedImpact || '',
        status: riskRecord.status || 'OPEN'
      });
    } else {
      setFormData({
        riskNo: '',
        dateAdded: new Date().toISOString().split('T')[0],
        category: categories[0]?.name || 'People',
        subCategory: categories[0]?.subCategories?.[0]?.name || '',
        description: '',
        riskOwner: 'Project Manager',
        likelihood: 3,
        impact: 3,
        targetScore: 6,
        mitigationAction: '',
        actionDueDate: '',
        personMonitoring: '',
        notes: '',
        assessmentResult: '',
        reviewDate: '',
        assessedLikelihood: '',
        assessedImpact: '',
        status: 'OPEN'
      });
    }
    setErrors({});
  }, [riskRecord, isOpen, categories]);

  // Update available subcategories when category changes
  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const selected = categories.find(c => c.name.toLowerCase() === formData.category.toLowerCase());
      if (selected && selected.subCategories) {
        setAvailableSubCategories(selected.subCategories);
      } else {
        setAvailableSubCategories([]);
      }
    } else {
      setAvailableSubCategories([]);
    }
  }, [formData.category, categories]);

  if (!isOpen) return null;

  // Live Calculations
  const currentScore = calculateRiskScore(formData.likelihood, formData.impact);
  const currentRating = getRiskRating(currentScore);
  const currentVariance = calculateVariance(currentScore, formData.targetScore);

  const assessedScore = (formData.assessedLikelihood && formData.assessedImpact)
    ? calculateRiskScore(formData.assessedLikelihood, formData.assessedImpact)
    : null;
  const assessedRating = assessedScore !== null ? getRiskRating(assessedScore) : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description of Risk is required';
    }
    if (!formData.likelihood) {
      newErrors.likelihood = 'Likelihood is required';
    }
    if (!formData.impact) {
      newErrors.impact = 'Impact is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      ...formData,
      projectId,
      likelihood: Number(formData.likelihood),
      impact: Number(formData.impact),
      targetScore: formData.targetScore !== '' ? Number(formData.targetScore) : null,
      assessedLikelihood: formData.assessedLikelihood !== '' ? Number(formData.assessedLikelihood) : null,
      assessedImpact: formData.assessedImpact !== '' ? Number(formData.assessedImpact) : null,
    };

    onSave(payload);
  };

  const getRatingBadge = (rating) => {
    if (rating === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          HIGH (15+)
        </span>
      );
    }
    if (rating === 'MEDIUM') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          MEDIUM (8-14)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
        LOW (&lt;8)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/30">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {riskRecord ? `Edit Risk Record #${riskRecord.riskNo}` : 'Add New HR Project Risk Record'}
              </h3>
              <p className="text-xs text-slate-400">
                Formula: Current Score = (Likelihood × Impact) + Impact | Variance = Current − Target
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
          
          {/* SECTION 1: RISK IDENTIFICATION */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                1. Risk Identification & Ownership
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">Fields 1 – 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Risk No */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Risk No.
                </label>
                <input
                  type="number"
                  name="riskNo"
                  value={formData.riskNo}
                  onChange={handleChange}
                  placeholder="Auto-generated"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date Added */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  2. Date Added
                </label>
                <input
                  type="date"
                  name="dateAdded"
                  value={formData.dateAdded}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    3. Category <span className="text-rose-500">*</span>
                  </label>
                  {onOpenCategoryModal && (
                    <button
                      type="button"
                      onClick={onOpenCategoryModal}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  )}
                </div>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-xl border text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.category ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-rose-600">{errors.category}</p>}
              </div>

              {/* Sub-category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  4. Sub-category
                </label>
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Sub-category --</option>
                  {availableSubCategories.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Description of Risk */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  5. Description of Risk <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows="2"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Clearly state the hazard, vulnerability, or event and its potential operational/safeguarding impacts..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.description ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.description && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.description}</p>}
              </div>

              {/* Risk Owner */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  6. Risk Owner
                </label>
                <input
                  type="text"
                  name="riskOwner"
                  value={formData.riskOwner}
                  onChange={handleChange}
                  placeholder="e.g. Project Manager"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Job title recommended</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: CURRENT RISK RATING & RISK APPETITE */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                2. Current Assessment & Risk Appetite (Fields 7 – 11)
              </h4>
              <span className="text-[11px] font-bold text-slate-600">RAG Approved Formula Applied</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {/* Likelihood */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  7. Likelihood (1-5)
                </label>
                <select
                  name="likelihood"
                  value={formData.likelihood}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LIKELIHOOD_LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Impact */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  8. Impact (1-5)
                </label>
                <select
                  name="impact"
                  value={formData.impact}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {IMPACT_LEVELS.map(i => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>

              {/* 9. Live Current Score & Rating */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  9. Current Score
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-2xl font-black text-slate-900">{currentScore}</span>
                  {getRatingBadge(currentRating)}
                </div>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                  ({formData.likelihood} × {formData.impact}) + {formData.impact}
                </span>
              </div>

              {/* 10. Target Score */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  10. Target Score
                </label>
                <input
                  type="number"
                  name="targetScore"
                  value={formData.targetScore}
                  onChange={handleChange}
                  placeholder="e.g. 6"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Risk Appetite target</span>
              </div>

              {/* 11. Live Variance */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  11. Variance
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-2xl font-black ${
                    currentVariance > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {currentVariance > 0 ? `+${currentVariance}` : currentVariance}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {currentVariance > 0 ? 'Gap to Close' : 'Within Appetite'}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                  Current − Target
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: MITIGATION PLAN */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                3. Mitigation Plan & Execution (Fields 12 – 15)
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">Specific, timebound actions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Mitigation Required / Action */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  12. Mitigation Required / Action
                </label>
                <textarea
                  name="mitigationAction"
                  rows="2"
                  value={formData.mitigationAction}
                  onChange={handleChange}
                  placeholder="Define concrete, actionable mitigations. Avoid vague phrases like 'ongoing'..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date Action To Be Completed By */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  13. Action Due Date
                </label>
                <input
                  type="date"
                  name="actionDueDate"
                  value={formData.actionDueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Person Monitoring */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  14. Person Monitoring
                </label>
                <input
                  type="text"
                  name="personMonitoring"
                  value={formData.personMonitoring}
                  onChange={handleChange}
                  placeholder="e.g. HR Director / Compliance Officer"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  15. Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional context or progress updates..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: ASSESSMENT & REVIEW */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                4. Formal Assessment Result & Re-Review (Fields 16 – 20)
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">Post-Mitigation Verification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {/* 16. Assessment Result */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  16. Assessment Result
                </label>
                <input
                  type="text"
                  name="assessmentResult"
                  value={formData.assessmentResult}
                  onChange={handleChange}
                  placeholder="e.g. Tolerable, On Track, Action Needed"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 17. Review Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  17. Review Date
                </label>
                <input
                  type="date"
                  name="reviewDate"
                  value={formData.reviewDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 18. Assessed Likelihood */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  18. Assessed Likelihood
                </label>
                <select
                  name="assessedLikelihood"
                  value={formData.assessedLikelihood}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- None --</option>
                  {LIKELIHOOD_LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* 19. Assessed Impact */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  19. Assessed Impact
                </label>
                <select
                  name="assessedImpact"
                  value={formData.assessedImpact}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- None --</option>
                  {IMPACT_LEVELS.map(i => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>

              {/* 20. Live Assessment Score */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  20. Assessment Score
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {assessedScore !== null ? assessedScore : '—'}
                  </span>
                  {assessedRating && getRatingBadge(assessedRating)}
                </div>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                  {assessedScore !== null ? `(${formData.assessedLikelihood} × ${formData.assessedImpact}) + ${formData.assessedImpact}` : 'Set 18 & 19'}
                </span>
              </div>
            </div>

            {/* Lifecycle Status */}
            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Lifecycle Status:
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="MITIGATED">MITIGATED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{riskRecord ? 'Update Risk Record' : 'Save Risk Record'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
