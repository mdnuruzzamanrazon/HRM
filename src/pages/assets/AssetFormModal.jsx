import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Save } from 'lucide-react';

export default function AssetFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  references = {},
  isSubmitting = false
}) {
  const isEdit = Boolean(initialData?._id || initialData?.assetId);

  const [formData, setFormData] = useState({
    assetId: '',
    name: '',
    category: 'IT Equipment',
    projectDonor: 'Core',
    location: 'Head Office',
    custodian: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: 0,
    usefulLifeYears: 5,
    annualDepreciation: 0,
    currentBookValue: 0,
    condition: 'Good',
    status: 'Active',
    lastAuditDate: '',
    auditResult: 'Verified',
    nextAuditDue: '',
    riskFlag: 'Low',
    physicalTagLocation: 'Top cover',
    qrLabelSize: '50mm x 30mm',
    remarks: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        assetId: initialData.assetId || '',
        name: initialData.name || '',
        category: initialData.category || 'IT Equipment',
        projectDonor: initialData.projectDonor || 'Core',
        location: initialData.location || 'Head Office',
        custodian: initialData.custodian || '',
        purchaseDate: initialData.purchaseDate || '',
        purchaseCost: initialData.purchaseCost || 0,
        usefulLifeYears: initialData.usefulLifeYears || 5,
        annualDepreciation: initialData.annualDepreciation || 0,
        currentBookValue: initialData.currentBookValue !== undefined ? initialData.currentBookValue : (initialData.purchaseCost || 0),
        condition: initialData.condition || 'Good',
        status: initialData.status || 'Active',
        lastAuditDate: initialData.lastAuditDate || '',
        auditResult: initialData.auditResult || 'Verified',
        nextAuditDue: initialData.nextAuditDue || '',
        riskFlag: initialData.riskFlag || 'Low',
        physicalTagLocation: initialData.physicalTagLocation || 'Top cover',
        qrLabelSize: initialData.qrLabelSize || '50mm x 30mm',
        remarks: initialData.remarks || ''
      });
      setErrors({});
    } else if (!initialData && isOpen) {
      // New asset default ID suggestion
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      setFormData({
        assetId: `CBDP-AST-${randomCode}`,
        name: '',
        category: 'IT Equipment',
        projectDonor: 'Core',
        location: 'Head Office',
        custodian: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseCost: 0,
        usefulLifeYears: 5,
        annualDepreciation: 0,
        currentBookValue: 0,
        condition: 'Good',
        status: 'Active',
        lastAuditDate: new Date().toISOString().split('T')[0],
        auditResult: 'Verified',
        nextAuditDue: '',
        riskFlag: 'Low',
        physicalTagLocation: 'Top cover',
        qrLabelSize: '50mm x 30mm',
        remarks: ''
      });
      setErrors({});
    }
  }, [initialData, isOpen]);

  // Recalculate annual depreciation when cost or useful life changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'purchaseCost' || name === 'usefulLifeYears') {
        const cost = Number(name === 'purchaseCost' ? value : updated.purchaseCost) || 0;
        const years = Number(name === 'usefulLifeYears' ? value : updated.usefulLifeYears) || 1;
        updated.annualDepreciation = years > 0 ? Math.round(cost / years) : 0;
        if (!isEdit && name === 'purchaseCost') {
          updated.currentBookValue = cost;
        }
      }
      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.assetId.trim()) errs.assetId = 'Asset ID is required';
    if (!formData.name.trim()) errs.name = 'Asset Name is required';
    if (Number(formData.purchaseCost) < 0) errs.purchaseCost = 'Cost cannot be negative';
    if (Number(formData.usefulLifeYears) <= 0) errs.usefulLifeYears = 'Useful life must be at least 1 year';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const categories = references.categories?.length
    ? references.categories
    : ['IT Equipment', 'Office Furniture', 'Field Equipment', 'Vehicle', 'Safety Equipment', 'Communication', 'Other'];

  const locations = references.locations?.length
    ? references.locations
    : ['Head Office', 'Amtoli Field Office', 'Warehouse', 'Taltali Program Office', 'Hatchery Office', "Cox's Bazar Field", 'Barguna Field'];

  const statuses = references.statuses?.length
    ? references.statuses
    : ['Active', 'In Use', 'Under Maintenance', 'Transferred', 'Disposed', 'Lost'];

  const conditions = references.conditions?.length
    ? references.conditions
    : ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];

  const auditResults = references.auditResults?.length
    ? references.auditResults
    : ['Verified', 'Mismatch', 'Missing', 'Damaged', 'Not Audited'];

  const projectDonors = references.projectDonors?.length
    ? references.projectDonors
    : ['Core', 'LLDRR', 'FISHNET', 'NAGORIC', 'Plan International', 'Other'];

  const riskLevels = ['Low', 'Medium', 'High', 'Critical'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEdit ? `Edit Asset: ${formData.assetId}` : 'Register New Organizational Asset'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEdit ? 'Update registered asset specifications and audit status' : 'Enter complete asset details according to the CBDP Asset Register'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Section 1: Identification & General Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-1">
              1. Asset Identification & Classification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Asset ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="assetId"
                  value={formData.assetId}
                  onChange={handleChange}
                  disabled={isEdit}
                  placeholder="e.g. CBDP-AST-0031"
                  className={`w-full px-3 py-2 text-sm border rounded-xl font-mono uppercase bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    errors.assetId ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                  }`}
                />
                {errors.assetId && <p className="text-xs text-red-500 mt-1">{errors.assetId}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Asset Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Dell Latitude 5420 Core i5 16GB"
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    errors.name ? 'border-red-400 bg-red-50/20' : 'border-slate-300'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project / Donor</label>
                <select
                  name="projectDonor"
                  value={formData.projectDonor}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {projectDonors.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {locations.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Custodian (Assigned To)</label>
                <input
                  type="text"
                  name="custodian"
                  value={formData.custodian}
                  onChange={handleChange}
                  placeholder="e.g. Finance Officer"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Risk Flag</label>
                <select
                  name="riskFlag"
                  value={formData.riskFlag}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {riskLevels.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Financial & Valuation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-1">
              2. Acquisition & Depreciation Parameters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Cost (BDT)</label>
                <input
                  type="number"
                  name="purchaseCost"
                  value={formData.purchaseCost}
                  onChange={handleChange}
                  min="0"
                  step="any"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Useful Life (Years)</label>
                <input
                  type="number"
                  name="usefulLifeYears"
                  value={formData.usefulLifeYears}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Annual Depreciation (Auto)
                </label>
                <div className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-100/80 rounded-xl font-mono text-slate-700 font-semibold">
                  {Number(formData.annualDepreciation).toLocaleString()} BDT
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Book Value (BDT)
                </label>
                <input
                  type="number"
                  name="currentBookValue"
                  value={formData.currentBookValue}
                  onChange={handleChange}
                  min="0"
                  step="any"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl text-emerald-700 font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Audit & Physical Inspection */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-1">
              3. Physical Condition & Audit Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condition</label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {conditions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Result</label>
                <select
                  name="auditResult"
                  value={formData.auditResult}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {auditResults.map((ar) => (
                    <option key={ar} value={ar}>{ar}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Audit Date</label>
                <input
                  type="date"
                  name="lastAuditDate"
                  value={formData.lastAuditDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Next Audit Due</label>
                <input
                  type="date"
                  name="nextAuditDue"
                  value={formData.nextAuditDue}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Tag Placement</label>
                <input
                  type="text"
                  name="physicalTagLocation"
                  value={formData.physicalTagLocation}
                  onChange={handleChange}
                  placeholder="e.g. Top cover, Back panel"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">QR Label Dimension</label>
                <select
                  name="qrLabelSize"
                  value={formData.qrLabelSize}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="50mm x 30mm">50mm x 30mm (Standard)</option>
                  <option value="70mm x 40mm">70mm x 40mm (Large Equipment)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks & Observations</label>
                <input
                  type="text"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Optional field notes or inspection remarks"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Register Asset')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
