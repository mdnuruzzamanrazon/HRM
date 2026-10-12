import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Loader2, CalendarClock, Plus, Users, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const shiftSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  startTime: z.string().min(4, 'Start time is required'),
  endTime: z.string().min(4, 'End time is required'),
});

export default function ShiftDashboard() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(shiftSchema)
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shiftsRes, assignRes] = await Promise.all([
        api.get('/shifts'),
        api.get('/shifts/assignments')
      ]);
      setShifts(shiftsRes.data.data);
      setAssignments(assignRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/shifts', data);
      reset();
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create shift');
    }
  };

  // Helper to calculate duration
  const getDuration = (start, end) => {
    if (!start || !end || typeof start !== 'string' || typeof end !== 'string') return '-';
    try {
      const [h1, m1] = start.split(':').map(Number);
      const [h2, m2] = end.split(':').map(Number);
      let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (isNaN(diff)) return '-';
      if (diff < 0) diff += 24 * 60; // overnight shift
      const hrs = Math.floor(diff / 60);
      return `${hrs}h`;
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Shift Management</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Configure organizational shifts and view rosters.</p>
        </div>
        {['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(user.role) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-brand-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Create Shift
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Shifts List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
            <CalendarClock className="w-5 h-5 mr-2 text-primary" /> Active Shifts
          </h3>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            shifts.map(shift => (
              <div key={shift._id} className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base">{shift.name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
                <div className="space-y-2 mt-4 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                    <span>{shift.startTime} - {shift.endTime} ({getDuration(shift.startTime, shift.endTime)})</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                    <span>{assignments.filter(a => a.shiftId?._id === shift._id).length} Assigned</span>
                  </div>
                </div>
              </div>
            ))
          )}
          {!loading && shifts.length === 0 && (
            <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm">
              No shifts configured.
            </div>
          )}
        </div>

        {/* Employee Roster */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" /> Employee Roster
          </h3>
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            {loading ? (
               <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200 text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                      <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned Shift</th>
                      <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Timings</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map(assignment => (
                      <tr key={assignment._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {assignment.employeeId?.personalDetails?.firstName} {assignment.employeeId?.personalDetails?.lastName}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{assignment.employeeId?.employeeCode}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {assignment.shiftId?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-sm text-gray-600">
                          {assignment.shiftId?.startTime} - {assignment.shiftId?.endTime}
                        </td>
                      </tr>
                    ))}
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-4 sm:px-6 py-12 text-center text-gray-500 text-sm">
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

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Create New Shift</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Shift Name</label>
                <input {...register('name')} placeholder="e.g. Morning Shift" className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm" />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" {...register('startTime')} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm" />
                  {errors.startTime && <p className="mt-1 text-xs text-red-500">{errors.startTime.message}</p>}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" {...register('endTime')} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm" />
                  {errors.endTime && <p className="mt-1 text-xs text-red-500">{errors.endTime.message}</p>}
                </div>
              </div>
              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center justify-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}