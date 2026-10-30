import React, { useState, useEffect } from 'react';
import { X, Users, Shield, Check, AlertCircle, Save, Lock } from 'lucide-react';
import api from '../../services/api';

const AVAILABLE_MODULES = [
  { id: 'RISK', name: 'Risk Register' },
  { id: 'COMPLAINTS', name: 'Complaints & Feedback' },
  { id: 'EVENTS', name: 'Event Tracker' },
  { id: 'BENEFICIARIES', name: 'Beneficiary Information' },
];

const resolveTargetUserId = (u) =>
  u?.userAccount?._id || u?.userAccount || u?.userId?._id || u?.userId || u?._id;

const resolveTargetEmail = (u) =>
  u?.userAccount?.email || u?.email || u?.workEmail || u?.personalDetails?.email || '';

const resolveDisplayName = (u) => {
  if (u?.name) return u.name;
  const fn = u?.firstName || u?.personalDetails?.firstName || '';
  const ln = u?.lastName || u?.personalDetails?.lastName || '';
  const full = `${fn} ${ln}`.trim();
  return full || resolveTargetEmail(u) || 'Staff Member';
};

export default function ProjectAssignModal({ isOpen, onClose, onSave, project }) {
  const [users, setUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [restrictAccess, setRestrictAccess] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setRestrictAccess(Boolean(project?.restrictAccess));
      if (project?.assignedUsers) {
        setAssignedUsers(
          project.assignedUsers.map(a => ({
            user: a.user?._id || a.user,
            userEmail: a.userEmail || a.user?.email || '',
            role: a.role || 'EDITOR',
            modules: a.modules || ['RISK', 'COMPLAINTS', 'EVENTS', 'BENEFICIARIES'],
          }))
        );
      } else {
        setAssignedUsers([]);
      }
      setError('');
    }
  }, [isOpen, project]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/employees', { params: { limit: 200 } });
      if (res.data?.data) {
        setUsers(
          res.data.data.filter(e => Boolean(resolveTargetUserId(e)) && Boolean(resolveTargetEmail(e)))
        );
      }
    } catch (err) {
      console.warn('Failed to load user list:', err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (!isOpen || !project) return null;

  const handleToggleUser = (userObj) => {
    const targetUserId = resolveTargetUserId(userObj);
    const targetEmail = resolveTargetEmail(userObj);

    const existingIndex = assignedUsers.findIndex(
      a =>
        String(a.user) === String(targetUserId) ||
        (targetEmail && a.userEmail?.toLowerCase() === targetEmail.toLowerCase())
    );

    if (existingIndex !== -1) {
      setAssignedUsers(assignedUsers.filter((_, idx) => idx !== existingIndex));
    } else {
      setAssignedUsers([
        ...assignedUsers,
        {
          user: targetUserId,
          userEmail: targetEmail,
          role: 'EDITOR',
          modules: ['RISK', 'COMPLAINTS', 'EVENTS', 'BENEFICIARIES'],
        }
      ]);
    }
  };

  const handleRoleChange = (userId, role) => {
    setAssignedUsers(prev =>
      prev.map(a => String(a.user) === String(userId) ? { ...a, role } : a)
    );
  };

  const handleToggleModule = (userId, moduleId) => {
    setAssignedUsers(prev =>
      prev.map(a => {
        if (String(a.user) !== String(userId)) return a;
        const currentModules = a.modules || [];
        const exists = currentModules.includes(moduleId);
        const newModules = exists
          ? currentModules.filter(m => m !== moduleId)
          : [...currentModules, moduleId];
        return { ...a, modules: newModules };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      await onSave(project._id, assignedUsers, restrictAccess);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update user assignments.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Manage Project Access: {project.name}
              </h3>
              <p className="text-xs text-slate-400">
                Assign authorized user accounts and module permissions ({project.code || 'PRJ'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-900 flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div>
                <p className="font-bold">Project-Level Authorization Policy</p>
                <p className="text-indigo-800/80 mt-0.5 leading-relaxed">
                  Super Admins and HR Admins retain system-wide governance access. Non-admin users only gain access according to their assigned project role and module permissions below.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={restrictAccess}
                  onChange={(e) => setRestrictAccess(e.target.checked)}
                  className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-indigo-950 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  Restrict access strictly to explicitly listed users (even when list is empty)
                </span>
              </label>
            </div>
          </div>

          {/* Assigned Members Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Assigned User Permissions ({assignedUsers.length})
            </h4>

            {assignedUsers.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No specific user permissions configured</p>
                <p className="mt-1">
                  {restrictAccess
                    ? 'Restricted mode active: only Super Admins and HR Admins can access this project.'
                    : 'Standard HR Manager/Officer roles have default workspace access until restricted.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedUsers.map((assignment) => (
                  <div
                    key={String(assignment.user)}
                    className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {assignment.userEmail?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{assignment.userEmail}</p>
                          <span className="text-[10px] text-slate-400">Authorized Project Member</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-bold text-slate-500">Project Role:</label>
                          <select
                            value={assignment.role}
                            onChange={(e) => handleRoleChange(assignment.user, e.target.value)}
                            className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="VIEWER">Viewer (Read Only)</option>
                            <option value="EDITOR">Editor (Can Create/Edit)</option>
                            <option value="MANAGER">Manager (Full Controls)</option>
                            <option value="ADMIN">Project Admin</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleUser({ _id: assignment.user, email: assignment.userEmail })}
                          className="text-xs text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer px-2 py-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Module permissions checkboxes */}
                    <div className="pt-2 border-t border-slate-200/70">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Permitted Project-Linked Modules:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {AVAILABLE_MODULES.map((mod) => {
                          const isChecked = (assignment.modules || []).includes(mod.id);
                          return (
                            <label
                              key={mod.id}
                              onClick={() => handleToggleModule(assignment.user, mod.id)}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>
                              <span className="truncate">{mod.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Users to Add */}
          <div className="space-y-3 pt-2 border-t border-slate-200/80">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Add Staff Accounts from Directory
            </h4>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 custom-scrollbar">
              {loadingUsers ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading directory...</div>
              ) : users.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No linked user accounts found.</div>
              ) : (
                users.map((u) => {
                  const targetUserId = resolveTargetUserId(u);
                  const targetEmail = resolveTargetEmail(u);
                  const displayName = resolveDisplayName(u);
                  const isAssigned = assignedUsers.some(
                    a =>
                      String(a.user) === String(targetUserId) ||
                      (targetEmail && a.userEmail?.toLowerCase() === targetEmail.toLowerCase())
                  );
                  return (
                    <div
                      key={u._id}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {targetEmail} &bull; {u.title || u.jobDetails?.title || u.jobDetails?.designation || 'Staff'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleUser(u)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          isAssigned
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                        }`}
                      >
                        {isAssigned ? 'Remove' : '+ Grant Access'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Permissions...' : 'Save Permissions'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
