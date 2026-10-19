import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TaskProgressTimeline from '../../components/TaskProgressTimeline';
import { 
  CheckSquare, Clock, AlertCircle, FileText, Send, 
  UploadCloud, Paperclip, MessageSquare, Download, 
  CheckCircle2, ArrowRight, Eye, RefreshCw, X, 
  Search, Filter, ChevronRight, User, Calendar, 
  AlertTriangle, Shield, Sparkles, Loader2, File, Image as ImageIcon, Archive
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export default function EmployeeTasks() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  
  // Selected task drawer state
  const [selectedTask, setSelectedTask] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Submission Form State
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState('');

  // Messaging State
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Action status message
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  const handleOpenTask = async (task) => {
    setSelectedTask(task);
    setSubmissionNotes('');
    setSelectedFiles([]);
    setSubmissionSuccess('');
    setMessageText('');
    setSearchParams({ taskId: task._id });

    // Fetch latest task version to ensure fresh messages and submissions
    try {
      setDrawerLoading(true);
      const res = await api.get(`/tasks/${task._id}`);
      if (res.data?.success) {
        setSelectedTask(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load task details:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedTask(null);
    searchParams.delete('taskId');
    setSearchParams(searchParams);
  };

  const fetchTasks = async (autoSelectId = null) => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      if (res.data?.success) {
        const fetchedTasks = res.data.data || [];
        setTasks(fetchedTasks);

        // Auto select task if query parameter exists or was passed
        const targetId = autoSelectId || searchParams.get('taskId');
        if (targetId) {
          const match = fetchedTasks.find(t => t._id === targetId);
          if (match) {
            handleOpenTask(match);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setActionMessage({ text: 'Failed to load task list. Please refresh.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Accept Task
  const handleAcceptTask = async (taskId) => {
    try {
      const res = await api.put(`/tasks/${taskId}/accept`);
      if (res.data?.success) {
        setActionMessage({ text: 'Task accepted successfully! You can now start working on it.', type: 'success' });
        await fetchTasks(taskId);
      }
    } catch (err) {
      setActionMessage({ text: err.response?.data?.message || 'Failed to accept task', type: 'error' });
    }
  };

  // Start Task
  const handleStartTask = async (taskId) => {
    try {
      const res = await api.put(`/tasks/${taskId}/start`);
      if (res.data?.success) {
        setActionMessage({ text: 'Task is now in progress.', type: 'success' });
        await fetchTasks(taskId);
      }
    } catch (err) {
      setActionMessage({ text: err.response?.data?.message || 'Failed to update task', type: 'error' });
    }
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Allowed extensions check: pdf, doc, docx, jpg, jpeg, png, webp, xls, xlsx, zip, txt
    const allowed = /\.(pdf|doc|docx|jpg|jpeg|png|webp|xls|xlsx|zip|txt|csv)$/i;
    const validFiles = [];
    let hasInvalid = false;

    files.forEach(f => {
      if (allowed.test(f.name)) {
        if (f.size <= 25 * 1024 * 1024) { // 25MB
          validFiles.push(f);
        } else {
          alert(`File ${f.name} exceeds maximum 25MB limit.`);
        }
      } else {
        hasInvalid = true;
      }
    });

    if (hasInvalid) {
      alert('Some files were ignored because their format is not supported. Supported: PDF, Word, Images, Excel, ZIP, TXT.');
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Deliverable
  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length && !submissionNotes.trim()) {
      alert('Please provide either attached files or submission explanation notes.');
      return;
    }

    try {
      setIsSubmittingWork(true);
      const formData = new FormData();
      formData.append('notes', submissionNotes);
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const res = await api.post(`/tasks/${selectedTask._id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setSubmissionSuccess('Deliverables submitted successfully for HR review!');
        setSelectedFiles([]);
        setSubmissionNotes('');
        await fetchTasks(selectedTask._id);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      alert(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmittingWork(false);
    }
  };

  // Send Discussion Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setIsSendingMessage(true);
      const res = await api.post(`/tasks/${selectedTask._id}/messages`, { text: messageText });
      if (res.data?.success) {
        setMessageText('');
        // Refresh task drawer
        const updated = await api.get(`/tasks/${selectedTask._id}`);
        if (updated.data?.success) {
          setSelectedTask(updated.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Secure File Download Handler
  const handleDownloadFile = async (taskId, fileId, originalName) => {
    try {
      const response = await api.get(`/tasks/${taskId}/files/${fileId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName || 'task-file');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not download file. Ensure you have access.');
    }
  };

  // Helper for file type icons
  const getFileIcon = (fileName = '') => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return <ImageIcon className="w-4 h-4 text-emerald-600" />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText className="w-4 h-4 text-rose-600" />;
    }
    if (['zip', 'rar', '7z'].includes(ext)) {
      return <Archive className="w-4 h-4 text-amber-600" />;
    }
    return <File className="w-4 h-4 text-blue-600" />;
  };

  // Format bytes helper
  const formatBytes = (bytes = 0) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Priority color styling
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Urgent</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">High</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Low</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Medium</span>;
    }
  };

  // Status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'AWAITING_ACCEPTANCE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">Awaiting Acceptance</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">Accepted</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">In Progress</span>;
      case 'SUBMITTED':
      case 'RESUBMITTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Under Review</span>;
      case 'REVISION_REQUIRED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Revision Required</span>;
      case 'COMPLETED':
      case 'APPROVED':
      case 'DONE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">{status}</span>;
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(task => {
    // Tab filter
    if (activeTab === 'PENDING' && task.status !== 'AWAITING_ACCEPTANCE') return false;
    if (activeTab === 'IN_PROGRESS' && !['ACCEPTED', 'IN_PROGRESS'].includes(task.status)) return false;
    if (activeTab === 'SUBMITTED' && !['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'].includes(task.status)) return false;
    if (activeTab === 'REVISION' && task.status !== 'REVISION_REQUIRED') return false;
    if (activeTab === 'COMPLETED' && !['COMPLETED', 'APPROVED', 'DONE'].includes(task.status)) return false;

    // Priority filter
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title?.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  // Calculate counts for badges
  const pendingCount = tasks.filter(t => t.status === 'AWAITING_ACCEPTANCE').length;
  const inProgressCount = tasks.filter(t => ['ACCEPTED', 'IN_PROGRESS'].includes(t.status)).length;
  const revisionCount = tasks.filter(t => t.status === 'REVISION_REQUIRED').length;
  const completedCount = tasks.filter(t => ['COMPLETED', 'APPROVED', 'DONE'].includes(t.status)).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Task Deliverables
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
              {tasks.length} Assigned
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review assignments, accept tasks, submit multi-format deliverables, and track HR approvals.
          </p>
        </div>

        <button
          onClick={() => fetchTasks(selectedTask?._id)}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh Tasks</span>
        </button>
      </div>

      {/* Global Action Banner */}
      {actionMessage.text && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-xs transition-all ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button 
            onClick={() => setActionMessage({ text: '', type: '' })}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div 
          onClick={() => setActiveTab('PENDING')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            pendingCount > 0 
              ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm ring-2 ring-amber-300/50' 
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Acceptance</span>
            <AlertTriangle className={`w-4 h-4 ${pendingCount > 0 ? 'text-amber-600 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{pendingCount}</span>
            {pendingCount > 0 && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">Action Needed</span>}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('IN_PROGRESS')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{inProgressCount}</div>
        </div>

        <div 
          onClick={() => setActiveTab('REVISION')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            revisionCount > 0 
              ? 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200 shadow-sm ring-2 ring-rose-300/50' 
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Needs Revision</span>
            <AlertCircle className={`w-4 h-4 ${revisionCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{revisionCount}</span>
            {revisionCount > 0 && <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-full">Resubmit</span>}
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('COMPLETED')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{completedCount}</div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { id: 'ALL', label: 'All Tasks', count: tasks.length },
            { id: 'PENDING', label: 'Pending Acceptance', count: pendingCount, alert: pendingCount > 0 },
            { id: 'IN_PROGRESS', label: 'Active & In Progress', count: inProgressCount },
            { id: 'SUBMITTED', label: 'Under Review', count: tasks.filter(t => ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'].includes(t.status)).length },
            { id: 'REVISION', label: 'Revisions Requested', count: revisionCount, alert: revisionCount > 0 },
            { id: 'COMPLETED', label: 'Completed', count: completedCount }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : tab.alert
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Priority Selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks by title or requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs font-semibold text-slate-500">Loading your assigned deliverables...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No tasks found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'ALL' 
              ? 'You do not have any tasks matching the current search filters.' 
              : `There are currently no tasks in the "${activeTab.toLowerCase().replace('_', ' ')}" stage.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => {
            const isDueSoon = task.dueDate && !isPast(new Date(task.dueDate));
            const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !['COMPLETED', 'APPROVED', 'DONE'].includes(task.status);
            const needsAcceptance = task.status === 'AWAITING_ACCEPTANCE';
            const needsRevision = task.status === 'REVISION_REQUIRED';

            return (
              <div 
                key={task._id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden shadow-xs hover:shadow-md ${
                  needsAcceptance 
                    ? 'border-amber-300 ring-1 ring-amber-300/40 bg-gradient-to-b from-amber-50/20 to-white' 
                    : needsRevision
                    ? 'border-rose-300 ring-1 ring-rose-300/40 bg-gradient-to-b from-rose-50/20 to-white'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Top Pill Bar */}
                <div className="p-4 pb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(task.priority)}
                    {task.submissions?.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                        v{task.submissions.length}
                      </span>
                    )}
                  </div>
                  <div>
                    {getStatusBadge(task.status)}
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 py-2 flex-1 space-y-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-2">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {/* Deadline Indicator */}
                  <div className={`p-2 rounded-xl text-xs flex items-center gap-2 ${
                    isOverdue 
                      ? 'bg-rose-50 text-rose-800 font-bold border border-rose-200' 
                      : 'bg-slate-50 text-slate-600 border border-slate-100'
                  }`}>
                    <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span className="truncate">
                      Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No deadline'}
                    </span>
                    {task.dueDate && (
                      <span className="ml-auto text-[10px] font-mono">
                        {isOverdue ? 'Overdue!' : formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  {/* Revision Alert Snippet */}
                  {needsRevision && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="line-clamp-2">
                        <span className="font-bold">Revision Notice: </span>
                        {task.submissions?.[0]?.feedback || 'HR requested corrections on your latest deliverable.'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 mt-auto">
                  {needsAcceptance ? (
                    <button
                      onClick={() => handleAcceptTask(task._id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept Task</span>
                    </button>
                  ) : null}

                  <button
                    onClick={() => handleOpenTask(task)}
                    className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span>{needsAcceptance ? 'View Details' : 'Open & Work'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail & Submission Slide-over Drawer / Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fadeIn">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slideLeft">
            
            {/* Drawer Top Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Task Workspace</span>
                    {getPriorityBadge(selectedTask.priority)}
                  </div>
                  <h2 className="text-base font-black truncate text-white mt-0.5">{selectedTask.title}</h2>
                </div>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Workspace Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-slate-50/50">
              
              {/* Acceptance Callout Banner */}
              {selectedTask.status === 'AWAITING_ACCEPTANCE' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-extrabold">Task Awaiting Your Acceptance</h4>
                      <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                        Please review the instructions, requirements, and deadline below. Once ready, click 
                        <strong> Accept Task</strong> to officially confirm assignment and unlock deliverables submission.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptTask(selectedTask._id)}
                    className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Accept Task Assignment</span>
                  </button>
                </div>
              )}

              {/* Start Task Button if Accepted */}
              {selectedTask.status === 'ACCEPTED' && (
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold">Ready to start working?</h4>
                    <p className="text-[11px] text-sky-700">Move task to "In Progress" to keep HR updated.</p>
                  </div>
                  <button
                    onClick={() => handleStartTask(selectedTask._id)}
                    className="py-2 px-3.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    Start Working
                  </button>
                </div>
              )}

              {/* Visual Task Progress Tracker */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Lifecycle Progress</h4>
                <TaskProgressTimeline task={selectedTask} />
              </div>

              {/* Requirements & Description Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Assignment Details</span>
                  <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: {selectedTask.dueDate ? format(new Date(selectedTask.dueDate), 'PPP') : 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">Description</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedTask.description || 'No general description provided.'}
                  </p>
                </div>

                {selectedTask.instructions && (
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 mb-1">Step-by-Step Instructions</h4>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                      {selectedTask.instructions}
                    </div>
                  </div>
                )}

                {/* Supporting Materials / Attachments from HR */}
                {selectedTask.attachments?.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reference Files Attached by HR ({selectedTask.attachments.length})</span>
                    </h4>
                    <div className="space-y-1.5">
                      {selectedTask.attachments.map((file, fIdx) => (
                        <div 
                          key={fIdx} 
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getFileIcon(file.originalName)}
                            <span className="font-semibold text-slate-800 truncate">{file.originalName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({formatBytes(file.size)})</span>
                          </div>
                          <button
                            onClick={() => handleDownloadFile(selectedTask._id, file.fileId, file.originalName)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Work Submission Panel (If accepted or in progress) */}
              {['ACCEPTED', 'IN_PROGRESS', 'REVISION_REQUIRED', 'SUBMITTED', 'RESUBMITTED'].includes(selectedTask.status) && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <UploadCloud className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                        {selectedTask.status === 'REVISION_REQUIRED' 
                          ? `Submit Revised Deliverable (Version ${(selectedTask.submissions?.length || 0) + 1})`
                          : selectedTask.submissions?.length > 0
                          ? `Upload Updated Deliverable (Version ${(selectedTask.submissions.length || 0) + 1})`
                          : 'Submit Deliverable Work'}
                      </h4>
                    </div>
                    {selectedTask.status === 'REVISION_REQUIRED' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                        Revision Requested
                      </span>
                    )}
                  </div>

                  {submissionSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{submissionSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitWork} className="space-y-4">
                    {/* Notes Textarea */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Submission Notes & Work Summary
                      </label>
                      <textarea
                        rows={3}
                        value={submissionNotes}
                        onChange={(e) => setSubmissionNotes(e.target.value)}
                        placeholder="Provide details on your completed deliverables, changes made, or comments for HR review..."
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all"
                      />
                    </div>

                    {/* Drag and Drop File Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Deliverable Files (PDF, Word, Images, Excel, ZIP - Max 25MB each)
                      </label>
                      
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-slate-50 hover:bg-emerald-50/30 transition-all cursor-pointer group">
                        <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        <span className="text-xs font-bold text-slate-700 mt-2">
                          Click to browse or drop deliverables here
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Supports PDF, DOC, DOCX, JPG, PNG, WEBP, XLS, XLSX, ZIP
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.zip,.txt"
                        />
                      </label>

                      {/* Selected files preview */}
                      {selectedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Ready to upload ({selectedFiles.length} files):
                          </span>
                          <div className="space-y-1.5">
                            {selectedFiles.map((file, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {getFileIcon(file.name)}
                                  <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">({formatBytes(file.size)})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                  title="Remove file"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingWork}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingWork ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading & Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Deliverable to HR</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Submission Versions & History */}
              {selectedTask.submissions?.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Submission History ({selectedTask.submissions.length} Version{selectedTask.submissions.length > 1 ? 's' : ''})</span>
                  </h4>

                  <div className="space-y-3">
                    {selectedTask.submissions.map((sub, sIdx) => (
                      <div 
                        key={sIdx}
                        className={`p-4 rounded-2xl border text-xs space-y-3 ${
                          sub.status === 'APPROVED' 
                            ? 'bg-emerald-50/50 border-emerald-200' 
                            : sub.status === 'REVISION_REQUIRED'
                            ? 'bg-rose-50/50 border-rose-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-black/5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                              Version {sub.version}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {sub.submittedAt ? format(new Date(sub.submittedAt), 'PPp') : ''}
                            </span>
                          </div>
                          <div>
                            {sub.status === 'APPROVED' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                Approved
                              </span>
                            ) : sub.status === 'REVISION_REQUIRED' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                                Revision Required
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                                Pending HR Review
                              </span>
                            )}
                          </div>
                        </div>

                        {sub.notes && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee Notes:</span>
                            <p className="text-slate-700 mt-0.5 leading-relaxed">{sub.notes}</p>
                          </div>
                        )}

                        {/* Files attached in this submission */}
                        {sub.files?.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Submitted Files:</span>
                            <div className="mt-1 space-y-1.5">
                              {sub.files.map((file, fIdx) => (
                                <div 
                                  key={fIdx}
                                  className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {getFileIcon(file.originalName)}
                                    <span className="font-medium text-slate-800 truncate">{file.originalName}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">({formatBytes(file.size)})</span>
                                  </div>
                                  <button
                                    onClick={() => handleDownloadFile(selectedTask._id, file.fileId, file.originalName)}
                                    className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                    title="Download file"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* HR Review Feedback */}
                        {sub.feedback && (
                          <div className={`p-3 rounded-xl border text-xs ${
                            sub.status === 'APPROVED' 
                              ? 'bg-emerald-100/50 border-emerald-300 text-emerald-950' 
                              : 'bg-rose-100/60 border-rose-300 text-rose-950'
                          }`}>
                            <span className="font-bold block mb-0.5">HR Review Feedback:</span>
                            <p className="leading-relaxed">{sub.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discussion Thread */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                      Task Communication & Feedback ({selectedTask.messages?.length || 0})
                    </h4>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar p-1">
                  {(selectedTask.messages || []).length === 0 ? (
                    <p className="text-center text-xs text-slate-400 italic py-4">
                      No comments or messages yet. Post a question or note for HR below.
                    </p>
                  ) : (
                    selectedTask.messages.map((msg, mIdx) => {
                      const isMe = msg.senderRole === 'EMPLOYEE';
                      return (
                        <div 
                          key={mIdx}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className={`max-w-[85%] p-3 rounded-2xl text-xs space-y-1 ${
                            isMe 
                              ? 'bg-emerald-600 text-white rounded-br-none shadow-xs' 
                              : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                          }`}>
                            <div className="flex items-center gap-2 text-[10px] opacity-75 font-bold">
                              <span>{msg.senderName}</span>
                              <span>•</span>
                              <span>{msg.createdAt ? format(new Date(msg.createdAt), 'p') : ''}</span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message input */}
                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message or response for HR..."
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isSendingMessage || !messageText.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSendingMessage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send</span>
                  </button>
                </form>
              </div>

              {/* Task Activity Timeline / Audit Log */}
              {selectedTask.timeline?.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Audit Activity History
                  </h4>
                  <div className="space-y-2 text-xs">
                    {selectedTask.timeline.map((event, eIdx) => (
                      <div key={eIdx} className="flex items-start gap-2.5 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <span className="font-semibold text-slate-800">{event.details || event.action}</span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {event.timestamp ? format(new Date(event.timestamp), 'PPp') : ''} • By {event.actorName} ({event.actorRole})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
