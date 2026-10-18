import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Loader2, Shield, UserCheck, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      const user = await login({ ...data, portal: 'HR' });
      if (user?.role === 'EMPLOYEE') {
        navigate('/employee/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    }
  };

  const fillAdmin = () => {
    setValue('email', 'mdnuruzzamanrazon@gmail.com');
    setValue('password', 'ABCabc@123');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-2.5 shadow-lg shadow-slate-200/60 border border-slate-100 flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-105">
            <img 
              src="/cbdp-logo.png" 
              alt="CBDP Logo" 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-2">
            <Shield className="w-3.5 h-3.5" />
            HR & Management Portal
          </div>

          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Sign in to <span className="text-primary font-black">CBDP</span> HR
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Center for Development & Peace — Administration & HR
          </p>
        </div>

        {/* Quick Demo Credentials Fill */}
        <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100/80 rounded-xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Demo Admin Account
            </p>
            <p className="text-[11px] text-indigo-700 truncate">mdnuruzzamanrazon@gmail.com</p>
          </div>
          <button
            type="button"
            onClick={fillAdmin}
            className="flex-shrink-0 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Auto Fill
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl text-sm text-center leading-snug">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@cbdp.org"
                className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-shadow"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs sm:text-sm font-medium text-primary hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-shadow"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in to HR Portal'}
            </button>
          </div>

          {/* Switch to Employee Portal Link */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Are you an Employee looking for Self-Service?
            </p>
            <Link
              to="/employee/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Switch to Employee Portal &rarr;
            </Link>
          </div>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} CBDP &bull; Hope &bull; Dignity &bull; Resilience
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
