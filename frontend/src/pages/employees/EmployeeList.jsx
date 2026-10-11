import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data } = await api.get('/employees');
        setEmployees(data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filtered = employees.filter(e => 
    e.personalDetails.firstName.toLowerCase().includes(search.toLowerCase()) || 
    e.personalDetails.lastName.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Employees</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage your workforce directory and profiles.</p>
        </div>
        <Link 
          to="/employees/new" 
          className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors w-full sm:w-auto"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Employee
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-gray-200 bg-gray-50/80">
          <div className="relative w-full sm:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-shadow"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Join Date</th>
                  <th className="px-4 sm:px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-9 w-9 sm:h-10 sm:w-10">
                          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-primary font-bold text-xs sm:text-sm shadow-xs">
                            {emp.personalDetails.firstName?.[0]}{emp.personalDetails.lastName?.[0]}
                          </div>
                        </div>
                        <div className="ml-3 sm:ml-4 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {emp.personalDetails.firstName} {emp.personalDetails.lastName}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{emp.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{emp.jobDetails.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{emp.jobDetails.employmentType}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-md ${
                        emp.jobDetails.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {emp.jobDetails.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {format(new Date(emp.jobDetails.joinDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/employees/${emp._id}`} className="text-primary hover:text-brand-900 font-semibold p-1 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm">
                      No employees found matching your search.
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
