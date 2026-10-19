import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, Lock, Eye, EyeOff, Shield, ShieldCheck, Sparkles, 
  CheckCircle2, AlertCircle, AlertTriangle, Loader2, Building2, 
  UserCheck, ArrowRight, MapPin, CreditCard, Users, Check
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid work email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function EmployeeLogin() {
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [portal, setPortal] = useState('EMPLOYEE');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const { 
    register, 
    handleSubmit, 
    setValue, 
    formState: { errors, isSubmitting } 
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem('cb_remembered_email');
    if (savedEmail) {
      setValue('email', savedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  const onSubmit = async (data) => {
    try {
      setError('');
      setLoginSuccess(false);

      if (rememberMe) {
        localStorage.setItem('cb_remembered_email', data.email);
        localStorage.setItem('cb_preferred_portal', portal);
      } else {
        localStorage.removeItem('cb_remembered_email');
      }

      const user = await login({ 
        email: data.email, 
        password: data.password, 
        portal, 
        rememberMe 
      });

      setLoginSuccess(true);

      setTimeout(() => {
        if (user?.role === 'EMPLOYEE' || portal === 'EMPLOYEE') {
          navigate('/employee/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 500);
    } catch (err) {
      setLoginSuccess(false);
      setError(
        err.response?.data?.message || 
        'Authentication failed. Please verify your email and password.'
      );
    }
  };

  const fillPreset = (type) => {
    setError('');
    setActivePreset(type);
    if (type === 'admin') {
      setPortal('HR');
      setValue('email', 'mdnuruzzamanrazon@gmail.com', { shouldValidate: true });
      setValue('password', 'ABCabc@123', { shouldValidate: true });
    } else {
      setPortal('EMPLOYEE');
      setValue('email', 'employee@cbdp.org', { shouldValidate: true });
      setValue('password', 'ABCabc@123', { shouldValidate: true });
    }
    setTimeout(() => setActivePreset(null), 1800);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-12 bg-slate-900 text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* ============================================================== */}
      {/* LEFT COLUMN: BRAND HERO & EMPLOYEE PORTAL SHOWCASE            */}
      {/* ============================================================== */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-10 xl:p-14 relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#06241b] to-[#0f172a] text-white border-r border-slate-800/60 shadow-2xl">
        
        {/* Ambient Decorative Lighting */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/25 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
        
        <div 
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '28px 28px'
          }}
        />

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white p-2 shadow-xl shadow-emerald-950/50 flex items-center justify-center border border-white/20 transition-transform duration-300 hover:scale-105">
              <img 
                src="/cbdp-logo.png" 
                alt="CBDP Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white font-heading">
                  CBDP <span className="text-emerald-400">Self-Service</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Employee Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Center for Development & Peace
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700/80 text-slate-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">GPS Geofence Verified</span>
          </div>
        </div>

        {/* Main Showcase Presentation */}
        <div className="relative z-10 my-auto py-12 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 mb-6 backdrop-blur-sm">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Employee Self-Service Experience</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15] font-heading">
            Your Workday, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-indigo-300">
              Simplified &amp; Connected.
            </span>
          </h1>

          <p className="mt-4 text-base text-slate-300/90 leading-relaxed">
            Clock in with precision GPS geofencing, submit leave applications, review monthly payslips, and collaborate on organizational tasks from any device.
          </p>

          {/* Key Feature Highlight Cards */}
          <div className="mt-8 grid gap-3.5">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80">
              <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  One-Tap GPS Attendance
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-semibold">Active</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                  Automatic location detection ensures instant clock-ins at your designated workplace campus.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80">
              <div className="p-2.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Digital Payslips &amp; Tax Summaries</h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                  View and download encrypted payslips with full salary, allowances, and tax withholding breakdowns.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80">
              <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Leave Requests &amp; Shift Rosters</h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                  Track real-time annual, sick, and casual leave balances with immediate manager approvals.
                </p>
              </div>
            </div>
          </div>

          {/* Metrics Strip */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div>
              <p className="text-lg font-extrabold text-white">Fast</p>
              <p className="text-[11px] text-slate-400">1-Click Clock-In</p>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <p className="text-lg font-extrabold text-white">100%</p>
              <p className="text-[11px] text-slate-400">Encrypted Data</p>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <p className="text-lg font-extrabold text-white">24/7</p>
              <p className="text-[11px] text-slate-400">Mobile Accessible</p>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-800/50 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} CBDP &bull; Hope &bull; Dignity &bull; Resilience</p>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Employee Gateway</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT COLUMN: AUTHENTICATION FORM                             */}
      {/* ============================================================== */}
      <div className="flex-1 lg:col-span-6 xl:col-span-5 flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-14 bg-slate-50 relative min-h-screen">
        
        <div className="w-full max-w-md my-auto relative z-10">

          {/* Mobile Header Branding */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-white p-2 shadow-lg shadow-slate-200/60 border border-slate-200/80 mb-3 items-center justify-center">
              <img 
                src="/cbdp-logo.png" 
                alt="CBDP Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
              CBDP <span className="text-emerald-600">Employee</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Staff Self-Service Gateway
            </p>
          </div>

          {/* Card Container */}
          <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl shadow-slate-200/70 border border-slate-200/80">
            
            {/* Portal Switcher Tabs */}
            <div className="mb-6">
              <div className="p-1 rounded-2xl bg-slate-100/90 border border-slate-200/70 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => { setPortal('HR'); setError(''); }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    portal === 'HR'
                      ? 'bg-white text-indigo-700 shadow-sm shadow-slate-200 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className={`w-3.5 h-3.5 ${portal === 'HR' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>HR &amp; Management</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setPortal('EMPLOYEE'); setError(''); }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    portal === 'EMPLOYEE'
                      ? 'bg-white text-emerald-700 shadow-sm shadow-slate-200 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className={`w-3.5 h-3.5 ${portal === 'EMPLOYEE' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>Employee Portal</span>
                </button>
              </div>
            </div>

            {/* Welcome Title */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
                  Employee Sign In
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Self-Service
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Access your personalized workspace, attendance check-in, and salary records.
              </p>
            </div>

            {/* Quick Demo Credentials */}
            <div className="mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Quick Demo Access
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Click to fill</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillPreset('employee')}
                  className={`p-2 rounded-xl text-left transition-all border text-xs cursor-pointer ${
                    activePreset === 'employee'
                      ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-emerald-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px]">Staff Employee</span>
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">employee@cbdp.org</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillPreset('admin')}
                  className={`p-2 rounded-xl text-left transition-all border text-xs cursor-pointer ${
                    activePreset === 'admin'
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400/20'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-indigo-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px]">Super Admin</span>
                    <Shield className="w-3 h-3 text-indigo-600" />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">mdnuruzzamanrazon@...</p>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Sign-in Notice</p>
                  <p className="text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Staff Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="employee@cbdp.org"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/20' 
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100 hover:border-slate-400'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/20' 
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-100 hover:border-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    Remember my email
                  </span>
                </label>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Encrypted</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || loginSuccess}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${
                    loginSuccess 
                      ? 'bg-emerald-600 shadow-emerald-500/25'
                      : portal === 'EMPLOYEE'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.99]'
                      : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.99]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : loginSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Signed In! Entering Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to {portal === 'EMPLOYEE' ? 'Employee Portal' : 'HR Portal'}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                HR Administrator or Management?{' '}
                <Link
                  to="/login"
                  className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Go to HR Management Gateway</span>
                  &rarr;
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center space-y-1">
            <p className="text-[11px] text-slate-400 font-medium">
              Protected by automated session tracking and zero-trust verification.
            </p>
            <p className="text-[10px] text-slate-400">
              Center for Development & Peace &bull; Bangladesh &amp; Global Operations
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
