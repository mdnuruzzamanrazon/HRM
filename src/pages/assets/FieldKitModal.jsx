import React, { useState, useEffect } from 'react';
import { X, Save, PackageCheck } from 'lucide-react';

export default function FieldKitModal({ isOpen, onClose, onSubmit, initialKit, isSubmitting = false }) {
  const isAdjust = Boolean(initialKit);

  const [formData, setFormData] = useState({
    itemCode: '',
    kitProject: 'FISHNET',
    equipmentName: '',
    category: 'Field Equipment',
    location: 'Warehouse',
    responsiblePerson: '',
    openingQty: 0,
    issuedQty: 0,
    returnedQty: 0,
    damagedQty: 0,
    missingQty: 0,
    minimumStock: 5,
    remarks: ''
  });

  useEffect(() => {
    if (initialKit && isOpen) {
      setFormData({
        itemCode: initialKit.itemCode || '',
        kitProject: initialKit.kitProject || 'FISHNET',
        equipmentName: initialKit.equipmentName || '',
        category: initialKit.category || 'Field Equipment',
        location: initialKit.location || 'Warehouse',
        responsiblePerson: initialKit.responsiblePerson || '',
        openingQty: initialKit.openingQty || 0,
        issuedQty: initialKit.issuedQty || 0,
        returnedQty: initialKit.returnedQty || 0,
        damagedQty: initialKit.damagedQty || 0,
        missingQty: initialKit.missingQty || 0,
        minimumStock: initialKit.minimumStock || 5,
        remarks: initialKit.remarks || ''
      });
    } else if (!initialKit && isOpen) {
      setFormData({
        itemCode: `KIT-00${Math.floor(10 + Math.random() * 90)}`,
        kitProject: 'FISHNET',
        equipmentName: '',
        category: 'Field Equipment',
        location: 'Warehouse',
        responsiblePerson: 'Logistics Assistant',
        openingQty: 10,
        issuedQty: 0,
        returnedQty: 0,
        damagedQty: 0,
        missingQty: 0,
        minimumStock: 5,
        remarks: ''
      });
    }
  }, [initialKit, isOpen]);

  if (!isOpen) return null;

  const available = Math.max(
    0,
    Number(formData.openingQty || 0) -
      Number(formData.issuedQty || 0) +
      Number(formData.returnedQty || 0) -
      Number(formData.damagedQty || 0) -
      Number(formData.missingQty || 0)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isAdjust ? `Stock Adjustment: ${formData.itemCode}` : 'Register New Project Field Kit'}
              </h2>
              <p className="text-xs text-slate-400">Manage multi-item field stock allocations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Item Code</label>
              <input
                type="text"
                disabled={isAdjust}
                value={formData.itemCode}
                onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kit / Project</label>
              <input
                type="text"
                value={formData.kitProject}
                onChange={(e) => setFormData({ ...formData, kitProject: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment / Kit Name</label>
              <input
                type="text"
                required
                value={formData.equipmentName}
                onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
                placeholder="e.g. Inflatable Life Jacket Pack"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Responsible Person</label>
              <input
                type="text"
                value={formData.responsiblePerson}
                onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Stock Quantity Reconciliation
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Opening</label>
                <input
                  type="number"
                  min="0"
                  value={formData.openingQty}
                  onChange={(e) => setFormData({ ...formData, openingQty: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Issued</label>
                <input
                  type="number"
                  min="0"
                  value={formData.issuedQty}
                  onChange={(e) => setFormData({ ...formData, issuedQty: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg text-center text-amber-700 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Returned</label>
                <input
                  type="number"
                  min="0"
                  value={formData.returnedQty}
                  onChange={(e) => setFormData({ ...formData, returnedQty: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg text-center text-emerald-700 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Damaged</label>
                <input
                  type="number"
                  min="0"
                  value={formData.damagedQty}
                  onChange={(e) => setFormData({ ...formData, damagedQty: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg text-center text-red-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Missing</label>
                <input
                  type="number"
                  min="0"
                  value={formData.missingQty}
                  onChange={(e) => setFormData({ ...formData, missingQty: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg text-center text-rose-700"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Available Calculated Balance:</span>
                <span className="text-xl font-extrabold text-indigo-700">{available} units</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Minimum Alert Threshold:</span>
                <input
                  type="number"
                  min="1"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                  className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-lg text-center font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
            >
              {isSubmitting ? 'Saving...' : 'Save Stock Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
