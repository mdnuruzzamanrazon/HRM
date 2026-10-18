import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { 
  Loader2, ArrowLeft, UserPlus, User, Briefcase, Mail, 
  Calendar, Hash, Sparkles, ShieldCheck, CheckCircle2 
} from 'lucide-react';

const employeeSchema = z.object({
  firstName: z.string().min(2, 'First name is required (min 2 characters)'),
  lastName: z.string().min(2, 'Last name is required (min 2 characters)'),
  email: z.string().email('Invalid email address format').optional().or(z.literal('')),
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
      setError(err.response?.data?.message || 'Failed to onboard employee. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link 
          to="/employees" 
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Add New Personnel Record
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Provision official workforce credentials, designate operational title, and configure portal access.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              {error}
            </div>
          )}

          {/* Section 1: Personal Identity */}
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-5">
              <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Personal Identity & Contact
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  {...register('firstName')} 
                  placeholder="e.g. John"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow" 
                />
                {errors.firstName && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  {...register('lastName')} 
                  placeholder="e.g. Doe"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow" 
                />
                {errors.lastName && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.lastName.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Official Email Address <span className="text-slate-400 font-normal lowercase">(optional: enables automated portal login creation)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input 
                    {...register('email')} 
                    type="email" 
                    placeholder="e.g. john.doe@cbdp.org" 
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow" 
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Organizational Placement */}
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Job Details & Enterprise Placement
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Employee Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input 
                    {...register('employeeCode')} 
                    placeholder="e.g. CBDP-1005" 
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow font-mono" 
                  />
                </div>
                {errors.employeeCode && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.employeeCode.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Job Title / Designation <span className="text-rose-500">*</span>
                </label>
                <input 
                  {...register('title')} 
                  placeholder="e.g. Senior Systems Analyst" 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow" 
                />
                {errors.title && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.title.message}</p>}
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Date of Joining <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input 
                    {...register('joinDate')} 
                    type="date" 
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow" 
                  />
                </div>
                {errors.joinDate && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.joinDate.message}</p>}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 border-t border-slate-100">
            <Link 
              to="/employees" 
              className="w-full sm:w-auto inline-flex justify-center items-center bg-white border border-slate-300 rounded-xl py-2.5 px-5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl bg-primary py-2.5 px-6 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Registering Personnel...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Complete Personnel Onboarding
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
