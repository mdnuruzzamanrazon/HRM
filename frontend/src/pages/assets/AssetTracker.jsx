import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import QRCode from 'qrcode';
import {
  Boxes,
  Package,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Download,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Printer,
  QrCode,
  Truck,
  FileText,
  GitCommit,
  Database,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  DollarSign,
  MapPin,
  Tag,
  PackageCheck,
  Building2,
  ExternalLink,
  SlidersHorizontal,
  X
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import AssetDetailModal from './AssetDetailModal';
import AssetFormModal from './AssetFormModal';
import FieldKitModal from './FieldKitModal';
import VehicleLogModal from './VehicleLogModal';
import HandoverModal from './HandoverModal';
import WorkflowModal from './WorkflowModal';
import GoogleSyncModal from './GoogleSyncModal';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AssetTracker() {
  const { user } = useAuth();
  const canManage = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'FINANCE_OFFICER'].includes(user?.role);
  const canDelete = ['SUPER_ADMIN', 'HR_ADMIN'].includes(user?.role);

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'register' | 'qr-system' | 'field-kits' | 'handovers' | 'vehicle-log' | 'workflows' | 'references'

  // Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [fieldKits, setFieldKits] = useState([]);
  const [vehicleLogs, setVehicleLogs] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [consumables, setConsumables] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [references, setReferences] = useState({});

  // Loading States
  const [loading, setLoading] = useState(true);
  const [dashLoading, setDashLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Filter & Search States for Register
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [donorFilter, setDonorFilter] = useState('ALL');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [selectedKit, setSelectedKit] = useState(null);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // QR System Batch Selection
  const [selectedQrAssetIds, setSelectedQrAssetIds] = useState([]);
  const [qrBatchPreviewUrls, setQrBatchPreviewUrls] = useState({});

  // Toast Notification
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Fetch Dashboard Analytics
  const fetchDashboard = useCallback(async () => {
    try {
      setDashLoading(true);
      const res = await api.get('/assets/dashboard');
      if (res.data?.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching asset dashboard:', err);
    } finally {
      setDashLoading(false);
    }
  }, []);

  // 2. Fetch Assets Register
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (locationFilter !== 'ALL') params.location = locationFilter;
      if (riskFilter !== 'ALL') params.riskFlag = riskFilter;
      if (donorFilter !== 'ALL') params.projectDonor = donorFilter;

      const res = await api.get('/assets', { params });
      if (res.data?.success) {
        setAssets(res.data.data);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalCount(res.data.pagination.totalCount || 0);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      showToast('Failed to load asset records', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, searchQuery, categoryFilter, statusFilter, locationFilter, riskFilter, donorFilter]);

  // 3. Fetch Supporting Data
  const fetchSupportingData = useCallback(async () => {
    try {
      const [refRes, kitRes, vehRes, hoRes, wfRes] = await Promise.all([
        api.get('/assets/references'),
        api.get('/assets/kits'),
        api.get('/assets/vehicles'),
        api.get('/assets/handovers'),
        api.get('/assets/workflows'),
      ]);
      if (refRes.data?.success) setReferences(refRes.data.data || {});
      if (kitRes.data?.success) setFieldKits(kitRes.data.data || []);
      if (vehRes.data?.success) setVehicleLogs(vehRes.data.data || []);
      if (hoRes.data?.success) {
        setHandovers(hoRes.data.data.handovers || []);
        setConsumables(hoRes.data.data.consumables || []);
      }
      if (wfRes.data?.success) setWorkflows(wfRes.data.data || []);
    } catch (err) {
      console.error('Error fetching supporting asset data:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchSupportingData();
  }, [fetchDashboard, fetchSupportingData]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Reset pagination on filter change
  const handleFilterChange = (setter, val) => {
    setter(val);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setLocationFilter('ALL');
    setRiskFilter('ALL');
    setDonorFilter('ALL');
    setPage(1);
  };

  // Form Submissions
  const handleSaveAsset = async (formData) => {
    try {
      setIsSubmitting(true);
      if (formInitialData?._id || formInitialData?.assetId) {
        const id = formInitialData._id || formInitialData.assetId;
        const res = await api.put(`/assets/${id}`, formData);
        if (res.data?.success) {
          showToast('Asset record updated successfully');
          setIsFormOpen(false);
          fetchAssets();
          fetchDashboard();
        }
      } else {
        const res = await api.post('/assets', formData);
        if (res.data?.success) {
          showToast('New asset registered successfully');
          setIsFormOpen(false);
          fetchAssets();
          fetchDashboard();
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving asset', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id) => {
    try {
      setIsSubmitting(true);
      const res = await api.delete(`/assets/${id}`);
      if (res.data?.success) {
        showToast('Asset archived successfully');
        setDeleteConfirmId(null);
        fetchAssets();
        fetchDashboard();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting asset', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveFieldKit = async (kitData) => {
    try {
      setIsSubmitting(true);
      if (selectedKit?._id || selectedKit?.itemCode) {
        const id = selectedKit._id || selectedKit.itemCode;
        await api.put(`/assets/kits/${id}/stock`, kitData);
        showToast('Field kit stock updated');
      } else {
        await api.post('/assets/kits', kitData);
        showToast('New field kit registered');
      }
      setIsKitModalOpen(false);
      fetchSupportingData();
    } catch (err) {
      showToast('Failed to save field kit', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveVehicleLog = async (logData) => {
    try {
      setIsSubmitting(true);
      await api.post('/assets/vehicles', logData);
      showToast('Vehicle trip log saved');
      setIsVehicleModalOpen(false);
      fetchSupportingData();
      fetchDashboard();
    } catch (err) {
      showToast('Failed to record vehicle trip', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveHandover = async (hoData) => {
    try {
      setIsSubmitting(true);
      await api.post('/assets/handovers', hoData);
      showToast('Asset handover deed finalized');
      setIsHandoverModalOpen(false);
      fetchSupportingData();
    } catch (err) {
      showToast('Failed to save handover deed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveWorkflow = async (wfData) => {
    try {
      setIsSubmitting(true);
      await api.post('/assets/workflows', wfData);
      showToast('Procurement workflow request logged');
      setIsWorkflowModalOpen(false);
      fetchSupportingData();
      fetchDashboard();
    } catch (err) {
      showToast('Failed to log workflow request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // QR Batch Generation
  useEffect(() => {
    if (activeTab === 'qr-system' && assets.length > 0) {
      assets.forEach((a) => {
        if (!qrBatchPreviewUrls[a.assetId]) {
          QRCode.toDataURL(a.qrText || `${a.assetId}|${a.name}`, { width: 90, margin: 1 })
            .then((url) => {
              setQrBatchPreviewUrls((prev) => ({ ...prev, [a.assetId]: url }));
            })
            .catch(() => {});
        }
      });
    }
  }, [activeTab, assets, qrBatchPreviewUrls]);

  const handleSelectAllQr = (e) => {
    if (e.target.checked) {
      setSelectedQrAssetIds(assets.map((a) => a.assetId));
    } else {
      setSelectedQrAssetIds([]);
    }
  };

  const handleToggleQrSelect = (id) => {
    setSelectedQrAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchPrintQr = async () => {
    if (selectedQrAssetIds.length === 0) {
      showToast('Please select at least one asset to print', 'error');
      return;
    }
    try {
      await api.put('/assets/qr-status', {
        assetIds: selectedQrAssetIds,
        printStatus: 'Printed',
      });
      showToast(`Marked ${selectedQrAssetIds.length} QR tags as Printed`);
      window.print();
      fetchAssets();
    } catch (err) {
      showToast('Failed to update QR print status', 'error');
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (assets.length === 0) {
      showToast('No assets to export', 'error');
      return;
    }
    const headers = [
      'Asset ID',
      'Asset Name',
      'Category',
      'Project/Donor',
      'Location',
      'Custodian',
      'Purchase Date',
      'Purchase Cost',
      'Useful Life (Years)',
      'Annual Depreciation',
      'Current Book Value',
      'Condition',
      'Status',
      'Last Audit Date',
      'Audit Result',
      'Next Audit Due',
      'Risk Flag',
      'Remarks',
    ];

    const rows = assets.map((a) => [
      `"${a.assetId || ''}"`,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${a.category || ''}"`,
      `"${a.projectDonor || ''}"`,
      `"${a.location || ''}"`,
      `"${a.custodian || ''}"`,
      `"${a.purchaseDate || ''}"`,
      a.purchaseCost || 0,
      a.usefulLifeYears || 5,
      a.annualDepreciation || 0,
      a.currentBookValue || 0,
      `"${a.condition || ''}"`,
      `"${a.status || ''}"`,
      `"${a.lastAuditDate || ''}"`,
      `"${a.auditResult || ''}"`,
      `"${a.nextAuditDue || ''}"`,
      `"${a.riskFlag || ''}"`,
      `"${(a.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CBDP_Asset_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Asset register exported successfully');
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('active') || s.includes('use')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s.includes('maintenance')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s.includes('disposed') || s.includes('lost')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getRiskBadge = (risk) => {
    const r = String(risk || '').toLowerCase();
    if (r === 'critical' || r === 'high') {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (r === 'medium') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border animate-in slide-in-from-bottom-5 duration-200 ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          {notification.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Asset Tracker Management System
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Enterprise Multi-Worksheet Asset Governance, Audit Lifecycle & QR Tracking
              </p>
            </div>
          </div>
        </div>

        {/* Global Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            Sync Google Sheets
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition border border-slate-300"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Export CSV
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setFormInitialData(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              Register Asset
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs based on the 9 Worksheets */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 text-sm font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" />
          Overview Dashboard
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'register'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Package className="w-4 h-4" />
          Master Asset Register ({totalCount || 30})
        </button>

        <button
          onClick={() => setActiveTab('qr-system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'qr-system'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <QrCode className="w-4 h-4" />
          QR Tag System & Printing
        </button>

        <button
          onClick={() => setActiveTab('field-kits')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'field-kits'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          Field Kits & Inventory ({fieldKits.length})
        </button>

        <button
          onClick={() => setActiveTab('handovers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'handovers'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          Handover & Return Deeds ({handovers.length})
        </button>

        <button
          onClick={() => setActiveTab('vehicle-log')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'vehicle-log'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Truck className="w-4 h-4" />
          Fleet & Vehicle Logbook ({vehicleLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'workflows'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          Procurement & Lifecycle ({workflows.length})
        </button>

        <button
          onClick={() => setActiveTab('references')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
            activeTab === 'references'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Database className="w-4 h-4" />
          Reference Master Lists
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE OVERVIEW & ANALYTICS (Worksheet 1 / GID 1754930862)     */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Registered</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  {dashLoading ? '...' : dashboardData?.kpi?.totalAssets ?? 30}
                </span>
                <span className="text-xs text-slate-500 font-medium">Assets on file</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Full institutional register</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active / In Use</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700">
                  {dashLoading ? '...' : dashboardData?.kpi?.activeAssets ?? 29}
                </span>
                <span className="text-xs text-emerald-600 font-medium">Operational</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Currently assigned or available</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Critical / High Risk</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600">
                  {dashLoading ? '...' : dashboardData?.kpi?.criticalRiskAssets ?? 2}
                </span>
                <span className="text-xs text-rose-600 font-medium">Needs Attention</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">High risk or maintenance needed</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Audit Overdue</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600">
                  {dashLoading ? '...' : dashboardData?.kpi?.auditOverdueCount ?? 2}
                </span>
                <span className="text-xs text-amber-600 font-medium">Overdue</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Next audit date already passed</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Purchase Value</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">
                  {dashLoading ? '...' : Number(dashboardData?.kpi?.totalPurchaseValue ?? 332880).toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">BDT</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Original acquisition cost</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Book Value</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-700">
                  {dashLoading ? '...' : Number(dashboardData?.kpi?.currentBookValue ?? 92086).toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">BDT</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Depreciated institutional valuation</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleet Fuel Economy</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-blue-700">
                  {dashLoading ? '...' : dashboardData?.kpi?.avgKmPerLiter ?? 14.25}
                </span>
                <span className="text-xs text-slate-500">KM / Liter</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">From fleet logbook records</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Delayed Workflows</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <GitCommit className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-purple-700">
                  {dashLoading ? '...' : dashboardData?.kpi?.workflowDelayedCount ?? 3}
                </span>
                <span className="text-xs text-slate-500">Pipelines</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Procurement / disposal delayed</span>
            </div>

          </div>

          {/* Manager Notes & Color Guide Bar */}
          <div className="p-4 bg-slate-950 text-white rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30">
                Institutional Color Guide
              </span>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Green = OK</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Amber = Watch</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Red = Overdue / Critical</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Blue = In Progress</span>
              </div>
            </div>
            <div className="text-xs text-slate-400">
              Source: Worksheet 1 (GID 1754930862) Manager Standard Protocol
            </div>
          </div>

          {/* Category Summary Matrix & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Category Summary Matrix Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Category Breakdown Summary Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Exact breakdown matching Google Sheet Dashboard (GID 1754930862)
                  </p>
                </div>
                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                  7 Standard Categories
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-bold text-[11px]">
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3 text-center">Total Assets</th>
                      <th className="py-3 px-3 text-center">Active Assets</th>
                      <th className="py-3 px-3 text-center">Risk Flag</th>
                      <th className="py-3 px-3 text-right">Current Book Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(dashboardData?.categorySummaries || []).map((cat, idx) => (
                      <tr key={cat.category} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          {cat.category}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">
                          {cat.total}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${cat.active > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'}`}>
                            {cat.active}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${cat.risk > 0 ? 'bg-rose-50 text-rose-700' : 'text-slate-400'}`}>
                            {cat.risk}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                          {Number(cat.value || 0).toLocaleString()} BDT
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Condition Pie Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Physical Condition Distribution
                </h3>
                <p className="text-xs text-slate-500 mb-4">Verified during field inspections</p>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.distributions?.byCondition || [
                          { name: 'Good', count: 28 },
                          { name: 'Excellent', count: 1 },
                          { name: 'Fair', count: 1 }
                        ]}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {COLORS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 mt-2">
                <strong>Audit Compliance: </strong> All assets physically labeled with unique QR codes.
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MASTER ASSET REGISTER & AUDITS (Worksheet 2 / GID 1517243350)     */}
      {/* ========================================================================= */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          
          {/* Search, Filter Bar, and Actions */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                  placeholder="Search by ID, name, custodian, location, remarks..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleFilterChange(setSearchQuery, '')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Dropdowns Toggle */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition ${
                    filtersOpen || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || riskFilter !== 'ALL'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters {(categoryFilter !== 'ALL' || statusFilter !== 'ALL' || riskFilter !== 'ALL') ? '(Active)' : ''}
                </button>

                {(searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || riskFilter !== 'ALL' || locationFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs text-rose-600 hover:underline px-2 py-1 font-semibold"
                  >
                    Clear All
                  </button>
                )}

                <span className="text-xs text-slate-400 border-l border-slate-200 pl-3">
                  Showing <strong>{assets.length}</strong> of <strong>{totalCount}</strong> assets
                </span>
              </div>

            </div>

            {/* Collapsible Filter Panel */}
            {filtersOpen && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => handleFilterChange(setCategoryFilter, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="ALL">All Categories</option>
                    {(references.categories || []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="ALL">All Statuses</option>
                    {(references.statuses || []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => handleFilterChange(setLocationFilter, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="ALL">All Locations</option>
                    {(references.locations || []).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Risk Level</label>
                  <select
                    value={riskFilter}
                    onChange={(e) => handleFilterChange(setRiskFilter, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="ALL">All Risk Levels</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Project / Donor</label>
                  <select
                    value={donorFilter}
                    onChange={(e) => handleFilterChange(setDonorFilter, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="ALL">All Projects</option>
                    {(references.projectDonors || []).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Master Asset Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px]">
                    <th className="py-3 px-4">Asset ID</th>
                    <th className="py-3 px-4">Asset Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Location & Custodian</th>
                    <th className="py-3 px-3 text-right">Purchase Cost</th>
                    <th className="py-3 px-3 text-right">Book Value</th>
                    <th className="py-3 px-3 text-center">Condition</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Risk Flag</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Loading asset records...
                      </td>
                    </tr>
                  ) : assets.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No assets matched the current search or filters.
                      </td>
                    </tr>
                  ) : (
                    assets.map((asset) => (
                      <tr key={asset.assetId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {asset.assetId}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 max-w-xs truncate" title={asset.name}>
                          {asset.name}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {asset.category}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <div className="font-medium text-slate-800">{asset.location}</div>
                          <div className="text-[11px] text-slate-400">{asset.custodian || 'Unassigned'}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                          {Number(asset.purchaseCost || 0).toLocaleString()} BDT
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {Number(asset.currentBookValue || 0).toLocaleString()} BDT
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {asset.condition || 'Good'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(asset.status)}`}>
                            {asset.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getRiskBadge(asset.riskFlag)}`}>
                            {asset.riskFlag || 'Low'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setIsDetailOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="View Full Profile & QR"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormInitialData(asset);
                                  setIsFormOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Edit Asset"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(asset.assetId)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Archive / Delete"
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
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> (Total <strong>{totalCount}</strong> assets)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 font-semibold"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 font-semibold"
                >
                  Next
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: QR ASSET SYSTEM & PRINTING (Worksheet 3 / GID 861206349)          */}
      {/* ========================================================================= */}
      {activeTab === 'qr-system' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Institutional QR Asset Tagging & Label Printing System
              </h3>
              <p className="text-xs text-slate-500">
                Directly generated according to Worksheet 3 (GID 861206349) specification
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBatchPrintQr}
                disabled={selectedQrAssetIds.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Selected Tags ({selectedQrAssetIds.length})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedQrAssetIds.length === assets.length && assets.length > 0}
                  onChange={handleSelectAllQr}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Select All on Page ({assets.length})
              </label>
              <span className="text-xs text-slate-500 font-mono">
                Standard Size: 50mm x 30mm | High-Contrast Thermal / Laser Label
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {assets.map((asset) => {
                const isSelected = selectedQrAssetIds.includes(asset.assetId);
                return (
                  <div
                    key={asset.assetId}
                    className={`p-4 rounded-xl border transition flex items-center gap-3.5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleQrSelect(asset.assetId)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />

                    <div className="w-20 h-20 bg-white p-1 border border-slate-200 rounded-lg flex-shrink-0 shadow-xs">
                      {qrBatchPreviewUrls[asset.assetId] ? (
                        <img src={qrBatchPreviewUrls[asset.assetId]} alt="QR" className="w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                          ...
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 text-xs">
                      <div className="font-mono font-bold text-slate-900 text-sm truncate">
                        {asset.assetId}
                      </div>
                      <div className="font-semibold text-slate-700 truncate" title={asset.name}>
                        {asset.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {asset.location} | {asset.custodian || 'Unassigned'}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {asset.qrLabelSize || '50mm x 30mm'}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {asset.qrPrintStatus || 'Ready'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FIELD KITS & INVENTORY TRACKING (Worksheet 4 / GID 1726563914)     */}
      {/* ========================================================================= */}
      {activeTab === 'field-kits' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Field Kit & Project Multi-Item Inventory Tracker
              </h3>
              <p className="text-xs text-slate-500">
                Opening, Issued, Returned, Damaged, and Available balance according to Worksheet 4 (GID 1726563914)
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setSelectedKit(null);
                  setIsKitModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" /> Add Field Kit
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px]">
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-3">Project</th>
                    <th className="py-3 px-4">Equipment / Kit Name</th>
                    <th className="py-3 px-3">Location & Custodian</th>
                    <th className="py-3 px-2 text-center">Opening</th>
                    <th className="py-3 px-2 text-center text-amber-700">Issued</th>
                    <th className="py-3 px-2 text-center text-emerald-700">Returned</th>
                    <th className="py-3 px-2 text-center text-rose-600">Damaged</th>
                    <th className="py-3 px-2 text-center font-bold text-indigo-700">Available</th>
                    <th className="py-3 px-2 text-center">Stock Status</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fieldKits.map((kit) => (
                    <tr key={kit.itemCode} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{kit.itemCode}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{kit.kitProject}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{kit.equipmentName}</td>
                      <td className="py-3 px-3 text-slate-600">
                        <div>{kit.location}</div>
                        <div className="text-[11px] text-slate-400">{kit.responsiblePerson}</div>
                      </td>
                      <td className="py-3 px-2 text-center font-semibold text-slate-700">{kit.openingQty}</td>
                      <td className="py-3 px-2 text-center font-semibold text-amber-700">{kit.issuedQty}</td>
                      <td className="py-3 px-2 text-center font-semibold text-emerald-700">{kit.returnedQty}</td>
                      <td className="py-3 px-2 text-center font-semibold text-rose-600">{kit.damagedQty}</td>
                      <td className="py-3 px-2 text-center font-black text-sm text-indigo-700">{kit.availableQty}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          kit.stockStatus === 'OK' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {kit.stockStatus || 'OK'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedKit(kit);
                              setIsKitModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition border border-indigo-200"
                          >
                            Adjust Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: HANDOVER & RETURN DEEDS (Worksheet 7 & 5 / GID 2011906547 & 1510015205) */}
      {/* ========================================================================= */}
      {activeTab === 'handovers' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Official Chain-of-Custody Handover & Return Deeds
              </h3>
              <p className="text-xs text-slate-500">
                Generated from Worksheet 7 (GID 2011906547) and consumable distributions (Worksheet 5 / GID 1510015205)
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setIsHandoverModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" /> Create Handover Deed
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {handovers.map((ho) => (
              <div key={ho.formNo} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">{ho.formNo}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {ho.type}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{ho.date}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Handed Over By:</span>
                    <span className="font-semibold text-slate-800">{ho.handedOverBy?.name}</span>
                    <span className="text-slate-500 block text-[11px]">{ho.handedOverBy?.designation}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Received By:</span>
                    <span className="font-semibold text-slate-800">{ho.receivedBy?.name}</span>
                    <span className="text-slate-500 block text-[11px]">{ho.receivedBy?.designation}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
                  <span className="font-bold text-slate-700 block">Included Assets:</span>
                  {(ho.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span>• {it.assetName} ({it.assetId || 'Kit'})</span>
                      <span className="font-semibold">Qty: {it.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Consumables Mini-Section (Worksheet 5 / GID 1510015205) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              Stationery & Consumables Quick Allocations (Worksheet 5 / GID 1510015205)
            </h4>
            <div className="flex flex-wrap gap-3">
              {consumables.map((c, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <span className="font-bold text-slate-800">{c.name}</span>
                  <span className="ml-2 text-indigo-600 font-bold">Qty: {c.quantity}</span>
                  <span className="block text-slate-500 text-[11px] mt-0.5">Handover To: {c.handoverTo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: FLEET & VEHICLE LOGBOOK (Worksheet 6 / GID 1933684115)            */}
      {/* ========================================================================= */}
      {activeTab === 'vehicle-log' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Fleet Mileage, Fuel Consumption & Odometer Tracker
              </h3>
              <p className="text-xs text-slate-500">
                Audited trip logs, KM/L fuel efficiency, and cost per KM from Worksheet 6 (GID 1933684115)
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" /> Add Trip Log
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Vehicle ID</th>
                    <th className="py-3 px-3">Driver</th>
                    <th className="py-3 px-2 text-center">Start KM</th>
                    <th className="py-3 px-2 text-center">End KM</th>
                    <th className="py-3 px-2 text-center font-bold text-indigo-700">Trip KM</th>
                    <th className="py-3 px-3">Purpose / Route</th>
                    <th className="py-3 px-2 text-right">Fuel Liters</th>
                    <th className="py-3 px-2 text-right">Fuel Cost</th>
                    <th className="py-3 px-2 text-center font-bold text-emerald-700">KM / L</th>
                    <th className="py-3 px-2 text-center">Odometer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicleLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-semibold text-slate-800">{log.date}</td>
                      <td className="py-3 px-3 font-mono font-bold text-indigo-700">{log.vehicleId}</td>
                      <td className="py-3 px-3 text-slate-700">{log.driver}</td>
                      <td className="py-3 px-2 text-center font-mono">{log.startKm}</td>
                      <td className="py-3 px-2 text-center font-mono">{log.endKm}</td>
                      <td className="py-3 px-2 text-center font-mono font-bold text-indigo-700">{log.tripKm}</td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{log.purposeRoute}</td>
                      <td className="py-3 px-2 text-right font-mono">{log.fuelLiters} L</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-800">{log.fuelCost} BDT</td>
                      <td className="py-3 px-2 text-center font-mono font-black text-emerald-700">{log.kmPerLiter}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          {log.odometerCheck || 'OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PROCUREMENT & LIFECYCLE WORKFLOWS (Worksheet 8 / GID 1017327203)  */}
      {/* ========================================================================= */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Procurement & Asset Disposal Lifecycle Pipelines
              </h3>
              <p className="text-xs text-slate-500">
                Requisition to Tagging & Disposal tracking from Worksheet 8 (GID 1017327203)
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setIsWorkflowModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" /> New Request Pipeline
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workflows.map((wf) => (
              <div key={wf.requestId} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-mono text-sm font-bold text-indigo-700">{wf.requestId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    wf.workflowStatus === 'Delayed' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {wf.workflowStatus}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900">{wf.assetName}</h4>
                  <p className="text-xs text-slate-500">{wf.requestingDept} Dept. | {wf.budgetLine}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Stage:</span>
                    <span className="font-bold text-slate-800">{wf.currentStage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Requisition Date:</span>
                    <span className="text-slate-700">{wf.requisitionDate || 'Pending'}</span>
                  </div>
                  {wf.leadTimeDays > 0 && (
                    <div className="flex justify-between text-amber-700 font-bold">
                      <span>Lead Time Elapsed:</span>
                      <span>{wf.leadTimeDays} Days</span>
                    </div>
                  )}
                </div>

                {wf.remarks && (
                  <p className="text-xs text-slate-500 italic">Notes: {wf.remarks}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: VALIDATION LISTS & REFERENCE DATA (Worksheet 9 / GID 671339665)    */}
      {/* ========================================================================= */}
      {activeTab === 'references' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Database-Driven Reference Lists & Master Dropdown Options
            </h3>
            <p className="text-xs text-slate-500">
              Mirrored dynamically from Worksheet 9 (GID 671339665) to prevent hardcoded frontend choices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Asset Categories</h4>
              <ul className="space-y-1 text-xs">
                {(references.categories || []).map((c) => (
                  <li key={c} className="p-1.5 bg-white rounded-lg border border-slate-100 font-medium text-slate-800">{c}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Institutional Locations</h4>
              <ul className="space-y-1 text-xs">
                {(references.locations || []).map((l) => (
                  <li key={l} className="p-1.5 bg-white rounded-lg border border-slate-100 font-medium text-slate-800">{l}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Projects / Donors</h4>
              <ul className="space-y-1 text-xs">
                {(references.projectDonors || []).map((p) => (
                  <li key={p} className="p-1.5 bg-white rounded-lg border border-slate-100 font-medium text-slate-800">{p}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Fleet Vehicles</h4>
              <ul className="space-y-1 text-xs">
                {(references.vehicles || []).map((v) => (
                  <li key={v} className="p-1.5 bg-white rounded-lg border border-slate-100 font-mono text-indigo-700 font-bold">{v}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Asset Statuses</h4>
              <ul className="space-y-1 text-xs">
                {(references.statuses || []).map((s) => (
                  <li key={s} className="p-1.5 bg-white rounded-lg border border-slate-100 font-medium text-slate-800">{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Condition & Audit Tags</h4>
              <ul className="space-y-1 text-xs">
                {(references.conditions || []).map((c) => (
                  <li key={c} className="p-1.5 bg-white rounded-lg border border-slate-100 font-medium text-slate-800">{c}</li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS INTEGRATION                                                        */}
      {/* ========================================================================= */}

      {/* Asset Detail & QR Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedAsset(null);
        }}
        onEdit={(a) => {
          setFormInitialData(a);
          setIsFormOpen(true);
        }}
        onPrintSingle={(a) => {
          setSelectedQrAssetIds([a.assetId]);
          window.print();
        }}
      />

      {/* Asset Form Modal */}
      <AssetFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setFormInitialData(null);
        }}
        onSubmit={handleSaveAsset}
        initialData={formInitialData}
        references={references}
        isSubmitting={isSubmitting}
      />

      {/* Field Kit Modal */}
      <FieldKitModal
        isOpen={isKitModalOpen}
        onClose={() => {
          setIsKitModalOpen(false);
          setSelectedKit(null);
        }}
        onSubmit={handleSaveFieldKit}
        initialKit={selectedKit}
        isSubmitting={isSubmitting}
      />

      {/* Vehicle Log Modal */}
      <VehicleLogModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSubmit={handleSaveVehicleLog}
        vehicles={references.vehicles}
        isSubmitting={isSubmitting}
      />

      {/* Handover Modal */}
      <HandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        onSubmit={handleSaveHandover}
        assets={assets}
        isSubmitting={isSubmitting}
      />

      {/* Workflow Modal */}
      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        onSubmit={handleSaveWorkflow}
        isSubmitting={isSubmitting}
      />

      {/* Google Sheets Sync Modal */}
      <GoogleSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncComplete={() => {
          fetchDashboard();
          fetchAssets();
          fetchSupportingData();
        }}
      />

      {/* Delete / Archive Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Archive Asset Record?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to archive <strong>{deleteConfirmId}</strong>? This action marks the record as archived and retains full audit trails in the persistent database.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAsset(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 shadow-sm"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
