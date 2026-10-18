import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Loader2, CalendarClock, Plus, Users, Clock, Edit, 
  Trash2, X, CheckCircle2, AlertCircle, Save, UserCheck, Shield
} from 'lucide-react';

export default function ShiftDashboard() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Modals state
  const [isCreateShiftModalOpen, setIsCreateShiftModalOpen] = useState(false);
  const [isEditShiftModalOpen, setIsEditShiftModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms state
  const [shiftForm, setShiftForm] = useState({
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    description: ''
  });

  const [editShiftForm, setEditShiftForm] = useState({
    id: '',
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    description: ''
  });

  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    shiftId: '',
    effectiveFrom: new Date().toISOString().split('T')[0]
  });

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shiftsRes, assignRes, empRes] = await Promise.all([
        api.get('/shifts'),
        api.get('/shifts/assignments'),
        api.get('/employees')
      ]);
      setShifts(shiftsRes.data.data || []);
      setAssignments(assignRes.data.data || []);
      setEmployees(empRes.data.data || []);
    } catch (err) {
      console.error(err);
      notify('error', 'Failed to load shift records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateShift = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/shifts', shiftForm);
      notify('success', 'New shift created successfully');
      setIsCreateShiftModalOpen(false);
      setShiftForm({
        name: '',
        startTime: '09:00',
        endTime: '17:00',
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        description: ''
      });
      await fetchData();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to create shift');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditShiftSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/shifts/${editShiftForm.id}`, {
        name: editShiftForm.name,
        startTime: editShiftForm.startTime,
        endTime: editShiftForm.endTime,
        description: editShiftForm.description
      });
      notify('success', 'Shift details updated successfully');
      setIsEditShiftModalOpen(false);
      await fetchData();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to update shift');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift? All associated assignments will also be deleted.')) return;
    try {
      await api.delete(`/shifts/${shiftId}`);
      notify('success', 'Shift deleted successfully');
      await fetchData();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to delete shift');
    }
  };

  const handleAssignShift = async (e) => {
    e.preventDefault();
    if (!assignForm.employeeId || !assignForm.shiftId) {
      notify('error', 'Please select both an employee and a shift');
      return;
    }
    setActionLoading(true);
    try {
      await api.post('/shifts/assignments', assignForm);
      notify('success', 'Shift assigned to employee');
      setIsAssignModalOpen(false);
      await fetchData();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to assign shift');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignId) => {
    if (!window.confirm('Are you sure you want to unassign this employee from the shift?')) return;
    try {
      await api.delete(`/shifts/assignments/${assignId}`);
      notify('success', 'Shift assignment removed');
      await fetchData();
    } catch (err) {
      notify('error', err.response?.data?.message || 'Failed to remove assignment');
    }
  };

  const openEditModal = (shift) => {
    setEditShiftForm({
      id: shift._id,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      description: shift.description || ''
    });
    setIsEditShiftModalOpen(true);
  };

  const getDuration = (start, end) => {
    if (!start || !end || typeof start !== 'string' || typeof end !== 'string') return '-';
    try {
      const [h1, m1] = start.split(':').map(Number);
      const [h2, m2] = end.split(':').map(Number);
      let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (isNaN(diff)) return '-';
      if (diff < 0) diff += 24 * 60;
      const hrs = Math.floor(diff / 60);
      return `${hrs}h`;
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium shadow-md transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Shift & Roster Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Configure corporate working schedules, operational windows, and staff rosters.</p>
        </div>
        {['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(user.role) && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button 
              onClick={() => {
                setAssignForm({
                  employeeId: employees[0]?._id || '',
                  shiftId: shifts[0]?._id || '',
                  effectiveFrom: new Date().toISOString().split('T')[0]
                });
                setIsAssignModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-primary" />
              <span>Assign Staff to Shift</span>
            </button>

            <button 
              onClick={() => setIsCreateShiftModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl text-white bg-primary hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Shift</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Shifts List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center">
              <CalendarClock className="w-4 h-4 mr-2 text-primary" /> Active Working Shifts
            </h3>
            <span className="text-xs font-bold text-slate-400">{shifts.length} configured</span>
          </div>

          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3">
              {shifts.map(shift => (
                <div key={shift._id} className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90 hover:border-primary/40 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{shift.name}</h4>
                      {shift.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{shift.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(shift)}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Edit Shift"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteShift(shift._id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Shift"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-slate-400">
                        <Clock className="w-3.5 h-3.5 mr-1.5" /> Timings
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {shift.startTime} - {shift.endTime} ({getDuration(shift.startTime, shift.endTime)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-slate-400">
                        <Users className="w-3.5 h-3.5 mr-1.5" /> Assigned
                      </span>
                      <span className="font-bold text-primary">
                        {assignments.filter(a => (a.shiftId?._id || a.shiftId) === shift._id).length} Personnel
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {shifts.length === 0 && (
                <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs">
                  No working shifts configured yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Employee Roster */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center">
              <Users className="w-4 h-4 mr-2 text-primary" /> Active Personnel Roster
            </h3>
            <span className="text-xs font-bold text-slate-400">{assignments.length} assigned</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                  <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
                    <tr>
                      <th className="px-6 py-3.5">Employee</th>
                      <th className="px-6 py-3.5">Assigned Shift</th>
                      <th className="px-6 py-3.5">Working Hours</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {assignments.map(assignment => {
                      const first = assignment.employeeId?.personalDetails?.firstName || '';
                      const last = assignment.employeeId?.personalDetails?.lastName || '';
                      const code = assignment.employeeId?.employeeCode || 'EMP';

                      return (
                        <tr key={assignment._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {first} {last}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">{code}</div>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {assignment.shiftId?.name || 'Standard Shift'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap font-mono text-slate-600">
                            {assignment.shiftId?.startTime} &ndash; {assignment.shiftId?.endTime}
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleRemoveAssignment(assignment._id)}
                              className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                              title="Unassign from Shift"
                            >
                              Unassign
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-xs">
                          No employees have been assigned to shifts yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE SHIFT MODAL */}
      {isCreateShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-primary" />
                <h3 className="text-base font-black text-slate-900">Create Work Shift</h3>
              </div>
              <button onClick={() => setIsCreateShiftModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Shift Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Regular Corporate, Morning Shift, Night Shift"
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional operational details"
                  value={shiftForm.description}
                  onChange={(e) => setShiftForm({ ...shiftForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateShiftModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold bg-primary text-white hover:bg-primary-hover rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Shift</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SHIFT MODAL */}
      {isEditShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Edit Shift Timings</h3>
              </div>
              <button onClick={() => setIsEditShiftModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditShiftSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Shift Name *</label>
                <input
                  type="text"
                  required
                  value={editShiftForm.name}
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={editShiftForm.startTime}
                    onChange={(e) => setEditShiftForm({ ...editShiftForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={editShiftForm.endTime}
                    onChange={(e) => setEditShiftForm({ ...editShiftForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={editShiftForm.description}
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditShiftModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN SHIFT MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                <h3 className="text-base font-black text-slate-900">Assign Staff to Shift</h3>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Target Employee *</label>
                <select
                  required
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.personalDetails?.firstName} {emp.personalDetails?.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Select Shift *</label>
                <select
                  required
                  value={assignForm.shiftId}
                  onChange={(e) => setAssignForm({ ...assignForm, shiftId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Shift...</option>
                  {shifts.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Effective Date *</label>
                <input
                  type="date"
                  required
                  value={assignForm.effectiveFrom}
                  onChange={(e) => setAssignForm({ ...assignForm, effectiveFrom: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold bg-primary text-white hover:bg-primary-hover rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}