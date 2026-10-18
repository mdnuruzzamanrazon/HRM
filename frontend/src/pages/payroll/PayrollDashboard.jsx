import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Loader2, DollarSign, Download, CheckCircle, 
  CreditCard, TrendingUp, Calendar, AlertCircle, FileText, Check 
} from 'lucide-react';
import { format } from 'date-fns';

export default function PayrollDashboard() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateMonth, setGenerateMonth] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'EMPLOYEE' ? '/payroll/my' : '/payroll/all';
      const { data } = await api.get(endpoint);
      setPayslips(data.data || []);
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
      await fetchPayslips();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.put(`/payroll/${id}/status`, { status: 'PAID' });
      await fetchPayslips();
    } catch (err) {
      alert('Failed to mark as paid');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const totalDisbursed = payslips
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const totalPending = payslips
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + (p.netSalary || 0), 0);

  const filtered = payslips.filter(p => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Payroll & Compensations</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {payslips.length} Statements
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Execute monthly salary disbursement runs, calculate withholdings, and manage compensation payouts
          </p>
        </div>

        {/* Admin Run Payroll Action Toolbar */}
        {['SUPER_ADMIN', 'FINANCE_OFFICER'].includes(user.role) && (
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
            <input 
              type="month" 
              value={generateMonth}
              onChange={(e) => setGenerateMonth(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button 
              onClick={handleGenerate} 
              disabled={generating} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all text-xs cursor-pointer shadow-xs disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
              <span>Execute Payroll Run</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Disbursed</span>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(totalDisbursed)}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Settled salaries</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Pending Payouts</span>
            <div className="text-2xl font-black text-amber-600">{formatCurrency(totalPending)}</div>
            <span className="text-[11px] text-amber-600 font-medium">Awaiting disbursement</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Payslip Archive</span>
            <div className="text-2xl font-black text-slate-900">{payslips.length}</div>
            <span className="text-[11px] text-indigo-600 font-medium">Available statements</span>
          </div>
        </div>

        <div className="card-modern p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Average Salary</span>
            <div className="text-2xl font-black text-purple-600">
              {formatCurrency(payslips.length > 0 ? (totalDisbursed + totalPending) / payslips.length : 5200)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Across active contracts</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card-modern p-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {['ALL', 'PENDING', 'PAID'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? `All Periods (${payslips.length})` : st}
            </button>
          ))}
        </div>
      </div>

      {/* Payslips Table */}
      <div className="card-modern overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center p-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold text-slate-400">Loading payroll history...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-6">Employee Profile</th>
                  <th className="py-3.5 px-6">Pay Period</th>
                  <th className="py-3.5 px-6">Base Salary</th>
                  <th className="py-3.5 px-6">Allowances</th>
                  <th className="py-3.5 px-6">Deductions</th>
                  <th className="py-3.5 px-6">Net Payable</th>
                  <th className="py-3.5 px-6">Disbursement Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((slip) => {
                  const first = slip.employeeId?.personalDetails?.firstName || '';
                  const last = slip.employeeId?.personalDetails?.lastName || '';
                  const code = slip.employeeId?.employeeCode || 'CBDP-EMP';
                  const initials = `${first[0] || '?'}${last[0] || '?'}`;

                  return (
                    <tr key={slip._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{first} {last}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-bold text-slate-800">
                        {slip.payPeriod || (slip.year && slip.month ? new Date(slip.year, slip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'Pay Period')}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-medium text-slate-600">
                        {formatCurrency(slip.baseSalary)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-medium text-emerald-600">
                        +{formatCurrency(slip.allowances)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-medium text-rose-500">
                        -{formatCurrency(slip.deductions)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-black text-slate-900 text-sm">
                        {formatCurrency(slip.netSalary)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          slip.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {slip.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        {['SUPER_ADMIN', 'FINANCE_OFFICER'].includes(user.role) && slip.status === 'PENDING' ? (
                          <button
                            onClick={() => handleMarkPaid(slip._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark as Paid</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-16 text-center text-slate-400">
                      <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <h4 className="text-sm font-bold text-slate-700">No payslips found</h4>
                      <p className="text-xs text-slate-400 mt-1">Execute a payroll batch using the toolbar above.</p>
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
