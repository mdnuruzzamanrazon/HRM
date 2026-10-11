import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Clock, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../services/api';

function StatCard({ title, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 sm:p-5 lg:p-6 flex items-center transition-all hover:shadow-md">
      <div className={`p-3 sm:p-3.5 rounded-xl ${colorClass} mr-3.5 sm:mr-4 shrink-0 shadow-xs`}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</p>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mt-0.5">{value ?? 0}</h3>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard');
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-center my-6">
      Failed to load dashboard: {error}
    </div>
  );

  const stats = data?.stats || { totalEmployees: 0, presentToday: 0, onLeave: 0, pendingApprovals: 0 };
  const attendanceTrends = data?.attendanceTrends || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
            Welcome back, {user?.email ? user.email.split('@')[0] : 'Admin'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Here is a snapshot of your workforce activity today.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-6">
        <StatCard title="Total Employees" value={stats.totalEmployees} icon={Users} colorClass="bg-blue-600" />
        <StatCard title="Present Today" value={stats.presentToday} icon={CheckCircle} colorClass="bg-emerald-600" />
        <StatCard title="On Leave" value={stats.onLeave} icon={Calendar} colorClass="bg-amber-600" />
        <StatCard title="Pending Approvals" value={stats.pendingApprovals} icon={Clock} colorClass="bg-rose-600" />
      </div>
      
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xs border border-gray-100">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Attendance Trends</h3>
              <p className="text-xs text-gray-500">Weekly workforce check-in performance</p>
            </div>
         </div>
         <div className="h-60 sm:h-72 lg:h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} 
                />
                <Area type="monotone" dataKey="present" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
}
