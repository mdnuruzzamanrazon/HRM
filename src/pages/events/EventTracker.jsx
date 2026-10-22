import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Building,
  MapPin,
  Users,
  ShieldCheck,
  Radio,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  Printer,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Copy,
  Info,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Layers,
  ArrowUpDown,
  BookOpen,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import LocationSelector from '../../components/common/LocationSelector';
import EventFormModal from './EventFormModal';
import EventDetailModal from './EventDetailModal';
import EventInstructionsModal from './EventInstructionsModal';
import EventPrintView from './EventPrintView';
import metadata from '../../data/eventMetadata.json';

export default function EventTracker() {
  const { user } = useAuth();

  // State: Data
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // State: Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState({
    division: '',
    district: '',
    upazila: '',
    union: '',
  });
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [eventThemeFilter, setEventThemeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // State: Sorting & Pagination
  const [sortBy, setSortBy] = useState('dateFrom');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // State: Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // State: Delete Confirmation
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State: Toast / Notification
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCopyId = (eventId, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(eventId);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch Summary KPIs
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/events/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.warn('Stats fetch notice:', err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Events List with all active filters
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
        search: searchQuery.trim() || undefined,
        division: locationFilter.division && locationFilter.division !== 'ALL' ? locationFilter.division : undefined,
        district: locationFilter.district && locationFilter.district !== 'ALL' ? locationFilter.district : undefined,
        upazila: locationFilter.upazila && locationFilter.upazila !== 'ALL' ? locationFilter.upazila : undefined,
        union: locationFilter.union && locationFilter.union !== 'ALL' ? locationFilter.union : undefined,
        eventType: eventTypeFilter !== 'ALL' ? eventTypeFilter : undefined,
        eventTheme: eventThemeFilter !== 'ALL' ? eventThemeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
      };

      const res = await api.get('/events', { params });
      if (res.data?.success) {
        setEvents(res.data.data || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalCount(res.data.pagination.totalEvents || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      showToast('Failed to load events. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    sortBy,
    sortOrder,
    searchQuery,
    locationFilter,
    eventTypeFilter,
    eventThemeFilter,
    statusFilter,
    dateFromFilter,
    dateToFilter,
  ]);

  // Initial Load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch when filters/pagination change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setLocationFilter({ division: '', district: '', upazila: '', union: '' });
    setEventTypeFilter('ALL');
    setEventThemeFilter('ALL');
    setStatusFilter('ALL');
    setDateFromFilter('');
    setDateToFilter('');
    setPage(1);
    showToast('Filters reset to default', 'info');
  };

  // Check if any filter is active
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (locationFilter.division && locationFilter.division !== 'ALL') count++;
    if (locationFilter.district && locationFilter.district !== 'ALL') count++;
    if (locationFilter.upazila && locationFilter.upazila !== 'ALL') count++;
    if (locationFilter.union && locationFilter.union !== 'ALL') count++;
    if (eventTypeFilter !== 'ALL') count++;
    if (eventThemeFilter !== 'ALL') count++;
    if (statusFilter !== 'ALL') count++;
    if (dateFromFilter) count++;
    if (dateToFilter) count++;
    return count;
  }, [searchQuery, locationFilter, eventTypeFilter, eventThemeFilter, statusFilter, dateFromFilter, dateToFilter]);

  // Handle Sort Toggle
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Export Events to CSV
  const handleExportCSV = async () => {
    try {
      showToast('Preparing event register export...', 'info');
      // Request complete filtered dataset
      const params = {
        limit: 2000,
        division: locationFilter.division || undefined,
        district: locationFilter.district || undefined,
        upazila: locationFilter.upazila || undefined,
        eventType: eventTypeFilter !== 'ALL' ? eventTypeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      };

      const res = await api.get('/events', { params });
      const dataToExport = res.data?.data || events;

      if (!dataToExport || dataToExport.length === 0) {
        showToast('No records available to export', 'error');
        return;
      }

      // Convert to CSV
      const headers = [
        'SL',
        'Event ID',
        'Date From',
        'Date To',
        'Implementing Org',
        'Consortium Partner',
        'Event Type',
        'Event Theme',
        'Event Title',
        'Division',
        'District',
        'Upazila',
        'Union',
        'Operational Level',
        'Community Participants',
        'Gov Rep Participants',
        'Total Direct Attendees',
        'Gov Rep Present',
        'Gov Response',
        'Gov Response Details',
        'Actions Agreed',
        'Conflict Prevention',
        'Conflict Prevention Details',
        'Indirect Reach',
        'Indirect Channel',
        'Est. Audience Reach',
        'Reach Estimation Source',
        'Status',
      ];

      const csvRows = [headers.join(',')];

      dataToExport.forEach((item) => {
        const commCount = Number(item.participantCountCommunity) || 0;
        const gCount = Number(item.govRepresentativeCount) || 0;
        const totalDirect = commCount + gCount;

        const row = [
          item.sl || '',
          `"${item.eventId || ''}"`,
          item.dateFrom ? new Date(item.dateFrom).toISOString().split('T')[0] : '',
          item.dateTo ? new Date(item.dateTo).toISOString().split('T')[0] : '',
          `"${(item.implementingOrg || '').replace(/"/g, '""')}"`,
          `"${(item.consortiumPartner || '').replace(/"/g, '""')}"`,
          `"${(item.eventType || '').replace(/"/g, '""')}"`,
          `"${(item.eventTheme || '').replace(/"/g, '""')}"`,
          `"${(item.eventTitle || '').replace(/"/g, '""')}"`,
          `"${item.division || ''}"`,
          `"${item.district || ''}"`,
          `"${item.upazila || ''}"`,
          `"${item.union || ''}"`,
          `"${item.eventLevel || ''}"`,
          commCount,
          gCount,
          totalDirect,
          `"${item.govRepresentativePresent || ''}"`,
          `"${item.govResponse || ''}"`,
          `"${(item.govResponseDetails || '').replace(/"/g, '""')}"`,
          `"${(item.actionsAgreed || '').replace(/"/g, '""')}"`,
          `"${item.conflictPrevention || ''}"`,
          `"${(item.conflictPreventionDetails || '').replace(/"/g, '""')}"`,
          `"${item.indirectReach || ''}"`,
          `"${(item.indirectReachChannel || '').replace(/"/g, '""')}"`,
          item.estimatedAudienceReach || 0,
          `"${(item.reachEstimationSource || '').replace(/"/g, '""')}"`,
          `"${item.status || ''}"`,
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', csvContent);
      downloadAnchor.setAttribute(
        'download',
        `CBDP_Event_Tracker_Register_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast(`Exported ${dataToExport.length} event records successfully!`, 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export events register', 'error');
    }
  };

  // Handle Event Saved (from Modal)
  const handleEventSaved = (savedEvent) => {
    setIsFormModalOpen(false);
    setEditingEvent(null);
    fetchEvents();
    fetchStats();
    showToast(
      editingEvent
        ? `Event ${savedEvent.eventId || ''} updated successfully`
        : `New Event ${savedEvent.eventId || ''} recorded successfully!`,
      'success'
    );
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await api.delete(`/events/${deleteCandidate._id}`);
      showToast(`Event record ${deleteCandidate.eventId} removed.`, 'success');
      setDeleteCandidate(null);
      fetchEvents();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete event:', err);
      showToast('Failed to delete event record', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium flex items-center gap-2 animate-bounce-short ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
              : toast.type === 'info'
              ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Page Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8 border border-gray-200/80 dark:border-gray-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <Globe className="w-3.5 h-3.5" />
                Community Based Development Project (CBDP)
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <MapPin className="w-3.5 h-3.5" />
                All 64 Districts • 547 Upazilas • 5,161 Unions
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
              Event Tracker
            </h1>

            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
              Manage, track, and monitor project events, activities, locations, and related information in one centralized workspace.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start lg:self-auto">
            <button
              onClick={() => setIsInstructionsOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 shadow-sm transition-all"
              title="Official SOP and Guidelines"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Official SOP & Guidelines</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 shadow-sm transition-all"
              title="Export Register as CSV"
            >
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Export Register</span>
            </button>

            <button
              onClick={() => {
                fetchEvents();
                fetchStats();
                showToast('Refreshed events list', 'info');
              }}
              className="p-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 shadow-sm transition-all"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <button
              onClick={() => {
                setEditingEvent(null);
                setIsFormModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Summary Dashboard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Total Events */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Events Recorded
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white">
              {statsLoading ? '...' : (stats?.totalEvents ?? totalCount).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
              Active project records
            </span>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500">
            <span>Completed: <strong className="text-emerald-700 dark:text-emerald-400">{stats?.byStatus?.find(s => s._id === 'Completed')?.count || 0}</strong></span>
            <span>Upcoming: <strong className="text-amber-700 dark:text-amber-400">{stats?.byStatus?.find(s => s._id === 'Upcoming')?.count || 0}</strong></span>
          </div>
        </div>

        {/* KPI 2: Direct Participants */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Direct Participants
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white">
              {statsLoading ? '...' : (stats?.totalDirectParticipants || 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
              Community & Gov attendees
            </span>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500">
            <span>Comm: <strong className="text-gray-800 dark:text-gray-200">{(stats?.totalCommunityParticipants || 0).toLocaleString()}</strong></span>
            <span>Gov: <strong className="text-gray-800 dark:text-gray-200">{(stats?.totalGovParticipants || 0).toLocaleString()}</strong></span>
          </div>
        </div>

        {/* KPI 3: Estimated Indirect Reach */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Est. Indirect Reach
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white">
              {statsLoading ? '...' : (stats?.totalIndirectReachAudience || 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
              Media & community dissemination
            </span>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500">
            <span>Campaigns: <strong className="text-purple-700 dark:text-purple-400">{stats?.indirectReachEventsCount || 0}</strong></span>
            <span>Channels: <strong className="text-gray-700 dark:text-gray-300">Social / Radio</strong></span>
          </div>
        </div>

        {/* KPI 4: Government Engagement */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Gov Engagement
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <Building className="w-4 h-4" />
            </div>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white">
              {statsLoading ? '...' : (stats?.govEngagedEventsCount || 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
              Events with Gov. Reps present
            </span>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500">
            <span>Positive: <strong className="text-emerald-700 dark:text-emerald-400">{stats?.govPositiveResponseCount || 0}</strong></span>
            <span>Rate: <strong className="text-teal-700 dark:text-teal-400">
              {stats?.totalEvents ? Math.round(((stats.govEngagedEventsCount || 0) / stats.totalEvents) * 100) : 0}%
            </strong></span>
          </div>
        </div>

        {/* KPI 5: Conflict Prevention */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Conflict Prevention
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white">
              {statsLoading ? '...' : (stats?.conflictPreventionEventsCount || 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
              Peacebuilding & harmony actions
            </span>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500">
            <span>Focus: <strong className="text-amber-700 dark:text-amber-400">Cohesion & Dialogue</strong></span>
            <span>Active: <strong className="text-gray-800 dark:text-gray-200">100%</strong></span>
          </div>
        </div>

      </div>

      {/* 3. Search & Hierarchical Location Filter Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
        
        {/* Search Bar & Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Global Search by Event ID, Title, Implementing Organization, Upazila, or District..."
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                isFilterExpanded || activeFiltersCount > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
              {isFilterExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Reset All Filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Hierarchical Location Selector Hub (Always visible or expandable) */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Bangladesh Administrative Location Filter (Division → District → Upazila → Union)
              </span>
            </div>
            {(locationFilter.division || locationFilter.district || locationFilter.upazila || locationFilter.union) && (
              <button
                onClick={() => {
                  setLocationFilter({ division: '', district: '', upazila: '', union: '' });
                  setPage(1);
                }}
                className="text-xs text-rose-600 hover:underline"
              >
                Clear Location
              </button>
            )}
          </div>

          <LocationSelector
            division={locationFilter.division}
            district={locationFilter.district}
            upazila={locationFilter.upazila}
            union={locationFilter.union}
            onChange={(loc) => {
              setLocationFilter(loc);
              setPage(1);
            }}
            isFilterMode={true}
            layout="grid"
          />
        </div>

        {/* Expanded Filters Panel (Type, Theme, Date Range, Status) */}
        {isFilterExpanded && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
            {/* Event Type Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">
                Event Type
              </label>
              <select
                value={eventTypeFilter}
                onChange={(e) => {
                  setEventTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="ALL">All Event Types (31)</option>
                {metadata.eventTypes?.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Theme Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">
                Event Theme
              </label>
              <select
                value={eventThemeFilter}
                onChange={(e) => {
                  setEventThemeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="ALL">All Event Themes (16)</option>
                {metadata.eventThemes?.map((th) => (
                  <option key={th} value={th}>
                    {th}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Range Filters */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => {
                    setDateFromFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  title="From Date"
                />
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => {
                    setDateToFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  title="To Date"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Professional Event Listing Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Header Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-850">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-gray-950 dark:text-white">
              Event Register Records
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {totalCount.toLocaleString()} {totalCount === 1 ? 'event' : 'events'} found
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Page size:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 uppercase text-[11px] font-bold tracking-wider border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3.5 w-14">SL</th>

                <th
                  onClick={() => handleSort('eventId')}
                  className="px-4 py-3.5 cursor-pointer hover:text-emerald-600 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Event ID</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('dateFrom')}
                  className="px-4 py-3.5 cursor-pointer hover:text-emerald-600 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('eventTitle')}
                  className="px-4 py-3.5 cursor-pointer hover:text-emerald-600 transition-colors min-w-[220px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Event Title & Theme</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>

                <th className="px-4 py-3.5 min-w-[170px]">Implementing Org</th>

                <th className="px-4 py-3.5 min-w-[200px]">Administrative Location</th>

                <th
                  onClick={() => handleSort('participantCountCommunity')}
                  className="px-4 py-3.5 cursor-pointer hover:text-emerald-600 transition-colors whitespace-nowrap text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Participants</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>

                <th className="px-4 py-3.5 whitespace-nowrap text-center">Gov Engagement</th>

                <th className="px-4 py-3.5 whitespace-nowrap text-center">Status</th>

                <th className="px-4 py-3.5 text-right w-28">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-20 text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="text-xs font-semibold">Loading CBDP event records...</span>
                    </div>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-20">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-emerald-600">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        No Event Records Found
                      </h3>
                      <p className="text-xs text-gray-500">
                        {activeFiltersCount > 0
                          ? 'No events match your current filter criteria. Try resetting your search or location filters.'
                          : 'No project events have been registered yet. Click "+ Add New Event" to record your first event.'}
                      </p>
                      {activeFiltersCount > 0 ? (
                        <button
                          onClick={handleResetFilters}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                          Reset Filters
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingEvent(null);
                            setIsFormModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                          + Record First Event
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                events.map((ev, index) => {
                  const commCount = Number(ev.participantCountCommunity) || 0;
                  const gCount = Number(ev.govRepresentativeCount) || 0;
                  const totalDirect = commCount + gCount;

                  return (
                    <tr
                      key={ev._id || index}
                      onClick={() => {
                        setSelectedEvent(ev);
                        setIsDetailModalOpen(true);
                      }}
                      className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors group"
                    >
                      {/* SL */}
                      <td className="px-4 py-3 font-medium text-gray-400">
                        {ev.sl || (page - 1) * limit + index + 1}
                      </td>

                      {/* Event ID */}
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 border border-gray-200 dark:border-gray-700 group-hover:border-emerald-400 transition-colors">
                          <span>{ev.eventId}</span>
                          <button
                            onClick={(e) => handleCopyId(ev.eventId, e)}
                            className="text-gray-400 hover:text-emerald-600"
                            title="Copy Event ID"
                          >
                            {copiedId === ev.eventId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-gray-900 dark:text-white block">
                          {formatDate(ev.dateFrom)}
                        </span>
                        {ev.dateTo && ev.dateTo !== ev.dateFrom && (
                          <span className="text-[11px] text-gray-400 block">
                            to {formatDate(ev.dateTo)}
                          </span>
                        )}
                      </td>

                      {/* Title & Theme */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className="font-bold text-gray-900 dark:text-white line-clamp-1 block text-xs sm:text-sm">
                            {ev.eventTitle}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {ev.eventType}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {ev.eventTheme}
                            </span>
                            {ev.conflictPrevention === 'Yes' && (
                              <span
                                className="p-0.5 rounded text-amber-600 dark:text-amber-400"
                                title="Conflict Prevention Event"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 inline" />
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Organization */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900 dark:text-white block line-clamp-1">
                          {ev.implementingOrg}
                        </span>
                        {ev.consortiumPartner && (
                          <span className="text-[11px] text-gray-500 line-clamp-1">
                            Partner: {ev.consortiumPartner}
                          </span>
                        )}
                      </td>

                      {/* Administrative Location */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-gray-900 dark:text-white block">
                            {[ev.upazila, ev.district].filter(Boolean).join(', ') || ev.district}
                          </span>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block">
                            Div: {ev.division} {ev.union ? `• Un: ${ev.union}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Participants */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-extrabold text-gray-950 dark:text-white text-sm block">
                          {totalDirect.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          {commCount} comm + {gCount} gov
                        </span>
                      </td>

                      {/* Gov Engagement */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {ev.govRepresentativePresent === 'Yes' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {ev.govResponse || 'Yes'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            ev.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : ev.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : ev.status === 'Upcoming'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {ev.status || 'Completed'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setSelectedEvent(ev);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedEvent(ev);
                              setIsPrintModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Print Top Sheet"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingEvent(ev);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                            title="Edit Event"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteCandidate(ev)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Event Record"
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

        {/* Table Pagination */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-gray-50/50 dark:bg-gray-850">
          <span className="text-gray-500">
            Showing{' '}
            <strong className="text-gray-900 dark:text-white">
              {totalCount === 0 ? 0 : (page - 1) * limit + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-gray-900 dark:text-white">
              {Math.min(page * limit, totalCount)}
            </strong>{' '}
            of <strong className="text-gray-900 dark:text-white">{totalCount}</strong> records
          </span>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-semibold text-gray-800 dark:text-gray-200">
              Page {page} of {totalPages || 1}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Modals */}
      
      {/* Add / Edit Event Modal */}
      <EventFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleEventSaved}
        eventToEdit={editingEvent}
      />

      {/* Event Details Comprehensive Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvent(null);
        }}
        onEdit={(ev) => {
          setIsDetailModalOpen(false);
          setEditingEvent(ev);
          setIsFormModalOpen(true);
        }}
        onPrint={(ev) => {
          setSelectedEvent(ev);
          setIsPrintModalOpen(true);
        }}
      />

      {/* Official Instructions & SOP Modal */}
      <EventInstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />

      {/* Printable Top Sheet Modal */}
      <EventPrintView
        event={selectedEvent}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-950 dark:text-white">
                Delete Event Record?
              </h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to permanently delete event{' '}
                <strong className="text-gray-800 dark:text-gray-200 font-mono">
                  {deleteCandidate.eventId}
                </strong>
                ? This action will archive the record from the active project register.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
