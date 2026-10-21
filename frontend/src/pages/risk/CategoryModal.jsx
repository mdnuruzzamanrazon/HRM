import React, { useState } from 'react';
import { X, Layers, Plus, Loader2, Save } from 'lucide-react';

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
    selectedCategory: '',
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
        newErrors.categoryName = 'Category name is required';
      }
    } else {
      if (!formData.selectedCategory) {
        newErrors.selectedCategory = 'Please choose a parent category';
      }
      if (!formData.subCategoryName.trim()) {
        newErrors.subCategoryName = 'Sub-category name is required';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/30">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Add Risk Classification
              </h3>
              <p className="text-xs text-slate-400">
                Configure organizational categories and subcategories
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'newCategory' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="categoryName"
                  value={formData.categoryName}
                  onChange={handleChange}
                  placeholder="e.g. Information Security & Compliance"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.categoryName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.categoryName && <p className="mt-1 text-xs text-rose-600">{errors.categoryName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g. IS"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Initial Sub-category (Optional)
                  </label>
                  <input
                    type="text"
                    name="subCategoryName"
                    value={formData.subCategoryName}
                    onChange={handleChange}
                    placeholder="e.g. Cloud Security"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Explanatory Note
                </label>
                <textarea
                  name="description"
                  rows="2"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Scope or guidance for this category..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Parent Category <span className="text-rose-500">*</span>
                </label>
                <select
                  name="selectedCategory"
                  value={formData.selectedCategory}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.selectedCategory ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {errors.selectedCategory && <p className="mt-1 text-xs text-rose-600">{errors.selectedCategory}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sub-category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subCategoryName"
                    value={formData.subCategoryName}
                    onChange={handleChange}
                    placeholder="e.g. Remote worker safety"
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs text-slate-900 ${
                      errors.subCategoryName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                  {errors.subCategoryName && <p className="mt-1 text-xs text-rose-600">{errors.subCategoryName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Code
                  </label>
                  <input
                    type="text"
                    name="subCategoryCode"
                    value={formData.subCategoryCode}
                    onChange={handleChange}
                    placeholder="e.g. RS"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Guidance Note
                </label>
                <input
                  type="text"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="e.g. Field travel and lone worker hazards"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
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
