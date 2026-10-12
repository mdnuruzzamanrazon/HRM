import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { Loader2, CheckCircle2 } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      setStatus({ type: '', message: '' });
      const response = await api.post(`/auth/reset-password/${token}`, { password: data.password });
      setIsSuccess(true);
      setStatus({ type: 'success', message: response.data.message });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Invalid or expired token. Please try again.' 
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        {!isSuccess ? (
          <>
            <div className="text-center">
              <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Create new password
              </h2>
              <p className="mt-2 text-center text-xs sm:text-sm text-gray-600">
                Your new password must be secure and different from previously used passwords.
              </p>
            </div>
            
            <form className="mt-6 sm:mt-8 space-y-5 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {status.message && (
                <div className={`p-3.5 rounded-xl text-sm text-center ${status.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                  {status.message}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-shadow"
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    placeholder="••••••••"
                    className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-shadow"
                  />
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 transition-all shadow-md shadow-primary/20 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset password'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-4 sm:py-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Password reset</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-6">{status.message}</p>
            <p className="text-xs text-gray-400">Redirecting to login in a moment...</p>
          </div>
        )}
      </div>
    </div>
  );
}
