import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { 
  Loader2, ArrowLeft, Mail, KeyRound, Lock, 
  ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff,
  RotateCw, Timer, Check, X, Shield, Sparkles
} from 'lucide-react';

const emailStepSchema = z.object({
  email: z.string().trim().min(1, 'Official email address is required').email('Please enter a valid official email address'),
});

const resetStepSchema = z.object({
  code: z.string().trim().length(6, 'Verification code must be exactly 6 digits').regex(/^\d{6}$/, 'Code must contain only digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
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
  
  // Independent visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeExpiresIn, setCodeExpiresIn] = useState(600); // 10 minutes in seconds
  const [resetSessionToken, setResetSessionToken] = useState('');
  
  // Unique form instance key to force a clean DOM remount on step changes,
  // permanently eliminating browser autofill persistence
  const [formKey, setFormKey] = useState(() => Date.now());

  // Form 1: Email entry
  const { 
    register: registerEmail, 
    handleSubmit: handleEmailSubmit, 
    reset: resetEmailForm,
    formState: { errors: emailErrors } 
  } = useForm({
    resolver: zodResolver(emailStepSchema),
    defaultValues: { email: '' },
    mode: 'onTouched'
  });

  // Form 2: 6-Digit Code + New Password + Confirm Password
  const { 
    register: registerReset, 
    handleSubmit: handleResetSubmit, 
    watch: watchReset,
    setValue: setResetValue,
    reset: resetResetForm,
    formState: { errors: resetErrors } 
  } = useForm({
    resolver: zodResolver(resetStepSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
    mode: 'onChange'
  });

  const watchedCode = watchReset('code') || '';
  const watchedNewPassword = watchReset('newPassword') || '';
  const watchedConfirmPassword = watchReset('confirmPassword') || '';

  // Password requirement checks for interactive feedback
  const hasMinLength = watchedNewPassword.length >= 6;
  const hasNumber = /\d/.test(watchedNewPassword);
  const hasLetter = /[a-zA-Z]/.test(watchedNewPassword);
  const passwordsMatch = watchedConfirmPassword.length > 0 && watchedNewPassword === watchedConfirmPassword;

  // On initial mount or refresh: strictly reset both forms to prevent browser or cached autofill
  useEffect(() => {
    resetEmailForm({ email: '' });
    resetResetForm({ code: '', newPassword: '', confirmPassword: '' });
    setFormKey(Date.now());
  }, [resetEmailForm, resetResetForm]);

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
      
      const res = await api.post('/auth/forgot-password', { email: normalizedEmail });
      
      setRegisteredEmail(normalizedEmail);
      setSuccessMsg(res.data?.message || `A 6-digit verification code has been dispatched to ${normalizedEmail}.`);
      if (res.data?.resetSessionToken) {
        setResetSessionToken(res.data.resetSessionToken);
      }
      
      // Strictly clean reset form state & generate a fresh DOM key
      resetResetForm({ code: '', newPassword: '', confirmPassword: '' });
      setFormKey(Date.now());
      setCodeExpiresIn(600); // 10 minutes countdown
      setResendCooldown(45); // 45 seconds cooldown before allowing resend
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to dispatch verification code. Please verify your email address.";
      setErrorMsg(msg);
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
      const res = await api.post('/auth/resend-code', { email: registeredEmail });
      setSuccessMsg(res.data?.message || `A fresh 6-digit verification code has been dispatched to ${registeredEmail}.`);
      if (res.data?.resetSessionToken) {
        setResetSessionToken(res.data.resetSessionToken);
      }
      // Clear code input when a fresh one is issued
      setResetValue('code', '', { shouldValidate: false });
      setCodeExpiresIn(600);
      setResendCooldown(45);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to resend verification code. Please try again shortly.");
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
        // Clear all form state
        resetResetForm({ code: '', newPassword: '', confirmPassword: '' });
        setStep(3);
        setSuccessMsg(res.data.message || 'Password has been successfully updated. You may now sign in with your new credentials.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'The verification code is incorrect or expired. Please check your email and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset back to Step 1 with a clean slate
  const handleBackToEmail = () => {
    resetResetForm({ code: '', newPassword: '', confirmPassword: '' });
    setErrorMsg('');
    setSuccessMsg('');
    setStep(1);
    setFormKey(Date.now());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900/95 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-slate-800">
      {/* Ambient background decoration */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-lg w-full relative z-10">
        
        {/* Card Container */}
        <div className="bg-white p-7 sm:p-10 rounded-3xl shadow-2xl shadow-black/40 border border-slate-200/80 backdrop-blur-xl transition-all">
          
          {/* Header Branding */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white p-2 shadow-md shadow-slate-200/60 border border-slate-100 flex items-center justify-center mb-4 transition-transform hover:scale-105">
              <img 
                src="/cbdp-logo.png" 
                alt="CBDP Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Visual Step Stepper */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                step === 1 ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500/30' : 'bg-slate-100 text-slate-500'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step > 1 ? 'bg-emerald-600 text-white' : (step === 1 ? 'bg-emerald-700 text-white' : 'bg-slate-300 text-slate-600')
                }`}>
                  {step > 1 ? '✓' : '1'}
                </span>
                <span>Email</span>
              </div>
              
              <div className="w-4 h-0.5 bg-slate-200" />
              
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                step === 2 ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500/30' : 'bg-slate-100 text-slate-500'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step > 2 ? 'bg-emerald-600 text-white' : (step === 2 ? 'bg-emerald-700 text-white' : 'bg-slate-300 text-slate-600')
                }`}>
                  {step > 2 ? '✓' : '2'}
                </span>
                <span>Verify &amp; Reset</span>
              </div>
              
              <div className="w-4 h-0.5 bg-slate-200" />
              
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                step === 3 ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500/30' : 'bg-slate-100 text-slate-500'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === 3 ? 'bg-emerald-700 text-white' : 'bg-slate-300 text-slate-600'
                }`}>
                  3
                </span>
                <span>Success</span>
              </div>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
              {step === 1 && 'Reset Account Password'}
              {step === 2 && 'Verify Code & Set Password'}
              {step === 3 && 'Password Reset Complete!'}
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
              {step === 1 && 'Enter your registered employee email address. We will send a secure 6-digit verification code directly to your Gmail inbox.'}
              {step === 2 && (
                <span>
                  Enter the 6-digit code issued for <strong className="text-slate-800 font-semibold">{registeredEmail}</strong> and set your new password.
                </span>
              )}
              {step === 3 && 'Your credentials have been securely updated. You may now sign in to your HRM account.'}
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

          {/* STEP 1: Email Request Form */}
          {step === 1 && (
            <form 
              key={`step1-${formKey}`}
              onSubmit={handleEmailSubmit(onEmailSubmit)} 
              className="space-y-5"
              autoComplete="off"
              noValidate
            >
              <div>
                <label 
                  htmlFor="staff-email-input" 
                  className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider"
                >
                  Registered Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    {...registerEmail('email')}
                    id="staff-email-input"
                    type="email"
                    autoComplete="email"
                    placeholder="e.g. nuruzzamanrazon62@gmail.com"
                    className={`w-full pl-10 pr-3.5 py-3 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      emailErrors.email 
                        ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' 
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                    }`}
                  />
                </div>
                {emailErrors.email && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {emailErrors.email.message}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-[11px] leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  A unique, single-use 6-digit verification code will be dispatched directly to your registered inbox. The code expires in 10 minutes.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-75 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Verification Email...</span>
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

          {/* STEP 2: Code Verification & Password Reset Form */}
          {step === 2 && (
            <form 
              key={`step2-${formKey}`}
              onSubmit={handleResetSubmit(onResetSubmit)} 
              className="space-y-4"
              autoComplete="off"
              noValidate
            >
              {/* HIDDEN DECOY INPUTS: Deflects browser autofill heuristics from prefilling saved credentials */}
              <div style={{ display: 'none' }} aria-hidden="true">
                <input type="text" name="decoy_username_trap" tabIndex={-1} autoComplete="off" defaultValue="" />
                <input type="password" name="decoy_password_trap" tabIndex={-1} autoComplete="off" defaultValue="" />
              </div>

              {/* Code Validity & Countdown Header */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <Timer className="w-4 h-4 text-emerald-600" />
                  <span>Code Validity:</span>
                </div>
                <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                  codeExpiresIn < 120 
                    ? 'text-rose-700 bg-rose-100 animate-pulse' 
                    : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                }`}>
                  ⏱ {formatTimer(codeExpiresIn)}
                </span>
              </div>

              {/* 1. 6-Digit Verification Code Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label 
                    htmlFor="security_verification_code" 
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    6-Digit Verification Code <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Numbers only</span>
                </div>
                
                <div className="relative">
                  <input
                    {...registerReset('code')}
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                    placeholder="• • • • • •"
                    value={watchedCode}
                    onChange={(e) => {
                      // Strictly sanitize non-digit characters and limit to 6 digits
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setResetValue('code', cleaned, { shouldValidate: true });
                    }}
                    className={`w-full px-3.5 py-3 text-center text-2xl tracking-[10px] font-mono font-black rounded-xl border bg-white text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal focus:outline-none focus:ring-2 transition-all ${
                      resetErrors.code 
                        ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' 
                        : (watchedCode.length === 6 
                            ? 'border-emerald-500 focus:ring-emerald-100 bg-emerald-50/10' 
                            : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100')
                    }`}
                  />
                  {watchedCode.length === 6 && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>
                {resetErrors.code && (
                  <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {resetErrors.code.message}
                  </p>
                )}
              </div>

              {/* 2. New Password Field */}
              <div>
                <label 
                  htmlFor="newPassword" 
                  className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider"
                >
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    {...registerReset('newPassword')}
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    placeholder="Minimum 6 characters"
                    className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      resetErrors.newPassword 
                        ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' 
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100'
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {resetErrors.newPassword && (
                  <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {resetErrors.newPassword.message}
                  </p>
                )}
              </div>

              {/* 3. Confirm New Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label 
                    htmlFor="confirmPassword" 
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  {watchedConfirmPassword.length > 0 && (
                    <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                      passwordsMatch ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {passwordsMatch ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>Must match</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <input
                    {...registerReset('confirmPassword')}
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    placeholder="Re-enter new password to verify"
                    className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                      resetErrors.confirmPassword 
                        ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20' 
                        : (passwordsMatch 
                            ? 'border-emerald-400 focus:border-emerald-600 focus:ring-emerald-100 bg-emerald-50/20' 
                            : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100')
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {resetErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {resetErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Password Quality Checklist */}
              {watchedNewPassword.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className={hasMinLength ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                      {hasMinLength ? '✓' : '•'}
                    </span>
                    <span className={hasMinLength ? 'text-slate-800 font-medium' : ''}>
                      At least 6 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className={hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                      {hasNumber ? '✓' : '•'}
                    </span>
                    <span className={hasNumber ? 'text-slate-800 font-medium' : ''}>
                      Contains at least one number
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className={hasLetter ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                      {hasLetter ? '✓' : '•'}
                    </span>
                    <span className={hasLetter ? 'text-slate-800 font-medium' : ''}>
                      Contains letters
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || codeExpiresIn === 0}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-75 active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying &amp; Saving New Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Save New Password &amp; Sign In</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Resend Code & Email Navigation */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isResending}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Verification Code'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer transition-colors"
                >
                  Change email address
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Password Updated Successfully</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Your new password is now active in the HRM platform. You can immediately log in with your updated credentials.
              </p>
              
              <div className="pt-3 grid gap-2.5">
                <Link
                  to="/employee/login"
                  className="inline-flex items-center justify-center w-full py-3 px-4 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 transition-all gap-1.5"
                >
                  <span>Sign In to Employee Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <span>Sign In to HR Management Portal</span>
                </Link>
              </div>
            </div>
          )}

          {/* Footer Back to Portal Links */}
          {step !== 3 && (
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center text-xs">
              <Link 
                to="/employee/login" 
                className="inline-flex items-center text-slate-500 hover:text-emerald-700 font-semibold transition-colors cursor-pointer gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign-In Gateway</span>
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
