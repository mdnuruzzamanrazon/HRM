import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldAlert, Plus, Search, Filter, RefreshCw, 
  Download, Edit3, Trash2, Eye, Calendar, Building2, 
  MapPin, Clock, ArrowUpDown, ChevronDown, ChevronUp, 
  Flame, Layers, FolderPlus, CheckCircle2, AlertTriangle, 
  HelpCircle, ChevronLeft, ChevronRight, LayoutGrid, Table as TableIcon,
  X, Check
} from 'lucide-react';
import { format } from 'date-fns';

import RiskFormModal from './RiskFormModal';
import RiskDetailModal from './RiskDetailModal';
import ProjectModal from './ProjectModal';
import CategoryModal from './CategoryModal';
import HeatmapModal from './HeatmapModal';

export default function RiskRegister() {
  const { user } = useAuth();

  // State: Data
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [risks, setRisks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // State: Filters & View
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [subCategoryFilter, setSubCategoryFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // State: Sorting & Pagination
  const [sortBy, setSortBy] = useState('riskNo');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // State: Modals
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailRisk, setDetailRisk] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, item: null, type: 'risk' });

  // State: Loading & Toast
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Find active project object
  const currentProject = useMemo(() => {
    return projects.find(p => p._id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  // Initial load: Fetch Projects and Categories
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch risks whenever project, filters, sorting, or pagination changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchRisks();
      fetchStats();
    }
  }, [
    selectedProjectId,
    categoryFilter,
    subCategoryFilter,
    ratingFilter,
    ownerFilter,
    statusFilter,
    searchQuery,
    sortBy,
    sortOrder,
    page,
    limit
  ]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [projRes, catRes] = await Promise.all([
        api.get('/risk/projects'),
        api.get('/risk/categories')
      ]);

      if (projRes.data?.success && projRes.data.data.length > 0) {
        setProjects(projRes.data.data);
        // Default to first project
        setSelectedProjectId(projRes.data.data[0]._id);
      }

      if (catRes.data?.success) {
        setCategories(catRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load initial risk data:', err);
      showToast(err.response?.data?.message || 'Failed to initialize Risk Register', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRisks = async () => {
    if (!selectedProjectId) return;
    try {
      setLoading(true);
      const params = {
        projectId: selectedProjectId,
        category: categoryFilter,
        subCategory: subCategoryFilter,
        riskRating: ratingFilter,
        riskOwner: ownerFilter,
        status: statusFilter,
        search: searchQuery,
        sortBy,
        sortOrder,
        page,
        limit
      };

      const res = await api.get('/risk/records', { params });
      if (res.data?.success) {
        setRisks(res.data.data);
        setTotalCount(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch risk records:', err);
      showToast('Failed to load risk records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await api.get('/risk/stats', { params: { projectId: selectedProjectId } });
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load risk stats:', err);
    }
  };

  // Sort handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Save / Update Risk Record
  const handleSaveRisk = async (payload) => {
    try {
      setIsSubmitting(true);
      if (selectedRisk?._id) {
        // Update
        const res = await api.put(`/risk/records/${selectedRisk._id}`, payload);
        if (res.data?.success) {
          showToast(`Risk #${res.data.data?.riskNo} updated successfully`);
          setIsRiskModalOpen(false);
          setSelectedRisk(null);
          fetchRisks();
          fetchStats();
        }
      } else {
        // Create
        const res = await api.post('/risk/records', payload);
        if (res.data?.success) {
          showToast(`Risk #${res.data.data?.riskNo} created successfully`);
          setIsRiskModalOpen(false);
          fetchRisks();
          fetchStats();
        }
      }
    } catch (err) {
      console.error('Failed to save risk record:', err);
      showToast(err.response?.data?.message || 'Failed to save risk record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Risk Record
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.item) return;

    try {
      setIsSubmitting(true);
      if (deleteConfirmation.type === 'risk') {
        const res = await api.delete(`/risk/records/${deleteConfirmation.item._id}`);
        if (res.data?.success) {
          showToast(`Risk #${deleteConfirmation.item.riskNo} deleted`);
          setDeleteConfirmation({ isOpen: false, item: null, type: 'risk' });
          if (isDetailModalOpen) setIsDetailModalOpen(false);
          fetchRisks();
          fetchStats();
        }
      } else if (deleteConfirmation.type === 'project') {
        const res = await api.delete(`/risk/projects/${deleteConfirmation.item._id}`);
        if (res.data?.success) {
          showToast(`Project deleted successfully`);
          setDeleteConfirmation({ isOpen: false, item: null, type: 'project' });
          // Refresh projects list
          const projRes = await api.get('/risk/projects');
          if (projRes.data?.success) {
            setProjects(projRes.data.data);
            if (projRes.data.data.length > 0) {
              setSelectedProjectId(projRes.data.data[0]._id);
            } else {
              setSelectedProjectId('');
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete:', err);
      showToast(err.response?.data?.message || 'Failed to delete item', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save / Update Project
  const handleSaveProject = async (payload) => {
    try {
      setIsSubmitting(true);
      if (editingProject?._id) {
        // Update
        const res = await api.put(`/risk/projects/${editingProject._id}`, payload);
        if (res.data?.success) {
          showToast('Project information updated successfully');
          setIsProjectModalOpen(false);
          setEditingProject(null);
          // Refresh projects
          const projRes = await api.get('/risk/projects');
          if (projRes.data?.success) {
            setProjects(projRes.data.data);
          }
        }
      } else {
        // Create
        const res = await api.post('/risk/projects', payload);
        if (res.data?.success) {
          showToast('New project created successfully');
          setIsProjectModalOpen(false);
          const projRes = await api.get('/risk/projects');
          if (projRes.data?.success) {
            setProjects(projRes.data.data);
            setSelectedProjectId(res.data.data._id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to save project:', err);
      showToast(err.response?.data?.message || 'Failed to save project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Category / Subcategory
  const handleSaveCategory = async (payload) => {
    try {
      setIsSubmitting(true);
      const res = await api.post('/risk/categories', payload);
      if (res.data?.success) {
        showToast('Classification saved successfully');
        setIsCategoryModalOpen(false);
        // Refresh categories
        const catRes = await api.get('/risk/categories');
        if (catRes.data?.success) {
          setCategories(catRes.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to add category:', err);
      showToast(err.response?.data?.message || 'Failed to add classification', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!risks || risks.length === 0) {
      showToast('No records to export', 'error');
      return;
    }

    const headers = [
      'Risk No',
      'Date Added',
      'Category',
      'Sub-category',
      'Description of Risk',
      'Risk Owner',
      'Likelihood',
      'Impact',
      'Current Score',
      'Target Score',
      'Variance',
      'Mitigation Required / Action',
      'Date Action to Be Completed By',
      'Person Monitoring',
      'Notes',
      'Assessment Result',
      'Review Date',
      'Assessed Likelihood',
      'Assessed Impact',
      'Assessment Score'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '';
      const s = String(str);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = risks.map(r => [
      r.riskNo,
      r.dateAdded ? format(new Date(r.dateAdded), 'yyyy-MM-dd') : '',
      r.category,
      r.subCategory,
      r.description,
      r.riskOwner,
      r.likelihood,
      r.impact,
      r.currentScore,
      r.targetScore ?? '',
      r.variance,
      r.mitigationAction,
      r.actionDueDate ? format(new Date(r.actionDueDate), 'yyyy-MM-dd') : '',
      r.personMonitoring,
      r.notes,
      r.assessmentResult,
      r.reviewDate ? format(new Date(r.reviewDate), 'yyyy-MM-dd') : '',
      r.assessedLikelihood ?? '',
      r.assessedImpact ?? '',
      r.assessmentScore ?? ''
    ].map(escapeCsv).join(','));

    // Prepend Project Info metadata header matching CBDP standard
    const projectHeader = [
      `"Risk Register - ${currentProject?.name || 'CBDP Project'}"`,
      `"Office Responsible: ${currentProject?.officeResponsible || ''}"`,
      `"Location: ${currentProject?.location || ''}"`,
      `"Period: ${currentProject?.period || ''}"`,
      `"Review Quarter: ${currentProject?.reviewQuarter || ''} | End Quarter: ${currentProject?.endQuarter || ''}"`,
      ''
    ].join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(projectHeader + '\n' + headers.join(',') + '\n' + rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Risk_Register_${(currentProject?.name || 'Project').replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported Risk Register to CSV successfully');
  };

  // RAG badge helper
  const renderRAGBadge = (score, rating) => {
    if (rating === 'HIGH' || score >= 15) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          {score} • HIGH
        </span>
      );
    }
    if (rating === 'MEDIUM' || (score >= 8 && score < 15)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {score} • MED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        {score} • LOW
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs font-bold ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}>
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Project Risk Register
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              CBDP Enterprise
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Permanent database risk governance, live RAG scoring, variance tracking, and mitigation controls
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsHeatmapOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-2xs transition-all cursor-pointer"
            title="Open 5x5 Likelihood x Impact Heat Matrix"
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">5×5 Heatmap</span>
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-2xs transition-all cursor-pointer"
            title="Configure Categories and Sub-categories"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Classifications</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-2xs transition-all cursor-pointer"
            title="Download CSV matching CBDP Risk Register spreadsheet format"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setSelectedRisk(null);
              setIsRiskModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Risk Record</span>
          </button>
        </div>
      </div>

      {/* 1. PROJECT INFORMATION BANNER (Required Section 1.A) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Banner Top Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 block">
                Active Project Information
              </span>
              <h2 className="text-sm font-bold text-white truncate">
                {currentProject?.name || 'No Project Selected'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Project Switcher */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              {projects.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.status !== 'ACTIVE' ? `(${p.status})` : ''}
                </option>
              ))}
            </select>

            {/* Edit Project Info Button */}
            <button
              onClick={() => {
                setEditingProject(currentProject);
                setIsProjectModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Edit Project Details"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* New Project Button */}
            <button
              onClick={() => {
                setEditingProject(null);
                setIsProjectModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              title="Create New Project"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Project</span>
            </button>
          </div>
        </div>

        {/* Project Information Fields Grid */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs bg-gradient-to-b from-white to-slate-50/50">
          <div>
            <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-0.5">
              Project Name
            </span>
            <p className="font-extrabold text-slate-900 truncate" title={currentProject?.name}>
              {currentProject?.name || '—'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-0.5">
              Office Responsible
            </span>
            <p className="font-semibold text-slate-800 truncate" title={currentProject?.officeResponsible}>
              {currentProject?.officeResponsible || '—'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-0.5">
              Project Location
            </span>
            <p className="font-semibold text-slate-800 truncate" title={currentProject?.location}>
              {currentProject?.location || '—'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-0.5">
              Project Period
            </span>
            <p className="font-semibold text-slate-800 truncate" title={currentProject?.period}>
              {currentProject?.period || '—'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-0.5">
              Review Quarter
            </span>
            <p className="font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md inline-block">
              {currentProject?.reviewQuarter || '—'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider mb-0.5">
              End Quarter
            </span>
            <p className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
              {currentProject?.endQuarter || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. RAG RISK RATING LEGEND & LIVE STATS CARDS (Required Section 1.B) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* RAG Legend Card */}
        <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-indigo-600" />
              Risk Rating System (RAG) Legend
            </span>
            <span className="text-[10px] font-bold text-slate-400">Formula: (L × I) + I</span>
          </div>

          <div className="space-y-2">
            {/* High */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 flex-shrink-0 animate-pulse" />
                <span className="font-black text-rose-900">High Risk (Red)</span>
              </div>
              <span className="font-extrabold text-rose-800">Scores of 15 or above</span>
            </div>

            {/* Medium */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="font-black text-amber-900">Medium Risk (Amber)</span>
              </div>
              <span className="font-extrabold text-amber-800">Scores 8 to 14</span>
            </div>

            {/* Low */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="font-black text-emerald-900">Low Risk (Green)</span>
              </div>
              <span className="font-extrabold text-emerald-800">Scores below 8</span>
            </div>
          </div>
        </div>

        {/* Live Project Metrics Cards */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Risks */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Risks
            </span>
            <div className="my-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {stats?.totalRisks ?? risks.length}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Logged in database</span>
          </div>

          {/* High Risks */}
          <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="w-1.5 absolute top-0 bottom-0 left-0 bg-rose-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 pl-1">
              High Risks (Red)
            </span>
            <div className="my-1 pl-1">
              <span className="text-2xl sm:text-3xl font-black text-rose-700">
                {stats?.highCount ?? 0}
              </span>
            </div>
            <span className="text-[10px] text-rose-600 font-bold pl-1">Immediate action</span>
          </div>

          {/* Medium Risks */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="w-1.5 absolute top-0 bottom-0 left-0 bg-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 pl-1">
              Medium Risks
            </span>
            <div className="my-1 pl-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-700">
                {stats?.mediumCount ?? 0}
              </span>
            </div>
            <span className="text-[10px] text-amber-600 font-bold pl-1">Active mitigation</span>
          </div>

          {/* Low Risks & Avg Score */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="w-1.5 absolute top-0 bottom-0 left-0 bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 pl-1">
              Low Risks
            </span>
            <div className="my-1 pl-1 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                {stats?.lowCount ?? 0}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Avg: {stats?.avgScore ?? 0}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold pl-1">Routine review</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by risk number, description, owner, mitigation action, or notes..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick View Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Table View (All 20 Columns)"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
                setSubCategoryFilter('ALL');
                setRatingFilter('ALL');
                setOwnerFilter('ALL');
                setStatusFilter('ALL');
                setPage(1);
              }}
              className="p-2 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              title="Reset all filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 text-xs">
          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setSubCategoryFilter('ALL');
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sub-category Filter */}
          <div>
            <select
              value={subCategoryFilter}
              onChange={(e) => {
                setSubCategoryFilter(e.target.value);
                setPage(1);
              }}
              disabled={categoryFilter === 'ALL'}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="ALL">All Sub-categories</option>
              {categories
                .find(c => c.name === categoryFilter)
                ?.subCategories?.map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
            >
              <option value="ALL">All RAG Ratings</option>
              <option value="HIGH">High Risk (Red 15+)</option>
              <option value="MEDIUM">Medium Risk (Amber 8-14)</option>
              <option value="LOW">Low Risk (Green &lt;8)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="MITIGATED">MITIGATED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>

          {/* Rows Per Page */}
          <div>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
            >
              <option value={10}>10 records / page</option>
              <option value={25}>25 records / page</option>
              <option value={50}>50 records / page</option>
              <option value={100}>100 records / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. RISK REGISTER TABLE (All 20 Columns - Required Section 1.C) */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              {/* Grouped Header Band */}
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                  <th colSpan={6} className="py-2 px-3 border-r border-slate-800">
                    Risk Identification (1 – 6)
                  </th>
                  <th colSpan={3} className="py-2 px-3 border-r border-slate-800 text-center">
                    Current Assessment (7 – 9)
                  </th>
                  <th colSpan={2} className="py-2 px-3 border-r border-slate-800 text-center">
                    Appetite & Variance (10 – 11)
                  </th>
                  <th colSpan={4} className="py-2 px-3 border-r border-slate-800">
                    Mitigation Plan & Monitoring (12 – 15)
                  </th>
                  <th colSpan={5} className="py-2 px-3 border-r border-slate-800 text-center">
                    Review & Post-Assessment (16 – 20)
                  </th>
                  <th className="py-2 px-3 text-center">Actions</th>
                </tr>

                {/* Individual Column Headers */}
                <tr className="bg-slate-50 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  {/* 1. Risk No. */}
                  <th
                    onClick={() => handleSort('riskNo')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 whitespace-nowrap sticky left-0 bg-slate-50 z-10 shadow-xs"
                  >
                    <div className="flex items-center gap-1">
                      <span>1. Risk No</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  {/* 2. Date Added */}
                  <th onClick={() => handleSort('dateAdded')} className="py-3 px-3 cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>2. Date Added</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  {/* 3. Category */}
                  <th className="py-3 px-3 whitespace-nowrap">3. Category</th>

                  {/* 4. Sub-category */}
                  <th className="py-3 px-3 whitespace-nowrap">4. Sub-category</th>

                  {/* 5. Description of Risk */}
                  <th className="py-3 px-3 min-w-[280px]">5. Description of Risk</th>

                  {/* 6. Risk Owner */}
                  <th className="py-3 px-3 whitespace-nowrap">6. Risk Owner</th>

                  {/* 7. Likelihood */}
                  <th className="py-3 px-2 text-center whitespace-nowrap" title="Likelihood scale (1 - 5)">
                    7. L
                  </th>

                  {/* 8. Impact */}
                  <th className="py-3 px-2 text-center whitespace-nowrap" title="Impact scale (1 - 5)">
                    8. I
                  </th>

                  {/* 9. Current Score */}
                  <th onClick={() => handleSort('currentScore')} className="py-3 px-3 cursor-pointer hover:bg-slate-100 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>9. Current Score</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  {/* 10. Target Score */}
                  <th className="py-3 px-2 text-center whitespace-nowrap" title="Target score (Appetite)">
                    10. Target
                  </th>

                  {/* 11. Variance */}
                  <th onClick={() => handleSort('variance')} className="py-3 px-2 cursor-pointer hover:bg-slate-100 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <span>11. Var</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  {/* 12. Mitigation Required / Action */}
                  <th className="py-3 px-3 min-w-[240px]">12. Mitigation Required / Action</th>

                  {/* 13. Date Action Completed By */}
                  <th onClick={() => handleSort('actionDueDate')} className="py-3 px-3 cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>13. Action Due</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  {/* 14. Person Monitoring */}
                  <th className="py-3 px-3 whitespace-nowrap">14. Monitor</th>

                  {/* 15. Notes */}
                  <th className="py-3 px-3 min-w-[160px]">15. Notes</th>

                  {/* 16. Assessment Result */}
                  <th className="py-3 px-3 whitespace-nowrap">16. Result</th>

                  {/* 17. Review Date */}
                  <th className="py-3 px-3 whitespace-nowrap">17. Review Date</th>

                  {/* 18. Assessed Likelihood */}
                  <th className="py-3 px-2 text-center whitespace-nowrap" title="Assessed Likelihood">
                    18. AL
                  </th>

                  {/* 19. Assessed Impact */}
                  <th className="py-3 px-2 text-center whitespace-nowrap" title="Assessed Impact">
                    19. AI
                  </th>

                  {/* 20. Assessment Score */}
                  <th className="py-3 px-3 text-center whitespace-nowrap">
                    20. Assessed Score
                  </th>

                  {/* Actions */}
                  <th className="py-3 px-3 text-center whitespace-nowrap sticky right-0 bg-slate-50 z-10 shadow-xs">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={21} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      <p className="text-xs font-semibold">Loading Risk Register records from database...</p>
                    </td>
                  </tr>
                ) : risks.length === 0 ? (
                  <tr>
                    <td colSpan={21} className="py-12 text-center text-slate-500">
                      <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-bold text-slate-700">No risk records found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try clearing search filters or click "Add Risk Record" to create the first record for this project.
                      </p>
                    </td>
                  </tr>
                ) : (
                  risks.map((risk) => (
                    <tr
                      key={risk._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. Risk No */}
                      <td className="py-2.5 px-3 font-black text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 shadow-xs">
                        #{risk.riskNo}
                      </td>

                      {/* 2. Date Added */}
                      <td className="py-2.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                        {risk.dateAdded ? format(new Date(risk.dateAdded), 'dd MMM yyyy') : '—'}
                      </td>

                      {/* 3. Category */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800">{risk.category}</span>
                      </td>

                      {/* 4. Sub-category */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-slate-600 font-medium">{risk.subCategory || '—'}</span>
                      </td>

                      {/* 5. Description of Risk */}
                      <td className="py-2.5 px-3 font-normal text-slate-800 max-w-[340px]">
                        <p className="line-clamp-2 leading-relaxed" title={risk.description}>
                          {risk.description}
                        </p>
                      </td>

                      {/* 6. Risk Owner */}
                      <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                        {risk.riskOwner || '—'}
                      </td>

                      {/* 7. Likelihood */}
                      <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                        {risk.likelihood}
                      </td>

                      {/* 8. Impact */}
                      <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                        {risk.impact}
                      </td>

                      {/* 9. Current Score & RAG */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {renderRAGBadge(risk.currentScore, risk.riskRating)}
                      </td>

                      {/* 10. Target Score */}
                      <td className="py-2.5 px-2 text-center font-semibold text-slate-700">
                        {risk.targetScore !== null && risk.targetScore !== undefined ? risk.targetScore : '—'}
                      </td>

                      {/* 11. Variance */}
                      <td className="py-2.5 px-2 text-center font-black whitespace-nowrap">
                        <span className={risk.variance > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                          {risk.variance > 0 ? `+${risk.variance}` : risk.variance}
                        </span>
                      </td>

                      {/* 12. Mitigation Action */}
                      <td className="py-2.5 px-3 font-normal text-slate-700 max-w-[300px]">
                        <p className="line-clamp-2 leading-relaxed" title={risk.mitigationAction}>
                          {risk.mitigationAction || '—'}
                        </p>
                      </td>

                      {/* 13. Action Due Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-600">
                        {risk.actionDueDate ? format(new Date(risk.actionDueDate), 'dd MMM yyyy') : '—'}
                      </td>

                      {/* 14. Person Monitoring */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">
                        {risk.personMonitoring || '—'}
                      </td>

                      {/* 15. Notes */}
                      <td className="py-2.5 px-3 text-slate-600 max-w-[200px]">
                        <p className="truncate" title={risk.notes}>{risk.notes || '—'}</p>
                      </td>

                      {/* 16. Assessment Result */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-slate-800">
                        {risk.assessmentResult || '—'}
                      </td>

                      {/* 17. Review Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-600">
                        {risk.reviewDate ? format(new Date(risk.reviewDate), 'dd MMM yyyy') : '—'}
                      </td>

                      {/* 18. Assessed Likelihood */}
                      <td className="py-2.5 px-2 text-center font-bold text-slate-700">
                        {risk.assessedLikelihood || '—'}
                      </td>

                      {/* 19. Assessed Impact */}
                      <td className="py-2.5 px-2 text-center font-bold text-slate-700">
                        {risk.assessedImpact || '—'}
                      </td>

                      {/* 20. Assessment Score */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {risk.assessmentScore !== null && risk.assessmentScore !== undefined
                          ? renderRAGBadge(risk.assessmentScore, risk.assessmentRating)
                          : <span className="text-slate-400">—</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 transition-colors z-10 shadow-xs">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setDetailRisk(risk);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedRisk(risk);
                              setIsRiskModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit Risk Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmation({ isOpen: true, item: risk, type: 'risk' })}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Risk Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD / GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {risks.map((risk) => (
            <div
              key={risk._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      #{risk.riskNo}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{risk.category}</span>
                  </div>
                  {renderRAGBadge(risk.currentScore, risk.riskRating)}
                </div>

                <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-relaxed">
                  {risk.description}
                </h4>

                {risk.subCategory && (
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">
                    Sub-category: {risk.subCategory}
                  </span>
                )}
              </div>

              {/* Score Breakdown Bar */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Current</span>
                  <span className="font-black text-slate-800">{risk.currentScore}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Target</span>
                  <span className="font-bold text-slate-700">{risk.targetScore ?? '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Variance</span>
                  <span className={`font-black ${risk.variance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {risk.variance > 0 ? `+${risk.variance}` : risk.variance}
                  </span>
                </div>
              </div>

              {/* Mitigation preview */}
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-500 text-[10px] uppercase block">Mitigation Action:</span>
                <p className="line-clamp-2 text-[11px] mt-0.5">{risk.mitigationAction || 'None specified'}</p>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400 text-[11px]">Owner: {risk.riskOwner || 'Unassigned'}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setDetailRisk(risk);
                      setIsDetailModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRisk(risk);
                      setIsRiskModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-amber-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmation({ isOpen: true, item: risk, type: 'risk' })}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-2">
        <div>
          Showing <span className="font-bold text-slate-800">{risks.length}</span> of{' '}
          <span className="font-bold text-slate-800">{totalCount}</span> risk records in current project
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-700 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Add / Edit Risk Modal */}
      <RiskFormModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        onSave={handleSaveRisk}
        riskRecord={selectedRisk}
        projectId={selectedProjectId}
        categories={categories}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        isSubmitting={isSubmitting}
      />

      {/* 2. View Detail Modal */}
      <RiskDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        riskRecord={detailRisk}
        onEdit={(r) => {
          setSelectedRisk(r);
          setIsRiskModalOpen(true);
        }}
        onDelete={(r) => {
          setDeleteConfirmation({ isOpen: true, item: r, type: 'risk' });
        }}
      />

      {/* 3. Project Management Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        project={editingProject}
        isSubmitting={isSubmitting}
      />

      {/* 4. Category Classification Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onSave={handleSaveCategory}
        isSubmitting={isSubmitting}
      />

      {/* 5. 5x5 Heatmap Matrix Modal */}
      <HeatmapModal
        isOpen={isHeatmapOpen}
        onClose={() => setIsHeatmapOpen(false)}
        heatmapData={stats?.heatmap}
        onSelectCell={(l, i) => {
          // When user clicks a cell in heatmap, filter table
          setSearchQuery('');
          showToast(`Filtered by Likelihood: ${l} and Impact: ${i}`);
        }}
      />

      {/* 6. Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Deletion
                </h3>
                <p className="text-xs text-slate-500">
                  {deleteConfirmation.type === 'risk'
                    ? `Are you sure you want to permanently delete Risk #${deleteConfirmation.item?.riskNo}?`
                    : `Are you sure you want to delete Project "${deleteConfirmation.item?.name}" and all associated risk records?`}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              This action cannot be undone and will permanently remove this data from the connected MongoDB database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmation({ isOpen: false, item: null, type: 'risk' })}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
