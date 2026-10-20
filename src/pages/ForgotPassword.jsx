import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { 
  Loader2, ArrowLeft, MailCheck, KeyRound, Lock, 
  ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff,
  RotateCw, Timer, Sparkles
} from 'lucide-react';

const emailStepSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid official email address'),
});

const resetStepSchema = z.object({
  code: z.string().trim().length(6, 'Verification code must be exactly 6 digits').regex(/^\d{6}$/, 'Code must contain only digits'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
  confirmPassword: z.string().min(6, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email entry, 2: Code & New Password, 3: Success
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeExpiresIn, setCodeExpiresIn] = useState(600); // 10 minutes in seconds
  const [showCredentialInput, setShowCredentialInput] = useState(false);
  const [manualCredential, setManualCredential] = useState('');
  const [sandboxCode, setSandboxCode] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [resetSessionToken, setResetSessionToken] = useState('');

  // Form 1: Email
  const { 
    register: registerEmail, 
    handleSubmit: handleEmailSubmit, 
    formState: { errors: emailErrors } 
  } = useForm({
    resolver: zodResolver(emailStepSchema),
    defaultValues: { email: '' }
  });

  // Form 2: Code + Password
  const { 
    register: registerReset, 
    handleSubmit: handleResetSubmit, 
    setValue: setResetValue,
    formState: { errors: resetErrors } 
  } = useForm({
    resolver: zodResolver(resetStepSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' }
  });

  // Countdown timer for 10-minute code expiry and resend cooldown
  useEffect(() => {
    let timer;
    if (step === 2) {
      timer = setInterval(() => {
        setCodeExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Step 1: Submit email to request code
  const onEmailSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const normalizedEmail = data.email.toLowerCase().trim();
      const payload = { 
        email: normalizedEmail,
        ...(manualCredential.trim() ? { credential: manualCredential.trim() } : {})
      };
      const res = await api.post('/auth/forgot-password', payload);
      
      setRegisteredEmail(normalizedEmail);
      setSuccessMsg(res.data?.message || 'A 6-digit verification code has been sent to your registered email address.');
      if (res.data?.resetSessionToken) {
        setResetSessionToken(res.data.resetSessionToken);
      }
      if (res.data?.sandboxCode) {
        setSandboxCode(res.data.sandboxCode);
        setResetValue('code', res.data.sandboxCode);
      }
      if (res.data?.previewUrl) {
        setPreviewUrl(res.data.previewUrl);
      }
      setCodeExpiresIn(600); // Reset 10-minute countdown
      setResendCooldown(45); // 45 seconds cooldown before allowing resend
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || "We couldn't send your verification code right now. Please try again later.";
      setErrorMsg(msg);
      setShowCredentialInput(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend code action
  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;
    try {
      setIsResending(true);
      setErrorMsg('');
      const res = await api.post('/auth/resend-code', { 
        email: registeredEmail,
        ...(manualCredential.trim() ? { credential: manualCredential.trim() } : {})
      });
      setSuccessMsg(res.data?.message || 'A 6-digit verification code has been sent to your registered email address.');
      if (res.data?.resetSessionToken) {
        setResetSessionToken(res.data.resetSessionToken);
      }
      if (res.data?.sandboxCode) {
        setSandboxCode(res.data.sandboxCode);
        setResetValue('code', res.data.sandboxCode);
      }
      if (res.data?.previewUrl) {
        setPreviewUrl(res.data.previewUrl);
      }
      setCodeExpiresIn(600);
      setResendCooldown(45);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "We couldn't send your verification code right now. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Submit code and set new password
  const onResetSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const res = await api.post('/auth/reset-password', {
        email: registeredEmail,
        code: data.code.trim(),
        newPassword: data.newPassword,
        resetSessionToken: resetSessionToken || undefined,
      });

      if (res.data?.success) {
        setStep(3);
        setSuccessMsg(res.data.message || 'Password has been successfully updated. You may now log in with your new credentials.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'The verification code is incorrect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900/95 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-slate-800">
      {/* Ambient background decoration */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        
        {/* Card Container */}
        <div className="bg-white p-7 sm:p-10 rounded-3xl shadow-2xl shadow-black/40 border border-slate-200/80">
          
          {/* Header Branding */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white p-2 shadow-md shadow-slate-200/60 border border-slate-100 flex items-center justify-center mb-3">
              <img 
                src="/cbdp-logo.png" 
                alt="CBDP Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
              {step === 1 && 'Reset Account Password'}
              {step === 2 && 'Verify Code & Set Password'}
              {step === 3 && 'Password Reset Complete!'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {step === 1 && 'Enter your registered work email to receive a secure 6-digit verification code.'}
              {step === 2 && `Enter the 6-digit code sent to ${registeredEmail} and choose a new password.`}
              {step === 3 && 'Your credentials have been securely updated. You can now sign in.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && step !== 3 && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* STEP 1: Email Form */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Registered Staff Email <span className="text-rose-500">*</span>
                </label>
                <input
                  {...registerEmail('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. employee@cbdp.org"
                  className={`w-full px-3.5 py-3 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    emailErrors.email ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                  }`}
                />
                {emailErrors.email && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{emailErrors.email.message}</p>
                )}
              </div>

              {/* Optional / Fallback Provider Connector */}
              {(showCredentialInput || Boolean(errorMsg)) ? (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-slate-800 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Live Gmail Delivery Setup
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCredentialInput(false)}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 underline"
                    >
                      Hide
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Enter your 16-character Google App Password or Resend API key to deliver the code directly to your Gmail inbox:
                  </p>
                  <input
                    type="text"
                    value={manualCredential}
                    onChange={(e) => setManualCredential(e.target.value)}
                    placeholder="16-character Google App Password (e.g. abcd efgh ijkl mnop)"
                    className="w-full px-3 py-2.5 text-xs font-mono rounded-xl border border-amber-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                  />
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <a 
                      href="https://myaccount.google.com/apppasswords" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      &rarr; Generate Google App Password
                    </a>
                    <a 
                      href="https://resend.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      &rarr; Or Get Resend Key
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCredentialInput(true)}
                    className="text-[11px] text-slate-500 hover:text-emerald-600 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Have a Google App Password? Click here to configure direct Gmail delivery</span>
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-75 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Account &amp; Sending Email...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Code & New Password Form */}
          {step === 2 && (
            <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
              
              {/* Timer Bar */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <Timer className="w-4 h-4 text-emerald-600" />
                  <span>Code Validity:</span>
                </div>
                <span className={`font-mono font-bold ${codeExpiresIn < 120 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatTimer(codeExpiresIn)}
                </span>
              </div>

              {/* Sandbox / Demo Code Notice */}
              {sandboxCode && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-amber-800">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      Sandbox / Demo Mode Code:
                    </span>
                    <span className="font-mono text-base font-black tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                      {sandboxCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Live SMTP credentials are not configured on the server, so this test code was generated. It has been auto-filled for you below.
                    {previewUrl && (
                      <a 
                        href={previewUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="ml-1 text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5"
                      >
                        Preview Generated Email &rarr;
                      </a>
                    )}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  6-Digit Verification Code <span className="text-rose-500">*</span>
                </label>
                <input
                  {...registerReset('code')}
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  className={`w-full px-3.5 py-2.5 text-center text-xl tracking-[8px] font-mono font-black rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 ${
                    resetErrors.code ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                  }`}
                />
                {resetErrors.code && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{resetErrors.code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    {...registerReset('newPassword')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    className={`w-full px-3.5 pr-10 py-2.5 text-sm rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 ${
                      resetErrors.newPassword ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {resetErrors.newPassword && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{resetErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  {...registerReset('confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 ${
                    resetErrors.confirmPassword ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                  }`}
                />
                {resetErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{resetErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || codeExpiresIn === 0}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-75 active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying &amp; Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Save New Password &amp; Finish</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Resend Code Section */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isResending}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 cursor-pointer disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Verification Code'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setErrorMsg(''); }}
                  className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Change email
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Your Password Has Been Updated</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your new password is now active in the system, and any previously active sessions have been invalidated for security.
              </p>
              
              <div className="pt-2 grid gap-2">
                <Link
                  to="/employee/login"
                  className="inline-flex justify-center w-full py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all"
                >
                  Sign In to Employee Portal
                </Link>
                <Link
                  to="/login"
                  className="inline-flex justify-center w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Sign In to HR Management Portal
                </Link>
              </div>
            </div>
          )}

          {/* Back to Login Link */}
          {step !== 3 && (
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              <Link 
                to="/employee/login" 
                className="inline-flex items-center text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Employee Portal</span>
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <span>HR Portal</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
