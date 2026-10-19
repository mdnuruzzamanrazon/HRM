import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TaskProgressTimeline from '../../components/TaskProgressTimeline';
import { 
  Loader2, Plus, Calendar as CalendarIcon, MoreVertical, 
  Trash2, Search, Filter, CheckCircle2, AlertCircle, 
  Clock, Paperclip, Send, Download, Eye, FileText, 
  UserCheck, AlertTriangle, RefreshCw, X, Edit3, 
  ChevronRight, ArrowUpDown, LayoutGrid, List, 
  File, Image as ImageIcon, Archive, Check, MessageSquare, CheckSquare
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export default function TaskDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'table'

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    instructions: '',
    assignedTo: '',
    dueDate: '',
    priority: 'MEDIUM'
  });
  const [createFiles, setCreateFiles] = useState([]);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    priority: 'MEDIUM'
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Review & Feedback State
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [showRevisionInput, setShowRevisionInput] = useState(false);

  // Messaging State
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'].includes(user?.role);

  const handleOpenDrawer = async (task) => {
    setSelectedTask(task);
    setShowRevisionInput(false);
    setRevisionFeedback('');
    setChatMessage('');
    setSearchParams({ taskId: task._id });

    try {
      setDrawerLoading(true);
      const res = await api.get(`/tasks/${task._id}`);
      if (res.data?.success) {
        setSelectedTask(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch full task details:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedTask(null);
    searchParams.delete('taskId');
    setSearchParams(searchParams);
  };

  const fetchData = async (autoSelectId = null) => {
    try {
      setLoading(true);
      const [tasksRes, empRes] = await Promise.all([
        api.get('/tasks'),
        isAdmin ? api.get('/employees') : Promise.resolve({ data: { data: [] } })
      ]);
      
      const fetchedTasks = tasksRes.data?.data || [];
      setTasks(fetchedTasks);
      if (empRes.data?.data) {
        setEmployees(empRes.data.data);
      }

      // Handle auto select from search params or ID
      const targetId = autoSelectId || searchParams.get('taskId');
      if (targetId) {
        const match = fetchedTasks.find(t => t._id === targetId);
        if (match) {
          handleOpenDrawer(match);
        }
      }
    } catch (err) {
      console.error('Failed to load task dashboard data:', err);
      setToastMessage({ text: 'Error fetching task deliverables', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.role]);

  // Open Edit Modal
  const handleOpenEdit = (task) => {
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      instructions: task.instructions || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      priority: task.priority || 'MEDIUM'
    });
    setIsEditModalOpen(true);
  };

  // Submit Create Task
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title || !createForm.assignedTo || !createForm.dueDate) {
      alert('Please fill in Title, Assignee, and Due Date.');
      return;
    }

    try {
      setCreateSubmitting(true);
      const formData = new FormData();
      formData.append('title', createForm.title);
      formData.append('description', createForm.description);
      formData.append('instructions', createForm.instructions);
      formData.append('assignedTo', createForm.assignedTo);
      formData.append('dueDate', createForm.dueDate);
      formData.append('priority', createForm.priority);

      createFiles.forEach(file => {
        formData.append('attachments', file);
      });

      const res = await api.post('/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setToastMessage({ text: 'Task successfully created and assigned to employee!', type: 'success' });
        setIsCreateModalOpen(false);
        setCreateForm({
          title: '',
          description: '',
          instructions: '',
          assignedTo: '',
          dueDate: '',
          priority: 'MEDIUM'
        });
        setCreateFiles([]);
        await fetchData(res.data.data?._id);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
      alert(err.response?.data?.message || 'Failed to create task');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Submit Edit Task
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setEditSubmitting(true);
      const res = await api.put(`/tasks/${selectedTask._id}`, editForm);
      if (res.data?.success) {
        setToastMessage({ text: 'Task updated successfully', type: 'success' });
        setIsEditModalOpen(false);
        await fetchData(selectedTask._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task');
    } finally {
      setEditSubmitting(false);
    }
  };

  // HR Review Actions: UNDER_REVIEW, REQUEST_REVISION, APPROVE
  const handleReviewAction = async (action) => {
    if (action === 'REQUEST_REVISION' && !revisionFeedback.trim()) {
      setShowRevisionInput(true);
      return;
    }

    try {
      setIsReviewSubmitting(true);
      const res = await api.put(`/tasks/${selectedTask._id}/review`, {
        action,
        feedback: revisionFeedback
      });

      if (res.data?.success) {
        setToastMessage({ 
          text: action === 'APPROVE' 
            ? 'Deliverables approved! Task marked as completed.' 
            : action === 'REQUEST_REVISION'
            ? 'Revision request and feedback delivered to employee.'
            : 'Task marked under active HR review.',
          type: 'success' 
        });
        setShowRevisionInput(false);
        setRevisionFeedback('');
        await fetchData(selectedTask._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review submission');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  // Quick Status Mover
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      if (res.data?.success) {
        setToastMessage({ text: `Task status updated to ${newStatus.replace('_', ' ')}`, type: 'success' });
        await fetchData(selectedTask?._id === taskId ? taskId : null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  // Delete / Cancel Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? All submission versions and messages will be removed.')) return;
    try {
      const res = await api.delete(`/tasks/${taskId}`);
      if (res.data?.success) {
        setToastMessage({ text: 'Task deleted successfully', type: 'success' });
        if (selectedTask?._id === taskId) {
          handleCloseDrawer();
        }
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  // Send Discussion Message
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      setIsSendingChat(true);
      const res = await api.post(`/tasks/${selectedTask._id}/messages`, { text: chatMessage });
      if (res.data?.success) {
        setChatMessage('');
        const updated = await api.get(`/tasks/${selectedTask._id}`);
        if (updated.data?.success) {
          setSelectedTask(updated.data.data);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSendingChat(false);
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
      link.setAttribute('download', originalName || 'file');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Could not download file. Ensure file exists.');
    }
  };

  // File Icon Helper
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

  const formatBytes = (bytes = 0) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Priority styling
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Urgent</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">High</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Low</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Medium</span>;
    }
  };

  // Status styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'AWAITING_ACCEPTANCE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">Awaiting Acceptance</span>;
      case 'ACCEPTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">Accepted</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">In Progress</span>;
      case 'SUBMITTED':
      case 'RESUBMITTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Under Review</span>;
      case 'REVISION_REQUIRED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Revision Required</span>;
      case 'COMPLETED':
      case 'APPROVED':
      case 'DONE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">{status}</span>;
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
    if (employeeFilter !== 'ALL') {
      const empId = task.assignedTo?._id?.toString() || task.assignedTo?.toString();
      if (empId !== employeeFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title?.toLowerCase().includes(q);
      const matchEmp = `${task.assignedTo?.personalDetails?.firstName || ''} ${task.assignedTo?.personalDetails?.lastName || ''}`.toLowerCase().includes(q);
      if (!matchTitle && !matchEmp) return false;
    }
    return true;
  });

  // Kanban Columns
  const kanbanColumns = [
    { id: 'AWAITING_ACCEPTANCE', title: 'Pending Acceptance', color: 'border-amber-200 bg-amber-50/40 text-amber-900' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-indigo-200 bg-indigo-50/40 text-indigo-900' },
    { id: 'SUBMITTED', title: 'Under Review', color: 'border-purple-200 bg-purple-50/40 text-purple-900', statuses: ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'] },
    { id: 'REVISION_REQUIRED', title: 'Revision Required', color: 'border-rose-200 bg-rose-50/40 text-rose-900' },
    { id: 'COMPLETED', title: 'Completed', color: 'border-emerald-200 bg-emerald-50/40 text-emerald-900', statuses: ['COMPLETED', 'APPROVED', 'DONE'] },
  ];

  // Stats calculation
  const totalCount = tasks.length;
  const awaitingCount = tasks.filter(t => t.status === 'AWAITING_ACCEPTANCE').length;
  const inProgressCount = tasks.filter(t => ['ACCEPTED', 'IN_PROGRESS'].includes(t.status)).length;
  const reviewCount = tasks.filter(t => ['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED'].includes(t.status)).length;
  const revisionCount = tasks.filter(t => t.status === 'REVISION_REQUIRED').length;
  const completedCount = tasks.filter(t => ['COMPLETED', 'APPROVED', 'DONE'].includes(t.status)).length;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn min-h-[calc(100vh-8rem)] flex flex-col">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Task Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
              {tasks.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assign employee deliverables, monitor acceptance, review submissions, and manage approvals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchData(selectedTask?._id)}
            className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assign New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Toast Banner */}
      {toastMessage.text && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-xs transition-all ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button 
            onClick={() => setToastMessage({ text: '', type: '' })}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${statusFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>All Tasks</span>
          <div className="mt-1 text-2xl font-black">{totalCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('AWAITING_ACCEPTANCE')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'AWAITING_ACCEPTANCE' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${statusFilter === 'AWAITING_ACCEPTANCE' ? 'text-amber-100' : 'text-slate-400'}`}>Pending Acceptance</span>
            {awaitingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </div>
          <div className="mt-1 text-2xl font-black">{awaitingCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'IN_PROGRESS' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${statusFilter === 'IN_PROGRESS' ? 'text-indigo-100' : 'text-slate-400'}`}>In Progress</span>
          <div className="mt-1 text-2xl font-black">{inProgressCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('SUBMITTED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'SUBMITTED' ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${statusFilter === 'SUBMITTED' ? 'text-purple-100' : 'text-slate-400'}`}>Under Review</span>
          <div className="mt-1 text-2xl font-black">{reviewCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('REVISION_REQUIRED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'REVISION_REQUIRED' ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${statusFilter === 'REVISION_REQUIRED' ? 'text-rose-100' : 'text-slate-400'}`}>Revisions</span>
          <div className="mt-1 text-2xl font-black">{revisionCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'COMPLETED' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${statusFilter === 'COMPLETED' ? 'text-emerald-100' : 'text-slate-400'}`}>Completed</span>
          <div className="mt-1 text-2xl font-black">{completedCount}</div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, View Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by task title or assigned employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Employee Filter */}
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">All Assignees</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.personalDetails?.firstName} {emp.personalDetails?.lastName} ({emp.employeeCode})
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end md:self-auto shrink-0">
          <button
            onClick={() => setViewMode('board')}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'board' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Kanban Board View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Board</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Structured Table View"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Display (Board View vs Table View) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-bold text-slate-500">Loading task deliverables...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No tasks match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Try adjusting your employee, priority, or status filters above, or assign a new deliverable.
          </p>
        </div>
      ) : viewMode === 'board' ? (
        /* KANBAN BOARD VIEW */
        <div className="flex-1 flex space-x-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
          {kanbanColumns.map(col => {
            const columnTasks = filteredTasks.filter(t => {
              if (col.statuses) return col.statuses.includes(t.status);
              return t.status === col.id;
            });

            return (
              <div 
                key={col.id} 
                className={`flex flex-col shrink-0 w-[84vw] sm:w-80 lg:flex-1 rounded-2xl border ${col.color} overflow-hidden shadow-xs snap-start`}
              >
                {/* Column Header */}
                <div className="px-4 py-3 border-b border-black/5 bg-black/5 font-extrabold text-slate-900 flex justify-between items-center text-xs">
                  <span>{col.title}</span>
                  <span className="bg-white px-2 py-0.5 rounded-full text-[10px] text-slate-700 shadow-xs font-mono font-black">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Column Body Cards */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar max-h-[65vh]">
                  {columnTasks.map(task => {
                    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !['COMPLETED', 'APPROVED', 'DONE'].includes(task.status);
                    const hasSubmissions = (task.submissions?.length || 0) > 0;
                    const empName = `${task.assignedTo?.personalDetails?.firstName || ''} ${task.assignedTo?.personalDetails?.lastName || ''}`.trim() || 'Employee';

                    return (
                      <div 
                        key={task._id}
                        onClick={() => handleOpenDrawer(task)}
                        className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group relative"
                      >
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            {getPriorityBadge(task.priority)}
                            {hasSubmissions && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                                v{task.submissions.length}
                              </span>
                            )}
                          </div>
                          <div>{getStatusBadge(task.status)}</div>
                        </div>

                        {/* Title & Excerpt */}
                        <h4 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Assignee & Deadline Info */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-black shrink-0">
                              {empName.charAt(0)}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[90px]">
                              {empName}
                            </span>
                          </div>

                          <div className={`text-[10px] font-mono flex items-center gap-1 ${
                            isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'
                          }`}>
                            <CalendarIcon className="w-3 h-3" />
                            <span>{task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : ''}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnTasks.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400 italic bg-white/40 rounded-xl border border-dashed border-slate-200">
                      No tasks in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* STRUCTURED TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Task Deliverable</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submissions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map(task => {
                  const empName = `${task.assignedTo?.personalDetails?.firstName || ''} ${task.assignedTo?.personalDetails?.lastName || ''}`.trim() || 'Employee';
                  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !['COMPLETED', 'APPROVED', 'DONE'].includes(task.status);

                  return (
                    <tr 
                      key={task._id}
                      onClick={() => handleOpenDrawer(task)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                        <div className="group-hover:text-primary transition-colors">{task.title}</div>
                        {task.description && <div className="text-[10px] text-slate-400 font-normal truncate">{task.description}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {empName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{empName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{task.assignedTo?.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getPriorityBadge(task.priority)}</td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                        {isOverdue && <span className="block text-[10px] text-rose-500 font-bold">Overdue</span>}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(task.status)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {task.submissions?.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                            v{task.submissions.length} ({task.submissions[0].files?.length || 0} files)
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenDrawer(task); }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                        >
                          Review &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-Over Task Review & Management Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fadeIn">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">HR Task Administration</span>
                    {getPriorityBadge(selectedTask.priority)}
                  </div>
                  <h2 className="text-base font-black truncate text-white mt-0.5">{selectedTask.title}</h2>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(selectedTask)}
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      title="Edit Task"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(selectedTask._id)}
                      className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={handleCloseDrawer}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-slate-50/50">
              
              {/* Assignee Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-sm">
                    {selectedTask.assignedTo?.personalDetails?.firstName?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {selectedTask.assignedTo?.personalDetails?.firstName} {selectedTask.assignedTo?.personalDetails?.lastName}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {selectedTask.assignedTo?.employeeCode} • {selectedTask.assignedTo?.jobDetails?.title || 'Staff'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Acceptance Status</span>
                  {selectedTask.acceptanceStatus === 'ACCEPTED' ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                    </span>
                  ) : (
                    <span className="text-xs font-extrabold text-amber-600 animate-pulse">
                      Pending Acceptance
                    </span>
                  )}
                  {selectedTask.acceptedAt && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {format(new Date(selectedTask.acceptedAt), 'PPp')}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Timeline Tracker */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Lifecycle Status</h4>
                <TaskProgressTimeline task={selectedTask} />
              </div>

              {/* HR Review Action Station (If deliverables have been submitted) */}
              {['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED', 'REVISION_REQUIRED'].includes(selectedTask.status) && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900">
                        Deliverable Review Control Station
                      </h4>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        Inspect employee files below and select the appropriate review action.
                      </p>
                    </div>
                    {getStatusBadge(selectedTask.status)}
                  </div>

                  {/* Review Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {selectedTask.status !== 'UNDER_REVIEW' && (
                      <button
                        onClick={() => handleReviewAction('UNDER_REVIEW')}
                        disabled={isReviewSubmitting}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Mark Under Review</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowRevisionInput(prev => !prev)}
                      disabled={isReviewSubmitting}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Request Revisions</span>
                    </button>

                    <button
                      onClick={() => handleReviewAction('APPROVE')}
                      disabled={isReviewSubmitting}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Complete Task</span>
                    </button>
                  </div>

                  {/* Revision Feedback Box */}
                  {showRevisionInput && (
                    <div className="p-3.5 bg-white rounded-xl border border-amber-300 space-y-2.5 animate-fadeIn">
                      <label className="block text-xs font-bold text-slate-800">
                        Specify Required Corrections / Missing Information:
                      </label>
                      <textarea
                        rows={3}
                        value={revisionFeedback}
                        onChange={(e) => setRevisionFeedback(e.target.value)}
                        placeholder="Explain precisely what the employee needs to update, correct, or re-upload..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRevisionInput(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewAction('REQUEST_REVISION')}
                          disabled={!revisionFeedback.trim() || isReviewSubmitting}
                          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50"
                        >
                          Send Revision Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submissions & Uploaded Deliverables Section */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                      Employee Deliverables ({selectedTask.submissions?.length || 0} Submissions)
                    </h4>
                  </div>
                </div>

                {(!selectedTask.submissions || selectedTask.submissions.length === 0) ? (
                  <div className="text-center py-6 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No deliverables submitted yet by employee.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedTask.submissions.map((sub, sIdx) => (
                      <div 
                        key={sIdx}
                        className={`p-4 rounded-2xl border text-xs space-y-3 ${
                          sub.status === 'APPROVED' 
                            ? 'bg-emerald-50/40 border-emerald-200' 
                            : sub.status === 'REVISION_REQUIRED'
                            ? 'bg-rose-50/40 border-rose-200'
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
                          <div>{getStatusBadge(sub.status)}</div>
                        </div>

                        {sub.notes && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee Notes:</span>
                            <p className="text-slate-700 mt-0.5 leading-relaxed">{sub.notes}</p>
                          </div>
                        )}

                        {/* Files attached in this version */}
                        {sub.files?.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Submitted Files ({sub.files.length}):
                            </span>
                            <div className="mt-1.5 space-y-1.5">
                              {sub.files.map((file, fIdx) => (
                                <div 
                                  key={fIdx}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {getFileIcon(file.originalName)}
                                    <span className="font-semibold text-slate-800 truncate">{file.originalName}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">({formatBytes(file.size)})</span>
                                  </div>
                                  <button
                                    onClick={() => handleDownloadFile(selectedTask._id, file.fileId, file.originalName)}
                                    className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                    title="Download Deliverable File"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {sub.feedback && (
                          <div className="p-3 rounded-xl bg-white/80 border border-black/5 text-slate-700">
                            <span className="font-bold text-[10px] uppercase text-slate-500 block mb-0.5">HR Review Feedback:</span>
                            <p className="text-xs leading-relaxed">{sub.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Task Details & HR Instructions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Task Information</span>
                  <div className="text-xs font-mono font-bold text-slate-600">
                    Due: {selectedTask.dueDate ? format(new Date(selectedTask.dueDate), 'PPP') : 'N/A'}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">Description</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedTask.description || 'No description provided.'}
                  </p>
                </div>

                {selectedTask.instructions && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-1">Step-by-Step Instructions Given to Employee</h4>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap">
                      {selectedTask.instructions}
                    </div>
                  </div>
                )}

                {/* Initial HR Reference Attachments */}
                {selectedTask.attachments?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-2">Initial HR Reference Files:</h4>
                    <div className="space-y-1.5">
                      {selectedTask.attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            {getFileIcon(file.originalName)}
                            <span className="font-medium text-slate-800 truncate">{file.originalName}</span>
                          </div>
                          <button
                            onClick={() => handleDownloadFile(selectedTask._id, file.fileId, file.originalName)}
                            className="p-1 text-indigo-600 hover:text-indigo-800"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Discussion / Feedback Thread */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                      Direct Discussion with Employee ({selectedTask.messages?.length || 0})
                    </h4>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar p-1">
                  {(selectedTask.messages || []).length === 0 ? (
                    <p className="text-center text-xs text-slate-400 italic py-4">
                      No messages yet. Send a note or required changes to the employee below.
                    </p>
                  ) : (
                    selectedTask.messages.map((msg, mIdx) => {
                      const isHR = msg.senderRole !== 'EMPLOYEE';
                      return (
                        <div key={mIdx} className={`flex flex-col ${isHR ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-xs space-y-1 ${
                            isHR 
                              ? 'bg-slate-900 text-white rounded-br-none shadow-xs' 
                              : 'bg-emerald-50 text-emerald-950 rounded-bl-none border border-emerald-200'
                          }`}>
                            <div className="flex items-center gap-2 text-[10px] opacity-75 font-bold">
                              <span>{msg.senderName} ({msg.senderRole})</span>
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

                <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Send a direct message or instructions to employee..."
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={isSendingChat || !chatMessage.trim()}
                    className="px-4 py-2 bg-primary hover:bg-brand-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSendingChat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send</span>
                  </button>
                </form>
              </div>

              {/* Audit Activity Log */}
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

      {/* Assign New Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Assign New Task Deliverable</h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Regional Inventory Audit & Risk Assessment"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign to Employee *</label>
                <select
                  required
                  value={createForm.assignedTo}
                  onChange={(e) => setCreateForm({ ...createForm, assignedTo: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select an employee from directory...</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.personalDetails?.firstName} {emp.personalDetails?.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deadline Date *</label>
                  <input
                    type="date"
                    required
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Description</label>
                <textarea
                  rows={2}
                  placeholder="Overview of the task goals and scope..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Step-by-Step Instructions & Requirements</label>
                <textarea
                  rows={3}
                  placeholder="1. Check physical warehouse logs&#10;2. Complete audit template&#10;3. Upload signed scan in PDF format"
                  value={createForm.instructions}
                  onChange={(e) => setCreateForm({ ...createForm, instructions: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              {/* Attach Reference Files */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attach Reference Documents (PDF, Word, Excel, Images, ZIP)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setCreateFiles(Array.from(e.target.files || []))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.zip,.txt"
                />
                {createFiles.length > 0 && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    {createFiles.length} file(s) selected for attachment
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2.5 text-xs font-black text-white bg-primary hover:bg-brand-700 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {createSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Assign Task to Employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="text-sm font-bold">Edit Task Deliverable Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions</label>
                <textarea
                  rows={3}
                  value={editForm.instructions}
                  onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 text-xs font-black text-white bg-primary rounded-xl"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}