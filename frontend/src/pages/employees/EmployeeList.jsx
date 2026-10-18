import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Loader2, Users, Building, Mail, 
  Calendar, ChevronRight, Filter, ArrowUpDown, Eye 
} from 'lucide-react';
import api from '../../services/api';
import { formatSafeDate } from '../../utils/date';

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/employees');
        setEmployees(data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filtered = employees.filter(e => {
    const firstName = e.personalDetails?.firstName || '';
    const lastName = e.personalDetails?.lastName || '';
    const code = e.employeeCode || '';
    const matchesSearch = firstName.toLowerCase().includes(search.toLowerCase()) || 
      lastName.toLowerCase().includes(search.toLowerCase()) ||
      code.toLowerCase().includes(search.toLowerCase());

    const status = e.jobDetails?.status || 'ACTIVE';
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = employees.filter(e => (e.jobDetails?.status || 'ACTIVE') === 'ACTIVE').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Employee Directory</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {employees.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete workforce roster, departmental affiliations, and employment profile records
          </p>
        </div>

        <Link 
          to="/employees/new" 
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Employee</span>
        </Link>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="card-modern p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            placeholder="Search employees by name or employee code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto custom-scrollbar">
          {['ALL', 'ACTIVE', 'ON_LEAVE', 'INACTIVE'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? `All (${employees.length})` : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Table Container */}
      <div className="card-modern overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center p-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold text-slate-400">Loading directory...</span>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-6">Employee Profile</th>
                  <th className="py-3.5 px-6">Employee Code</th>
                  <th className="py-3.5 px-6">Role & Department</th>
                  <th className="py-3.5 px-6">Employment Status</th>
                  <th className="py-3.5 px-6 hidden lg:table-cell">Joined Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((emp) => {
                  const first = emp.personalDetails?.firstName || '';
                  const last = emp.personalDetails?.lastName || '';
                  const email = emp.personalDetails?.email || '';
                  const initials = `${first[0] || 'E'}${last[0] || 'M'}`;
                  const status = emp.jobDetails?.status || 'ACTIVE';

                  const statusStyles = {
                    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    ON_LEAVE: 'bg-amber-50 text-amber-700 border-amber-200',
                    INACTIVE: 'bg-rose-50 text-rose-700 border-rose-200'
                  };

                  return (
                    <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{first} {last}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{email || 'employee@cbdp.org'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-mono font-bold text-slate-700 text-xs">
                        {emp.employeeCode || 'CBDP-EMP'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">
                          {emp.jobDetails?.designation || emp.jobDetails?.title || 'Team Member'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {emp.jobDetails?.departmentId?.name || emp.jobDetails?.department || 'Operations'} &bull; {emp.jobDetails?.employmentType || 'Full-time'}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-slate-500 font-mono text-[11px] hidden lg:table-cell">
                        {formatSafeDate(emp.jobDetails?.joiningDate || emp.jobDetails?.joinDate, 'MMM dd, yyyy')}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <Link 
                          to={`/employees/${emp._id}`} 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Record</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <h4 className="text-sm font-bold text-slate-700">No employees match this filter</h4>
                      <p className="text-xs text-slate-400 mt-1">Try resetting your search query or status filter.</p>
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
