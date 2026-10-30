import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Phone,
  MapPin,
  HeartHandshake,
  Building,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import LocationSelector from '../../components/common/LocationSelector';
import { useProject } from '../../context/ProjectContext';

export default function BeneficiaryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  activeForum = 'Upazilla Nagoric Forum',
  projectId,
  projectName = '',
  isSubmitting = false,
}) {
  const isEditMode = Boolean(initialData && initialData._id);
  const { selectedProject, registerUnsavedForm, unregisterUnsavedForm } = useProject();
  const [lockedProjectId, setLockedProjectId] = useState(projectId);
  const resolvedProjectName = projectName || selectedProject?.name || initialData?.projectName || '';

  const defaultFormState = {
    name: '',
    sex: 'Female',
    motherName: '',
    age: '',
    occupation: '',
    contactNo: '',
    alternativeContactNo: '',
    projectName: resolvedProjectName,
    csoName: 'Community Based Development Project (CBDP)',
    category: 'Direct Beneficiary Information',
    forumName: activeForum && activeForum !== 'ALL' ? activeForum : 'Upazilla Nagoric Forum',
    groupNameCode: '',
    division: 'Barishal',
    district: 'Barguna',
    upazila: 'Amtoli',
    union: 'Amtoli Sadar',
    village: '',
    detailAddress: '',
    adibashi: 'No',
    dalit: 'No',
    disability: 'No',
    remarks: '',
    sl: '',
  };

  const [formData, setFormData] = useState(defaultFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        sex: initialData.sex || 'Female',
        motherName: initialData.motherName || '',
        age: initialData.age ? String(initialData.age) : '',
        occupation: initialData.occupation || '',
        contactNo: initialData.contactNo || '',
        alternativeContactNo: initialData.alternativeContactNo || '',
        projectName: resolvedProjectName || initialData.projectName || '',
        csoName: initialData.csoName || 'Community Based Development Project (CBDP)',
        category: initialData.category || 'Direct Beneficiary Information',
        forumName: initialData.forumName || activeForum || 'Upazilla Nagoric Forum',
        groupNameCode: initialData.groupNameCode || '',
        division: initialData.division || 'Barishal',
        district: initialData.district || 'Barguna',
        upazila: initialData.upazila || 'Amtoli',
        union: initialData.union || 'Amtoli Sadar',
        village: initialData.village || '',
        detailAddress: initialData.detailAddress || '',
        adibashi: initialData.adibashi || 'No',
        dalit: initialData.dalit || 'No',
        disability: initialData.disability || 'No',
        remarks: initialData.remarks || '',
        sl: initialData.sl ? String(initialData.sl) : '',
      });
    } else {
      setFormData({
        ...defaultFormState,
        projectName: resolvedProjectName,
        forumName: activeForum && activeForum !== 'ALL' ? activeForum : 'Upazilla Nagoric Forum',
      });
    }
    setErrors({});
    if (isOpen) {
      setLockedProjectId(initialData?.projectId || projectId);
      registerUnsavedForm('beneficiary-form-modal', 'Beneficiary Form');
    } else {
      unregisterUnsavedForm('beneficiary-form-modal');
    }
    return () => unregisterUnsavedForm('beneficiary-form-modal');
  }, [initialData, activeForum, isOpen, projectId, resolvedProjectName, registerUnsavedForm, unregisterUnsavedForm]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleLocationChange = (loc) => {
    setFormData((prev) => ({
      ...prev,
      division: loc.division || '',
      district: loc.district || '',
      upazila: loc.upazila || '',
      union: loc.union || '',
    }));
    if (errors.division || errors.district || errors.upazila || errors.union) {
      setErrors((prev) => ({
        ...prev,
        division: null,
        district: null,
        upazila: null,
        union: null,
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Beneficiary Name is required';
    if (!formData.forumName.trim()) newErrors.forumName = 'Forum Name is required';
    if (!formData.division) newErrors.division = 'Division is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.upazila) newErrors.upazila = 'Upazila is required';
    if (!formData.union) newErrors.union = 'Union is required';

    if (formData.contactNo) {
      const cleanPhone = formData.contactNo.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 13) {
        newErrors.contactNo = 'Please enter a valid phone number';
      }
    }

    if (formData.age && (isNaN(formData.age) || parseInt(formData.age, 10) < 1 || parseInt(formData.age, 10) > 120)) {
      newErrors.age = 'Age must be between 1 and 120';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const effectiveProjectId = lockedProjectId || projectId;
    if (!effectiveProjectId || (projectId && String(effectiveProjectId) !== String(projectId))) {
      setErrors({ name: 'Active project changed while form was open. Please reopen the form under the target project.' });
      return;
    }
    if (!validate()) return;

    const payload = {
      ...formData,
      projectId: effectiveProjectId,
      projectName: resolvedProjectName || formData.projectName,
      age: formData.age ? parseInt(formData.age, 10) : undefined,
      sl: formData.sl ? parseInt(formData.sl, 10) : undefined,
    };

    onSubmit(payload);
  };

  const forumOptions = [
    'Upazilla Nagoric Forum',
    'Amtoli Sadar Union Nagoric Forum',
    'Arpangasia Union Nagoric Forum',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {isEditMode ? 'Edit Beneficiary Record' : 'Add New Beneficiary'}
              </h3>
              <p className="text-xs text-indigo-200/80">
                Selected Project: <strong className="text-white">{resolvedProjectName || 'Active Project'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Project & Forum Assignment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-indigo-900">
              <Building className="w-4 h-4 text-indigo-600" />
              1. Project & Forum Information
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Forum / Worksheet <span className="text-rose-500">*</span>
                </label>
                <select
                  name="forumName"
                  value={formData.forumName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-xl border bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition ${
                    errors.forumName ? 'border-rose-400' : 'border-slate-300'
                  }`}
                >
                  {forumOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                {errors.forumName && <p className="text-rose-600 text-[11px] mt-0.5">{errors.forumName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Active Project (Locked)
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={resolvedProjectName || formData.projectName}
                  readOnly
                  className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-900 font-bold text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CSO Name
                </label>
                <input
                  type="text"
                  name="csoName"
                  value={formData.csoName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Group Name & Code (If any)
                </label>
                <input
                  type="text"
                  name="groupNameCode"
                  value={formData.groupNameCode}
                  onChange={handleChange}
                  placeholder="e.g. UN-FORUM-01"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Serial Number (Sl No.)
                </label>
                <input
                  type="number"
                  name="sl"
                  value={formData.sl}
                  onChange={handleChange}
                  placeholder="Auto-generated if blank"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Personal & Demographics */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-indigo-900">
              <User className="w-4 h-4 text-indigo-600" />
              2. Personal & Demographic Details
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Name of Beneficiary / Member <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Md. Jamal Mrida / Sonia Akter"
                  className={`w-full px-3 py-2 rounded-xl border bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition ${
                    errors.name ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {errors.name && <p className="text-rose-600 text-[11px] mt-0.5">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sex (Female/Male/Transgender) <span className="text-rose-500">*</span>
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Transgender">Transgender</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g. 34"
                  className={`w-full px-3 py-2 rounded-xl border bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition ${
                    errors.age ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {errors.age && <p className="text-rose-600 text-[11px] mt-0.5">{errors.age}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mother's Name
                </label>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  placeholder="e.g. Jahanara Begum"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Occupation
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="e.g. Social Worker / Housewife / Student / Business"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-indigo-900">
              <Phone className="w-4 h-4 text-indigo-600" />
              3. Contact Information
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Number (Self)
                </label>
                <input
                  type="text"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleChange}
                  placeholder="e.g. 01716336698"
                  className={`w-full px-3 py-2 rounded-xl border bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition ${
                    errors.contactNo ? 'border-rose-400' : 'border-slate-300'
                  }`}
                />
                {errors.contactNo && <p className="text-rose-600 text-[11px] mt-0.5">{errors.contactNo}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alternative Contact Number
                </label>
                <input
                  type="text"
                  name="alternativeContactNo"
                  value={formData.alternativeContactNo}
                  onChange={handleChange}
                  placeholder="e.g. 01713673593 (Mother)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Administrative Location (Division -> District -> Upazila -> Union) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-indigo-900">
              <MapPin className="w-4 h-4 text-indigo-600" />
              4. Bangladesh Administrative Location
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <LocationSelector
                division={formData.division}
                district={formData.district}
                upazila={formData.upazila}
                union={formData.union}
                onChange={handleLocationChange}
                isFilterMode={false}
                required={true}
                layout="grid"
              />
              {(errors.division || errors.district || errors.upazila || errors.union) && (
                <p className="text-rose-600 text-[11px] mt-2">
                  Please select Division, District, Upazila, and Union.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Village / Institution
                </label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  placeholder="e.g. Chalavanga / Gopkhali / Amtoli Pourashova"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detail Address
                </label>
                <input
                  type="text"
                  name="detailAddress"
                  value={formData.detailAddress}
                  onChange={handleChange}
                  placeholder="e.g. Ward 3, Amtoli Sadar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Inclusion & Vulnerabilities */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-indigo-900">
              <HeartHandshake className="w-4 h-4 text-indigo-600" />
              5. Social Inclusion, Ethnicity & Disability
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Persons with Disability (Yes/No)
                </label>
                <select
                  name="disability"
                  value={formData.disability}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adibashi / Indigenous (Yes/No)
                </label>
                <select
                  name="adibashi"
                  value={formData.adibashi}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dalit (Yes/No)
                </label>
                <select
                  name="dalit"
                  value={formData.dalit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Observations
                </label>
                <textarea
                  name="remarks"
                  rows={2}
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Optional notes or observations..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-2 shadow-sm shadow-indigo-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditMode ? 'Update Beneficiary' : 'Save Beneficiary'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
