import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Loader2, ArrowLeft, User, Briefcase, Phone, MapPin, 
  Calendar, Building2, CalendarDays, Shield, Mail, CheckCircle2,
  Sparkles, BadgeCheck, FileText, Clock
} from 'lucide-react';
import { formatSafeDate } from '../../utils/date';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const { data } = await api.get(`/employees/${id}`);
        setEmployee(data.data);
      } catch (err) {
        console.error(err);
        alert('Failed to load employee details');
        navigate('/employees');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-9 h-9 animate-spin text-primary" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Loading Personnel File...</p>
      </div>
    );
  }

  if (!employee) return null;

  const { personalDetails = {}, jobDetails = {}, employeeCode, user: userAccount } = employee;
  const fullName = `${personalDetails.firstName || ''} ${personalDetails.lastName || ''}`.trim() || 'Employee Profile';

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link 
            to="/employees" 
            className="inline-flex items-center justify-center w-10 h-10 shrink-0 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 hover:text-primary transition-colors shadow-xs text-slate-500 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {fullName}
              </h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                jobDetails.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                jobDetails.status === 'ON_LEAVE' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                jobDetails.status === 'PROBATION' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {jobDetails.status || 'UNKNOWN'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Official enterprise workforce records, organizational identity, and background documentation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
            {employeeCode || 'EMP-UNKNOWN'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Contact Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-md border-4 border-white ring-4 ring-slate-100 uppercase mx-auto">
                {personalDetails.firstName?.charAt(0) || ''}{personalDetails.lastName?.charAt(0) || ''}
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 truncate">{fullName}</h3>
            <p className="text-xs font-bold text-primary mt-0.5">{jobDetails.title || 'Staff Member'}</p>
            <p className="text-xs text-slate-400 mt-1">{jobDetails.departmentId?.name || 'Operations Unit'}</p>

            <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</div>
                <div className="text-xs font-bold text-slate-700 mt-0.5 truncate">{jobDetails.employmentType || 'Full-Time'}</div>
              </div>
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Portal Login</div>
                <div className="text-xs font-bold text-emerald-600 mt-0.5 truncate">
                  {userAccount ? 'Enabled' : 'Pending'}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Contact Details</h4>
              <BadgeCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mr-3">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5 break-all">
                    {personalDetails.phone || 'No phone provided'}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mr-3">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5 break-all">
                    {userAccount?.email || employee.email || 'No email registered'}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mr-3">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contact Address</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5 break-words">
                    {personalDetails.contactAddress || 'No residential address on file'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employment Specs */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Employment Specifications</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">Section 01</span>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Employee Code
                  </dt>
                  <dd className="text-sm font-bold text-slate-900 font-mono">{employeeCode || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                    <Briefcase className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Designation / Title
                  </dt>
                  <dd className="text-sm font-bold text-slate-900">{jobDetails.title || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                    <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Department
                  </dt>
                  <dd className="text-sm font-bold text-slate-900">{jobDetails.departmentId?.name || 'General Operations'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                    <Shield className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Employment Type
                  </dt>
                  <dd className="text-sm font-bold text-slate-900">{jobDetails.employmentType || 'Standard Full-Time'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Date of Joining
                  </dt>
                  <dd className="text-sm font-bold text-slate-900">
                    {formatSafeDate(jobDetails.joinDate, 'MMM dd, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Work Shift
                  </dt>
                  <dd className="text-sm font-bold text-slate-900">Standard Corporate (09:00 - 17:00)</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Personal Record & Demographics</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">Section 02</span>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                    <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Date of Birth
                  </dt>
                  <dd className="text-sm font-bold text-slate-900">
                    {formatSafeDate(personalDetails.dob, 'MMM dd, yyyy', 'Not Provided')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</dt>
                  <dd className="text-sm font-bold text-slate-900">{personalDetails.gender || 'Not Specified'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Blood Group</dt>
                  <dd className="text-sm font-bold text-slate-900">{personalDetails.bloodGroup || 'Not Recorded'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
