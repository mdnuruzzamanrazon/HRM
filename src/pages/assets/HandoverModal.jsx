import React, { useState } from 'react';
import { X, FileText, Plus, Trash2, Printer, Save, CheckCircle } from 'lucide-react';

export default function HandoverModal({ isOpen, onClose, onSubmit, assets = [], isSubmitting = false }) {
  const [formData, setFormData] = useState({
    formNo: `HO-2026-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    type: 'Handover',
    projectDonor: 'FISHNET',
    handedOverBy: {
      name: '',
      designation: 'HR & Admin Officer',
      location: 'Head Office',
      contact: ''
    },
    receivedBy: {
      name: '',
      designation: 'Project Officer',
      location: 'Taltali Program Office',
      contact: ''
    },
    purpose: 'Field project operations and beneficiary verification',
    expectedReturnDate: '',
    items: [
      {
        sl: 1,
        assetId: assets[0]?.assetId || 'CBDP-AST-Core-Lap-01',
        assetName: assets[0]?.name || 'Asus vivo Book 15.6',
        conditionHandover: 'Good',
        accessories: 'Power Charger, Mouse, Bag',
        qty: 1,
        remarks: ''
      }
    ]
  });

  const [printMode, setPrintMode] = useState(false);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          sl: prev.items.length + 1,
          assetId: '',
          assetName: '',
          conditionHandover: 'Good',
          accessories: '',
          qty: 1,
          remarks: ''
        }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.items];
      updated[index][field] = value;
      // If assetId changed, auto-fill asset name if found in assets
      if (field === 'assetId') {
        const found = assets.find((a) => a.assetId === value);
        if (found) {
          updated[index].assetName = found.name;
          updated[index].conditionHandover = found.condition || 'Good';
        }
      }
      return { ...prev, items: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Official Asset Handover & Return Deed Form (Form GID 2011906547)
              </h2>
              <p className="text-xs text-slate-400">Record chain of custody and signed equipment handovers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPrintMode(!printMode)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              {printMode ? 'Edit Form' : 'Print Preview'}
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Preview Mode */}
        {printMode ? (
          <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto bg-slate-50 text-slate-900 font-sans print:p-0 print:bg-white">
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <h1 className="text-xl font-bold tracking-tight uppercase">Community Based Development Program (CBDP)</h1>
              <h2 className="text-base font-semibold text-slate-700 mt-1 uppercase">Official Asset Handover / Return Form</h2>
              <div className="flex justify-between text-xs text-slate-600 mt-3">
                <span><strong>Form No:</strong> {formData.formNo}</span>
                <span><strong>Date:</strong> {formData.date}</span>
                <span><strong>Type:</strong> {formData.type}</span>
                <span><strong>Project/Donor:</strong> {formData.projectDonor}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs border border-slate-300 p-4 rounded bg-white">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase block mb-1">Handed Over By:</span>
                <div><strong>Name:</strong> {formData.handedOverBy.name || 'Admin Officer'}</div>
                <div><strong>Designation:</strong> {formData.handedOverBy.designation}</div>
                <div><strong>Office / Location:</strong> {formData.handedOverBy.location}</div>
                <div><strong>Contact:</strong> {formData.handedOverBy.contact || 'N/A'}</div>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase block mb-1">Received By:</span>
                <div><strong>Name:</strong> {formData.receivedBy.name || 'Recipient'}</div>
                <div><strong>Designation:</strong> {formData.receivedBy.designation}</div>
                <div><strong>Office / Location:</strong> {formData.receivedBy.location}</div>
                <div><strong>Contact:</strong> {formData.receivedBy.contact || 'N/A'}</div>
              </div>
            </div>

            <div className="text-xs">
              <strong>Purpose of Allocation:</strong> {formData.purpose}
              {formData.expectedReturnDate && (
                <span className="ml-4"><strong>Expected Return Date:</strong> {formData.expectedReturnDate}</span>
              )}
            </div>

            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2">SL</th>
                  <th className="border border-slate-300 p-2">Asset ID</th>
                  <th className="border border-slate-300 p-2">Asset / Equipment Name</th>
                  <th className="border border-slate-300 p-2">Condition at Handover</th>
                  <th className="border border-slate-300 p-2">Accessories Included</th>
                  <th className="border border-slate-300 p-2 text-center">Qty</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-mono font-semibold">{item.assetId}</td>
                    <td className="border border-slate-300 p-2 font-medium">{item.assetName}</td>
                    <td className="border border-slate-300 p-2">{item.conditionHandover}</td>
                    <td className="border border-slate-300 p-2 text-slate-600">{item.accessories || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">{item.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signature Block */}
            <div className="grid grid-cols-4 gap-4 pt-10 text-center text-xs">
              <div className="border-t border-slate-400 pt-2">
                <p className="font-semibold">Handed Over By</p>
                <p className="text-slate-400 text-[10px]">Signature & Date</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-semibold">Received By</p>
                <p className="text-slate-400 text-[10px]">Signature & Date</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-semibold">Verified By (Admin)</p>
                <p className="text-slate-400 text-[10px]">Signature & Date</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-semibold">Approved By (Director)</p>
                <p className="text-slate-400 text-[10px]">Signature & Date</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-black transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Document
              </button>
            </div>
          </div>
        ) : (
          /* Form Entry Mode */
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Form No.</label>
                <input
                  type="text"
                  required
                  value={formData.formNo}
                  onChange={(e) => setFormData({ ...formData, formNo: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Handover">Handover to Custodian</option>
                  <option value="Return">Asset Return</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project / Donor</label>
                <input
                  type="text"
                  value={formData.projectDonor}
                  onChange={(e) => setFormData({ ...formData, projectDonor: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            {/* Handed Over By & Received By */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Handed Over By */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Handed Over By (Issuer)
                </span>
                <input
                  type="text"
                  required
                  placeholder="Officer Name"
                  value={formData.handedOverBy.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    handedOverBy: { ...formData.handedOverBy, name: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Designation"
                    value={formData.handedOverBy.designation}
                    onChange={(e) => setFormData({
                      ...formData,
                      handedOverBy: { ...formData.handedOverBy, designation: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Office / Location"
                    value={formData.handedOverBy.location}
                    onChange={(e) => setFormData({
                      ...formData,
                      handedOverBy: { ...formData.handedOverBy, location: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Received By */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Received By (Recipient)
                </span>
                <input
                  type="text"
                  required
                  placeholder="Recipient Name"
                  value={formData.receivedBy.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    receivedBy: { ...formData.receivedBy, name: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Designation"
                    value={formData.receivedBy.designation}
                    onChange={(e) => setFormData({
                      ...formData,
                      receivedBy: { ...formData.receivedBy, designation: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Office / Location"
                    value={formData.receivedBy.location}
                    onChange={(e) => setFormData({
                      ...formData,
                      receivedBy: { ...formData.receivedBy, location: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

            </div>

            {/* Purpose & Return Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose of Handover</label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="e.g. Field program monitoring in Barguna"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Return Date</label>
                <input
                  type="date"
                  value={formData.expectedReturnDate}
                  onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Itemized Assets Included in Handover
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Asset Line
                </button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Asset ID</label>
                      <input
                        type="text"
                        placeholder="e.g. CBDP-AST-0001"
                        value={item.assetId}
                        onChange={(e) => handleItemChange(idx, 'assetId', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono uppercase"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Asset / Equipment Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lenovo Laptop"
                        value={item.assetName}
                        onChange={(e) => handleItemChange(idx, 'assetName', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Accessories Included</label>
                      <input
                        type="text"
                        placeholder="Charger, Mouse, Case"
                        value={item.accessories}
                        onChange={(e) => handleItemChange(idx, 'accessories', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-center font-bold"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg mt-3"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
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
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Recording Deed...' : 'Finalize Handover Deed'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
