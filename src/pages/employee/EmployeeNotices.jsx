import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Bell, Pin, Calendar, Tag, Search, AlertCircle, 
  Loader2, Filter, Sparkles, Building2, CheckCircle2 
} from 'lucide-react';

export default function EmployeeNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notices');
      if (res.data?.success) {
        setNotices(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Notices' },
    { id: 'ANNOUNCEMENT', label: 'Announcements' },
    { id: 'POLICY', label: 'Policies' },
    { id: 'EVENT', label: 'Events' },
    { id: 'URGENT', label: 'Urgent' }
  ];

  const filteredNotices = notices.filter(n => {
    const matchCategory = activeCategory === 'ALL' || (n.category || 'ANNOUNCEMENT').toUpperCase() === activeCategory;
    const matchSearch = !searchQuery || 
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="w-full space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Company Notices & Announcements
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Official communications, policy updates, and corporate events published by HR & Executive Management
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCategory === c.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200/80">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
          Loading company notice board...
        </div>
      ) : filteredNotices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotices.map((n) => {
            const isUrgent = n.isUrgent || n.category === 'URGENT';
            return (
              <div
                key={n._id}
                className={`bg-white rounded-2xl p-6 border transition-all hover:shadow-md flex flex-col justify-between ${
                  isUrgent ? 'border-rose-300 ring-1 ring-rose-200/60' : 'border-slate-200/80 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isUrgent
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {isUrgent ? <AlertCircle className="w-3 h-3 text-rose-500" /> : <Pin className="w-3 h-3 text-emerald-500" />}
                      {n.category || 'General'}
                    </span>

                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(n.publishedDate || n.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {n.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {n.content}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>HR Administration</span>
                  </div>
                  <span>CBDP Employee Portal</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200/80 space-y-2">
          <Bell className="w-8 h-8 mx-auto text-slate-300" />
          <h4 className="text-sm font-bold text-slate-700">No notices found</h4>
          <p className="text-xs text-slate-400">Try adjusting your category filter or search keywords.</p>
        </div>
      )}

    </div>
  );
}
