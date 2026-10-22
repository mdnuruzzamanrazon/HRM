import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, Search, Filter, RefreshCw, Download, 
  Printer, Edit3, Trash2, Eye, Calendar, Building2, 
  Clock, ArrowUpDown, ChevronDown, ChevronUp, AlertTriangle, 
  CheckCircle2, ChevronLeft, ChevronRight, X, Check, 
  Info, ShieldCheck, AlertCircle, ArrowUpRight, Scale,
  Lock, EyeOff, Layers, FolderClock, MessageSquareWarning,
  Sparkles, SlidersHorizontal, Phone, Mail, User, Inbox, Globe,
  BookOpen, BarChart3, Table as TableIcon, Shield
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

import ComplaintsGuidelinesView from './ComplaintsGuidelinesView';
import ComplaintsAnalyticsView from './ComplaintsAnalyticsView';
import ComplaintFormModal from './ComplaintFormModal';
import ComplaintDetailModal from './ComplaintDetailModal';
import StatusUpdateModal from './StatusUpdateModal';
import AppealModal from './AppealModal';
import ComplaintsPrintView from './ComplaintsPrintView';

export default function ComplaintsRegister() {
  const { user } = useAuth();

  // State: Subpage Navigation Tab
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'guidelines' | 'analytics'

  // State: Data
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // State: Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Open' | 'Closed'
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [partnerFilter, setPartnerFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isOverdueFilter, setIsOverdueFilter] = useState(false);
  const [hasAppealFilter, setHasAppealFilter] = useState(false);
  const [maskPhones, setMaskPhones] = useState(true);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // State: Sorting & Pagination
  const [sortBy, setSortBy] = useState('dateReceived');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // State: Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusComplaint, setStatusComplaint] = useState(null);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [appealComplaint, setAppealComplaint] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, item: null });

  // State: Loading & Toast
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Sync tab from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'guidelines' || tabParam === 'analytics' || tabParam === 'register') {
      setActiveTab(tabParam);
    }
  }, []);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const url = new URL(window.location);
    if (newTab === 'register') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', newTab);
    }
    window.history.replaceState(null, '', url.pathname + url.search);
  };

  // Initial load: Fetch Projects and initial data
  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, []);

  // Fetch complaints on filter / sort / page change
  useEffect(() => {
    if (activeTab === 'register' || activeTab === 'analytics') {
      fetchComplaints();
      fetchStats();
    }
  }, [
    selectedProjectId,
    statusFilter,
    channelFilter,
    categoryFilter,
    partnerFilter,
    startDate,
    endDate,
    isOverdueFilter,
    hasAppealFilter,
    sortBy,
    sortOrder,
    page,
    limit,
    activeTab
  ]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'register') {
        fetchComplaints();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch projects from risk/projects endpoint to associate with register
  const fetchProjects = async () => {
    try {
      const res = await api.get('/risk/projects');
      if (res.data?.success && res.data.data) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.warn('Projects fetch note:', err.message);
    }
  };

  // Fetch Summary Stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/complaints/stats', {
        params: {
          projectId: selectedProjectId !== 'ALL' ? selectedProjectId : undefined
        }
      });
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch complaint stats:', err);
    }
  };

  // Fetch Complaints List
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        receivingChannel: channelFilter !== 'ALL' ? channelFilter : undefined,
        complaintCategory: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        partnerOrgName: partnerFilter !== 'ALL' ? partnerFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isOverdue: isOverdueFilter ? 'true' : undefined,
        hasAppeal: hasAppealFilter ? 'true' : undefined,
        projectId: selectedProjectId !== 'ALL' ? selectedProjectId : undefined
      };

      const res = await api.get('/complaints', { params });
      if (res.data?.success) {
        setComplaints(res.data.data || []);
        if (res.data.pagination) {
          setTotalCount(res.data.pagination.total || 0);
          setTotalPages(res.data.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
      showToast(err.response?.data?.message || 'Failed to fetch complaints register.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sort Click
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setChannelFilter('ALL');
    setCategoryFilter('ALL');
    setPartnerFilter('ALL');
    setStartDate('');
    setEndDate('');
    setIsOverdueFilter(false);
    setHasAppealFilter(false);
    setSortBy('dateReceived');
    setSortOrder('desc');
    setPage(1);
  };

  // Save (Create or Update)
  const handleSaveComplaint = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedComplaint && selectedComplaint._id) {
        // Update
        const res = await api.put(`/complaints/${selectedComplaint._id}`, formData);
        if (res.data?.success) {
          showToast(`Complaint ${res.data.data?.sNo || ''} updated successfully.`);
          setIsFormModalOpen(false);
          setSelectedComplaint(null);
          fetchComplaints();
          fetchStats();
        }
      } else {
        // Create
        const res = await api.post('/complaints', formData);
        if (res.data?.success) {
          showToast(`Complaint ${res.data.data?.sNo || ''} registered successfully.`);
          setIsFormModalOpen(false);
          setSelectedComplaint(null);
          fetchComplaints();
          fetchStats();
        }
      }
    } catch (err) {
      console.error('Save complaint error:', err);
      showToast(err.response?.data?.message || 'Failed to save complaint record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Status
  const handleSaveStatus = async (statusData) => {
    if (!statusComplaint) return;
    setIsSubmitting(true);
    try {
      const res = await api.patch(`/complaints/${statusComplaint._id}/status`, statusData);
      if (res.data?.success) {
        showToast(`Complaint status updated to ${statusData.status}.`);
        setIsStatusModalOpen(false);
        setStatusComplaint(null);
        fetchComplaints();
        fetchStats();
      }
    } catch (err) {
      console.error('Status update error:', err);
      showToast(err.response?.data?.message || 'Failed to update status.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Appeal
  const handleSaveAppeal = async (appealData) => {
    if (!appealComplaint) return;
    setIsSubmitting(true);
    try {
      const res = await api.post(`/complaints/${appealComplaint._id}/appeal`, appealData);
      if (res.data?.success) {
        showToast('Appeal details saved successfully.');
        setIsAppealModalOpen(false);
        setAppealComplaint(null);
        fetchComplaints();
        fetchStats();
      }
    } catch (err) {
      console.error('Appeal save error:', err);
      showToast(err.response?.data?.message || 'Failed to record appeal.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.item) return;
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/complaints/${deleteConfirmation.item._id}`);
      if (res.data?.success) {
        showToast(`Record ${deleteConfirmation.item.sNo} removed from register.`);
        setDeleteConfirmation({ isOpen: false, item: null });
        fetchComplaints();
        fetchStats();
      }
    } catch (err) {
      console.error('Delete complaint error:', err);
      showToast(err.response?.data?.message || 'Failed to delete record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mask Phone Helper
  const displayPhone = (phone) => {
    if (!phone) return '—';
    if (!maskPhones) return phone;
    if (phone.includes('PROTECTED')) return phone;
    if (phone.length <= 6) return '••••••';
    return `${phone.slice(0, 5)}••••${phone.slice(-2)}`;
  };

  // Format Date Helper
  const formatDateDisplay = (d) => {
    if (!d) return '—';
    try {
      return format(new Date(d), 'dd MMM yyyy');
    } catch {
      return String(d);
    }
  };

  // Channel Icon helper
  const getChannelIcon = (ch) => {
    switch (ch) {
      case 'Phone': return <Phone className="w-3.5 h-3.5 text-blue-500" />;
      case 'Email': return <Mail className="w-3.5 h-3.5 text-indigo-500" />;
      case 'In-Person': return <User className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Suggestion Box': return <Inbox className="w-3.5 h-3.5 text-amber-500" />;
      case 'Website / Online Form': return <Globe className="w-3.5 h-3.5 text-cyan-500" />;
      default: return <MessageSquareWarning className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  // Active filters count
  const activeFiltersCount = [
    statusFilter !== 'ALL',
    channelFilter !== 'ALL',
    categoryFilter !== 'ALL',
    partnerFilter !== 'ALL',
    startDate !== '',
    endDate !== '',
    isOverdueFilter,
    hasAppealFilter
  ].filter(Boolean).length;

  // Selected Project Object
  const currentProjectName = useMemo(() => {
    if (selectedProjectId === 'ALL') return 'All Operational Projects';
    const found = projects.find(p => p._id === selectedProjectId);
    return found ? found.name : 'CBDP Women & Girls Empowerment Initiative';
  }, [projects, selectedProjectId]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 transition-all transform animate-in slide-in-from-bottom-3 ${
          toast.type === 'error'
            ? 'bg-rose-900/95 text-white border-rose-700 shadow-rose-950/20'
            : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-950/20'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP HEADER & MODULE SUBPAGE NAVIGATION CARD                               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
        
        {/* ROW 1: HEADER & PRIMARY ACTIONS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center justify-center flex-shrink-0">
              <FolderClock className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                  Complaints &amp; Feedback Register
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-mono">
                  Safeguarding &amp; CRM
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Database Connected</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Record, monitor, and manage project complaints and feedback securely.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full lg:w-auto">
            {/* Project Selector */}
            <div className="relative min-w-[210px] flex-1 sm:flex-initial">
              <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-7 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer appearance-none truncate"
              >
                <option value="ALL">All Assigned Projects</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Phone Privacy Mask Toggle */}
            <button
              type="button"
              onClick={() => setMaskPhones(!maskPhones)}
              title={maskPhones ? 'Reveal phone numbers (PII)' : 'Mask phone numbers for privacy'}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                maskPhones 
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 shadow-2xs' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-500/20 shadow-2xs'
              }`}
            >
              {maskPhones ? <Lock className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Print / Export Sheet */}
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Monthly Register Sheet</span>
            </button>

            {/* Refresh Data */}
            <button
              type="button"
              onClick={() => {
                fetchComplaints();
                fetchStats();
                showToast('Refreshed complaints register.');
              }}
              title="Refresh register"
              className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Add Complaint / Feedback Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedComplaint(null);
                setIsFormModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer flex-shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Complaint / Feedback</span>
            </button>
          </div>
        </div>

        {/* ROW 2: SEGMENTED MODULE SUBPAGE NAVIGATION */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 overflow-x-auto scrollbar-none gap-1">
            {/* Tab 1: Register Log */}
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white shadow-xs text-indigo-600 border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Complaints Register</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-mono">
                {totalCount}
              </span>
            </button>

            {/* Tab 2: Operational Guidelines & Policies Subpage */}
            <button
              type="button"
              onClick={() => handleTabChange('guidelines')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'guidelines'
                  ? 'bg-white shadow-xs text-indigo-600 border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Operational Guidelines &amp; Policies</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                Oxfam &amp; Partner SOP
              </span>
            </button>

            {/* Tab 3: Analytics & Resolution Insights */}
            <button
              type="button"
              onClick={() => handleTabChange('analytics')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white shadow-xs text-indigo-600 border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Resolution Analytics</span>
            </button>
          </div>

          {/* Quick Notice Link when on Register Tab */}
          {activeTab === 'register' && (
            <button
              type="button"
              onClick={() => handleTabChange('guidelines')}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Joint Safeguarding Standards Active</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBPAGE TAB 2: OPERATIONAL GUIDELINES & POLICIES VIEW                     */}
      {/* ========================================================================= */}
      {activeTab === 'guidelines' && (
        <ComplaintsGuidelinesView
          onOpenPrint={() => setIsPrintModalOpen(true)}
          onSwitchToRegister={() => handleTabChange('register')}
        />
      )}

      {/* ========================================================================= */}
      {/* SUBPAGE TAB 3: RESOLUTION ANALYTICS & INSIGHTS VIEW                       */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <ComplaintsAnalyticsView
          stats={stats}
          complaints={complaints}
          onSwitchToRegister={() => handleTabChange('register')}
        />
      )}

      {/* ========================================================================= */}
      {/* SUBPAGE TAB 1: MAIN COMPLAINTS REGISTER VIEW (CLEAN, MODERN & ORGANIZED)   */}
      {/* ========================================================================= */}
      {activeTab === 'register' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Summary Dashboard Cards (Dynamically Calculated from Database) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Total Records */}
            <div 
              onClick={() => {
                setStatusFilter('ALL');
                setIsOverdueFilter(false);
                setHasAppealFilter(false);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                statusFilter === 'ALL' && !isOverdueFilter && !hasAppealFilter
                  ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20 shadow-xs'
                  : 'bg-white border-slate-200/90 hover:bg-slate-50 text-slate-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <span className={statusFilter === 'ALL' && !isOverdueFilter && !hasAppealFilter ? 'text-slate-300' : 'text-slate-500'}>
                  Total Records
                </span>
                <Layers className={`w-3.5 h-3.5 ${statusFilter === 'ALL' && !isOverdueFilter && !hasAppealFilter ? 'text-indigo-400' : 'text-slate-400'}`} />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono">
                {stats ? stats.totalRecords : complaints.length}
              </div>
              <span className={`text-[10px] mt-1 block font-medium truncate ${
                statusFilter === 'ALL' && !isOverdueFilter && !hasAppealFilter ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Logged project intake
              </span>
            </div>

            {/* Open Complaints */}
            <div 
              onClick={() => {
                setStatusFilter('Open');
                setIsOverdueFilter(false);
                setHasAppealFilter(false);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                statusFilter === 'Open' && !isOverdueFilter
                  ? 'bg-amber-500 text-white border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white border-slate-200/90 hover:bg-amber-50/50 text-slate-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <span className={statusFilter === 'Open' && !isOverdueFilter ? 'text-amber-100' : 'text-amber-700'}>
                  Open Complaints
                </span>
                <Clock className={`w-3.5 h-3.5 ${statusFilter === 'Open' && !isOverdueFilter ? 'text-white' : 'text-amber-600'}`} />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono">
                {stats ? stats.openComplaints : 0}
              </div>
              <span className={`text-[10px] mt-1 block font-medium truncate ${
                statusFilter === 'Open' && !isOverdueFilter ? 'text-amber-100' : 'text-slate-500'
              }`}>
                Under redressal
              </span>
            </div>

            {/* Closed Complaints */}
            <div 
              onClick={() => {
                setStatusFilter('Closed');
                setIsOverdueFilter(false);
                setHasAppealFilter(false);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                statusFilter === 'Closed'
                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                  : 'bg-white border-slate-200/90 hover:bg-emerald-50/50 text-slate-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <span className={statusFilter === 'Closed' ? 'text-emerald-100' : 'text-emerald-700'}>
                  Closed Complaints
                </span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${statusFilter === 'Closed' ? 'text-white' : 'text-emerald-600'}`} />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono">
                {stats ? stats.closedComplaints : 0}
              </div>
              <span className={`text-[10px] mt-1 block font-medium truncate ${
                statusFilter === 'Closed' ? 'text-emerald-100' : 'text-slate-500'
              }`}>
                Formally resolved
              </span>
            </div>

            {/* Pending Appeals */}
            <div 
              onClick={() => {
                setHasAppealFilter(!hasAppealFilter);
                setIsOverdueFilter(false);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                hasAppealFilter
                  ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-600/20 shadow-xs'
                  : 'bg-white border-slate-200/90 hover:bg-purple-50/50 text-slate-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <span className={hasAppealFilter ? 'text-purple-100' : 'text-purple-700'}>
                  Pending Appeals
                </span>
                <Scale className={`w-3.5 h-3.5 ${hasAppealFilter ? 'text-white' : 'text-purple-600'}`} />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono">
                {stats ? stats.pendingAppeals : 0}
              </div>
              <span className={`text-[10px] mt-1 block font-medium truncate ${
                hasAppealFilter ? 'text-purple-100' : 'text-slate-500'
              }`}>
                Under committee review
              </span>
            </div>

            {/* Overdue Complaints (>30 days) */}
            <div 
              onClick={() => {
                setIsOverdueFilter(!isOverdueFilter);
                setStatusFilter('Open');
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md col-span-2 sm:col-span-1 ${
                isOverdueFilter
                  ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-600/20 shadow-xs'
                  : 'bg-white border-slate-200/90 hover:bg-rose-50/50 text-slate-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <span className={isOverdueFilter ? 'text-rose-100' : 'text-rose-700'}>
                  Overdue Complaints
                </span>
                <AlertTriangle className={`w-3.5 h-3.5 ${isOverdueFilter ? 'text-white' : 'text-rose-600'}`} />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono">
                {stats ? stats.overdueComplaints : 0}
              </div>
              <span className={`text-[10px] mt-1 block font-medium truncate ${
                isOverdueFilter ? 'text-rose-100' : 'text-slate-500'
              }`}>
                Open &gt; 30 days
              </span>
            </div>
          </div>

          {/* Clean Unified Search & Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
              
              {/* Search Box */}
              <div className="md:col-span-4 relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search S.No, complainant, category, partner, or issue..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="md:col-span-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="ALL">Status: All</option>
                  <option value="Open">Status: Open</option>
                  <option value="Closed">Status: Closed</option>
                </select>
              </div>

              {/* Receiving Channel Filter */}
              <div className="md:col-span-2">
                <select
                  value={channelFilter}
                  onChange={(e) => {
                    setChannelFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-medium truncate"
                >
                  <option value="ALL">Channel: All</option>
                  <option value="Phone">Phone</option>
                  <option value="Email">Email</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Suggestion Box">Suggestion Box</option>
                  <option value="Website / Online Form">Website / Form</option>
                  <option value="Community Helpdesk">Community Helpdesk</option>
                  <option value="SMS / WhatsApp">SMS / WhatsApp</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="md:col-span-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-medium truncate"
                >
                  <option value="ALL">Category: All</option>
                  <option value="Staff Conduct & Safeguarding">Staff Conduct &amp; Safeguarding</option>
                  <option value="Programme Quality & Delivery">Programme Quality &amp; Delivery</option>
                  <option value="Procurement & Financial Management">Procurement &amp; Finance</option>
                  <option value="Aid Diversion & Corruption">Aid Diversion &amp; Corruption</option>
                  <option value="Harassment & Discrimination">Harassment &amp; Discrimination</option>
                  <option value="Information Request & Inquiry">Information Request &amp; Inquiry</option>
                  <option value="Community Relations & Respect">Community Relations</option>
                  <option value="Service Delivery & Assistance">Service Delivery &amp; Assistance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Partner Organization Filter */}
              <div className="md:col-span-2">
                <select
                  value={partnerFilter}
                  onChange={(e) => {
                    setPartnerFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-semibold truncate"
                >
                  <option value="ALL">Partner: All</option>
                  <option value="Oxfam">Oxfam</option>
                  <option value="CBDP Foundation">CBDP Foundation</option>
                  <option value="Rupantar">Rupantar</option>
                  <option value="Coast Foundation">Coast Foundation</option>
                  <option value="BRAC">BRAC</option>
                  <option value="ActionAid">ActionAid</option>
                  <option value="Local Partner NGO">Local Partner NGO</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Pills Row */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Quick Filters:</span>
                
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setIsOverdueFilter(false);
                    setHasAppealFilter(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                    statusFilter === 'ALL' && !isOverdueFilter && !hasAppealFilter
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('Open');
                    setIsOverdueFilter(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                    statusFilter === 'Open' && !isOverdueFilter
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Open Only
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('Closed');
                    setIsOverdueFilter(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                    statusFilter === 'Closed'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Closed Only
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOverdueFilter(!isOverdueFilter);
                    setStatusFilter('Open');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                    isOverdueFilter
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <span>Overdue (&gt;30d)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHasAppealFilter(!hasAppealFilter)}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                    hasAppealFilter
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Scale className="w-3 h-3 text-purple-500" />
                  <span>Appeals</span>
                </button>

                {/* Date range toggle / inputs */}
                <div className="flex items-center gap-1.5 ml-2 text-slate-500 font-medium">
                  <span className="text-[11px]">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-0.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                  <span className="text-[11px]">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-0.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Active filters and reset */}
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Clean Enterprise Table Card */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/90 overflow-hidden">
            
            {/* Table Header Bar */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Complaints &amp; Feedback Records</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">
                  Showing {complaints.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, totalCount)} of {totalCount} records
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Page size:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Scrollable Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-700 tracking-wider sticky top-0 z-10 select-none">
                    {/* 1. S.No */}
                    <th 
                      onClick={() => handleSort('sNo')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>1. S.No</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    {/* 2. Date Received */}
                    <th 
                      onClick={() => handleSort('dateReceived')}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>2. Date Received</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    {/* 3. Receiving Channel */}
                    <th className="py-3 px-3 whitespace-nowrap">3. Channel</th>

                    {/* 4. Feedback / Complainant */}
                    <th className="py-3 px-3 min-w-[160px]">4. Complainant Name &amp; Address</th>

                    {/* 5. Contact Phone */}
                    <th className="py-3 px-3 whitespace-nowrap">5. Contact Phone</th>

                    {/* 6. Complaint Category */}
                    <th className="py-3 px-3 min-w-[150px]">6. Category</th>

                    {/* 7. Description */}
                    <th className="py-3 px-3 min-w-[220px]">7. Description of Issue</th>

                    {/* 8-10. Demographics */}
                    <th className="py-3 px-2 text-center whitespace-nowrap">8. Gender</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">9. Age</th>
                    <th className="py-3 px-2 text-center whitespace-nowrap">10. Disability</th>

                    {/* 11. Concerned Partner */}
                    <th className="py-3 px-3 min-w-[110px]">11. Partner / Org</th>

                    {/* 12. Actions Taken */}
                    <th className="py-3 px-3 min-w-[180px]">12. Redressal Action</th>

                    {/* 13. Reason for Delay */}
                    <th className="py-3 px-3 min-w-[160px]">13. 30-Day Delay Info</th>

                    {/* 14. Current Status */}
                    <th 
                      onClick={() => handleSort('status')}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors text-center whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>14. Status</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    {/* 15. Date Closed */}
                    <th 
                      onClick={() => handleSort('dateClosed')}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>15. Closed</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    {/* 16-18. Appeal Columns */}
                    <th className="py-3 px-3 whitespace-nowrap">16. Appeal Date</th>
                    <th className="py-3 px-3 min-w-[140px]">17. Appeal Outcome</th>
                    <th className="py-3 px-3 whitespace-nowrap">18. Final Closing</th>

                    {/* Actions */}
                    <th className="py-3 px-3 text-right sticky right-0 bg-slate-100/95 backdrop-blur-xs whitespace-nowrap z-20">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-150">
                  {loading ? (
                    <tr>
                      <td colSpan={19} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                          <span className="font-bold text-xs">Loading Complaints &amp; Feedback Register...</span>
                        </div>
                      </td>
                    </tr>
                  ) : complaints.length === 0 ? (
                    <tr>
                      <td colSpan={19} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-slate-500">
                          <FolderClock className="w-10 h-10 text-slate-300" />
                          <span className="font-bold text-slate-800 text-sm">No complaints or feedback found</span>
                          <p className="text-xs text-slate-500">
                            No records match the current filters or query. Try resetting filters or adding a new complaint.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedComplaint(null);
                              setIsFormModalOpen(true);
                            }}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add First Complaint</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    complaints.map((c) => {
                      const daysOld = c.dateReceived ? differenceInDays(new Date(), new Date(c.dateReceived)) : 0;
                      const isRecordOverdue = c.status === 'Open' && daysOld > 30;

                      return (
                        <tr 
                          key={c._id || c.sNo} 
                          className={`hover:bg-slate-50/80 transition-colors text-slate-800 align-top ${
                            isRecordOverdue ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {/* 1. S.No */}
                          <td className="py-3 px-3.5 font-mono font-bold whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setDetailComplaint(c);
                                setIsDetailModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                            >
                              {c.sNo}
                            </button>
                          </td>

                          {/* 2. Date Received */}
                          <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                            {formatDateDisplay(c.dateReceived)}
                            {daysOld > 0 && (
                              <span className="text-[10px] text-slate-400 block font-normal">
                                ({daysOld}d ago)
                              </span>
                            )}
                          </td>

                          {/* 3. Receiving Channel */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-800">
                              {getChannelIcon(c.receivingChannel)}
                              <span>{c.receivingChannel}</span>
                            </div>
                            {c.receivingChannelOther && (
                              <span className="text-[10px] text-slate-500 block truncate max-w-[100px]">
                                {c.receivingChannelOther}
                              </span>
                            )}
                          </td>

                          {/* 4. Feedback / Complainant Name & Address */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 truncate max-w-[160px]">
                              {c.complainantName || 'Anonymous'}
                            </div>
                            {c.isAnonymous && (
                              <span className="inline-block text-[9px] font-bold uppercase bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded mt-0.5">
                                Anonymous
                              </span>
                            )}
                            {c.complainantAddress && (
                              <span className="text-[10px] text-slate-500 block truncate max-w-[160px]" title={c.complainantAddress}>
                                {c.complainantAddress}
                              </span>
                            )}
                          </td>

                          {/* 5. Complainant Contact Phone Number */}
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                            <span className="font-semibold block">{displayPhone(c.complainantPhone)}</span>
                            {c.numberCalledFrom && c.numberCalledFrom !== c.complainantPhone && (
                              <span className="text-[10px] text-slate-400 block">
                                Called: {displayPhone(c.numberCalledFrom)}
                              </span>
                            )}
                          </td>

                          {/* 6. Complaint Type / Category */}
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold truncate max-w-[160px]" title={c.complaintCategory}>
                              {c.complaintCategory}
                            </span>
                            {c.complaintCategoryOther && (
                              <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                                {c.complaintCategoryOther}
                              </span>
                            )}
                          </td>

                          {/* 7. Description */}
                          <td className="py-3 px-3">
                            <p 
                              className="line-clamp-2 text-slate-700 font-sans cursor-pointer hover:text-slate-900 leading-snug"
                              onClick={() => {
                                setDetailComplaint(c);
                                setIsDetailModalOpen(true);
                              }}
                              title={c.description}
                            >
                              {c.description}
                            </p>
                          </td>

                          {/* 8. Gender */}
                          <td className="py-3 px-2 text-center text-slate-700 whitespace-nowrap">
                            {c.complainantGender || '—'}
                          </td>

                          {/* 9. Age */}
                          <td className="py-3 px-2 text-center text-slate-700 whitespace-nowrap">
                            {c.complainantAge || '—'}
                          </td>

                          {/* 10. Disability */}
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              c.complainantDisability === 'Yes' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'text-slate-600 bg-slate-100'
                            }`}>
                              {c.complainantDisability || 'Not recorded'}
                            </span>
                          </td>

                          {/* 11. Concerned Partner / Organization Name */}
                          <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            {c.partnerOrgName}
                          </td>

                          {/* 12. Actions Taken / How Issue Was Redressed */}
                          <td className="py-3 px-3">
                            <p className="line-clamp-2 text-slate-600 font-sans leading-snug" title={c.actionsTaken}>
                              {c.actionsTaken || '—'}
                            </p>
                          </td>

                          {/* 13. Reason for Delay and Complainant Notification */}
                          <td className="py-3 px-3">
                            {c.delayReason ? (
                              <div className="space-y-0.5">
                                <p className="line-clamp-1 text-slate-700 font-medium" title={c.delayReason}>
                                  {c.delayReason}
                                </p>
                                <span className="text-[10px] font-semibold text-slate-500 block">
                                  Notified: <strong className={c.isComplainantNotifiedOfDelay === 'Yes' ? 'text-emerald-700' : 'text-amber-700'}>
                                    {c.isComplainantNotifiedOfDelay || 'No'}
                                  </strong>
                                </span>
                              </div>
                            ) : isRecordOverdue ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                <AlertTriangle className="w-3 h-3" />
                                Delay reason needed
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* 14. Current Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              c.status === 'Closed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                c.status === 'Closed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                              }`} />
                              {c.status}
                            </span>
                          </td>

                          {/* 15. Date Complaint Closed */}
                          <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                            {formatDateDisplay(c.dateClosed)}
                          </td>

                          {/* 16. Appeal Date */}
                          <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                            {formatDateDisplay(c.appealDate)}
                          </td>

                          {/* 17. Appeal Outcome */}
                          <td className="py-3 px-3">
                            {c.appealOutcome ? (
                              <p className="line-clamp-1 text-slate-700 font-medium" title={c.appealOutcome}>
                                {c.appealOutcome}
                              </p>
                            ) : c.hasAppeal ? (
                              <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded">
                                {c.appealStatus || 'Under Review'}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* 18. Final Closing Date After Appeal */}
                          <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                            {formatDateDisplay(c.finalClosingDateAfterAppeal)}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-3 text-right sticky right-0 bg-white/95 backdrop-blur-xs whitespace-nowrap z-10 shadow-xs">
                            <div className="flex items-center justify-end gap-1">
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailComplaint(c);
                                  setIsDetailModalOpen(true);
                                }}
                                title="View Details"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Quick Status Toggle */}
                              <button
                                type="button"
                                onClick={() => {
                                  setStatusComplaint(c);
                                  setIsStatusModalOpen(true);
                                }}
                                title="Update Status / Resolution"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Manage Appeal */}
                              <button
                                type="button"
                                onClick={() => {
                                  setAppealComplaint(c);
                                  setIsAppealModalOpen(true);
                                }}
                                title="Manage Appeal"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                              >
                                <Scale className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedComplaint(c);
                                  setIsFormModalOpen(true);
                                }}
                                title="Edit Record"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmation({ isOpen: true, item: c })}
                                title="Delete Record"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3 text-xs">
              <div className="text-slate-500 font-medium">
                Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          page === pageNumber
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <ComplaintFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedComplaint(null);
        }}
        onSave={handleSaveComplaint}
        complaintRecord={selectedComplaint}
        projectName={currentProjectName}
        projectId={selectedProjectId !== 'ALL' ? selectedProjectId : null}
        isSubmitting={isSubmitting}
      />

      {/* View Details Modal */}
      <ComplaintDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailComplaint(null);
        }}
        complaintRecord={detailComplaint}
        onEdit={(record) => {
          setIsDetailModalOpen(false);
          setSelectedComplaint(record);
          setIsFormModalOpen(true);
        }}
        onUpdateStatus={(record) => {
          setIsDetailModalOpen(false);
          setStatusComplaint(record);
          setIsStatusModalOpen(true);
        }}
        onPrintSingle={() => setIsPrintModalOpen(true)}
      />

      {/* Quick Status Modal */}
      <StatusUpdateModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusComplaint(null);
        }}
        complaintRecord={statusComplaint}
        onSave={handleSaveStatus}
        isSubmitting={isSubmitting}
      />

      {/* Manage Appeal Modal */}
      <AppealModal
        isOpen={isAppealModalOpen}
        onClose={() => {
          setIsAppealModalOpen(false);
          setAppealComplaint(null);
        }}
        complaintRecord={appealComplaint}
        onSave={handleSaveAppeal}
        isSubmitting={isSubmitting}
      />

      {/* Print / Export Document Modal */}
      <ComplaintsPrintView
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={complaints}
        projectName={currentProjectName}
        stats={stats}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Confirm Record Deletion
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to delete complaint record <strong>{deleteConfirmation.item?.sNo}</strong>?
                This action is restricted to HR Administrators and will be recorded in the audit trail.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmation({ isOpen: false, item: null })}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
