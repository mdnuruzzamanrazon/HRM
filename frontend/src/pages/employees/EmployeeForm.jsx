import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { Loader2, ArrowLeft } from 'lucide-react';

const employeeSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  employeeCode: z.string().min(2, 'Employee code is required'),
  title: z.string().min(2, 'Job title is required'),
  joinDate: z.string().min(1, 'Join date is required'),
});

export default function EmployeeForm() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(employeeSchema),
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      await api.post('/employees', data);
      navigate('/employees');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create employee');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/employees" className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">Add New Employee</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Create a new employee profile and account.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-lg text-sm">{error}</div>}
          
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input {...register('firstName')} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm transition-shadow" />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input {...register('lastName')} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm transition-shadow" />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Address (Optional: auto-creates login)</label>
                <input {...register('email')} type="email" placeholder="e.g. employee@nexushr.com" className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm transition-shadow" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Job Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                <input {...register('employeeCode')} placeholder="e.g. NX-1001" className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm transition-shadow" />
                {errors.employeeCode && <p className="mt-1 text-xs text-red-500">{errors.employeeCode.message}</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input {...register('title')} placeholder="e.g. Software Engineer" className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm transition-shadow" />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>
              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Join Date</label>
                <input {...register('joinDate')} type="date" className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm transition-shadow" />
                {errors.joinDate && <p className="mt-1 text-xs text-red-500">{errors.joinDate.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-100">
            <Link to="/employees" className="w-full sm:w-auto inline-flex justify-center items-center bg-white border border-gray-300 rounded-lg py-2.5 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg border border-transparent bg-primary py-2.5 px-6 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-70"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
