import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export default function ForgotPassword() {
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      setStatus({ type: '', message: '' });
      const response = await api.post('/auth/forgot-password', data);
      setIsSuccess(true);
      setStatus({ type: 'success', message: response.data.message });
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Something went wrong. Please try again.' 
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        {!isSuccess ? (
          <>
            <div className="text-center">
              <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-2 shadow-md shadow-slate-200/60 border border-slate-100 flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-105">
                <img 
                  src="/cbdp-logo.png" 
                  alt="CBDP Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Reset your password
              </h2>
              <p className="mt-2 text-center text-xs sm:text-sm text-gray-600">
                Enter your registered CBDP email and we'll send you a secure link to reset your credentials.
              </p>
            </div>
            
            <form className="mt-6 sm:mt-8 space-y-5 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {status.message && (
                <div className={`p-3.5 rounded-xl text-sm text-center ${status.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                  {status.message}
                </div>
              )}
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-shadow"
                  placeholder="you@cbdp.org"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 transition-all shadow-md shadow-primary/20 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send reset link'}
                </button>
              </div>
              
              <div className="text-center mt-4">
                <Link to="/login" className="inline-flex items-center text-xs sm:text-sm font-medium text-primary hover:text-brand-700">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to login
                </Link>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-4 sm:py-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
              <MailCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-6">{status.message}</p>
            <Link 
              to="/login"
              className="inline-flex justify-center w-full py-2.5 sm:py-3 px-4 border border-gray-300 shadow-xs text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Return to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
