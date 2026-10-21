import React, { useState } from 'react';
import { X, Layers, Plus, Loader2 } from 'lucide-react';

export default function CategoryModal({
  isOpen,
  onClose,
  categories = [],
  onSave,
  isSubmitting = false
}) {
  const [mode, setMode] = useState('newCategory'); // 'newCategory' | 'newSubCategory'
  const [formData, setFormData] = useState({
    categoryName: '',
    code: '',
    description: '',
    selectedCategory: categories[0]?.name || '',
    subCategoryName: '',
    subCategoryCode: '',
    note: ''
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

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

    if (mode === 'newCategory') {
      if (!formData.categoryName.trim()) {
        newErrors.categoryName = 'Category Name is required';
      }
    } else {
      if (!formData.selectedCategory) {
        newErrors.selectedCategory = 'Parent Category is required';
      }
      if (!formData.subCategoryName.trim()) {
        newErrors.subCategoryName = 'Sub-category Name is required';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = mode === 'newCategory' ? {
      categoryName: formData.categoryName.trim(),
      code: formData.code.trim(),
      description: formData.description.trim(),
      subCategoryName: formData.subCategoryName.trim() || undefined,
      subCategoryCode: formData.subCategoryCode.trim() || undefined,
      note: formData.note.trim() || undefined
    } : {
      categoryName: formData.selectedCategory,
      subCategoryName: formData.subCategoryName.trim(),
      subCategoryCode: formData.subCategoryCode.trim(),
      note: formData.note.trim()
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200/80 bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                Add Risk Classification
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                Configure organizational categories and sub-categories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200/80 bg-slate-50/40 px-4 sm:px-6 pt-3">
          <button
            type="button"
            onClick={() => setMode('newCategory')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              mode === 'newCategory'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            New Category
          </button>
          <button
            type="button"
            onClick={() => setMode('newSubCategory')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              mode === 'newSubCategory'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            New Sub-category
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {mode === 'newCategory' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="categoryName"
                  value={formData.categoryName}
                  onChange={handleChange}
                  placeholder="e.g. Information Security & Compliance"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs ${
                    errors.categoryName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
                {errors.categoryName && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.categoryName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g. CAT_SEC"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Initial Sub-category
                  </label>
                  <input
                    type="text"
                    name="subCategoryName"
                    value={formData.subCategoryName}
                    onChange={handleChange}
                    placeholder="e.g. Data Protection"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="2"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Define scope for this risk classification..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Parent Category <span className="text-rose-500">*</span>
                </label>
                <select
                  name="selectedCategory"
                  value={formData.selectedCategory}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Sub-category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subCategoryName"
                    value={formData.subCategoryName}
                    onChange={handleChange}
                    placeholder="e.g. Incident Response"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs ${
                      errors.subCategoryName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  />
                  {errors.subCategoryName && <p className="mt-1 text-[11px] text-rose-600 font-semibold">{errors.subCategoryName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Sub-category Code
                  </label>
                  <input
                    type="text"
                    name="subCategoryCode"
                    value={formData.subCategoryCode}
                    onChange={handleChange}
                    placeholder="e.g. SUB_IR"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Guidance Note
                </label>
                <input
                  type="text"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="e.g. Specific hazard types or governance guidelines"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                />
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3.5 sm:pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer text-center"
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.2]" />
                  <span>Add Classification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
