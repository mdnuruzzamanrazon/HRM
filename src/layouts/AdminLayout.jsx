import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, LayoutDashboard, Users, Clock, Calendar, CreditCard, 
  CalendarClock, Receipt, Calculator, MapPin, Megaphone, CheckSquare, 
  Bell, Shield, Menu, X 
} from 'lucide-react';
import { cn } from '../utils/cn';
import ErrorBoundary from '../components/ErrorBoundary';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

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

  const currentTitle = navItems.find(item => location.pathname.startsWith(item.href))?.name || 
    (location.pathname.split('/')[1] ? location.pathname.split('/')[1].charAt(0).toUpperCase() + location.pathname.split('/')[1].slice(1) : 'Dashboard');

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop fixed sidebar + Mobile slide-over drawer) */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-64 lg:z-auto lg:shadow-none flex-shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 flex-shrink-0">
          <Link to="/dashboard" className="font-bold text-xl tracking-tight flex items-center">
            Nexus<span className="text-primary font-light">HR</span>
          </Link>
          <button 
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 group",
                  isActive
                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 mr-3 flex-shrink-0 transition-transform group-hover:scale-105",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                )} />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex-shrink-0">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="ml-3 flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.email || 'Logged In'}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.toLowerCase().replace('_', ' ') || 'User'}</p>
            </div>
            <button 
              onClick={handleLogout} 
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors ml-1 flex-shrink-0"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Responsive Header / Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-xs flex-shrink-0 z-10">
          <div className="flex items-center min-w-0">
            {/* Mobile Hamburger Button */}
            <button 
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 mr-2 sm:mr-3 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Title / Breadcrumb */}
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate tracking-tight">
              {currentTitle}
            </h1>
          </div>

          {/* Top Right Utilities */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <Link 
              to="/notifications" 
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
            </Link>

            {/* User Quick Info */}
            <div className="hidden sm:flex items-center pl-2 border-l border-gray-200">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center mr-2 border border-primary/20">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-xs font-semibold text-gray-700 max-w-[130px] truncate">
                {user?.email}
              </span>
            </div>

            {/* Mobile Logout */}
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors sm:hidden"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            <ErrorBoundary resetKey={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}

