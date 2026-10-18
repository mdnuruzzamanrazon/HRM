import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isEmployee = user?.role === 'EMPLOYEE';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Your current account role (<span className="font-semibold text-slate-800">{user?.role || 'Guest'}</span>) does not have permission to view or manage this administrative resource.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          {isEmployee ? (
            <Link
              to="/employee/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-brand-700 transition-all shadow-md shadow-primary/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Employee Portal
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-brand-700 transition-all shadow-md shadow-primary/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to HR Management Dashboard
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of Account
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Center for Development & Peace (CBDP) &bull; Security & Access Control
          </p>
        </div>
      </div>
    </div>
  );
}
