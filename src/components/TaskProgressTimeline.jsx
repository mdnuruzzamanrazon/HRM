import React from 'react';
import { 
  CheckCircle2, Clock, AlertCircle, RefreshCw, 
  Send, Eye, FileText, Check, ShieldAlert
} from 'lucide-react';

/**
 * TaskProgressTimeline
 * Visual lifecycle progress tracker representing:
 * Assigned -> Accepted -> In Progress -> Submitted -> Under Review -> Revision Required (if applicable) -> Resubmitted -> Approved / Completed
 */
export default function TaskProgressTimeline({ task, className = '' }) {
  if (!task) return null;

  const status = task.status || 'AWAITING_ACCEPTANCE';
  const hasSubmissions = (task.submissions?.length || 0) > 0;
  const hasRevisions = status === 'REVISION_REQUIRED' || status === 'RESUBMITTED' || 
    task.submissions?.some(s => s.status === 'REVISION_REQUIRED');

  // Define structured lifecycle steps
  const steps = [
    {
      id: 'ASSIGNED',
      label: 'Assigned',
      description: 'Task assigned by HR',
      icon: FileText,
      isCompleted: true, // Always completed once task exists
      isCurrent: status === 'AWAITING_ACCEPTANCE',
      date: task.createdAt ? new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
    },
    {
      id: 'ACCEPTED',
      label: 'Accepted',
      description: 'Employee accepted task',
      icon: Check,
      isCompleted: task.acceptanceStatus === 'ACCEPTED' || status !== 'AWAITING_ACCEPTANCE',
      isCurrent: status === 'ACCEPTED',
      date: task.acceptedAt ? new Date(task.acceptedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
    },
    {
      id: 'IN_PROGRESS',
      label: 'In Progress',
      description: 'Active work in progress',
      icon: Clock,
      isCompleted: ['IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'RESUBMITTED', 'COMPLETED', 'APPROVED', 'DONE'].includes(status) && status !== 'ACCEPTED' && status !== 'AWAITING_ACCEPTANCE',
      isCurrent: status === 'IN_PROGRESS',
      date: null
    },
    {
      id: 'SUBMITTED',
      label: hasRevisions && status === 'RESUBMITTED' ? 'Resubmitted' : 'Submitted',
      description: hasSubmissions ? `${task.submissions.length} version(s) uploaded` : 'Work submitted',
      icon: Send,
      isCompleted: ['SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'RESUBMITTED', 'COMPLETED', 'APPROVED', 'DONE'].includes(status) && status !== 'IN_PROGRESS',
      isCurrent: status === 'SUBMITTED' || status === 'RESUBMITTED',
      date: task.submissions?.[0]?.submittedAt ? new Date(task.submissions[0].submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
    },
    {
      id: 'UNDER_REVIEW',
      label: 'Under Review',
      description: 'HR inspecting deliverables',
      icon: Eye,
      isCompleted: ['UNDER_REVIEW', 'COMPLETED', 'APPROVED', 'DONE'].includes(status),
      isCurrent: status === 'UNDER_REVIEW',
      date: null
    }
  ];

  // Insert Revision Required step if revision has occurred or is pending
  if (hasRevisions) {
    steps.push({
      id: 'REVISION_REQUIRED',
      label: 'Revision Required',
      description: 'Corrections requested by HR',
      icon: AlertCircle,
      isCompleted: status === 'RESUBMITTED' || status === 'COMPLETED' || status === 'APPROVED',
      isCurrent: status === 'REVISION_REQUIRED',
      isAlert: true,
      date: task.submissions?.find(s => s.status === 'REVISION_REQUIRED')?.reviewedAt ? 
        new Date(task.submissions.find(s => s.status === 'REVISION_REQUIRED').reviewedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null
    });
  }

  // Final Step: Approved / Completed
  steps.push({
    id: 'COMPLETED',
    label: 'Approved & Completed',
    description: 'Deliverables verified and accepted',
    icon: CheckCircle2,
    isCompleted: ['COMPLETED', 'APPROVED', 'DONE'].includes(status),
    isCurrent: ['COMPLETED', 'APPROVED', 'DONE'].includes(status),
    date: ['COMPLETED', 'APPROVED', 'DONE'].includes(status) && task.updatedAt ? 
      new Date(task.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null
  });

  return (
    <div className={`w-full py-4 ${className}`}>
      {/* Mobile Vertical Timeline */}
      <div className="md:hidden space-y-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-start gap-3 relative">
              {idx !== steps.length - 1 && (
                <div 
                  className={`absolute left-4 top-8 -bottom-2 w-0.5 ${
                    step.isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} 
                />
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                step.isCurrent
                  ? step.isAlert 
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                    : 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : step.isCompleted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-400 border border-slate-300'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${
                    step.isCurrent ? 'text-indigo-900 font-extrabold' : step.isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                  {step.date && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {step.date}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Horizontal Stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between relative">
          {/* Connector Line */}
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
          
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex-1 flex flex-col items-center text-center relative z-10 group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  step.isCurrent
                    ? step.isAlert
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-4 ring-amber-100 scale-110'
                      : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-100 scale-110'
                    : step.isCompleted
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-400 border-2 border-slate-300'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="mt-2.5 max-w-[120px]">
                  <p className={`text-xs font-bold leading-tight ${
                    step.isCurrent
                      ? step.isAlert ? 'text-amber-600' : 'text-indigo-600'
                      : step.isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </p>
                  {step.date ? (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{step.date}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{step.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
