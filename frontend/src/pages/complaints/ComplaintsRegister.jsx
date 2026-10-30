import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  BookOpen, BarChart3, Table as TableIcon, Shield, LayoutList, Columns
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

import ComplaintsGuidelinesView from './ComplaintsGuidelinesView';
import ComplaintsAnalyticsView from './ComplaintsAnalyticsView';
import ComplaintFormModal from './ComplaintFormModal';
import ComplaintDetailModal from './ComplaintDetailModal';
import StatusUpdateModal from './StatusUpdateModal';
import AppealModal from './AppealModal';
import ComplaintsPrintView from './ComplaintsPrintView';
import { useProject } from '../../context/ProjectContext';
import ActiveProjectBanner from '../../components/common/ActiveProjectBanner';

export default function ComplaintsRegister() {
  const { user } = useAuth();
  const {
    projects,
    selectedProjectId,
    selectedProject,
    projectSwitchVersion,
  } = useProject();

  // State: Subpage Navigation Tab
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'guidelines' | 'analytics'

  // State: Data
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const requestSeqRef = useRef(0);
  const statsSeqRef = useRef(0);

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
  const [tableMode, setTableMode] = useState('standard'); // 'standard' | 'all_fields'

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

  // Reset stale records, invalid project-specific filters, and open modals when project switches
  useEffect(() => {
    requestSeqRef.current += 1;
    statsSeqRef.current += 1;
    setComplaints([]);
    setStats(null);
    setTotalCount(0);
    setTotalPages(1);
    setPage(1);
    setPartnerFilter('ALL');
    setIsFormModalOpen(false);
    setSelectedComplaint(null);
    setIsDetailModalOpen(false);
    setDetailComplaint(null);
    setIsStatusModalOpen(false);
    setStatusComplaint(null);
    setIsAppealModalOpen(false);
    setAppealComplaint(null);
  }, [selectedProjectId, projectSwitchVersion]);

  // Fetch complaints on project / filter / sort / page change
  useEffect(() => {
    if (!selectedProjectId) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    if (activeTab === 'register' || activeTab === 'analytics') {
      fetchComplaints(selectedProjectId, controller.signal);
      fetchStats(selectedProjectId, controller.signal);
    }
    return () => controller.abort();
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
    if (!selectedProjectId) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (activeTab === 'register') {
        fetchComplaints(selectedProjectId, controller.signal);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Fetch Summary Stats
  const fetchStats = async (targetProjectId = selectedProjectId, signal = undefined) => {
    if (!targetProjectId) return;
    const seq = ++statsSeqRef.current;
    try {
      const res = await api.get('/complaints/stats', {
        params: { projectId: targetProjectId },
        signal,
      });
      if (seq !== statsSeqRef.current) return;
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      console.error('Failed to fetch complaint stats:', err);
    }
  };

  // Fetch Complaints List
  const fetchComplaints = async (targetProjectId = selectedProjectId, signal = undefined) => {
    if (!targetProjectId) return;
    const seq = ++requestSeqRef.current;
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
        projectId: targetProjectId
      };

      const res = await api.get('/complaints', { params, signal });
      if (seq !== requestSeqRef.current) return;
      if (res.data?.success) {
        setComplaints(res.data.data || []);
        if (res.data.pagination) {
          setTotalCount(res.data.pagination.total || 0);
          setTotalPages(res.data.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      if (seq !== requestSeqRef.current) return;
      console.error('Failed to fetch complaints:', err);
      showToast(err.response?.data?.message || 'Failed to fetch complaints register.', 'error');
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false);
      }
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

  // Active secondary filters count (excluding search & status)
  const activeSecondaryFiltersCount = [
    channelFilter !== 'ALL',
    categoryFilter !== 'ALL',
    partnerFilter !== 'ALL',
    startDate !== '',
    endDate !== ''
  ].filter(Boolean).length;

  // Total active filters count
  const activeFiltersCount = [
    statusFilter !== 'ALL',
    channelFilter !== 'ALL',
    categoryFilter !== 'ALL',
    partnerFilter !== 'ALL',
    startDate !== '',
    endDate !== '',
    isOverdueFilter,
    hasAppealFilter,
    searchQuery.trim() !== ''
  ].filter(Boolean).length;

  // Selected Project Name
  const currentProjectName = useMemo(() => {
    if (selectedProject?.name) return selectedProject.name;
    const found = projects.find(p => String(p._id) === String(selectedProjectId));
    return found ? found.name : 'No Project Selected';
  }, [selectedProject, projects, selectedProjectId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
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

      {/* Shared Active Project Context Banner */}
      <ActiveProjectBanner moduleName="Complaints & Feedback" />

      {/* ========================================================================= */}
      {/* TOP HEADER & MODULE SUBPAGE NAVIGATION CARD                               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
        
        {/* ROW 1: HEADER & PRIMARY ACTIONS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center justify-center flex-shrink-0">
              <FolderClock className="w-6 h-6 stroke-[2.2]" />
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
                  <span>Database Live</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Centralized registry for intake, investigation, and time-bound redressal complying with joint Partner and Oxfam standards.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full lg:w-auto">
            {/* Print / Export Sheet */}
            <button
              type="button"
              disabled={!selectedProjectId}
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Monthly Register Sheet</span>
            </button>

            {/* Add Complaint / Feedback Button */}
            <button
              type="button"
              disabled={!selectedProjectId}
              onClick={() => {
                setSelectedComplaint(null);
                setIsFormModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-sm shadow-indigo-600/25 transition-all cursor-pointer flex-shrink-0"
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

          {/* Quick Notice & Utilities */}
          <div className="flex items-center gap-2.5">
            {/* Phone Privacy Mask Toggle */}
            <button
              type="button"
              onClick={() => setMaskPhones(!maskPhones)}
              title={maskPhones ? 'Reveal phone numbers (PII)' : 'Mask phone numbers for privacy'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                maskPhones 
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 shadow-2xs' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-500/20 shadow-2xs'
              }`}
            >
              {maskPhones ? <Lock className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{maskPhones ? 'PII Protected' : 'PII Revealed'}</span>
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
              className="p-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Guidelines Link */}
            {activeTab === 'register' && (
              <button
                type="button"
                onClick={() => handleTabChange('guidelines')}
                className="hidden sm:inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer ml-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>SOP Standards</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
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
          
          {/* Summary Dashboard Cards (Cohesive, Uniform Enterprise Styling) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* 1. Total Records */}
            <div 
              onClick={() => {
                setStatusFilter('ALL');
                setIsOverdueFilter(false);
                setHasAppealFilter(false);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                statusFilter === 'ALL' && !isOverdueFilter && !hasAppealFilter
                  ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/15 shadow-sm'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Records
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-2">
                {stats ? stats.totalRecords : complaints.length}
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1.5 text-slate-500 font-medium">
                <span>Logged project intake</span>
                {statusFilter === 'ALL' && !isOverdueFilter && !hasAppealFilter && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                )}
              </div>
            </div>

            {/* 2. Open Complaints */}
            <div 
              onClick={() => {
                setStatusFilter('Open');
                setIsOverdueFilter(false);
                setHasAppealFilter(false);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                statusFilter === 'Open' && !isOverdueFilter
                  ? 'bg-white border-amber-500 ring-2 ring-amber-500/15 shadow-sm'
                  : 'bg-white border-slate-200/90 hover:border-amber-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Open Complaints
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-2">
                {stats ? stats.openComplaints : 0}
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1.5 text-slate-500 font-medium">
                <span>Under active redressal</span>
                {statusFilter === 'Open' && !isOverdueFilter && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                )}
              </div>
            </div>

            {/* 3. Closed Complaints */}
            <div 
              onClick={() => {
                setStatusFilter('Closed');
                setIsOverdueFilter(false);
                setHasAppealFilter(false);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                statusFilter === 'Closed'
                  ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/15 shadow-sm'
                  : 'bg-white border-slate-200/90 hover:border-emerald-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Closed Complaints
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-2">
                {stats ? stats.closedComplaints : 0}
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1.5 text-slate-500 font-medium">
                <span>Formally resolved</span>
                {statusFilter === 'Closed' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
              </div>
            </div>

            {/* 4. Pending Appeals */}
            <div 
              onClick={() => {
                setHasAppealFilter(!hasAppealFilter);
                setIsOverdueFilter(false);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                hasAppealFilter
                  ? 'bg-white border-purple-500 ring-2 ring-purple-500/15 shadow-sm'
                  : 'bg-white border-slate-200/90 hover:border-purple-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  Pending Appeals
                </span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Scale className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-2">
                {stats ? stats.pendingAppeals : 0}
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1.5 text-slate-500 font-medium">
                <span>Under review</span>
                {hasAppealFilter && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                )}
              </div>
            </div>

            {/* 5. Overdue Complaints (>30 days) */}
            <div 
              onClick={() => {
                setIsOverdueFilter(!isOverdueFilter);
                setStatusFilter('Open');
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md col-span-2 sm:col-span-1 ${
                isOverdueFilter
                  ? 'bg-white border-rose-500 ring-2 ring-rose-500/15 shadow-sm'
                  : 'bg-white border-slate-200/90 hover:border-rose-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  Overdue Complaints
                </span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-2">
                {stats ? stats.overdueComplaints : 0}
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1.5 text-slate-500 font-medium">
                <span>Open &gt; 30 days</span>
                {isOverdueFilter && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                )}
              </div>
            </div>
          </div>

          {/* Clean Unified Search & Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Search Box */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search S.No, complainant, category, partner, or issue..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 font-medium transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Segmented Quick Status Pills */}
              <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto scrollbar-none gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setIsOverdueFilter(false);
                    setHasAppealFilter(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'ALL' && !isOverdueFilter && !hasAppealFilter
                      ? 'bg-white shadow-xs text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({stats?.totalRecords || complaints.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('Open');
                    setIsOverdueFilter(false);
                    setHasAppealFilter(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'Open' && !isOverdueFilter && !hasAppealFilter
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  Open ({stats?.openComplaints || 0})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('Closed');
                    setIsOverdueFilter(false);
                    setHasAppealFilter(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'Closed' && !isOverdueFilter && !hasAppealFilter
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  Closed ({stats?.closedComplaints || 0})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOverdueFilter(!isOverdueFilter);
                    setStatusFilter('Open');
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isOverdueFilter
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Overdue ({stats?.overdueComplaints || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHasAppealFilter(!hasAppealFilter)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    hasAppealFilter
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <Scale className="w-3 h-3" />
                  <span>Appeals ({stats?.pendingAppeals || 0})</span>
                </button>
              </div>

              {/* Advanced Filters Toggle & Reset */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isFilterExpanded || activeSecondaryFiltersCount > 0
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-500/15'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Filters</span>
                  {activeSecondaryFiltersCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">
                      {activeSecondaryFiltersCount}
                    </span>
                  )}
                </button>

                {(activeFiltersCount > 0 || searchQuery) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors px-2 py-1 cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible Secondary Filter Tray */}
            {isFilterExpanded && (
              <div className="pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
                {/* Receiving Channel Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Receiving Channel</label>
                  <select
                    value={channelFilter}
                    onChange={(e) => {
                      setChannelFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="ALL">All Channels</option>
                    <option value="Phone">Phone</option>
                    <option value="Email">Email</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Suggestion Box">Suggestion Box</option>
                    <option value="Website / Online Form">Website / Online Form</option>
                    <option value="Community Helpdesk">Community Helpdesk</option>
                    <option value="SMS / WhatsApp">SMS / WhatsApp</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Complaint Category Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Complaint Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-medium truncate"
                  >
                    <option value="ALL">All Categories</option>
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
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Concerned Partner Org</label>
                  <select
                    value={partnerFilter}
                    onChange={(e) => {
                      setPartnerFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-semibold truncate"
                  >
                    <option value="ALL">All Partners</option>
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

                {/* Date Range */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Intake Date Range</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPage(1);
                      }}
                      className="w-1/2 px-2 py-1 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                    <span className="text-slate-400 text-xs">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPage(1);
                      }}
                      className="w-1/2 px-2 py-1 text-xs rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clean Enterprise Table Card */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/90 overflow-hidden">
            
            {/* Table Header Controls Bar */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Complaints &amp; Feedback Records</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 font-medium">
                  Showing {complaints.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, totalCount)} of {totalCount} records
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle: Standard vs All 18 Fields */}
                <div className="hidden sm:flex items-center bg-slate-200/70 p-0.5 rounded-lg border border-slate-300/60">
                  <button
                    type="button"
                    onClick={() => setTableMode('standard')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      tableMode === 'standard'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span>Standard View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableMode('all_fields')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      tableMode === 'all_fields'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>All 18 Fields</span>
                  </button>
                </div>

                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Page size:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Scrollable Table Area */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                {/* ========================================================= */}
                {/* TABLE HEAD: STANDARD VIEW vs ALL 18 FIELDS VIEW           */}
                {/* ========================================================= */}
                <thead>
                  {tableMode === 'standard' ? (
                    /* Standard High-Frequency Operational Headers */
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-700 tracking-wider sticky top-0 z-10 select-none">
                      <th 
                        onClick={() => handleSort('sNo')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap min-w-[140px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Case ID &amp; Date</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      <th className="py-3 px-3.5 min-w-[200px]">Complainant &amp; Location</th>
                      <th className="py-3 px-3 whitespace-nowrap min-w-[130px]">Channel &amp; Contact</th>
                      <th className="py-3 px-3 min-w-[160px]">Category</th>
                      <th className="py-3 px-3 min-w-[240px]">Issue Description</th>
                      <th className="py-3 px-3 whitespace-nowrap min-w-[130px]">Partner Org</th>

                      <th 
                        onClick={() => handleSort('status')}
                        className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap min-w-[130px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Status &amp; SLA</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      <th className="py-3 px-4 text-right sticky right-0 bg-slate-100/95 backdrop-blur-xs whitespace-nowrap z-20 min-w-[130px]">
                        Actions
                      </th>
                    </tr>
                  ) : (
                    /* All 18 Standard Compliance Register Headers */
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-700 tracking-wider sticky top-0 z-10 select-none">
                      <th 
                        onClick={() => handleSort('sNo')}
                        className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap min-w-[120px]"
                      >
                        <div className="flex items-center gap-1">
                          <span>01. S.No</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      <th 
                        onClick={() => handleSort('dateReceived')}
                        className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap min-w-[120px]"
                      >
                        <div className="flex items-center gap-1">
                          <span>02. Date Received</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      <th className="py-3 px-3 whitespace-nowrap min-w-[110px]">03. Channel</th>
                      <th className="py-3 px-3 min-w-[170px]">04. Complainant Name &amp; Address</th>
                      <th className="py-3 px-3 whitespace-nowrap min-w-[130px]">05. Contact Phone</th>
                      <th className="py-3 px-3 min-w-[160px]">06. Category</th>
                      <th className="py-3 px-3 min-w-[220px]">07. Description of Issue</th>

                      <th className="py-3 px-2 text-center whitespace-nowrap min-w-[80px]">08. Gender</th>
                      <th className="py-3 px-2 text-center whitespace-nowrap min-w-[70px]">09. Age</th>
                      <th className="py-3 px-2 text-center whitespace-nowrap min-w-[90px]">10. Disability</th>

                      <th className="py-3 px-3 min-w-[140px] whitespace-nowrap">11. Partner Org</th>
                      <th className="py-3 px-3 min-w-[180px]">12. Redressal Action</th>
                      <th className="py-3 px-3 min-w-[160px]">13. 30-Day Delay Info</th>

                      <th 
                        onClick={() => handleSort('status')}
                        className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors text-center whitespace-nowrap min-w-[100px]"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>14. Status</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      <th 
                        onClick={() => handleSort('dateClosed')}
                        className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap min-w-[110px]"
                      >
                        <div className="flex items-center gap-1">
                          <span>15. Closed</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      <th className="py-3 px-3 whitespace-nowrap min-w-[110px]">16. Appeal Date</th>
                      <th className="py-3 px-3 min-w-[140px]">17. Appeal Outcome</th>
                      <th className="py-3 px-3 whitespace-nowrap min-w-[110px]">18. Final Closing</th>

                      <th className="py-3 px-3 text-right sticky right-0 bg-slate-100/95 backdrop-blur-xs whitespace-nowrap z-20 min-w-[130px]">
                        Actions
                      </th>
                    </tr>
                  )}
                </thead>

                {/* ========================================================= */}
                {/* TABLE BODY: CLEAN DATA RENDERING                          */}
                {/* ========================================================= */}
                <tbody className="divide-y divide-slate-150">
                  {loading ? (
                    <tr>
                      <td colSpan={tableMode === 'standard' ? 8 : 19} className="py-14 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                          <span className="font-bold text-xs">Loading Complaints &amp; Feedback Register...</span>
                        </div>
                      </td>
                    </tr>
                  ) : complaints.length === 0 ? (
                    <tr>
                      <td colSpan={tableMode === 'standard' ? 8 : 19} className="py-14 text-center">
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
                          {/* ========================================================= */}
                          {/* ROW RENDERING: STANDARD VIEW                              */}
                          {/* ========================================================= */}
                          {tableMode === 'standard' ? (
                            <>
                              {/* 1. Case ID & Date */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDetailComplaint(c);
                                    setIsDetailModalOpen(true);
                                  }}
                                  className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer block text-left"
                                >
                                  {c.sNo}
                                </button>
                                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                                  {formatDateDisplay(c.dateReceived)}
                                  {daysOld > 0 && <span className="text-slate-400"> • {daysOld}d ago</span>}
                                </span>
                              </td>

                              {/* 2. Complainant & Location */}
                              <td className="py-3.5 px-3.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 text-xs truncate max-w-[180px]">
                                    {c.complainantName || 'Anonymous Complainant'}
                                  </span>
                                  {c.isAnonymous && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-slate-100 text-slate-600 border border-slate-200">
                                      Anon
                                    </span>
                                  )}
                                </div>
                                {c.complainantAddress && (
                                  <span className="text-[11px] text-slate-500 block truncate max-w-[190px] mt-0.5" title={c.complainantAddress}>
                                    {c.complainantAddress}
                                  </span>
                                )}
                                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-medium flex-wrap">
                                  {c.complainantGender && <span>{c.complainantGender}</span>}
                                  {c.complainantAge && <span>• {c.complainantAge} yrs</span>}
                                  {c.complainantDisability === 'Yes' && (
                                    <span className="px-1 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200/60">
                                      PWD
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 3. Channel & Contact */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-800">
                                  {getChannelIcon(c.receivingChannel)}
                                  <span>{c.receivingChannel}</span>
                                </div>
                                <span className="font-mono text-[11px] text-slate-600 block mt-1">
                                  {displayPhone(c.complainantPhone)}
                                </span>
                              </td>

                              {/* 4. Category */}
                              <td className="py-3.5 px-3">
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-[11px] font-semibold max-w-[180px] truncate" title={c.complaintCategory}>
                                  {c.complaintCategory}
                                </span>
                              </td>

                              {/* 5. Issue Description */}
                              <td className="py-3.5 px-3">
                                <p 
                                  className="line-clamp-2 text-slate-700 font-sans text-xs leading-relaxed cursor-pointer hover:text-slate-900"
                                  onClick={() => {
                                    setDetailComplaint(c);
                                    setIsDetailModalOpen(true);
                                  }}
                                  title={c.description}
                                >
                                  {c.description}
                                </p>
                              </td>

                              {/* 6. Partner Org */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <span className="font-bold text-slate-800 text-xs">
                                  {c.partnerOrgName || 'CBDP Foundation'}
                                </span>
                              </td>

                              {/* 7. Status & SLA */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  c.status === 'Closed'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    c.status === 'Closed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                                  }`} />
                                  <span>{c.status}</span>
                                </span>

                                {/* 30-Day SLA Indicator */}
                                {c.status === 'Closed' ? (
                                  <span className="text-[10px] text-slate-400 block mt-1 font-medium">
                                    Resolved {formatDateDisplay(c.dateClosed)}
                                  </span>
                                ) : isRecordOverdue ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 mt-1">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    <span>Overdue ({daysOld}d)</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 block mt-1 font-medium">
                                    SLA: {Math.max(0, 30 - daysOld)}d left
                                  </span>
                                )}

                                {c.hasAppeal && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 mt-1">
                                    <Scale className="w-3 h-3 text-purple-600" />
                                    <span>Appeal Active</span>
                                  </span>
                                )}
                              </td>
                            </>
                          ) : (
                            /* ========================================================= */
                            /* ROW RENDERING: ALL 18 FIELDS VIEW (FULL AUDIT SHEET)      */
                            /* ========================================================= */
                            <>
                              {/* 01. S.No */}
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

                              {/* 02. Date Received */}
                              <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                                {formatDateDisplay(c.dateReceived)}
                                {daysOld > 0 && (
                                  <span className="text-[10px] text-slate-400 block">
                                    ({daysOld}d ago)
                                  </span>
                                )}
                              </td>

                              {/* 03. Receiving Channel */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-800">
                                  {getChannelIcon(c.receivingChannel)}
                                  <span>{c.receivingChannel}</span>
                                </div>
                              </td>

                              {/* 04. Complainant Name & Address */}
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900 truncate max-w-[160px]">
                                  {c.complainantName || 'Anonymous'}
                                </div>
                                {c.complainantAddress && (
                                  <span className="text-[10px] text-slate-500 block truncate max-w-[160px]" title={c.complainantAddress}>
                                    {c.complainantAddress}
                                  </span>
                                )}
                              </td>

                              {/* 05. Contact Phone */}
                              <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                                <span className="font-semibold block">{displayPhone(c.complainantPhone)}</span>
                              </td>

                              {/* 06. Category */}
                              <td className="py-3 px-3">
                                <span className="inline-block px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold truncate max-w-[150px]" title={c.complaintCategory}>
                                  {c.complaintCategory}
                                </span>
                              </td>

                              {/* 07. Description */}
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

                              {/* 08. Gender */}
                              <td className="py-3 px-2 text-center text-slate-700 whitespace-nowrap">
                                {c.complainantGender || '—'}
                              </td>

                              {/* 09. Age */}
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

                              {/* 11. Partner Org (Properly spaced, no truncation!) */}
                              <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                                {c.partnerOrgName || 'CBDP Foundation'}
                              </td>

                              {/* 12. Actions Taken */}
                              <td className="py-3 px-3">
                                <p className="line-clamp-2 text-slate-600 font-sans leading-snug" title={c.actionsTaken}>
                                  {c.actionsTaken || '—'}
                                </p>
                              </td>

                              {/* 13. Reason for Delay */}
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

                              {/* 14. Status */}
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

                              {/* 15. Date Closed */}
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

                              {/* 18. Final Closing */}
                              <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                                {formatDateDisplay(c.finalClosingDateAfterAppeal)}
                              </td>
                            </>
                          )}

                          {/* ========================================================= */}
                          {/* ACTIONS COLUMN (UNIFIED & CLEAN)                          */}
                          {/* ========================================================= */}
                          <td className="py-3.5 px-4 text-right sticky right-0 bg-white/95 backdrop-blur-xs whitespace-nowrap z-10 shadow-xs">
                            <div className="flex items-center justify-end gap-1">
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailComplaint(c);
                                  setIsDetailModalOpen(true);
                                }}
                                title="View Complete Record"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Quick Status / Resolution Update */}
                              <button
                                type="button"
                                onClick={() => {
                                  setStatusComplaint(c);
                                  setIsStatusModalOpen(true);
                                }}
                                title="Update Status / Resolution"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>

                              {/* Appeal Workflow */}
                              <button
                                type="button"
                                onClick={() => {
                                  setAppealComplaint(c);
                                  setIsAppealModalOpen(true);
                                }}
                                title="Manage Appeal"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                              >
                                <Scale className="w-4 h-4" />
                              </button>

                              {/* Edit Record */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedComplaint(c);
                                  setIsFormModalOpen(true);
                                }}
                                title="Edit Record"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Delete Record */}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmation({ isOpen: true, item: c })}
                                title="Delete Record"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
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
        projectId={selectedProjectId || null}
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
