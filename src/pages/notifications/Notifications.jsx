import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Loader2, Bell, CheckCircle2, Circle, Send, BellRing, 
  Briefcase, FileText, Settings, DollarSign, Sparkles, Filter, 
  Clock, ShieldAlert, CheckCheck
} from 'lucide-react';
import { formatSafeDistanceToNow } from '../../utils/date';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await api.put('/notifications/mark-all-read');
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleSimulateAlert = async () => {
    try {
      setPushing(true);
      const types = ['SYSTEM', 'LEAVE', 'PAYROLL', 'TASK', 'EXPENSE'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      await api.post('/notifications/push', {
        title: `Test ${randomType} Notification`,
        message: 'This is an enterprise automated alert dispatched via the event bus.',
        type: randomType
      });
      fetchNotifications();
    } catch (err) {
      alert('Failed to push notification');
    } finally {
      setPushing(false);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'LEAVE': 
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Briefcase className="w-5 h-5" />
          </div>
        );
      case 'PAYROLL': 
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <DollarSign className="w-5 h-5" />
          </div>
        );
      case 'TASK': 
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FileText className="w-5 h-5" />
          </div>
        );
      case 'SYSTEM': 
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
            <Settings className="w-5 h-5" />
          </div>
        );
      default: 
        return (
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <BellRing className="w-5 h-5" />
          </div>
        );
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const leaveCount = notifications.filter(n => n.type === 'LEAVE').length;
  const payrollCount = notifications.filter(n => n.type === 'PAYROLL').length;
  const systemCount = notifications.filter(n => n.type === 'SYSTEM').length;

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'UNREAD') return !n.isRead;
    if (filterType === 'LEAVE') return n.type === 'LEAVE';
    if (filterType === 'PAYROLL') return n.type === 'PAYROLL';
    if (filterType === 'SYSTEM') return n.type === 'SYSTEM';
    return true;
  });

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Enterprise Notification Feed
            </h2>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time organizational event dispatch, workflow triggers, and team activity streams.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs cursor-pointer transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              Mark All as Read
            </button>
          )}
          {user?.role === 'SUPER_ADMIN' && (
            <button 
              onClick={handleSimulateAlert}
              disabled={pushing}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black px-4 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-70 cursor-pointer"
            >
              {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Dispatch Test Alert
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Notices</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{notifications.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unread Alerts</div>
            <div className="text-xl font-black text-rose-600 mt-0.5">{unreadCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Approvals</div>
            <div className="text-xl font-black text-amber-600 mt-0.5">{leaveCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payroll Activity</div>
            <div className="text-xl font-black text-emerald-600 mt-0.5">{payrollCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {[
          { id: 'ALL', label: 'All Updates' },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
          { id: 'LEAVE', label: 'Leave' },
          { id: 'PAYROLL', label: 'Payroll' },
          { id: 'SYSTEM', label: 'System' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === tab.id
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications Container */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden min-h-[360px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Syncing Notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3 border border-slate-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-base font-black text-slate-900">Inbox Clear</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              You are completely up to date. There are no pending alerts under this category.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification._id} 
                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                className={`p-5 hover:bg-slate-50/80 transition-colors flex items-start gap-4 cursor-pointer ${
                  !notification.isRead ? 'bg-brand-50/20' : ''
                }`}
              >
                {getIcon(notification.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm ${!notification.isRead ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse"></span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {formatSafeDistanceToNow(notification.createdAt, { addSuffix: true })}
                    </span>
                  </div>

                  <p className={`text-xs ${!notification.isRead ? 'text-slate-700 font-medium' : 'text-slate-500'} leading-relaxed`}>
                    {notification.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
