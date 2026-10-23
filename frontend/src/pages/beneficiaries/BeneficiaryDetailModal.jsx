import React from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  ShieldAlert,
  HeartHandshake,
  Clock,
  Building,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

export default function BeneficiaryDetailModal({ beneficiary, isOpen, onClose, onEdit }) {
  if (!isOpen || !beneficiary) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold text-xl shadow-inner">
              {beneficiary.name ? beneficiary.name.charAt(0).toUpperCase() : 'B'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">{beneficiary.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  beneficiary.sex === 'Female' 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : beneficiary.sex === 'Male'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  {beneficiary.sex || 'Unspecified'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {beneficiary.status || 'ACTIVE'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-1 font-mono">
                <span>ID: {beneficiary.beneficiaryId}</span>
                <span>•</span>
                <span>Sl No: {beneficiary.sl || 'N/A'}</span>
                <span>•</span>
                <span className="text-indigo-300 font-sans">{beneficiary.forumName}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Multi-Forum Representation Notice */}
          {beneficiary.crossForumMember && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-300/70 text-amber-900 flex items-start gap-3 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-amber-950 text-sm">
                  Multi-Forum Representative (Cross-Forum Member)
                </p>
                <p className="text-amber-800 mt-0.5">
                  This beneficiary is active across multiple project forums:
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {beneficiary.linkedForums?.map((forum, idx) => (
                    <span 
                      key={idx} 
                      className={`px-2.5 py-1 rounded-md font-medium text-xs shadow-xs ${
                        forum === beneficiary.forumName
                          ? 'bg-amber-600 text-white font-semibold'
                          : 'bg-white text-amber-900 border border-amber-300'
                      }`}
                    >
                      {forum} {forum === beneficiary.forumName && '(Current)'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Personal & Demographic Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Personal & Demographics
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Mother's Name:</span>
                  <span className="font-semibold text-slate-800">{beneficiary.motherName || 'Not recorded'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Age:</span>
                  <span className="font-semibold text-slate-800">{beneficiary.age ? `${beneficiary.age} Years` : 'Not recorded'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Occupation:</span>
                  <span className="font-semibold text-slate-800">{beneficiary.occupation || 'Not recorded'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Category:</span>
                  <span className="font-semibold text-slate-800">{beneficiary.category || 'Direct Beneficiary'}</span>
                </div>
              </div>
            </div>

            {/* Contact Details Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                Contact Details
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Primary Contact Number (Self):</span>
                  {beneficiary.contactNo ? (
                    <a 
                      href={`tel:${beneficiary.contactNo}`} 
                      className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      {beneficiary.contactNo}
                    </a>
                  ) : (
                    <span className="font-semibold text-slate-500">Not provided</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Alternative Contact Number:</span>
                  <span className="font-semibold text-slate-800">
                    {beneficiary.alternativeContactNo || 'None listed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Administrative Location Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                Administrative Location
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Division:</span>
                  <span className="font-semibold text-slate-800">{beneficiary.division || 'Barishal'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">District:</span>
                  <span className="font-semibold text-slate-800">{beneficiary.district || 'Barguna'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Upazila:</span>
                  <span className="font-semibold text-slate-800">{beneficiary.upazila || 'Amtoli'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Union / Pourashova:</span>
                  <span className="font-semibold text-slate-800">{beneficiary.union || 'Amtoli Sadar'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Village / Institution:</span>
                  <span className="font-semibold text-slate-800">{beneficiary.village || 'Not specified'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Detail Address:</span>
                  <span className="font-semibold text-slate-800">{beneficiary.detailAddress || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Social Inclusion & Vulnerability Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-purple-600" />
                Social Inclusion & Vulnerability
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Disability</span>
                  <span className={`inline-block mt-1 font-bold ${
                    beneficiary.disability === 'Yes' ? 'text-amber-600' : 'text-slate-700'
                  }`}>
                    {beneficiary.disability || 'No'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Adibashi</span>
                  <span className={`inline-block mt-1 font-bold ${
                    beneficiary.adibashi === 'Yes' ? 'text-indigo-600' : 'text-slate-700'
                  }`}>
                    {beneficiary.adibashi || 'No'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Dalit</span>
                  <span className={`inline-block mt-1 font-bold ${
                    beneficiary.dalit === 'Yes' ? 'text-purple-600' : 'text-slate-700'
                  }`}>
                    {beneficiary.dalit || 'No'}
                  </span>
                </div>
              </div>
              {beneficiary.remarks && (
                <div className="text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block font-medium">Remarks:</span>
                  <span className="text-slate-700 italic">{beneficiary.remarks}</span>
                </div>
              )}
            </div>

          </div>

          {/* Project & CSO Sponsorship Box */}
          <div className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Project / Programme</span>
              <span className="text-white font-semibold text-sm">{beneficiary.projectName || 'NAGORIC Project'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">CSO Name</span>
              <span className="text-indigo-300 font-medium">{beneficiary.csoName || 'Community Based Development Project (CBDP)'}</span>
            </div>
            {beneficiary.groupNameCode && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Group Name & Code</span>
                <span className="text-white font-mono">{beneficiary.groupNameCode}</span>
              </div>
            )}
          </div>

          {/* Audit Trail Section */}
          {beneficiary.auditTrail && beneficiary.auditTrail.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Audit Trail & History
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {beneficiary.auditTrail.slice().reverse().map((audit, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-medium text-slate-800">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                          {audit.action}
                        </span>
                        <span>{audit.performedBy || 'System'}</span>
                        {audit.role && <span className="text-slate-400 text-[11px]">({audit.role})</span>}
                      </div>
                      {audit.details && (
                        <p className="text-slate-600 mt-1 text-[11px]">{audit.details}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap ml-2">
                      {new Date(audit.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Created: {new Date(beneficiary.createdAt || Date.now()).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(beneficiary);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs"
              >
                Edit Beneficiary
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-xs"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
