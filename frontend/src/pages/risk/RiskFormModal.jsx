import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, ShieldAlert, CheckCircle2, 
  HelpCircle, Calendar, User, Clock, Loader2, Save, Plus,
  FileText, Activity, CheckSquare, RefreshCw, AlertCircle, BookOpen,
  Info, Tag
} from 'lucide-react';
import { 
  calculateRiskScore, 
  getRiskRating, 
  calculateVariance, 
  LIKELIHOOD_LEVELS, 
  IMPACT_LEVELS 
} from '../../utils/riskCalculations.js';
import { CBDP_STANDARD_CLASSIFICATIONS } from './RiskCategoriesView.jsx';
import { useProject } from '../../context/ProjectContext';

export default function RiskFormModal({
  isOpen,
  onClose,
  onSave,
  riskRecord = null,
  prefillData = null,
  projectId,
  projectName = '',
  categories = [],
  onOpenCategoryModal,
  onOpenGuidance,
  isSubmitting = false
}) {
  const { selectedProject, registerUnsavedForm, unregisterUnsavedForm } = useProject();
  const [lockedProjectId, setLockedProjectId] = useState(projectId);
  const [formData, setFormData] = useState({
    riskNo: '',
    dateAdded: new Date().toISOString().split('T')[0],
    category: '',
    subCategory: '',
    categoryCode: '',
    subCode: '',
    ukDirector: '',
    explanatoryNote: '',
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

  // Resolve official CBDP meta (code, subcode, director, note) for category & subcategory
  const resolveClassificationMeta = (catName, subName) => {
    let catCode = '';
    let subCode = '';
    let ukDirector = '';
    let note = '';

    if (categories && categories.length > 0) {
      const matchedCat = categories.find(c => c.name.toLowerCase() === (catName || '').toLowerCase());
      if (matchedCat) {
        catCode = matchedCat.code || '';
        const matchedSub = matchedCat.subCategories?.find(s => s.name.toLowerCase() === (subName || '').toLowerCase());
        if (matchedSub) {
          subCode = matchedSub.code || '';
          ukDirector = matchedSub.ukDirector || '';
          note = matchedSub.note || '';
        }
      }
    }

    if (!subCode || !ukDirector || !note) {
      const stdMatch = CBDP_STANDARD_CLASSIFICATIONS.find(
        item => item.category.toLowerCase() === (catName || '').toLowerCase() &&
                item.subCategory.toLowerCase() === (subName || '').toLowerCase()
      );
      if (stdMatch) {
        if (!catCode) catCode = stdMatch.categoryCode;
        if (!subCode) subCode = stdMatch.subCode;
        if (!ukDirector) ukDirector = stdMatch.ukDirector;
        if (!note) note = stdMatch.note;
      }
    }

    return { catCode, subCode, ukDirector, note };
  };

  const getDirectorTheme = (director) => {
    switch (director) {
      case 'GMT':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' };
      case 'International':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
      case 'Finance':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
      case 'Marketing':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
      case 'Influence':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
      default:
        return { bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
    }
  };

  useEffect(() => {
    if (riskRecord) {
      const meta = resolveClassificationMeta(riskRecord.category, riskRecord.subCategory);
      setFormData({
        riskNo: riskRecord.riskNo || '',
        dateAdded: riskRecord.dateAdded ? new Date(riskRecord.dateAdded).toISOString().split('T')[0] : '',
        category: riskRecord.category || '',
        subCategory: riskRecord.subCategory || '',
        categoryCode: riskRecord.categoryCode || meta.catCode || '',
        subCode: riskRecord.subCode || meta.subCode || '',
        ukDirector: riskRecord.ukDirector || meta.ukDirector || '',
        explanatoryNote: riskRecord.explanatoryNote || meta.note || '',
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
    } else if (prefillData) {
      const meta = resolveClassificationMeta(prefillData.category, prefillData.subCategory);
      setFormData({
        riskNo: '',
        dateAdded: new Date().toISOString().split('T')[0],
        category: prefillData.category || '',
        subCategory: prefillData.subCategory || '',
        categoryCode: prefillData.categoryCode || meta.catCode || '',
        subCode: prefillData.subCode || meta.subCode || '',
        ukDirector: prefillData.ukDirector || meta.ukDirector || '',
        explanatoryNote: prefillData.note || prefillData.explanatoryNote || meta.note || '',
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
    } else {
      const defaultCat = categories[0]?.name || 'People';
      const defaultSub = categories[0]?.subCategories?.[0]?.name || 'Safeguarding';
      const meta = resolveClassificationMeta(defaultCat, defaultSub);
      setFormData({
        riskNo: '',
        dateAdded: new Date().toISOString().split('T')[0],
        category: defaultCat,
        subCategory: defaultSub,
        categoryCode: categories[0]?.code || meta.catCode || 'PE',
        subCode: categories[0]?.subCategories?.[0]?.code || meta.subCode || 'SG',
        ukDirector: categories[0]?.subCategories?.[0]?.ukDirector || meta.ukDirector || 'Finance',
        explanatoryNote: categories[0]?.subCategories?.[0]?.note || meta.note || 'Not specified in the source',
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
    if (isOpen) {
      setLockedProjectId(riskRecord?.projectId || projectId);
      registerUnsavedForm('risk-form-modal', 'Risk Register Form');
    } else {
      unregisterUnsavedForm('risk-form-modal');
    }
    return () => unregisterUnsavedForm('risk-form-modal');
  }, [riskRecord, prefillData, isOpen, categories, projectId, registerUnsavedForm, unregisterUnsavedForm]);

  // Update available subcategories when category changes
  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const selected = categories.find(c => c.name.toLowerCase() === formData.category.toLowerCase());
      if (selected && selected.subCategories) {
        setAvailableSubCategories(selected.subCategories);
      } else {
        const stdSubs = CBDP_STANDARD_CLASSIFICATIONS
          .filter(c => c.category.toLowerCase() === formData.category.toLowerCase())
          .map(c => ({ name: c.subCategory, code: c.subCode, ukDirector: c.ukDirector, note: c.note }));
        setAvailableSubCategories(stdSubs);
      }
    } else {
      setAvailableSubCategories([]);
    }
  }, [formData.category, categories]);

  const handleCategoryChange = (e) => {
    const newCatName = e.target.value;
    const matchedCat = categories.find(c => c.name.toLowerCase() === newCatName.toLowerCase());
    let subs = matchedCat?.subCategories || [];
    if (subs.length === 0) {
      subs = CBDP_STANDARD_CLASSIFICATIONS
        .filter(c => c.category.toLowerCase() === newCatName.toLowerCase())
        .map(c => ({ name: c.subCategory, code: c.subCode, ukDirector: c.ukDirector, note: c.note }));
    }
    setAvailableSubCategories(subs);

    const firstSub = subs[0] || null;
    const meta = resolveClassificationMeta(newCatName, firstSub?.name);

    setFormData(prev => ({
      ...prev,
      category: newCatName,
      subCategory: firstSub?.name || '',
      categoryCode: matchedCat?.code || meta.catCode || '',
      subCode: firstSub?.code || meta.subCode || '',
      ukDirector: firstSub?.ukDirector || meta.ukDirector || '',
      explanatoryNote: firstSub?.note || meta.note || ''
    }));

    if (errors.category) {
      setErrors(prev => ({ ...prev, category: null }));
    }
  };

  const handleSubCategoryChange = (e) => {
    const newSubName = e.target.value;
    const matchedSub = availableSubCategories.find(s => s.name.toLowerCase() === newSubName.toLowerCase());
    const meta = resolveClassificationMeta(formData.category, newSubName);

    setFormData(prev => ({
      ...prev,
      subCategory: newSubName,
      subCode: matchedSub?.code || meta.subCode || prev.subCode,
      ukDirector: matchedSub?.ukDirector || meta.ukDirector || prev.ukDirector,
      explanatoryNote: matchedSub?.note || meta.note || prev.explanatoryNote
    }));
  };

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
      newErrors.description = 'Risk description is required';
    }
    if (!formData.riskOwner.trim()) {
      newErrors.riskOwner = 'Risk owner is required';
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

    const effectiveProjectId = lockedProjectId || projectId;
    if (!effectiveProjectId || (projectId && String(effectiveProjectId) !== String(projectId))) {
      setErrors({ category: 'Active project changed while form was open. Please reopen the form under the target project.' });
      return;
    }

    const payload = {
      ...formData,
      projectId: effectiveProjectId,
      categoryCode: formData.categoryCode,
      subCode: formData.subCode,
      ukDirector: formData.ukDirector,
      explanatoryNote: formData.explanatoryNote,
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          HIGH (15+)
        </span>
      );
    }
    if (rating === 'MEDIUM') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          MEDIUM (8-14)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        LOW (&lt;8)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200/80 bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                {riskRecord ? `Edit Risk Record #${riskRecord.riskNo}` : 'Add New Risk Record'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                Selected Project: <strong className="text-indigo-700">{projectName || selectedProject?.name || 'Active Project'}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {onOpenGuidance && (
              <button
                type="button"
                onClick={onOpenGuidance}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                title="Open official CBDP Risk Register Guidance Manual"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guidance Manual</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* SECTION 1: BASIC RISK INFORMATION */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Basic Risk Information
                </h4>
                <p className="text-[11px] text-slate-500">Classification, date, and risk description</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Risk Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Risk Number
                </label>
                <input
                  type="number"
                  name="riskNo"
                  value={formData.riskNo}
                  onChange={handleChange}
                  placeholder="Auto-generated"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Auto-assigned if left blank</span>
              </div>

              {/* Date Added */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date Added <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateAdded"
                  value={formData.dateAdded}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs cursor-pointer"
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  {onOpenCategoryModal && (
                    <button
                      type="button"
                      onClick={onOpenCategoryModal}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                  )}
                </div>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs cursor-pointer ${
                    errors.category ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <option key={c.name} value={c.name}>
                      [{c.code || 'CAT'}] {c.name}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.category}</p>}
              </div>

              {/* Sub-category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sub-category
                </label>
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleSubCategoryChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs cursor-pointer"
                >
                  <option value="">-- Select Sub-category --</option>
                  {availableSubCategories.map(s => (
                    <option key={s.name} value={s.name}>
                      [{s.code || 'SUB'}] {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Official CBDP Classification Meta Banner */}
            {formData.category && (
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      CBDP Classification:
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <span className="bg-indigo-600 text-white px-1.5 py-0.2 rounded text-[10px]">
                        {formData.categoryCode || 'CAT'}
                      </span>
                      <span>{formData.category}</span>
                      <span className="text-slate-400 font-sans">›</span>
                      <span className="bg-indigo-100 text-indigo-900 px-1.5 py-0.2 rounded text-[10px]">
                        {formData.subCode || 'SUB'}
                      </span>
                      <span>{formData.subCategory || 'General'}</span>
                    </span>
                  </div>

                  {formData.ukDirector && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-500">UK Director:</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getDirectorTheme(formData.ukDirector).bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getDirectorTheme(formData.ukDirector).dot}`}></span>
                        <span>{formData.ukDirector}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Explanatory Note Callout */}
                <div className="text-[11px] text-slate-600 flex items-start gap-2 pt-1 border-t border-slate-200/60">
                  <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-700">Official Explanatory Note: </strong>
                    <span className={!formData.explanatoryNote || formData.explanatoryNote.toLowerCase().includes('not specified in the source') ? 'italic text-slate-400' : 'text-slate-700 font-medium'}>
                      {formData.explanatoryNote || 'Not specified in the source document.'}
                    </span>
                  </div>
                </div>

                {/* Duplicate Code Overlap Advisory if FS, SG, or PD */}
                {['FS', 'SG', 'PD'].includes(formData.subCode) && (
                  <div className="text-[10px] text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>
                      <strong>Shared Code Standard:</strong> "{formData.subCode}" is also referenced as an organizational code. This record is accurately filed under <strong>{formData.category}</strong>.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Description of Risk */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Risk Description <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Include <strong>Risk</strong> (what could go wrong) &amp; <strong>Consequences</strong> (impact)
                </span>
              </div>
              <textarea
                name="description"
                rows="2"
                value={formData.description}
                onChange={handleChange}
                placeholder="Clearly state the hazard, vulnerability, or event and its potential operational/safeguarding impacts..."
                className={`w-full px-3.5 py-2 rounded-xl border text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs ${
                  errors.description ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              {errors.description && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.description}</p>}
            </div>
          </section>

          {/* SECTION 2: RISK ASSESSMENT */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Risk Assessment & Scoring
                  </h4>
                  <p className="text-[11px] text-slate-500">Ownership, likelihood, impact, appetite target, and live RAG calculation</p>
                </div>
              </div>
              {onOpenGuidance && (
                <button
                  type="button"
                  onClick={onOpenGuidance}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  Formula &amp; Criteria
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Risk Owner */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Risk Owner <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="riskOwner"
                  value={formData.riskOwner}
                  onChange={handleChange}
                  placeholder="e.g. Project Manager"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs ${
                    errors.riskOwner ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.riskOwner && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.riskOwner}</p>}
              </div>

              {/* Likelihood */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Likelihood (1–5) <span className="text-rose-500">*</span>
                </label>
                <select
                  name="likelihood"
                  value={formData.likelihood}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs cursor-pointer"
                >
                  {LIKELIHOOD_LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Impact */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Impact (1–5) <span className="text-rose-500">*</span>
                </label>
                <select
                  name="impact"
                  value={formData.impact}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs cursor-pointer"
                >
                  {IMPACT_LEVELS.map(i => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>

              {/* Target Score */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Score
                </label>
                <input
                  type="number"
                  name="targetScore"
                  value={formData.targetScore}
                  onChange={handleChange}
                  placeholder="e.g. 6"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Risk Appetite target</span>
              </div>
            </div>

            {/* Live Scoring Summary Card (Clean Executive Design) */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Current Score Display */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Current Score
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-black text-slate-900 font-heading">{currentScore}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({formData.likelihood} × {formData.impact}) + {formData.impact}
                      </span>
                    </div>
                  </div>
                  <div>{getRatingBadge(currentRating)}</div>
                </div>

                {/* Target Score Display */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Target Appetite
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-bold text-slate-800 font-heading">
                        {formData.targetScore !== '' ? formData.targetScore : '—'}
                      </span>
                      <span className="text-[10px] text-slate-400">Target threshold</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    Target
                  </span>
                </div>

                {/* Variance Display */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Variance
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className={`text-2xl font-black font-heading ${
                        currentVariance > 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {currentVariance > 0 ? `+${currentVariance}` : currentVariance}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Current − Target</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    currentVariance > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {currentVariance > 0 ? 'Gap to Close' : 'Within Appetite'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: MITIGATION AND ACTION PLAN */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Mitigation and Action Plan
                  </h4>
                  <p className="text-[11px] text-slate-500">Specific controls, mitigation actions, and target completion deadlines</p>
                </div>
              </div>
              {onOpenGuidance && (
                <button
                  type="button"
                  onClick={onOpenGuidance}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  Mitigation Guidance
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Mitigation Action */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Mitigation Required / Action
                  </label>
                  <span className="text-[10px] text-amber-600 font-medium">
                    Must have completion date • Avoid 'ongoing'
                  </span>
                </div>
                <textarea
                  name="mitigationAction"
                  rows="2"
                  value={formData.mitigationAction}
                  onChange={handleChange}
                  placeholder="Define concrete, actionable mitigations. Avoid vague phrases like 'ongoing'..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                />
              </div>

              {/* Action Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Action Completion Deadline
                </label>
                <input
                  type="date"
                  name="actionDueDate"
                  value={formData.actionDueDate}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* SECTION 4: MONITORING AND REVIEW */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                4
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Monitoring and Review
                </h4>
                <p className="text-[11px] text-slate-500">Monitoring assignment, re-assessment scores, and review outcomes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Person Monitoring */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Person Monitoring
                </label>
                <input
                  type="text"
                  name="personMonitoring"
                  value={formData.personMonitoring}
                  onChange={handleChange}
                  placeholder="e.g. Finance Officer (use job title)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Prefer job title over personal name</span>
              </div>

              {/* Assessment Result */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assessment Result
                </label>
                <input
                  type="text"
                  name="assessmentResult"
                  value={formData.assessmentResult}
                  onChange={handleChange}
                  placeholder="e.g. Tolerable, On Track"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                />
              </div>

              {/* Review Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Review Date
                </label>
                <input
                  type="date"
                  name="reviewDate"
                  value={formData.reviewDate}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs cursor-pointer"
                />
              </div>

              {/* Lifecycle Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs cursor-pointer"
                >
                  <option value="OPEN">Open</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="MITIGATED">Mitigated</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional context, committee feedback, or verification remarks..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
              />
            </div>

            {/* Post-Mitigation Re-Assessment (Fields 18-20) */}
            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
                Post-Mitigation Re-Assessment (Optional Verification)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Assessed Likelihood */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assessed Likelihood
                  </label>
                  <select
                    name="assessedLikelihood"
                    value={formData.assessedLikelihood}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs cursor-pointer"
                  >
                    <option value="">-- None --</option>
                    {LIKELIHOOD_LEVELS.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>

                {/* Assessed Impact */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assessed Impact
                  </label>
                  <select
                    name="assessedImpact"
                    value={formData.assessedImpact}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs cursor-pointer"
                  >
                    <option value="">-- None --</option>
                    {IMPACT_LEVELS.map(i => (
                      <option key={i.value} value={i.value}>{i.label}</option>
                    ))}
                  </select>
                </div>

                {/* Assessed Score */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Assessed Score
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-black text-slate-900 font-heading">
                        {assessedScore !== null ? assessedScore : '—'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {assessedScore !== null ? `(${formData.assessedLikelihood} × ${formData.assessedImpact}) + ${formData.assessedImpact}` : 'Set AL & AI'}
                      </span>
                    </div>
                  </div>
                  <div>{assessedRating && getRatingBadge(assessedRating)}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Form Actions Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-3.5 sm:pt-4 border-t border-slate-200/80">
            <span className="text-xs text-slate-400">
              <span className="text-rose-500 font-bold">*</span> Required fields
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-xs text-center"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Record...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 stroke-[2.2]" />
                    <span>{riskRecord ? 'Update Risk Record' : 'Save Risk Record'}</span>
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
