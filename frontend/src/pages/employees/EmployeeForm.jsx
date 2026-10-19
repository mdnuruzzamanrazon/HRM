import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { 
  Loader2, ArrowLeft, UserPlus, User, Briefcase, Mail, 
  Calendar, Hash, KeyRound, ShieldCheck, CheckCircle2,
  Building, Phone, MapPin, AlertCircle
} from 'lucide-react';

const DEPARTMENTS = [
  'Engineering & Technology',
  'Human Resources',
  'Finance & Accounts',
  'Executive Management',
  'Operations & Logistics',
  'Marketing & Communications',
  'Product & Design',
  'Legal & Compliance'
];

const employeeSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required (min 2 characters)'),
  lastName: z.string().trim().min(2, 'Last name is required (min 2 characters)'),
  email: z.string().trim().email('A valid official email address is required (e.g. name@cbdp.org)'),
  employeeCode: z.string().trim().min(2, 'Employee ID / Code is required (min 2 characters)'),
  title: z.string().trim().min(2, 'Job title / designation is required'),
  department: z.string().trim().min(2, 'Please select or enter an official department'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR']),
  status: z.enum(['ACTIVE', 'PROBATION', 'INACTIVE']),
  joinDate: z.string().min(1, 'Date of joining is required'),
  phone: z.string().optional().or(z.literal('')),
  contactAddress: z.string().optional().or(z.literal('')),
  temporaryPassword: z.string().optional().or(z.literal('')),
  mustChangePassword: z.boolean().default(true),
});

export default function EmployeeForm() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      status: 'ACTIVE',
      employmentType: 'FULL_TIME',
      department: 'Engineering & Technology',
      joinDate: new Date().toISOString().split('T')[0],
      mustChangePassword: true,
      temporaryPassword: 'CBDP@123'
    }
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccessMsg('');
      const res = await api.post('/employees', data);
      if (res.data?.success) {
        setSuccessMsg(`Employee ${data.firstName} ${data.lastName} successfully registered in MongoDB! Redirecting...`);
        setTimeout(() => {
          navigate('/employees');
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register employee. Please check for duplicate email or employee ID.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link 
          to="/employees" 
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
            Onboard New Workforce Personnel
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Provision permanent database records, assign corporate department, and establish secure portal authentication credentials.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">
          
          {/* Notification Messages */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Personal Identity & Mandatory Official Email */}
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-heading">
                1. Personal Identity &amp; Portal Authentication Email
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  {...register('firstName')} 
                  placeholder="e.g. Sarah"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none transition-shadow ${
                    errors.firstName ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                  }`}
                />
                {errors.firstName && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  {...register('lastName')} 
                  placeholder="e.g. Jenkins"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none transition-shadow ${
                    errors.lastName ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                  }`}
                />
                {errors.lastName && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.lastName.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Official Email Address <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    Mandatory &bull; Used for Employee Portal Sign-In &amp; Password Recovery
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    {...register('email')} 
                    type="email" 
                    placeholder="e.g. sarah.jenkins@cbdp.org" 
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none transition-shadow font-mono ${
                      errors.email ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-rose-500 font-medium">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    {...register('phone')} 
                    placeholder="e.g. +880 1712-345678" 
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:border-indigo-600 focus:ring-indigo-100 focus:outline-none transition-shadow font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Residential / Office Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    {...register('contactAddress')} 
                    placeholder="e.g. Nabogram Road, Barishal" 
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:border-indigo-600 focus:ring-indigo-100 focus:outline-none transition-shadow"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Organizational Placement & Department */}
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-heading">
                2. Enterprise Department &amp; Position
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Employee ID / Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    {...register('employeeCode')} 
                    placeholder="e.g. CBDP-EMP-003" 
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none transition-shadow font-mono font-bold ${
                      errors.employeeCode ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                    }`}
                  />
                </div>
                {errors.employeeCode && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.employeeCode.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Official Department <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    {...register('department')}
                    className={`w-full pl-10 pr-8 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-900 bg-white focus:ring-2 focus:outline-none transition-shadow appearance-none cursor-pointer ${
                      errors.department ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                    }`}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                {errors.department && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.department.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Job Title / Designation <span className="text-rose-500">*</span>
                </label>
                <input 
                  {...register('title')} 
                  placeholder="e.g. Lead Software Architect" 
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:outline-none transition-shadow ${
                    errors.title ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                  }`}
                />
                {errors.title && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Employment Status <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 bg-white focus:ring-2 focus:border-indigo-600 focus:ring-indigo-100 focus:outline-none transition-shadow cursor-pointer"
                >
                  <option value="ACTIVE">ACTIVE (Authorized for Portal)</option>
                  <option value="PROBATION">PROBATION (Active Under Review)</option>
                  <option value="INACTIVE">INACTIVE (Access Suspended)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Contract Type <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('employmentType')}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 bg-white focus:ring-2 focus:border-indigo-600 focus:ring-indigo-100 focus:outline-none transition-shadow cursor-pointer"
                >
                  <option value="FULL_TIME">FULL_TIME (Permanent)</option>
                  <option value="PART_TIME">PART_TIME</option>
                  <option value="CONTRACTOR">CONTRACTOR / CONSULTANT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Date of Joining <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    {...register('joinDate')} 
                    type="date" 
                    className={`w-full pl-10 pr-3.5 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:outline-none transition-shadow ${
                      errors.joinDate ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-100'
                    }`}
                  />
                </div>
                {errors.joinDate && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.joinDate.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Initial Security & Portal Password Configuration */}
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-heading">
                3. Employee Portal Access &amp; Password Configuration
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Initial / Temporary Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input 
                      {...register('temporaryPassword')}
                      type="text"
                      placeholder="e.g. CBDP@123" 
                      className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:ring-2 focus:border-indigo-600 focus:ring-indigo-100 focus:outline-none transition-shadow font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Default is <code className="font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">CBDP@123</code>. Passwords are securely hashed with Argon2.
                  </p>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80 cursor-pointer select-none shadow-xs hover:border-indigo-300 transition-colors">
                    <input 
                      {...register('mustChangePassword')}
                      type="checkbox" 
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Require Password Change on First Login
                      </span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Prompts the employee to establish their private permanent password upon their initial sign-in.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Permanent database storage enabled: Newly registered personnel records and portal credentials persist across restarts and sessions.
                </span>
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
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 px-7 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-70 cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving to MongoDB &amp; Creating Portal Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Save Employee &amp; Activate Portal Credentials
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
