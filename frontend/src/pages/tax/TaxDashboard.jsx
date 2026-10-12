import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Plus, Calculator, ToggleLeft, ToggleRight } from 'lucide-react';
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
      setTaxes(data.data);
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
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Calculator className="h-12 w-12 text-gray-300 mb-4" />
        <h2 className="text-xl font-medium text-gray-600">Access Denied</h2>
        <p className="text-gray-400">You do not have permission to view tax configurations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Tax Management</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Configure global tax brackets and deductions for payroll.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-brand-700 transition-colors w-full sm:w-auto"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Create Tax Rule
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tax Rule Name</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Description</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taxes.map((tax) => {
                  const isTaxActive = tax.isActive ?? tax.active ?? true;
                  const rateVal = tax.taxRate ?? tax.rate ?? 0;
                  const typeVal = tax.type || 'PERCENTAGE';
                  return (
                    <tr key={tax._id} className={`hover:bg-slate-50 transition-colors ${!isTaxActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 flex items-center">
                          <Calculator className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                          {tax.taxName || tax.name || 'Unnamed Tax'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Created {formatSafeDate(tax.createdAt, 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {typeVal === 'PERCENTAGE' ? `${rateVal}%` : `$${rateVal}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 capitalize">{typeVal.toLowerCase()}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 hidden md:table-cell">
                        <div className="text-xs sm:text-sm text-gray-600 max-w-xs truncate">{tax.description || 'Standard withholding tax rule'}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-md border ${isTaxActive ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {isTaxActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleToggle(tax._id, isTaxActive)}
                          className={`inline-flex items-center transition-colors cursor-pointer ${isTaxActive ? 'text-rose-600 hover:text-rose-900' : 'text-emerald-600 hover:text-emerald-900'}`}
                          title={isTaxActive ? 'Deactivate' : 'Activate'}
                        >
                          {isTaxActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {taxes.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 sm:px-6 py-12 text-center text-gray-500 text-sm">
                      No tax configurations found.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Create Tax Rule</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tax Rule Name</label>
                <input {...register('taxName')} placeholder="e.g. State Income Tax" className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm" />
                {errors.taxName && <p className="mt-1 text-xs text-red-500">{errors.taxName.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Calculation Type</label>
                  <select {...register('type')} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white text-sm">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Rate / Amount</label>
                  <input type="number" step="0.01" {...register('taxRate', { valueAsNumber: true })} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm" />
                  {errors.taxRate && <p className="mt-1 text-xs text-red-500">{errors.taxRate.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea {...register('description')} rows={2} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary resize-none text-sm" />
              </div>
              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center justify-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}