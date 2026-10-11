import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Loader2, DollarSign, Download, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PayrollDashboard() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateMonth, setGenerateMonth] = useState('');

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'EMPLOYEE' ? '/payroll/my' : '/payroll/all';
      const { data } = await api.get(endpoint);
      setPayslips(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
    setGenerateMonth(format(new Date(), 'yyyy-MM'));
  }, [user.role]);

  const handleGenerate = async () => {
    if (!generateMonth) return alert('Select a month to generate payroll');
    const [year, month] = generateMonth.split('-');
    try {
      setGenerating(true);
      await api.post('/payroll/generate', { month: parseInt(month, 10), year: parseInt(year, 10) });
      fetchPayslips();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.put(`/payroll/${id}/status`, { status: 'PAID' });
      fetchPayslips();
    } catch (err) {
      alert('Failed to mark as paid');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll System</h2>
          <p className="text-gray-500 mt-1">Manage compensations, allowances, and payslips.</p>
        </div>
        
        {/* Admin controls */}
        {['SUPER_ADMIN', 'FINANCE_OFFICER'].includes(user.role) && (
          <div className="flex items-center space-x-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            <input 
              type="month" 
              value={generateMonth}
              onChange={(e) => setGenerateMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary transition-shadow"
            />
            <button 
              onClick={handleGenerate} 
              disabled={generating} 
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-70"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
              Run Payroll
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {user.role !== 'EMPLOYEE' && <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Earnings</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deductions</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Net Pay</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payslips.map((slip) => (
                  <tr key={slip._id} className="hover:bg-gray-50 transition-colors">
                    {user.role !== 'EMPLOYEE' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {slip.employeeId?.personalDetails?.firstName} {slip.employeeId?.personalDetails?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{slip.employeeId?.employeeCode}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {new Date(slip.year, slip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Base: {formatCurrency(slip.baseSalary)}</div>
                      <div className="text-xs text-emerald-600 mt-0.5">+ {formatCurrency(slip.allowances)} (Alw)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-rose-600 font-medium">
                        - {formatCurrency(slip.deductions)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(slip.netSalary)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md border ${getStatusColor(slip.status)}`}>
                        {slip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        {['SUPER_ADMIN', 'FINANCE_OFFICER'].includes(user.role) && slip.status === 'PENDING' && (
                          <button onClick={() => handleMarkPaid(slip._id)} className="text-emerald-600 hover:text-emerald-900 transition-colors" title="Mark as Paid">
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        <button className="text-gray-400 hover:text-primary transition-colors" title="Download Payslip (PDF)">
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {payslips.length === 0 && (
                  <tr>
                    <td colSpan={user.role !== 'EMPLOYEE' ? 7 : 6} className="px-6 py-12 text-center text-gray-500 text-sm">
                      No payslips generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
