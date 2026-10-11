import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Megaphone, Plus, Trash2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(noticeSchema),
    defaultValues: { priority: 'INFO' }
  });

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notices');
      setNotices(data.data);
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
    if (!window.confirm('Are you sure you want to remove this notice?')) return;
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
        return { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700', icon: <AlertTriangle className="w-5 h-5 text-red-600" /> };
      case 'IMPORTANT': 
        return { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', icon: <AlertCircle className="w-5 h-5 text-amber-600" /> };
      default: 
        return { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', icon: <Info className="w-5 h-5 text-blue-600" /> };
    }
  };

  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Digital Notice Board</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Company-wide announcements and organizational updates.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-brand-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Post Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {notices.map((notice) => {
            const styles = getPriorityStyles(notice.priority);
            return (
              <div key={notice._id} className={`rounded-xl shadow-xs border ${styles.border} overflow-hidden bg-white hover:shadow-md transition-shadow relative flex flex-col`}>
                <div className={`px-4 sm:px-5 py-3.5 sm:py-4 border-b ${styles.border} ${styles.bg} flex justify-between items-start`}>
                  <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 pr-6">
                    <div className="shrink-0">{styles.icon}</div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate">{notice.title}</h3>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDelete(notice._id)} className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors shrink-0 cursor-pointer" title="Delete notice">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="p-4 sm:p-5 flex-1">
                  <p className="text-gray-700 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{notice.content}</p>
                </div>
                <div className="px-4 sm:px-5 py-3 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs text-gray-500 gap-1 sm:gap-0">
                  <span className="font-medium text-gray-700 truncate">By {notice.authorId?.personalDetails?.firstName} {notice.authorId?.personalDetails?.lastName}</span>
                  <span className="text-[11px] text-gray-400">{format(new Date(notice.createdAt), 'MMM dd, yyyy • hh:mm a')}</span>
                </div>
              </div>
            );
          })}
          {notices.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 sm:p-16 bg-white border border-gray-200 rounded-xl text-center">
              <Megaphone className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900">No Announcements</h3>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">There are no active notices published at the moment.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Post Announcement</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Notice Title</label>
                <input {...register('title')} placeholder="e.g. Q4 All-Hands Meeting" className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm" />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Priority Level</label>
                <select {...register('priority')} className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white text-sm">
                  <option value="INFO">Information (Blue)</option>
                  <option value="IMPORTANT">Important (Amber)</option>
                  <option value="URGENT">Urgent (Red)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Message Content</label>
                <textarea {...register('content')} rows={5} placeholder="Write the full announcement here..." className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary resize-none text-sm" />
                {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>}
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center justify-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}