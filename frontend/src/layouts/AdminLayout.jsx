import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Users, Clock, Calendar, CreditCard, CalendarClock, Receipt, Calculator, MapPin, Megaphone, CheckSquare, Bell, Shield } from 'lucide-react';
import { cn } from '../utils/cn';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: Clock },
    { name: 'Leave Management', href: '/leave', icon: Calendar },
    { name: 'Payroll', href: '/payroll', icon: CreditCard },
    { name: 'Shift Management', href: '/shift', icon: CalendarClock },
    { name: 'Expense Management', href: '/expense', icon: Receipt },
    { name: 'Tax Management', href: '/tax', icon: Calculator },
    { name: 'Employee Tracking', href: '/tracking', icon: MapPin },
    { name: 'Digital Notice Board', href: '/noticeboard', icon: Megaphone },
    { name: 'Task Management', href: '/task', icon: CheckSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Security', href: '/security', icon: Shield },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-6 font-bold text-xl border-b border-slate-800">
          Nexus<span className="text-primary font-light">HR</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                location.pathname.startsWith(item.href)
                  ? "bg-primary text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
              {item.name}
            </Link>
          ))}
        </nav>
        
        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800 capitalize">
            {location.pathname.split('/')[1] || 'Dashboard'}
          </h1>
        </header>
        {/* Main Area */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
