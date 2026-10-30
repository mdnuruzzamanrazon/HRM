import React, { useState, useEffect } from 'react';
import {
  X,
  FolderKanban,
  Briefcase,
  Calendar,
  Percent,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Trash2,
  Plus,
  Loader2,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import api from '../../services/api';
import { useProject } from '../../context/ProjectContext';

export default function EmployeeProjectAssignModal({
  isOpen,
  onClose,
  employee,
  onUpdated,
}) {
  const { projects, refreshProjects } = useProject();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state for new assignment or reassignment
  const [reassignFromId, setReassignFromId] = useState('');
  const [formData, setFormData] = useState({
    projectId: '',
    roleInProject: 'Project Team Member',
    allocationPercentage: 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isPrimary: false,
    notes: '',
  });

  const empId = employee?._id;
  const fullName = employee
    ? `${employee.personalDetails?.firstName || employee.firstName || ''} ${
        employee.personalDetails?.lastName || employee.lastName || ''
      }`.trim() || employee.email || 'Employee'
    : 'Employee';

  const loadAssignments = async () => {
    if (!empId) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/employees/${empId}/projects`, {
        params: { includeHistory: 'true' },
      });
      if (res.data?.success) {
        const raw = res.data.data;
        const list = Array.isArray(raw) ? raw : (raw?.history || raw?.activeAssignments || []);
        setAssignments(list);
        const activeIds = new Set(
          list.filter((a) => a.status === 'ACTIVE').map((a) => String(a.projectId?._id || a.projectId))
        );
        const firstAvailable = projects.find(
          (p) => p.status === 'ACTIVE' && !activeIds.has(String(p._id))
        ) || projects[0];
        if (firstAvailable && !formData.projectId) {
          setFormData((prev) => ({ ...prev, projectId: firstAvailable._id }));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employee project assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && empId) {
      setReassignFromId('');
      setError('');
      setSuccessMsg('');
      loadAssignments();
    }
  }, [isOpen, empId]);

  if (!isOpen || !employee) return null;

  const activeAssignments = assignments.filter((a) => a.status === 'ACTIVE');
  const historyAssignments = assignments.filter((a) => a.status !== 'ACTIVE');

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectId) {
      setError('Please select a target project.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');

      const payload = {
        projectId: formData.projectId,
        roleInProject: formData.roleInProject || 'Project Staff',
        allocationPercentage: Number(formData.allocationPercentage) || 100,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        isPrimary: Boolean(formData.isPrimary),
        notes: formData.notes,
        reassignFromAssignmentId: reassignFromId || undefined,
      };

      const res = await api.post(`/employees/${empId}/projects`, payload);
      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Project assignment saved.');
        setReassignFromId('');
        setFormData((prev) => ({
          ...prev,
          notes: '',
          endDate: '',
        }));
        await loadAssignments();
        refreshProjects().catch(() => {});
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign employee to project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (assignment) => {
    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');
      const res = await api.delete(`/employees/${empId}/projects/${assignment._id}`, {
        data: { reason: 'Removed from project via Core HR assignment manager' },
      });
      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Removed from project assignment. Core HR record preserved.');
        if (reassignFromId === assignment._id) setReassignFromId('');
        await loadAssignments();
        refreshProjects().catch(() => {});
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove project assignment.');
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
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Project Assignments — {fullName}
              </h3>
              <p className="text-xs text-slate-400">
                Core HR Employee ({employee.employeeCode || 'EMP'}) &bull; Independent Project Assignment Relationship
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
          {/* Core HR Integrity Notice */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Core HR Master Integrity:</strong> Assigning, reassigning, or removing a project assignment never duplicates or deletes {fullName}&apos;s Core HR record, payroll profile, or employment history.
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

          {/* Active Project Assignments */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold uppercase tracking-wider text-slate-700">
              Active Project Assignments ({activeAssignments.length})
            </h4>

            {loading ? (
              <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Loading assignments...</span>
              </div>
            ) : activeAssignments.length === 0 ? (
              <div className="p-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-500">
                Not currently assigned to any project (Core HR Organization-Wide Staff).
              </div>
            ) : (
              <div className="space-y-2">
                {activeAssignments.map((a) => (
                  <div
                    key={a._id}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      reassignFromId === a._id
                        ? 'bg-amber-50/80 border-amber-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {a.projectName || a.projectId?.name || 'Project'}
                        </span>
                        {(a.projectCode || a.projectId?.code) && (
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] border border-indigo-200">
                            {a.projectCode || a.projectId?.code}
                          </span>
                        )}
                        {a.isPrimary && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            Primary Project
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500">
                        Role: <strong className="text-slate-700">{a.roleInProject || 'Project Staff'}</strong> &bull; Allocation:{' '}
                        <strong className="text-slate-700">{a.allocationPercentage ?? 100}%</strong>
                        {a.startDate ? ` • From ${new Date(a.startDate).toLocaleDateString()}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                          setReassignFromId(reassignFromId === a._id ? '' : a._id);
                          setFormData((prev) => ({
                            ...prev,
                            roleInProject: a.roleInProject || prev.roleInProject,
                            allocationPercentage: a.allocationPercentage ?? 100,
                            isPrimary: Boolean(a.isPrimary),
                          }));
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                          reassignFromId === a._id
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        }`}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>{reassignFromId === a._id ? 'Reassigning...' : 'Reassign'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleRemoveAssignment(a)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition-colors cursor-pointer"
                        title="Remove from project without deleting employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign / Reassign Form */}
          <form onSubmit={handleAssignSubmit} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                {reassignFromId ? (
                  <>
                    <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                    <span>Reassign Employee to Another Project</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <span>Assign Employee to Project</span>
                  </>
                )}
              </h4>
              {reassignFromId && (
                <button
                  type="button"
                  onClick={() => setReassignFromId('')}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Cancel Reassign Mode
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.code}) — {p.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Role in Project
                </label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.roleInProject}
                    onChange={(e) => setFormData({ ...formData, roleInProject: e.target.value })}
                    placeholder="e.g. Field Coordinator, M&E Focal"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Allocation (%)
                </label>
                <div className="relative">
                  <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.allocationPercentage}
                    onChange={(e) => setFormData({ ...formData, allocationPercentage: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assignment Start Date
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Expected End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Mark as Primary Project Assignment</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assignment Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional justification, donor cost-share note, or responsibilities..."
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
                <span>{reassignFromId ? 'Confirm Project Reassignment' : 'Assign to Project'}</span>
              </button>
            </div>
          </form>

          {/* Assignment History */}
          {historyAssignments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h4 className="font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Assignment History ({historyAssignments.length})</span>
              </h4>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
                {historyAssignments.map((h) => (
                  <div key={h._id} className="py-2.5 flex items-center justify-between gap-2 text-[11px] text-slate-600">
                    <div>
                      <span className="font-bold text-slate-800">{h.projectName || h.projectId?.name || 'Project'}</span>
                      <span className="mx-1.5">&bull;</span>
                      <span>{h.roleInProject || 'Staff'} ({h.allocationPercentage ?? 100}%)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 uppercase text-[10px]">
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
