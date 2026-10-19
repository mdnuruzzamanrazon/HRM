import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Clock, Calendar, CreditCard, 
  CalendarClock, Receipt, Megaphone, User, LogOut, 
  Menu, X, Bell, Shield, ArrowUpRight, ChevronRight,
  ShieldCheck, Sparkles, Building2, CheckSquare
} from 'lucide-react';
import { cn } from '../utils/cn';
import ErrorBoundary from '../components/ErrorBoundary';
import LogoutModal from '../components/LogoutModal';

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live Clock updater
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/employee/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const navSections = [
    {
      group: 'Portal Hub',
      items: [
        { name: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
        { name: 'My Tasks', href: '/employee/tasks', icon: CheckSquare },
        { name: 'Attendance & Hours', href: '/employee/attendance', icon: Clock },
        { name: 'Leave & Time Off', href: '/employee/leave', icon: Calendar },
      ]
    },
    {
      group: 'Compensation & Schedule',
      items: [
        { name: 'Payroll & Payslips', href: '/employee/payroll', icon: CreditCard },
        { name: 'Expense Claims', href: '/employee/expenses', icon: Receipt },
        { name: 'Shift & Roster', href: '/employee/shifts', icon: CalendarClock },
      ]
    },
    {
      group: 'Information & Account',
      items: [
        { name: 'Notice Board', href: '/employee/notices', icon: Megaphone },
        { name: 'My Profile & Settings', href: '/employee/profile', icon: User },
      ]
    }
  ];

  const allNavItems = navSections.flatMap(s => s.items);
  const currentItem = allNavItems.find(item => location.pathname === item.href || (item.href !== '/employee/dashboard' && location.pathname.startsWith(item.href)));
  const currentTitle = currentItem?.name || 'Employee Portal';

  const employeeName = user?.email?.split('@')[0] || 'Employee';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Modern Emerald Slate Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-slate-300 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-68 lg:z-auto lg:shadow-none flex-shrink-0 border-r border-slate-800/80",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950 flex-shrink-0">
          <Link to="/employee/dashboard" className="flex items-center gap-3 group min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-black/30 ring-1 ring-white/10 transition-transform group-hover:scale-105 flex-shrink-0 overflow-hidden">
              <img 
                src="/cbdp-logo.png" 
                alt="CBDP Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black text-lg tracking-wider text-white leading-tight">
                CBDP Portal
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                Self-Service Hub
              </span>
            </div>
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

        {/* Categorized Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
          {navSections.map((section) => (
            <div key={section.group} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                {section.group}
              </div>
              {section.items.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== '/employee/dashboard' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 group relative",
                      isActive
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-1 ring-white/15"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center min-w-0 gap-3">
                      <item.icon className={cn(
                        "h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-105",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                      )} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Quick Switch to HR Portal for Admin */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-800/80 px-1">
              <Link
                to="/dashboard"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-indigo-400 hover:bg-slate-850 hover:border-indigo-500/30 transition-all text-xs font-bold group shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>HR Admin Portal</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-xs font-black text-emerald-400 flex-shrink-0">
                {employeeName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate capitalize">{employeeName}</p>
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  {user?.role?.replace('_', ' ') || 'Employee'}
                </span>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setIsLogoutModalOpen(true)} 
              title="Sign out"
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors flex-shrink-0 cursor-pointer"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Enterprise Topbar Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 shadow-xs flex-shrink-0">
          <div className="flex items-center min-w-0 space-x-3">
            {/* Mobile Hamburger Button */}
            <button 
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Mobile Brand */}
            <Link to="/employee/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-white p-0.5 border border-slate-200 flex items-center justify-center shadow-xs overflow-hidden">
                <img src="/cbdp-logo.png" alt="CBDP" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">CBDP</span>
            </Link>

            {/* Breadcrumb Hierarchy */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="font-bold text-slate-500">Employee Hub</span>
              <span>/</span>
              <span className="font-semibold text-slate-800">{currentTitle}</span>
            </div>
          </div>

          {/* Top Right Utilities */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
            {/* Live Clock Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-mono font-semibold">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            {/* Admin Switcher */}
            {isAdmin && (
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>HR Admin</span>
              </Link>
            )}

            {/* Notice Bell */}
            <Link 
              to="/employee/notices" 
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative"
              title="Notices"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full ring-2 ring-white"></span>
            </Link>

            {/* User Profile Pill */}
            <div className="flex items-center pl-2 border-l border-slate-200">
              <Link to="/employee/profile" className="flex items-center gap-2.5 group">
                <div className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center justify-center transition-transform group-hover:scale-105">
                  {employeeName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px] capitalize">
                    {employeeName}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                    {user?.role?.replace('_', ' ') || 'Employee'}
                  </div>
                </div>
              </Link>

              <button 
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                title="Sign out"
                className="ml-2.5 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Main Workspace - Wide Desktop Optimized */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 custom-scrollbar">
          <div className="w-full max-w-[1640px] 2xl:max-w-[1760px] mx-auto space-y-6">
            <ErrorBoundary resetKey={location.pathname}>
              <Outlet />
            </ErrorBoundary>

            {/* Standard Enterprise Footer */}
            <footer className="mt-12 pt-5 pb-3 border-t border-slate-200 text-center text-xs text-slate-400">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <img src="/cbdp-logo.png" alt="CBDP" className="w-4 h-4 object-contain inline" />
                <span className="font-bold text-slate-700">CBDP Platform</span>
                <span>&bull;</span>
                <span>Employee Self-Service Enterprise System</span>
                <span>&bull;</span>
                <span className="text-slate-400">Hope • Dignity • Resilience</span>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => !isLoggingOut && setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        user={user}
        isLoading={isLoggingOut}
      />
    </div>
  );
}
