import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Loader2, ArrowLeft, User, Briefcase, Phone, MapPin, Calendar, Building, Building2, CalendarDays } from 'lucide-react';
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
    return <div className="flex items-center justify-center h-[calc(100vh-10rem)]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!employee) return null;

  const { personalDetails = {}, jobDetails = {}, employeeCode } = employee;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <Link to="/employees" className="inline-flex items-center justify-center w-10 h-10 shrink-0 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-primary transition-colors shadow-xs text-gray-500 cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
            Employee Profile
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">Detailed workforce records and background.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Overview */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 sm:p-6 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-brand-100 flex items-center justify-center text-2xl sm:text-3xl font-bold text-brand-700 mx-auto mb-4 border-4 border-white shadow-md uppercase">
              {personalDetails.firstName?.charAt(0) || ''}{personalDetails.lastName?.charAt(0) || ''}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{personalDetails.firstName} {personalDetails.lastName}</h3>
            <p className="text-xs sm:text-sm font-medium text-primary mt-1">{jobDetails.title || 'N/A'}</p>
            <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold border ${
              jobDetails.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
              jobDetails.status === 'ON_LEAVE' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
              jobDetails.status === 'PROBATION' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {jobDetails.status || 'UNKNOWN'}
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
             <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
               <h4 className="font-bold text-gray-900 text-sm">Contact Info</h4>
             </div>
             <div className="p-4 sm:p-5 space-y-4">
               <div className="flex items-start">
                 <Phone className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
                 <div className="text-sm text-gray-700 break-all">{personalDetails.phone || 'No phone provided'}</div>
               </div>
               <div className="flex items-start">
                 <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
                 <div className="text-sm text-gray-700 break-words">{personalDetails.contactAddress || 'No address provided'}</div>
               </div>
             </div>
          </div>
        </div>

        {/* Right Col - Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50/50 flex items-center">
              <Briefcase className="w-5 h-5 text-primary mr-3 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Employment Details</h3>
            </div>
            <div className="p-4 sm:p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 sm:gap-y-6">
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-1 flex items-center"><User className="w-4 h-4 mr-2" /> Employee Code</dt>
                  <dd className="text-sm font-bold text-gray-900">{employeeCode || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-1 flex items-center"><Building className="w-4 h-4 mr-2" /> Employment Type</dt>
                  <dd className="text-sm font-bold text-gray-900">{jobDetails.employmentType || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-1 flex items-center"><Calendar className="w-4 h-4 mr-2" /> Date of Joining</dt>
                  <dd className="text-sm font-bold text-gray-900">
                    {formatSafeDate(jobDetails.joinDate, 'MMM dd, yyyy')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gray-50/50 flex items-center">
              <User className="w-5 h-5 text-primary mr-3 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Personal Information</h3>
            </div>
            <div className="p-4 sm:p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 sm:gap-y-6">
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-1 flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Date of Birth</dt>
                  <dd className="text-sm font-bold text-gray-900">
                    {formatSafeDate(personalDetails.dob, 'MMM dd, yyyy', 'Not Provided')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
