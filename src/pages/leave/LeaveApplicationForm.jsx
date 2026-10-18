import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { 
  Loader2, ArrowLeft, Calendar, FileText, Send, 
  Sparkles, AlertCircle, Info, ShieldCheck 
} from 'lucide-react';

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
      setError(err.response?.data?.message || 'Failed to submit leave application. Please check remaining balance.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link 
          to="/leave" 
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Submit Leave Request
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Request scheduled PTO, sick leaves, or extended leaves for HR administrative approval.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              {error}
            </div>
          )}

          {/* Leave Type Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Category / Leave Type <span className="text-rose-500">*</span>
            </label>
            <select 
              {...register('leaveType')} 
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-white focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow font-medium"
            >
              <option value="ANNUAL_LEAVE">Annual Leave (Paid Time Off)</option>
              <option value="SICK_LEAVE">Sick Leave (Medical Certification)</option>
              <option value="MATERNITY_LEAVE">Maternity / Paternity Family Leave</option>
              <option value="UNPAID_LEAVE">Unpaid Absence / Special Leave</option>
            </select>
            {errors.leaveType && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.leaveType.message}</p>}
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Commencement Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input 
                  {...register('startDate')} 
                  type="date" 
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow" 
                />
              </div>
              {errors.startDate && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.startDate.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Conclusion Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input 
                  {...register('endDate')} 
                  type="date" 
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow" 
                />
              </div>
              {errors.endDate && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.endDate.message}</p>}
            </div>
          </div>

          {/* Justification / Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Reason & Context <span className="text-rose-500">*</span>
            </label>
            <textarea 
              {...register('reason')} 
              rows={4} 
              placeholder="State the purpose for this absence, contact arrangements, or hand-over notes..." 
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none resize-none transition-shadow" 
            />
            {errors.reason && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.reason.message}</p>}
          </div>

          {/* HR Note */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>
              Leave approvals are reviewed by HR Administration according to your company holiday calendar and accrued leave entitlements.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-slate-100">
            <Link 
              to="/leave" 
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
                  Submitting Request...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Dispatch Leave Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
