import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Loader2, Megaphone, Plus, Trash2, AlertCircle, Info, 
  AlertTriangle, Search, Sparkles, Building2, Calendar, X 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatSafeDate } from '../../utils/date';

const noticeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  priority: z.enum(['INFO', 'IMPORTANT', 'URGENT']),
});

export default function NoticeBoard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(noticeSchema),
    defaultValues: { priority: 'INFO' }
  });

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notices');
      setNotices(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/notices', data);
      reset();
      setIsModalOpen(false);
      fetchNotices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post notice');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this notice from the board?')) return;
    try {
      await api.delete(`/notices/${id}`);
      fetchNotices();
    } catch (err) {
      alert('Failed to delete notice');
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'URGENT': 
        return { 
          badge: 'bg-rose-50 text-rose-700 border-rose-200', 
          border: 'border-rose-200/80',
          headerBg: 'bg-rose-50/50',
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" /> 
        };
      case 'IMPORTANT': 
        return { 
          badge: 'bg-amber-50 text-amber-700 border-amber-200', 
          border: 'border-amber-200/80',
          headerBg: 'bg-amber-50/50',
          icon: <AlertCircle className="w-4 h-4 text-amber-600" /> 
        };
      default: 
        return { 
          badge: 'bg-blue-50 text-blue-700 border-blue-200', 
          border: 'border-blue-200/80',
          headerBg: 'bg-blue-50/50',
          icon: <Info className="w-4 h-4 text-blue-600" /> 
        };
    }
  };

  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(user.role);

  const filteredNotices = notices.filter(n => {
    const matchPriority = priorityFilter === 'ALL' || (n.priority || 'INFO') === priorityFilter;
    const matchSearch = !searchQuery || 
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPriority && matchSearch;
  });

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Corporate Notice Board
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Publish enterprise-wide circulars, regulatory advisories, and organizational memos.
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-primary hover:bg-brand-700 shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Publish Notice
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Notices' },
            { id: 'URGENT', label: 'Urgent' },
            { id: 'IMPORTANT', label: 'Important' },
            { id: 'INFO', label: 'General Info' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPriorityFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                priorityFilter === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center text-slate-400 border border-slate-200/80">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-xs font-semibold uppercase tracking-wider">Syncing notice board...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotices.map((notice) => {
            const styles = getPriorityStyles(notice.priority);
            return (
              <div 
                key={notice._id} 
                className={`rounded-2xl shadow-xs border ${styles.border} overflow-hidden bg-white hover:shadow-md transition-shadow relative flex flex-col justify-between`}
              >
                <div>
                  <div className={`px-5 py-4 border-b border-slate-100 ${styles.headerBg} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles.badge}`}>
                        {styles.icon}
                        {notice.priority || 'INFO'}
                      </span>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(notice._id)} 
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer" 
                        title="Delete notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 text-base leading-snug mb-2">
                      {notice.title}
                    </h3>
                    <p className="text-slate-600 whitespace-pre-wrap text-xs leading-relaxed">
                      {notice.content}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 truncate pr-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-600 truncate">
                      {notice.authorId?.personalDetails?.firstName 
                        ? `${notice.authorId.personalDetails.firstName} ${notice.authorId.personalDetails.lastName || ''}` 
                        : (typeof notice.author === 'string' ? notice.author : 'HR Office')}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono shrink-0">
                    {formatSafeDate(notice.createdAt, 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredNotices.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-16 bg-white border border-slate-200/80 rounded-3xl text-center">
              <Megaphone className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-base font-black text-slate-800">No Announcements</h3>
              <p className="text-slate-400 text-xs mt-1">There are no active notices matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/80">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/75">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Publish Official Announcement</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Notice Title <span className="text-rose-500">*</span>
                </label>
                <input 
                  {...register('title')} 
                  placeholder="e.g. Q4 All-Hands Meeting & Holiday Schedule" 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow" 
                />
                {errors.title && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.title.message}</p>}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Priority Level</label>
                <select 
                  {...register('priority')} 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-white focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-shadow font-medium"
                >
                  <option value="INFO">Information (Standard Blue)</option>
                  <option value="IMPORTANT">Important (Amber Advisory)</option>
                  <option value="URGENT">Urgent (Red Priority)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Announcement Body <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  {...register('content')} 
                  rows={5} 
                  placeholder="Draft the complete administrative notice, venue details, or instructions..." 
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none resize-none transition-shadow" 
                />
                {errors.content && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.content.message}</p>}
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-primary rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center justify-center cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Circular'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}