import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Download,
  UploadCloud,
  MapPin,
  Building,
  HeartHandshake,
  ShieldCheck,
  Eye,
  Edit3,
  Trash2,
  Phone,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  Check,
  SlidersHorizontal,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

import LocationSelector from '../../components/common/LocationSelector';
import BeneficiaryDetailModal from './BeneficiaryDetailModal';
import BeneficiaryFormModal from './BeneficiaryFormModal';
import BeneficiaryImportModal from './BeneficiaryImportModal';

export default function BeneficiaryManagement() {
  const { user } = useAuth();
  const canManage = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'FINANCE_OFFICER'].includes(user?.role);
  const canDelete = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user?.role);

  // Data states
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Tab & Filter states
  const [activeForumTab, setActiveForumTab] = useState('ALL'); // 'ALL' | 'Upazilla Nagoric Forum' | 'Amtoli Sadar Union Nagoric Forum' | 'Arpangasia Union Nagoric Forum'
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState({
    division: '',
    district: '',
    upazila: '',
    union: '',
  });
  const [sexFilter, setSexFilter] = useState('ALL');
  const [disabilityFilter, setDisabilityFilter] = useState('ALL');
  const [crossForumOnly, setCrossForumOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Pagination & Sorting states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('sl');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Show Toast Notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Fetch Dynamic Stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const params = {};
      if (activeForumTab !== 'ALL') params.forumName = activeForumTab;
      if (locationFilter.division) params.division = locationFilter.division;
      if (locationFilter.district) params.district = locationFilter.district;
      if (locationFilter.upazila) params.upazila = locationFilter.upazila;
      if (locationFilter.union) params.union = locationFilter.union;

      const res = await api.get('/beneficiaries/stats', { params });
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch beneficiary stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [activeForumTab, locationFilter]);

  // 2. Fetch Beneficiaries List
  const fetchBeneficiaries = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (activeForumTab !== 'ALL') params.forumName = activeForumTab;
      if (locationFilter.division) params.division = locationFilter.division;
      if (locationFilter.district) params.district = locationFilter.district;
      if (locationFilter.upazila) params.upazila = locationFilter.upazila;
      if (locationFilter.union) params.union = locationFilter.union;
      if (sexFilter !== 'ALL') params.sex = sexFilter;
      if (disabilityFilter !== 'ALL') params.disability = disabilityFilter;
      if (crossForumOnly) params.crossForumOnly = 'true';

      const res = await api.get('/beneficiaries', { params });
      if (res.data?.success) {
        setBeneficiaries(res.data.data || []);
        setTotalCount(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch beneficiaries:', err);
      showToast('Failed to load beneficiary records', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    sortBy,
    sortOrder,
    searchQuery,
    activeForumTab,
    locationFilter,
    sexFilter,
    disabilityFilter,
    crossForumOnly,
  ]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  // Handle Tab Switch
  const handleTabChange = (tab) => {
    setActiveForumTab(tab);
    setPage(1);
  };

  // Handle Location Change
  const handleLocationChange = (loc) => {
    setLocationFilter(loc);
    setPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setLocationFilter({ division: '', district: '', upazila: '', union: '' });
    setSexFilter('ALL');
    setDisabilityFilter('ALL');
    setCrossForumOnly(false);
    setActiveForumTab('ALL');
    setPage(1);
  };

  // Handle Sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Create / Update Submit Handler
  const handleFormSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      if (formInitialData && formInitialData._id) {
        // Update
        const res = await api.put(`/beneficiaries/${formInitialData._id}`, formData);
        if (res.data?.success) {
          showToast('Beneficiary record updated successfully!');
          setIsFormOpen(false);
          setFormInitialData(null);
          fetchBeneficiaries();
          fetchStats();
        }
      } else {
        // Create
        const res = await api.post('/beneficiaries', formData);
        if (res.data?.success) {
          showToast('New beneficiary record added successfully!');
          setIsFormOpen(false);
          fetchBeneficiaries();
          fetchStats();
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save beneficiary record';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Record Handler
  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/beneficiaries/${id}`);
      if (res.data?.success) {
        showToast('Beneficiary record permanently deleted.');
        setDeleteConfirmId(null);
        fetchBeneficiaries();
        fetchStats();
      }
    } catch (err) {
      showToast('Failed to delete beneficiary record', 'error');
    }
  };

  // Batch Import Handler
  const handleImportConfirm = async (importPayload) => {
    try {
      setIsImporting(true);
      const res = await api.post('/beneficiaries/import', importPayload);
      if (res.data?.success) {
        showToast(res.data.message || 'Import successful!');
        setIsImportOpen(false);
        fetchBeneficiaries();
        fetchStats();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to import spreadsheet';
      showToast(msg, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Export CSV Handler
  const handleExport = async (format = 'csv') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (activeForumTab !== 'ALL') params.append('forumName', activeForumTab);
      if (locationFilter.division) params.append('division', locationFilter.division);
      if (locationFilter.district) params.append('district', locationFilter.district);
      if (locationFilter.upazila) params.append('upazila', locationFilter.upazila);
      if (locationFilter.union) params.append('union', locationFilter.union);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/beneficiaries/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CBDP_Beneficiaries_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast(`Exported ${format.toUpperCase()} successfully!`);
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export beneficiaries', 'error');
    }
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(searchQuery) ||
      Boolean(locationFilter.division) ||
      Boolean(locationFilter.district) ||
      Boolean(locationFilter.upazila) ||
      Boolean(locationFilter.union) ||
      sexFilter !== 'ALL' ||
      disabilityFilter !== 'ALL' ||
      crossForumOnly ||
      activeForumTab !== 'ALL'
    );
  }, [searchQuery, locationFilter, sexFilter, disabilityFilter, crossForumOnly, activeForumTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Beneficiary Information
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage, search, and analyze project beneficiary records by project and administrative location.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              fetchBeneficiaries();
              fetchStats();
            }}
            title="Refresh database records"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => handleExport('csv')}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {canManage && (
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-700 font-semibold text-xs transition flex items-center gap-2 shadow-xs"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Import Sheet</span>
            </button>
          )}

          {canManage && (
            <button
              onClick={() => {
                setFormInitialData(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-sm shadow-indigo-600/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Beneficiary</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Dynamic Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        
        {/* Card 1: Total Beneficiaries */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Records</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {statsLoading ? '...' : stats?.totalBeneficiaries ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
            <span>Official Beneficiaries</span>
          </div>
        </div>

        {/* Card 2: Women / Female Representation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-rose-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Female Members</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
            {statsLoading ? '...' : stats?.bySex?.Female ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            {stats && stats.totalBeneficiaries > 0
              ? `${Math.round(((stats.bySex?.Female || 0) / stats.totalBeneficiaries) * 100)}% of total`
              : '0%'}
          </div>
        </div>

        {/* Card 3: Male Representation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-blue-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Male Members</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="text-2xl font-extrabold text-blue-600 tracking-tight">
            {statsLoading ? '...' : stats?.bySex?.Male ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            {stats && stats.totalBeneficiaries > 0
              ? `${Math.round(((stats.bySex?.Male || 0) / stats.totalBeneficiaries) * 100)}% of total`
              : '0%'}
          </div>
        </div>

        {/* Card 4: Persons with Disability */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-purple-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Disability Inclusion</span>
            <HeartHandshake className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 tracking-tight">
            {statsLoading ? '...' : stats?.vulnerabilities?.disabilityCount ?? 0}
          </div>
          <div className="text-[11px] text-purple-700/80 mt-1 font-semibold">
            PWD Verified
          </div>
        </div>

        {/* Card 5: Cross-Forum Representatives */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-amber-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cross-Forum</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
            {statsLoading ? '...' : stats?.vulnerabilities?.crossForumCount ?? 0}
          </div>
          <div className="text-[11px] text-amber-700/80 mt-1 font-medium">
            Multi-Forum Leaders
          </div>
        </div>

        {/* Card 6: Coverage Hierarchy */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Coverage</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            {statsLoading ? '...' : Object.keys(stats?.byUnion || {}).length || 3}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">
            Unions / Pourashovas
          </div>
        </div>

      </div>

      {/* Source Worksheets / Forum Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-px">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {[
            { id: 'ALL', name: 'All Beneficiaries', count: stats?.totalBeneficiaries },
            {
              id: 'Upazilla Nagoric Forum',
              name: 'Upazilla Nagoric Forum',
              count: stats?.byForum?.['Upazilla Nagoric Forum'] ?? 20,
            },
            {
              id: 'Amtoli Sada Union Nagoric Forum',
              name: 'Amtoli Sadar Union Forum',
              count: stats?.byForum?.['Amtoli Sadar Union Nagoric Forum'] ?? 25,
            },
            {
              id: 'Arpangasia Union Nagoric Forum',
              name: 'Arpangasia Union Forum',
              count: stats?.byForum?.['Arpangasia Union Nagoric Forum'] ?? 25,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                activeForumTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.name}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeForumTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
            filtersOpen || hasActiveFilters
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
          )}
        </button>
      </div>

      {/* Hierarchical Location & Extended Filters Panel */}
      {(filtersOpen || hasActiveFilters) && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-200">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Hierarchical Location & Multi-Criteria Filtering
            </span>
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          </div>

          {/* 4-Level Bangladesh Location Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
              Bangladesh Administrative Location (Division → District → Upazila → Union)
            </label>
            <LocationSelector
              division={locationFilter.division}
              district={locationFilter.district}
              upazila={locationFilter.upazila}
              union={locationFilter.union}
              onChange={handleLocationChange}
              isFilterMode={true}
              layout="grid"
            />
          </div>

          {/* Secondary Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
            
            {/* Global Search */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Search Keyword</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Name, phone, village..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Sex / Gender */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={sexFilter}
                onChange={(e) => {
                  setSexFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Genders</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Transgender">Transgender</option>
              </select>
            </div>

            {/* Disability Status */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Disability Inclusion</label>
              <select
                value={disabilityFilter}
                onChange={(e) => {
                  setDisabilityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Status</option>
                <option value="Yes">Persons with Disability (Yes)</option>
                <option value="No">No Disability</option>
              </select>
            </div>

            {/* Multi-Forum Toggle */}
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={crossForumOnly}
                  onChange={(e) => {
                    setCrossForumOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>Multi-Forum Members Only</span>
              </label>
            </div>

          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Active Filters:</span>
              
              {activeForumTab !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-200">
                  Forum: {activeForumTab}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleTabChange('ALL')} />
                </span>
              )}

              {locationFilter.division && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-200">
                  Div: {locationFilter.division}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleLocationChange({ ...locationFilter, division: '' })} />
                </span>
              )}

              {locationFilter.district && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-200">
                  Dist: {locationFilter.district}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleLocationChange({ ...locationFilter, district: '' })} />
                </span>
              )}

              {locationFilter.upazila && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-200">
                  Upa: {locationFilter.upazila}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleLocationChange({ ...locationFilter, upazila: '' })} />
                </span>
              )}

              {locationFilter.union && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-200">
                  Union: {locationFilter.union}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleLocationChange({ ...locationFilter, union: '' })} />
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-200">
                  Search: "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                </span>
              )}

              {sexFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-200">
                  Sex: {sexFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSexFilter('ALL')} />
                </span>
              )}

              {disabilityFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-200">
                  Disability: {disabilityFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setDisabilityFilter('ALL')} />
                </span>
              )}

              {crossForumOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-300">
                  Multi-Forum Leaders
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setCrossForumOnly(false)} />
                </span>
              )}
            </div>
          )}

        </div>
      )}

      {/* Main Beneficiary Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Table Controls Bar */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="font-semibold text-slate-700">
            Showing <span className="font-bold text-slate-900">{beneficiaries.length}</span> of{' '}
            <span className="font-bold text-slate-900">{totalCount}</span> Beneficiaries
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort('sl')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>SL / ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Beneficiary Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">Contact (Self)</th>
                <th className="px-4 py-3 whitespace-nowrap">Mother's Name</th>
                <th
                  onClick={() => handleSort('age')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Age / Occupation</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">Administrative Location</th>
                <th className="px-4 py-3 whitespace-nowrap">Village / Detail Address</th>
                <th className="px-4 py-3 whitespace-nowrap">Forum / Worksheet</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Inclusion</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <p className="font-medium text-xs">Loading official beneficiary records...</p>
                  </td>
                </tr>
              ) : beneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No Beneficiary Records Found</h3>
                    <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                      No matching records found for the applied administrative location or filters. Try resetting the filters.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                beneficiaries.map((b) => (
                  <tr
                    key={b._id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedBeneficiary(b);
                      setIsDetailOpen(true);
                    }}
                  >
                    {/* SL & ID */}
                    <td className="px-4 py-3 font-mono whitespace-nowrap">
                      <div className="font-bold text-slate-800">#{b.sl || '—'}</div>
                      <div className="text-[10px] text-slate-400">{b.beneficiaryId}</div>
                    </td>

                    {/* Name & Sex Badge */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            b.sex === 'Female'
                              ? 'bg-rose-100 text-rose-700'
                              : b.sex === 'Male'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {b.name ? b.name.charAt(0).toUpperCase() : 'B'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1.5">
                            <span>{b.name}</span>
                            {b.crossForumMember && (
                              <span
                                title="Multi-Forum Leader (Active in both Union and Upazila forums)"
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                Multi-Forum
                              </span>
                            )}
                          </div>
                          <span
                            className={`inline-block text-[10px] font-medium ${
                              b.sex === 'Female' ? 'text-rose-600' : 'text-blue-600'
                            }`}
                          >
                            {b.sex}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact Number */}
                    <td className="px-4 py-3 font-mono whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {b.contactNo ? (
                        <a
                          href={`tel:${b.contactNo}`}
                          className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                          title="Call beneficiary"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{b.contactNo}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {b.alternativeContactNo && (
                        <div className="text-[10px] text-slate-400 font-sans truncate max-w-[120px]">
                          Alt: {b.alternativeContactNo}
                        </div>
                      )}
                    </td>

                    {/* Mother's Name */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">
                      {b.motherName || '—'}
                    </td>

                    {/* Age / Occupation */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">
                        {b.age ? `${b.age} yrs` : '—'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {b.occupation || 'Unspecified'}
                      </div>
                    </td>

                    {/* Administrative Location */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>{b.union || '—'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {b.upazila}, {b.district}
                      </div>
                    </td>

                    {/* Village / Detail Address */}
                    <td className="px-4 py-3 max-w-[180px]">
                      <div className="font-medium text-slate-800 truncate" title={b.village}>
                        {b.village || '—'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate" title={b.detailAddress}>
                        {b.detailAddress || ''}
                      </div>
                    </td>

                    {/* Forum / Worksheet */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${
                          b.forumName.toLowerCase().includes('upazilla')
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : b.forumName.toLowerCase().includes('amtoli')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {b.forumName}
                      </span>
                    </td>

                    {/* Inclusion Flags */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {b.disability === 'Yes' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          PWD
                        </span>
                      ) : (
                        <span className="text-slate-300 font-medium text-[10px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td
                      className="px-4 py-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedBeneficiary(b);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canManage && (
                          <button
                            onClick={() => {
                              setFormInitialData(b);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                            title="Edit Record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => setDeleteConfirmId(b._id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg font-semibold text-xs transition ${
                      page === p
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Beneficiary Record</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete this beneficiary record? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <BeneficiaryDetailModal
        beneficiary={selectedBeneficiary}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedBeneficiary(null);
        }}
        onEdit={(b) => {
          setFormInitialData(b);
          setIsFormOpen(true);
        }}
      />

      {/* Add / Edit Form Modal */}
      <BeneficiaryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setFormInitialData(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={formInitialData}
        activeForum={activeForumTab}
        isSubmitting={isSubmitting}
      />

      {/* Spreadsheet Import Modal */}
      <BeneficiaryImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportConfirm={handleImportConfirm}
        activeForum={activeForumTab}
        isImporting={isImporting}
      />

    </div>
  );
}
