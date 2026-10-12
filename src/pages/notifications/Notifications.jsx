import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Bell, CheckCircle2, Circle, Send, BellRing, Briefcase, FileText, Settings, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      setNotifications(data.data);
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
        title: `Test ${randomType} Alert`,
        message: 'This is an automated system notification pushed directly to your inbox.',
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
      case 'LEAVE': return <Briefcase className="w-5 h-5 text-amber-500" />;
      case 'PAYROLL': return <DollarSign className="w-5 h-5 text-emerald-500" />;
      case 'TASK': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'SYSTEM': return <Settings className="w-5 h-5 text-slate-500" />;
      default: return <BellRing className="w-5 h-5 text-indigo-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center tracking-tight">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-3 bg-brand-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                {unreadCount} New
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Your central hub for alerts and team updates.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="flex-1 sm:flex-none text-xs sm:text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors bg-white px-3.5 py-2 rounded-lg border border-gray-200 shadow-xs cursor-pointer text-center"
            >
              Mark all read
            </button>
          )}
          {user?.role === 'SUPER_ADMIN' && (
            <button 
              onClick={handleSimulateAlert}
              disabled={pushing}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg shadow-xs text-white bg-gray-900 hover:bg-black transition-colors disabled:opacity-70 cursor-pointer"
            >
              {pushing ? <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" /> : <Send className="-ml-1 mr-2 h-4 w-4" />}
              Test Alert
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-full p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 sm:p-20 text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900">You're all caught up!</h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">No new notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`p-4 sm:p-5 hover:bg-slate-50 transition-colors flex gap-3 sm:gap-4 ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
              >
                <div className="shrink-0 mt-0.5 cursor-pointer">
                  {notification.isRead ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
                  ) : (
                    <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500 fill-brand-50" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 cursor-pointer">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="shrink-0">{getIcon(notification.type)}</span>
                      <h4 className={`text-sm truncate ${!notification.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notification.title}
                      </h4>
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap pl-7 sm:pl-0">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm pl-7 ${!notification.isRead ? 'text-gray-800' : 'text-gray-500'} leading-relaxed`}>
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
