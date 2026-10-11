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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-3 bg-brand-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {unreadCount} New
              </span>
            )}
          </h2>
          <p className="text-gray-500 mt-1">Your central hub for alerts and updates.</p>
        </div>
        
        <div className="flex space-x-3">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm cursor-pointer"
            >
              Mark all as read
            </button>
          )}
          {user.role === 'SUPER_ADMIN' && (
            <button 
              onClick={handleSimulateAlert}
              disabled={pushing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gray-900 hover:bg-black transition-colors disabled:opacity-70 cursor-pointer"
            >
              {pushing ? <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" /> : <Send className="-ml-1 mr-2 h-4 w-4" />}
              Test Alert
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="flex justify-center items-center h-full p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">You're all caught up!</h3>
            <p className="text-gray-500 text-sm mt-1">No new notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`p-5 hover:bg-gray-50 transition-colors flex gap-4 ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
              >
                <div className="shrink-0 mt-1 cursor-pointer">
                  {notification.isRead ? (
                    <CheckCircle2 className="w-6 h-6 text-gray-300" />
                  ) : (
                    <Circle className="w-6 h-6 text-brand-500 fill-brand-50" />
                  )}
                </div>
                
                <div className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      {getIcon(notification.type)}
                      <h4 className={`text-sm ${!notification.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notification.title}
                      </h4>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-sm ml-7 ${!notification.isRead ? 'text-gray-800' : 'text-gray-500'}`}>
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
