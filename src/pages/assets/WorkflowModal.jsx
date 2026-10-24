import React, { useState } from 'react';
import { X, GitCommit, Save, Clock } from 'lucide-react';

export default function WorkflowModal({ isOpen, onClose, onSubmit, isSubmitting = false }) {
  const [formData, setFormData] = useState({
    requestId: `REQ-00${Math.floor(10 + Math.random() * 90)}`,
    assetName: '',
    requestingDept: 'Program',
    budgetLine: 'IT Equipment',
    requisitionDate: new Date().toISOString().split('T')[0],
    approvalDate: '',
    rfqDate: '',
    poDate: '',
    receivedDate: '',
    taggedDate: '',
    assignedTo: '',
    currentStage: 'Requisition',
    workflowStatus: 'In Progress',
    remarks: ''
  });

  if (!isOpen) return null;

  const stages = [
    'Requisition',
    'Approval',
    'RFQ/Tender',
    'PO Issued',
    'Received',
    'Tagged & Assigned',
    'In Maintenance',
    'Disposal Requested',
    'Disposed'
  ];

  const statuses = ['Not Started', 'In Progress', 'Completed', 'Delayed', 'On Hold'];

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
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Initiate Procurement & Lifecycle Request</h2>
              <p className="text-xs text-slate-400">Track requisition approval, procurement pipeline, and assignment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Request ID</label>
              <input
                type="text"
                required
                value={formData.requestId}
                onChange={(e) => setFormData({ ...formData, requestId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Requesting Department</label>
              <input
                type="text"
                required
                value={formData.requestingDept}
                onChange={(e) => setFormData({ ...formData, requestingDept: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Asset / Item Needed</label>
              <input
                type="text"
                required
                placeholder="e.g. Field Laptop or Safety Life Jackets"
                value={formData.assetName}
                onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Budget Line</label>
              <input
                type="text"
                value={formData.budgetLine}
                onChange={(e) => setFormData({ ...formData, budgetLine: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Requisition Date</label>
              <input
                type="date"
                required
                value={formData.requisitionDate}
                onChange={(e) => setFormData({ ...formData, requisitionDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Lifecycle Stage</label>
              <select
                value={formData.currentStage}
                onChange={(e) => setFormData({ ...formData, currentStage: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
              >
                {stages.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Workflow Status</label>
              <select
                value={formData.workflowStatus}
                onChange={(e) => setFormData({ ...formData, workflowStatus: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks & Procurement Notes</label>
              <textarea
                rows={2}
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Optional procurement notes"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
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
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Register Workflow'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
