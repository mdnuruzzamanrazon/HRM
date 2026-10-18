import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Loader2, Plus, Calculator, ToggleLeft, ToggleRight, 
  Percent, ShieldCheck, CheckCircle2, AlertCircle, Sparkles,
  Layers, DollarSign, X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatSafeDate } from '../../utils/date';

const taxSchema = z.object({
  taxName: z.string().min(2, 'Name is required'),
  taxRate: z.number().min(0, 'Rate must be positive'),
  type: z.enum(['FIXED', 'PERCENTAGE']),
  description: z.string().optional(),
});

export default function TaxDashboard() {
  const { user } = useAuth();
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taxSchema),
    defaultValues: { type: 'PERCENTAGE' }
  });

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/taxes');
      setTaxes(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/taxes', data);
      reset();
      setIsModalOpen(false);
      fetchTaxes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create tax rule');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await api.put(`/taxes/${id}/toggle`, { isActive: !currentStatus });
      fetchTaxes();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  if (!['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE_OFFICER'].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <Calculator className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800">Restricted Access</h2>
        <p className="text-xs text-slate-400 max-w-sm mt-1">You do not possess the required financial officer clearances to view or adjust tax configurations.</p>
      </div>
    );
  }

  const activeTaxes = taxes.filter(t => (t.isActive ?? t.active ?? true));
  const percentageRules = taxes.filter(t => (t.type || 'PERCENTAGE') === 'PERCENTAGE');
  const fixedRules = taxes.filter(t => t.type === 'FIXED');

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Tax Rules & Statutory Deductions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure withholding parameters, progressive bracket definitions, and regulatory deduction rules.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-primary hover:bg-brand-700 shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
        >
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Create Statutory Rule
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Rules</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{taxes.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Rules</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">{activeTaxes.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Percentage Rules</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 mt-0.5">{percentageRules.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fixed Deductions</div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">{fixedRules.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Loading Tax Rules...</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75">
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-500">Tax Rule Name</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-500">Calculation Rate</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-500 hidden md:table-cell">Regulatory Description</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-500">Status</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-wider text-slate-500 text-right">Switch Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxes.map((tax) => {
                  const isTaxActive = tax.isActive ?? tax.active ?? true;
                  const rateVal = tax.taxRate ?? tax.rate ?? 0;
                  const typeVal = tax.type || 'PERCENTAGE';
                  return (
                    <tr key={tax._id} className={`hover:bg-slate-50/80 transition-colors ${!isTaxActive ? 'opacity-50' : ''}`}>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-slate-400 shrink-0" />
                          {tax.taxName || tax.name || 'Statutory Bracket'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          Created {formatSafeDate(tax.createdAt, 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm font-black text-slate-900 font-mono">
                          {typeVal === 'PERCENTAGE' ? `${rateVal}%` : `$${rateVal.toLocaleString()}`}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {typeVal}
                        </span>
                      </td>
                      <td className="py-4 px-6 hidden md:table-cell">
                        <div className="text-xs text-slate-600 max-w-sm truncate">
                          {tax.description || 'Standard corporate withholding deduction rule'}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isTaxActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {isTaxActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <button 
                          onClick={() => handleToggle(tax._id, isTaxActive)}
                          className={`inline-flex items-center transition-colors cursor-pointer ${
                            isTaxActive ? 'text-rose-600 hover:text-rose-700' : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                          title={isTaxActive ? 'Deactivate' : 'Activate'}
                        >
                          {isTaxActive ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7 text-slate-400" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {taxes.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-slate-400 text-xs">
                      No tax configurations found. Click "Create Statutory Rule" above to register a deduction.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200/80">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/75">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Create Statutory Tax Rule</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Tax Rule Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  {...register('taxName')} 
                  placeholder="e.g. State Income Tax" 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow" 
                />
                {errors.taxName && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.taxName.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Calculation Type</label>
                  <select 
                    {...register('type')} 
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-white focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Rate / Amount <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    {...register('taxRate', { valueAsNumber: true })} 
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow font-mono" 
                  />
                  {errors.taxRate && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.taxRate.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Description (Optional)</label>
                <textarea 
                  {...register('description')} 
                  rows={2} 
                  placeholder="Statutory citation, withholding notes..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none resize-none transition-shadow" 
                />
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-primary rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Provisioning...
                    </>
                  ) : (
                    'Register Tax Rule'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}