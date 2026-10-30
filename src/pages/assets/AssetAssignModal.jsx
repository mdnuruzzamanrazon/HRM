import React, { useState, useEffect } from 'react';
import {
  X,
  Boxes,
  FolderKanban,
  Building2,
  MapPin,
  User,
  Calendar,
  ArrowRightLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import { useProject } from '../../context/ProjectContext';

const DEPARTMENTS = [
  'Operations & Logistics',
  'Human Resources',
  'Finance & Accounts',
  'Executive Management',
  'Engineering & Technology',
  'Field Monitoring & Evaluation',
];

export default function AssetAssignModal({
  isOpen,
  onClose,
  asset,
  onUpdated,
}) {
  const { projects, refreshProjects } = useProject();
  const [employees, setEmployees] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    assignmentType: 'PROJECT',
    projectId: '',
    department: 'Operations & Logistics',
    location: '',
    custodianEmployeeId: '',
    custodianName: '',
    assignedDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    notes: '',
  });

  const targetAssetKey = asset?._id || asset?.assetId;

  const loadAssignmentState = async () => {
    if (!targetAssetKey) return;
    try {
      setLoading(true);
      setError('');
      const [histRes, empRes] = await Promise.all([
        api.get(`/assets/${targetAssetKey}/assignments`),
        api.get('/employees', { params: { limit: 200 } }).catch(() => ({ data: { data: [] } })),
      ]);

      if (empRes.data?.data) {
        setEmployees(empRes.data.data);
      }

      if (histRes.data?.success && histRes.data.data) {
        const ca = histRes.data.data.currentAssignment || asset.currentAssignment || null;
        setCurrentAssignment(ca);
        setHistory(histRes.data.data.history || []);

        setFormData((prev) => ({
          ...prev,
          assignmentType: ca?.assignmentType === 'DEPARTMENT' ? 'DEPARTMENT' : 'PROJECT',
          projectId: ca?.projectId || projects[0]?._id || '',
          department: ca?.department || 'Operations & Logistics',
          location: ca?.location || asset.location || 'Field Office',
          custodianEmployeeId: ca?.custodianEmployeeId || '',
          custodianName: ca?.custodianName && ca.custodianName !== 'Unassigned' ? ca.custodianName : (asset.custodian || ''),
          notes: '',
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load asset allocation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && targetAssetKey) {
      setError('');
      setSuccessMsg('');
      loadAssignmentState();
    }
  }, [isOpen, targetAssetKey]);

  if (!isOpen || !asset) return null;

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (formData.assignmentType === 'PROJECT' && !formData.projectId) {
      setError('Please select a target project for project allocation.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');

      const res = await api.post(`/assets/${targetAssetKey}/assign`, {
        assignmentType: formData.assignmentType,
        projectId: formData.assignmentType === 'PROJECT' ? formData.projectId : null,
        department: formData.assignmentType === 'DEPARTMENT' ? formData.department : '',
        location: formData.location,
        custodianEmployeeId: formData.custodianEmployeeId || null,
        custodianName: formData.custodianName,
        assignedDate: formData.assignedDate || undefined,
        expectedReturnDate: formData.expectedReturnDate || undefined,
        notes: formData.notes,
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Asset allocation updated.');
        await loadAssignmentState();
        refreshProjects().catch(() => {});
        if (onUpdated) onUpdated(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to allocate asset.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnToHeadOffice = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');
      const res = await api.post(`/assets/${targetAssetKey}/unassign`, {
        returnCondition: asset.condition || 'Good',
        location: 'Head Office',
        notes: 'Returned to Head Office inventory pool',
      });
      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Asset returned to Head Office inventory.');
        await loadAssignmentState();
        refreshProjects().catch(() => {});
        if (onUpdated) onUpdated(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to release asset allocation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Allocate / Transfer Asset — {asset.assetId}
              </h3>
              <p className="text-xs text-slate-400">
                {asset.name} &bull; Independent Asset Custody &amp; Movement Ledger
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Asset Master Integrity:</strong> Allocating or transferring equipment updates custody and appends to the movement ledger without duplicating the master asset record or changing the Global Project Selector.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Allocation Banner */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Current Custody &amp; Allocation
              </span>
              {currentAssignment?.assignmentType === 'PROJECT' && currentAssignment?.projectName ? (
                <p className="text-sm font-black text-indigo-900 mt-0.5">
                  Project: {currentAssignment.projectName}{' '}
                  {currentAssignment.projectCode ? `(${currentAssignment.projectCode})` : ''}
                </p>
              ) : currentAssignment?.assignmentType === 'DEPARTMENT' ? (
                <p className="text-sm font-black text-slate-900 mt-0.5">
                  Department: {currentAssignment.department}
                </p>
              ) : (
                <p className="text-sm font-black text-slate-800 mt-0.5">
                  Head Office / General Inventory Pool
                </p>
              )}
              <p className="text-slate-500 mt-0.5">
                Location: <strong className="text-slate-700">{currentAssignment?.location || asset.location || 'Head Office'}</strong> &bull; Custodian:{' '}
                <strong className="text-slate-700">{currentAssignment?.custodianName || asset.custodian || 'Unassigned'}</strong>
              </p>
            </div>

            {(currentAssignment?.projectId || currentAssignment?.assignmentType === 'DEPARTMENT') && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleReturnToHeadOffice}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return to Head Office</span>
              </button>
            )}
          </div>

          {/* Allocation / Transfer Form */}
          <form onSubmit={handleAssignSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
            <h4 className="font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
              <span>Allocate or Transfer Custody</span>
            </h4>

            {/* Type Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'PROJECT', label: 'Project Allocation', icon: FolderKanban },
                { id: 'DEPARTMENT', label: 'Department Pool', icon: Building2 },
                { id: 'HEAD_OFFICE', label: 'Head Office Store', icon: Boxes },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = formData.assignmentType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, assignmentType: opt.id })}
                    className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {formData.assignmentType === 'PROJECT' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Project <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                  >
                    <option value="">Select Project...</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.assignmentType === 'DEPARTMENT' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Target Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Physical Location / Field Office
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Barguna Field Office, Head Office"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Custodian Employee (Optional)
                </label>
                <select
                  value={formData.custodianEmployeeId}
                  onChange={(e) => {
                    const empId = e.target.value;
                    const found = employees.find((emp) => String(emp._id) === String(empId));
                    const empName = found
                      ? `${found.personalDetails?.firstName || found.firstName || ''} ${
                          found.personalDetails?.lastName || found.lastName || ''
                        }`.trim()
                      : formData.custodianName;
                    setFormData({
                      ...formData,
                      custodianEmployeeId: empId,
                      custodianName: empName,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                >
                  <option value="">Select Core HR Staff or type name...</option>
                  {employees.map((emp) => {
                    const fn = `${emp.personalDetails?.firstName || emp.firstName || ''} ${
                      emp.personalDetails?.lastName || emp.lastName || ''
                    }`.trim();
                    return (
                      <option key={emp._id} value={emp._id}>
                        {fn} ({emp.employeeCode || 'EMP'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Custodian Name / Label
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.custodianName}
                    onChange={(e) => setFormData({ ...formData, custodianName: e.target.value })}
                    placeholder="Custodian name or focal point"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Allocation Date
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={formData.assignedDate}
                    onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Expected Return Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expectedReturnDate}
                  onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Handover / Movement Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Purpose of allocation, condition verification, or dispatch reference..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Asset Allocation</span>
              </button>
            </div>
          </form>

          {/* Movement Ledger History */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h4 className="font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Allocation &amp; Movement History ({history.length})</span>
            </h4>

            {loading ? (
              <div className="py-4 text-center text-slate-400">Loading movement history...</div>
            ) : history.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400">
                No prior project/custodian transfers recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
                {history.map((h) => (
                  <div key={h._id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <div>
                      <span className="font-bold text-slate-900">
                        {h.assignmentType === 'PROJECT'
                          ? `Project: ${h.projectName || h.projectId?.name || 'Project'}`
                          : h.assignmentType === 'DEPARTMENT'
                          ? `Dept: ${h.department}`
                          : 'Head Office Inventory'}
                      </span>
                      <span className="text-slate-400 mx-1.5">&bull;</span>
                      <span className="text-slate-600">
                        Custodian: {h.custodianName || 'Unassigned'} ({h.location || 'HQ'})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {h.assignedDate && (
                        <span className="text-slate-400">
                          {new Date(h.assignedDate).toLocaleDateString()}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          h.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {h.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

