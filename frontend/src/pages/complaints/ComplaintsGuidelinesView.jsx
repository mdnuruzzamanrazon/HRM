import React from 'react';
import { 
  ShieldCheck, Lock, FileText, Users, AlertCircle, 
  CalendarCheck, CheckCircle2, BookOpen, Printer, ArrowRight,
  Clock, ShieldAlert, Award, ExternalLink, HelpCircle
} from 'lucide-react';

export default function ComplaintsGuidelinesView({ onOpenPrint, onSwitchToRegister }) {
  const guidelines = [
    {
      number: 1,
      title: 'Mandatory Recording of All Feedback',
      badge: 'Universal Intake',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'All complaints or feedback received through any complaints channel within the project must be recorded on this log.',
      operationalDetail: 'No informal or unrecorded feedback is permitted. Channels include Hotline Phone, SMS/WhatsApp, Email, In-Person walk-ins, Community Helpdesks, and Physical Suggestion Boxes.',
      responsibility: 'Intake Officer / HR Focal'
    },
    {
      number: 2,
      title: 'Joint Partner & Oxfam Ownership',
      badge: 'Accountability',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'The log must be maintained jointly by the Partner and Oxfam.',
      operationalDetail: 'Both organizations maintain shared oversight to guarantee impartiality, non-retaliation, and synchronized tracking across all field offices and implementation sites.',
      responsibility: 'Partner Executive Director & Oxfam Lead'
    },
    {
      number: 3,
      title: 'Prompt, Fair & Confidential Processing',
      badge: 'Safeguarding Standard',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'All complaints and feedback must be processed appropriately, promptly, and fairly, ensuring the utmost confidentiality, privacy, and safety of complainants and those affected.',
      operationalDetail: 'All allegations, particularly those concerning staff conduct, harassment, or safeguarding violations, are handled with strict privacy protocols and prompt investigation.',
      responsibility: 'Safeguarding & HR Committee'
    },
    {
      number: 4,
      title: 'Secure Storage & Privacy Protection',
      badge: 'Data Protection',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'The register must be stored securely to protect the confidentiality, privacy, and safety of complainants.',
      operationalDetail: 'Personally Identifiable Information (PII) including phone numbers, addresses, and disability statuses must be encrypted, access-restricted, and masked in general views.',
      responsibility: 'Data Protection & Systems Admin'
    },
    {
      number: 5,
      title: 'Monthly Hard Copy Filing',
      badge: 'Physical Archiving',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      description: 'Hard copies should be printed and filed monthly in a secure Complaints & Feedback folder.',
      operationalDetail: 'At the end of each calendar month, authorized HR personnel generate the verified monthly report, sign it jointly, and store it in the physical lockable complaints cabinet.',
      responsibility: 'HR Administrator'
    },
    {
      number: 6,
      title: 'Monthly ED & Focal Person Review',
      badge: 'Executive Oversight',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'The register must be reviewed monthly by the Partner\'s Executive Director (ED) and the relevant Oxfam focal persons to ensure open complaints and feedback are appropriately addressed, processed, closed, and kept up to date.',
      operationalDetail: 'The review session examines overdue cases (>30 days), evaluates appeal determinations, and signs off on formal closure vouchers.',
      responsibility: 'Executive Director (Partner) & Oxfam Focal'
    },
    {
      number: 7,
      title: 'Periodic Community & Vulnerable Group Consultations',
      badge: 'Beneficiary Inclusion',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      description: 'Beneficiaries and communities, especially marginalized and vulnerable people, should be consulted periodically to ensure the complaint and feedback mechanism is accessible, effective, confidential, and safe.',
      operationalDetail: 'Focus group discussions, accessibility audits for persons with disabilities, and multilingual communication ensures marginalized individuals can safely voice concerns.',
      responsibility: 'Community Engagement & Accountability Team'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner: Standard Overview */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Joint Accountability Framework
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs font-semibold text-slate-300">Partner &amp; Oxfam Humanitarian Standard</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Complaints &amp; Feedback Register — Operational Guidelines
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              This operational standard ensures that every beneficiary, community member, partner representative, 
              and staff member has safe, confidential, and accountable access to register grievances, feedback, 
              or inquiries without fear of retaliation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 flex-shrink-0">
            {onOpenPrint && (
              <button
                type="button"
                onClick={onOpenPrint}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Monthly Register Filing Sheet</span>
              </button>
            )}

            {onSwitchToRegister && (
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold border border-white/15 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Return to Active Register Log</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Guidelines Grid: 7 Standard Principles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Core Operating Procedures &amp; Accountability Mandate
            </h3>
            <p className="text-xs text-slate-500">
              Mandatory standards governing case intake, privacy, review cycles, and beneficiary safety.
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            7 Standards
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guidelines.map((g) => (
            <div 
              key={g.number}
              className={`p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                g.number === 7 ? 'md:col-span-2' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {g.number}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {g.title}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${g.badgeColor}`}>
                    {g.badge}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                  "{g.description}"
                </p>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {g.operationalDetail}
                </p>
              </div>

              <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Responsible Unit:</span>
                <span className="font-bold text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {g.responsibility}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Workflow Timeline Visualizer */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Monthly Operational Review &amp; Secure Filing Lifecycle
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">1</span>
            <h5 className="text-xs font-bold text-slate-900">Intake &amp; Logging</h5>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Log complaints received via Phone, Suggestion Box, Email, or In-Person within 24 hours.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">2</span>
            <h5 className="text-xs font-bold text-slate-900">30-Day Resolution Rule</h5>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              If unresolved past 30 days, mandatory delay reason and complainant notification must be documented.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">3</span>
            <h5 className="text-xs font-bold text-slate-900">Joint Monthly ED Review</h5>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Partner ED &amp; Oxfam Focal Person jointly review active, pending, and appealed cases monthly.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">4</span>
            <h5 className="text-xs font-bold text-slate-900">Physical Folder Archiving</h5>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Signed register sheets are printed and locked in the secure Complaints &amp; Feedback cabinet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
