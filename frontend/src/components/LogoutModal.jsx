import React, { useEffect, useRef } from 'react';
import { LogOut, X, Loader2, ShieldAlert } from 'lucide-react';

/**
 * LogoutModal - A sleek, modern confirmation popup for user logout.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is currently visible
 * @param {Function} props.onClose - Callback triggered to cancel logout (No option, backdrop click, Escape key)
 * @param {Function} props.onConfirm - Callback triggered to proceed with logout (Yes option)
 * @param {Object} [props.user] - Current logged in user object ({ email, role })
 * @param {boolean} [props.isLoading] - Loading state while logout request is processing
 */
export default function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  isLoading = false
}) {
  const cancelBtnRef = useRef(null);

  // Focus cancel button on open & handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    // Auto-focus the cancel button for safety
    const timer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';
  const roleDisplay = user?.role ? user.role.toLowerCase().replace('_', ' ') : 'Staff';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-xs animate-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      {/* Modal Dialog Card */}
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-modal-card transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Gradient Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-rose-400 to-indigo-600" />

        {/* Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-300"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7 pt-7 text-center">
          {/* Prominent Badge Icon */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 ring-8 ring-rose-50/70 flex items-center justify-center text-rose-600 shadow-xs mb-4.5">
            <LogOut className="w-7 h-7 stroke-[2.2] translate-x-0.5" />
          </div>

          {/* Heading and Description */}
          <h3 
            id="logout-dialog-title" 
            className="text-xl font-bold text-slate-900 tracking-tight"
          >
            Confirm Log Out
          </h3>
          <p 
            id="logout-dialog-desc" 
            className="text-sm text-slate-500 mt-2 px-1 leading-relaxed"
          >
            Are you sure you want to log out? Any unsaved changes in progress may be lost, and you will need to log back in to access the portal.
          </p>

          {/* Account Profile Preview */}
          {user && (
            <div className="mt-4.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-700 font-bold text-sm flex items-center justify-center border border-indigo-200 shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {user.email || 'Logged In Account'}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="capitalize font-medium text-slate-600">{roleDisplay}</span>
                  <span className="text-slate-300">•</span>
                  <span>CBDP Workforce</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons: Yes and No */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* No Option - Cancel */}
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              No, Stay Logged In
            </button>

            {/* Yes Option - Confirm Logout */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging out...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 stroke-[2.5]" />
                  <span>Yes, Log Out</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
