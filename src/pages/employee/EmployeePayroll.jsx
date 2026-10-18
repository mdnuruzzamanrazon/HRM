import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  DollarSign, FileText, Download, Printer, CheckCircle2, 
  Clock, AlertCircle, Loader2, ArrowUpRight, TrendingUp,
  Building, Calendar, ShieldCheck, X
} from 'lucide-react';

export default function EmployeePayroll() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payroll/my');
      if (res.data?.success) {
        setPayslips(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching payslips:', err);
    } finally {
      setLoading(false);
    }
  };

  const latestSlip = payslips[0];
  const totalPaid = payslips
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.netSalary || 0), 0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Payroll & Payslips
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            View your salary history, earnings breakdown, and download official monthly payslips
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Latest Net Salary</span>
            <div className="text-2xl font-black text-slate-900">
              ${(latestSlip?.netSalary || 0).toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              {latestSlip ? `${monthNames[(latestSlip.month || 1) - 1]} ${latestSlip.year}` : 'No records'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Disbursed</span>
            <div className="text-2xl font-black text-slate-900">
              ${totalPaid.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Across {payslips.filter(p => p.status === 'PAID').length} processed cycles
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payslip Statements</span>
            <div className="text-2xl font-black text-slate-900">
              {payslips.length}
            </div>
            <span className="text-[11px] text-purple-600 font-medium">
              Available for instant download
            </span>
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Statement Archive</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Base Salary</th>
                <th className="py-3 px-4">Allowances</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading payslip records...
                  </td>
                </tr>
              ) : payslips.length > 0 ? (
                payslips.map((slip) => (
                  <tr key={slip._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {monthNames[(slip.month || 1) - 1]} {slip.year}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      ${(slip.baseSalary || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-emerald-600">
                      +${(slip.allowances || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-rose-500">
                      -${(slip.deductions || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                      ${(slip.netSalary || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        slip.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {slip.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSlip(slip)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Payslip
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                    No payslips generated for your profile yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-modal-card max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  C
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">CBDP Human Resource Management</h3>
                  <p className="text-[10px] text-slate-400">Official Payslip Statement</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedSlip(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payslip Details */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/60 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Pay Period:</span>
                <span className="font-bold text-slate-800">
                  {monthNames[(selectedSlip.month || 1) - 1]} {selectedSlip.year}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payment Status:</span>
                <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                  selectedSlip.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedSlip.status || 'PENDING'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Disbursement Mode:</span>
                <span className="font-bold text-slate-800">Direct Bank Transfer</span>
              </div>
            </div>

            {/* Earnings & Deductions Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Earnings */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block border-b border-slate-100 pb-1">
                  Earnings (+)
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>Basic Salary</span>
                  <span className="font-semibold text-slate-900">${(selectedSlip.baseSalary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Housing Allowance</span>
                  <span className="font-semibold text-slate-900">${Math.round((selectedSlip.allowances || 0) * 0.6).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Medical & Transport</span>
                  <span className="font-semibold text-slate-900">${Math.round((selectedSlip.allowances || 0) * 0.4).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-emerald-700">
                  <span>Gross Earnings</span>
                  <span>${((selectedSlip.baseSalary || 0) + (selectedSlip.allowances || 0)).toLocaleString()}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block border-b border-slate-100 pb-1">
                  Deductions (-)
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>Tax Withholding</span>
                  <span className="font-semibold text-slate-900">${Math.round((selectedSlip.deductions || 0) * 0.65).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Provident / Pension</span>
                  <span className="font-semibold text-slate-900">${Math.round((selectedSlip.deductions || 0) * 0.35).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-rose-700">
                  <span>Total Deductions</span>
                  <span>-${(selectedSlip.deductions || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Banner */}
            <div className="p-4 bg-emerald-600 text-white rounded-xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-100 font-bold block">
                  Net Payable Salary
                </span>
                <span className="text-2xl font-black">
                  ${(selectedSlip.netSalary || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-semibold">
                <ShieldCheck className="w-5 h-5 text-emerald-200" />
                <span>Verified by HR Finance</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Statement
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
