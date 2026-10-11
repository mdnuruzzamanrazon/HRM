import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { Loader2, ArrowLeft } from 'lucide-react';

const leaveSchema = z.object({
  leaveType: z.enum(['ANNUAL_LEAVE', 'SICK_LEAVE', 'MATERNITY_LEAVE', 'UNPAID_LEAVE']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Please provide a valid reason (min 10 characters)'),
});

export default function LeaveApplicationForm() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(leaveSchema),
    defaultValues: { leaveType: 'ANNUAL_LEAVE' }
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      await api.post('/leave/apply', data);
      navigate('/leave');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave application');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center mb-6">
        <Link to="/leave" className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Apply for Leave</h2>
          <p className="text-gray-500 mt-1">Submit a new time-off request.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
            <select {...register('leaveType')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white transition-shadow">
              <option value="ANNUAL_LEAVE">Annual Leave</option>
              <option value="SICK_LEAVE">Sick Leave</option>
              <option value="MATERNITY_LEAVE">Maternity/Paternity Leave</option>
              <option value="UNPAID_LEAVE">Unpaid Leave</option>
            </select>
            {errors.leaveType && <p className="mt-1 text-sm text-red-500">{errors.leaveType.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input {...register('startDate')} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-shadow" />
              {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input {...register('endDate')} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-shadow" />
              {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea {...register('reason')} rows={4} placeholder="Briefly explain the reason for your leave..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary resize-none transition-shadow" />
            {errors.reason && <p className="mt-1 text-sm text-red-500">{errors.reason.message}</p>}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Link to="/leave" className="bg-white border border-gray-300 rounded-lg py-2.5 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 mr-4 transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center items-center rounded-lg border border-transparent bg-primary py-2.5 px-5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
