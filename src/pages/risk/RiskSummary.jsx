import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, 
  Layers, Flame, Compass, ArrowRight, Download, RefreshCw, 
  ExternalLink, Building2, Calendar, MapPin, Eye, Filter,
  PieChart as PieIcon, Radio, Sparkles, HelpCircle, X, ChevronRight, Plus
} from 'lucide-react';
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import api from '../../services/api';

export default function RiskSummary({
  project,
  projects = [],
  onSelectProject,
  onSwitchToRegister,
  onSwitchToGuidance,
  onAddRisk,
  onViewRiskDetail
}) {
  const [statsData, setStatsData] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radarViewMode, setRadarViewMode] = useState('radar'); // 'radar' or 'bars'
  const [heatmapViewMode, setHeatmapViewMode] = useState('matrix'); // 'matrix' or 'table'
  const [selectedCell, setSelectedCell] = useState(null); // { l, i, score, rating, records }

  const currentProjectId = project?._id || (projects[0]?._id);

  // Fetch Stats and Records whenever currentProjectId changes
  const fetchSummaryData = async () => {
    if (!currentProjectId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const [statsRes, recordsRes] = await Promise.all([
        api.get('/risk/stats', { params: { projectId: currentProjectId } }),
        api.get('/risk/records', { params: { projectId: currentProjectId, limit: 1000 } })
      ]);

      if (statsRes.data?.success) {
        setStatsData(statsRes.data.data);
      }
      if (recordsRes.data?.success) {
        setRecords(recordsRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load risk summary:', err);
      setError('Unable to load summary dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [currentProjectId]);

  // Fallback / reactive calculations if statsData is still initializing
  const summaryOfRisks = statsData?.summaryOfRisks || {
    high: { count: 0, percentage: 0, avgVariance: 0 },
    medium: { count: 0, percentage: 0, avgVariance: 0 },
    low: { count: 0, percentage: 0, avgVariance: 0 },
    total: { count: 0, percentage: 0, avgVariance: 0 }
  };

  const summaryByCategory = statsData?.summaryByCategory || [];
  const varianceRadar = statsData?.varianceRadar || [];
  const heatMapDataList = statsData?.heatMapDataList || [];
  const heatmap = statsData?.heatmap || {};

  // Totals for Summary by Category
  const categoryTotals = useMemo(() => {
    return summaryByCategory.reduce((acc, cat) => {
      acc.high += (cat.high || 0);
      acc.medium += (cat.medium || 0);
      acc.low += (cat.low || 0);
      acc.total += (cat.total || 0);
      return acc;
    }, { high: 0, medium: 0, low: 0, total: 0 });
  }, [summaryByCategory]);

  // Format data for Radar Chart
  const radarChartData = useMemo(() => {
    if (!varianceRadar || varianceRadar.length === 0) return [];
    return varianceRadar.map(item => ({
      category: item.category.length > 16 ? item.category.split(' ')[0] + '...' : item.category,
      fullCategory: item.category,
      'Current Score': Number(item.avgScore || 0),
      'Target Score': Number(item.avgTarget || 0),
      'Variance': Number(item.variance || 0),
      count: item.count || 0
    }));
  }, [varianceRadar]);

  const likelihoodLabels = {
    5: '5 - Very likely',
    4: '4 - Likely',
    3: '3 - Possible',
    2: '2 - Quite unlikely',
    1: '1 - Very unlikely'
  };

  const impactLabels = {
    1: '1 - Almost none',
    2: '2 - Some small impact',
    3: '3 - Considerable impact',
    4: '4 - Serious effects',
    5: '5 - Catastrophic effects'
  };

  // Export Summary CSV Handler
  const handleExportSummaryCSV = () => {
    if (!statsData) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `CBDP RISK REGISTER - EXECUTIVE SUMMARY REPORT\n`;
    csvContent += `Project:,"${project?.name || 'All Projects'}"\n`;
    csvContent += `Office Responsible:,"${project?.officeResponsible || '—'}"\n`;
    csvContent += `Review Quarter:,"${project?.reviewQuarter || '—'}"\n`;
    csvContent += `Export Date:,"${new Date().toLocaleDateString()}"\n\n`;

    // 1. Summary of Risks
    csvContent += `1. SUMMARY OF RISKS\n`;
    csvContent += `Level,Number of Risks,% of Total,Average Variance (Ave Var)\n`;
    csvContent += `High Risk (Score >= 15),${summaryOfRisks.high?.count || 0},${summaryOfRisks.high?.percentage || 0}%,${summaryOfRisks.high?.avgVariance || 0}\n`;
    csvContent += `Medium Risk (Score 8-14),${summaryOfRisks.medium?.count || 0},${summaryOfRisks.medium?.percentage || 0}%,${summaryOfRisks.medium?.avgVariance || 0}\n`;
    csvContent += `Low Risk (Score < 8),${summaryOfRisks.low?.count || 0},${summaryOfRisks.low?.percentage || 0}%,${summaryOfRisks.low?.avgVariance || 0}\n`;
    csvContent += `Total,${summaryOfRisks.total?.count || 0},100%,${summaryOfRisks.total?.avgVariance || 0}\n\n`;

    // 2. Summary by Category
    csvContent += `2. SUMMARY BY CATEGORY\n`;
    csvContent += `Category,High,Medium,Low,Total\n`;
    summaryByCategory.forEach(cat => {
      csvContent += `"${cat.category}",${cat.high},${cat.medium},${cat.low},${cat.total}\n`;
    });
    csvContent += `Total,${categoryTotals.high},${categoryTotals.medium},${categoryTotals.low},${categoryTotals.total}\n\n`;

    // 3. Variance Radar Data
    csvContent += `3. VARIANCE RADAR DATA\n`;
    csvContent += `Category,Active Risks,Average Score (Ave Score),Average Target (Ave Target),Variance (Var),Status\n`;
    varianceRadar.forEach(v => {
      csvContent += `"${v.category}",${v.count},${v.avgScore},${v.avgTarget},${v.variance},"${v.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Risk_Summary_${project?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Dashboard'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getHeatmapColor = (score) => {
    if (score >= 15) {
      return 'bg-rose-50 text-rose-950 border-rose-200 hover:bg-rose-100/90';
    }
    if (score >= 8) {
      return 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100/90';
    }
    return 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100/90';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* TOP HEADER & PROJECT SELECTOR BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>CBDP Risk Register • Executive Analytics</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-heading text-white">
              Risk Register Summary Dashboard
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consolidated organizational risk reporting, category concentration distributions, 5×5 heat map matrix, 
              and quantitative variance radar analysis based on the approved formula <span className="text-indigo-300 font-mono font-bold">(Likelihood × Impact) + Impact</span>.
            </p>

            {/* Project Metadata Ribbon */}
            {project && (
              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-300 border-t border-indigo-800/50">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <strong>Office:</strong> {project.officeResponsible || '—'}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <strong>Location:</strong> {project.projectLocation || '—'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <strong>Quarter:</strong> {project.reviewQuarter || '—'} (End: {project.endQuarter || '—'})
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions & Project Switcher */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0">
            {projects.length > 1 && (
              <div className="bg-slate-800/90 p-2 rounded-2xl border border-slate-700/80 shadow-md">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
                  Active HR Project
                </label>
                <select
                  value={currentProjectId}
                  onChange={(e) => onSelectProject && onSelectProject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportSummaryCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-xs border border-slate-700/80 transition-colors shadow-xs cursor-pointer"
                title="Download consolidated Summary CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={fetchSummaryData}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-xs border border-slate-700/80 transition-colors shadow-xs cursor-pointer"
                title="Refresh live metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {onAddRisk && (
                <button
                  onClick={onAddRisk}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-sm shadow-indigo-600/30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Risk</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TOP EXECUTIVE METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Risks */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Risks</span>
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
              {statsData?.totalRisks || 0}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Active project risks</span>
        </div>

        {/* High Risk */}
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 border border-rose-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">High Risk (≥15)</span>
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-950 font-heading">
              {summaryOfRisks.high?.count || 0}
            </span>
            <span className="text-xs font-bold text-rose-700">
              ({summaryOfRisks.high?.percentage || 0}%)
            </span>
          </div>
          <span className="text-[11px] text-rose-800 font-medium">
            Ave Var: <strong className="font-mono">+{summaryOfRisks.high?.avgVariance || 0}</strong>
          </span>
        </div>

        {/* Medium Risk */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Medium (8–14)</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-950 font-heading">
              {summaryOfRisks.medium?.count || 0}
            </span>
            <span className="text-xs font-bold text-amber-700">
              ({summaryOfRisks.medium?.percentage || 0}%)
            </span>
          </div>
          <span className="text-[11px] text-amber-800 font-medium">
            Ave Var: <strong className="font-mono">{summaryOfRisks.medium?.avgVariance >= 0 ? `+${summaryOfRisks.medium?.avgVariance}` : summaryOfRisks.medium?.avgVariance}</strong>
          </span>
        </div>

        {/* Low Risk */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Low (&lt;8)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-heading">
              {summaryOfRisks.low?.count || 0}
            </span>
            <span className="text-xs font-bold text-emerald-700">
              ({summaryOfRisks.low?.percentage || 0}%)
            </span>
          </div>
          <span className="text-[11px] text-emerald-800 font-medium">
            Ave Var: <strong className="font-mono">{summaryOfRisks.low?.avgVariance >= 0 ? `+${summaryOfRisks.low?.avgVariance}` : summaryOfRisks.low?.avgVariance}</strong>
          </span>
        </div>

        {/* Average Score & Variance */}
        <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Overall Ave Var</span>
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-heading ${
              (summaryOfRisks.total?.avgVariance || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {(summaryOfRisks.total?.avgVariance || 0) > 0 ? `+${summaryOfRisks.total?.avgVariance}` : (summaryOfRisks.total?.avgVariance || 0)}
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono">Current − Target</span>
          </div>
          <span className="text-[11px] text-indigo-800 font-medium">
            Avg Score: <strong>{statsData?.avgScore || 0}</strong>
          </span>
        </div>
      </div>

      {/* SECTION A & SECTION B: 2-COLUMN SUMMARY TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* SECTION A: SUMMARY OF RISKS */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-heading">
                    A. Summary of Risks
                  </h2>
                  <p className="text-[11px] text-slate-500">Distribution by RAG level &amp; average variance</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-4">Level</th>
                    <th className="py-2.5 px-4 text-center">Number</th>
                    <th className="py-2.5 px-4 text-center">% of Total</th>
                    <th className="py-2.5 px-4 text-right">Ave Var</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* High Risk */}
                  <tr className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                        <div>
                          <span className="font-bold text-slate-900">High Risk</span>
                          <span className="text-[10px] text-slate-400 block font-mono">Score ≥ 15</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 font-heading text-sm">
                      {summaryOfRisks.high?.count || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-600">
                      {summaryOfRisks.high?.percentage || 0}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">
                        {summaryOfRisks.high?.avgVariance > 0 ? `+${summaryOfRisks.high?.avgVariance}` : (summaryOfRisks.high?.avgVariance || 0)}
                      </span>
                    </td>
                  </tr>

                  {/* Medium Risk */}
                  <tr className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <div>
                          <span className="font-bold text-slate-900">Medium Risk</span>
                          <span className="text-[10px] text-slate-400 block font-mono">Score 8 to 14</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 font-heading text-sm">
                      {summaryOfRisks.medium?.count || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-600">
                      {summaryOfRisks.medium?.percentage || 0}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                        {summaryOfRisks.medium?.avgVariance > 0 ? `+${summaryOfRisks.medium?.avgVariance}` : (summaryOfRisks.medium?.avgVariance || 0)}
                      </span>
                    </td>
                  </tr>

                  {/* Low Risk */}
                  <tr className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <div>
                          <span className="font-bold text-slate-900">Low Risk</span>
                          <span className="text-[10px] text-slate-400 block font-mono">Score &lt; 8</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 font-heading text-sm">
                      {summaryOfRisks.low?.count || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-600">
                      {summaryOfRisks.low?.percentage || 0}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                        {summaryOfRisks.low?.avgVariance > 0 ? `+${summaryOfRisks.low?.avgVariance}` : (summaryOfRisks.low?.avgVariance || 0)}
                      </span>
                    </td>
                  </tr>
                </tbody>

                {/* Total Row */}
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                    <td className="py-3 px-4 uppercase text-[11px] tracking-wider text-slate-800">
                      Total
                    </td>
                    <td className="py-3 px-4 text-center font-heading text-base text-indigo-700">
                      {summaryOfRisks.total?.count || 0}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700 font-medium">
                      100%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-xs">
                      {summaryOfRisks.total?.avgVariance > 0 ? `+${summaryOfRisks.total?.avgVariance}` : (summaryOfRisks.total?.avgVariance || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-500">
            <strong>Average Variance (Ave Var):</strong> Quantifies the gap between current operational risk and target risk appetite (<span className="font-mono">Current − Target</span>).
          </div>
        </section>

        {/* SECTION B: SUMMARY BY CATEGORY */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-heading">
                    B. Summary by Category
                  </h2>
                  <p className="text-[11px] text-slate-500">Category risk load across High, Medium, and Low classifications</p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                {summaryByCategory.length} Categories
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-3 text-center text-rose-700 bg-rose-50/30">High</th>
                    <th className="py-2.5 px-3 text-center text-amber-700 bg-amber-50/30">Medium</th>
                    <th className="py-2.5 px-3 text-center text-emerald-700 bg-emerald-50/30">Low</th>
                    <th className="py-2.5 px-4 text-center font-bold">Total</th>
                    <th className="py-2.5 px-4 text-left hidden sm:table-cell">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryByCategory.map((cat, idx) => {
                    const catTotal = cat.total || 0;
                    const grandTotal = categoryTotals.total || 1;
                    const pctOfAll = grandTotal > 0 ? Math.round((catTotal / grandTotal) * 100) : 0;

                    return (
                      <tr key={cat.category || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          {cat.category}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-700">
                          {cat.high > 0 ? (
                            <span className="inline-block w-6 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800">
                              {cat.high}
                            </span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                          {cat.medium > 0 ? (
                            <span className="inline-block w-6 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                              {cat.medium}
                            </span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                          {cat.low > 0 ? (
                            <span className="inline-block w-6 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                              {cat.low}
                            </span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-900 font-heading text-sm">
                          {cat.total}
                        </td>
                        <td className="py-2.5 px-4 hidden sm:table-cell w-36">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden flex">
                              {cat.high > 0 && (
                                <div style={{ width: `${(cat.high / (cat.total || 1)) * 100}%` }} className="bg-rose-500 h-full"></div>
                              )}
                              {cat.medium > 0 && (
                                <div style={{ width: `${(cat.medium / (cat.total || 1)) * 100}%` }} className="bg-amber-400 h-full"></div>
                              )}
                              {cat.low > 0 && (
                                <div style={{ width: `${(cat.low / (cat.total || 1)) * 100}%` }} className="bg-emerald-500 h-full"></div>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono w-7 text-right">{pctOfAll}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Total Row */}
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                    <td className="py-3 px-4 uppercase text-[11px] tracking-wider text-slate-800">
                      Total
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-rose-700 text-sm">
                      {categoryTotals.high}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-amber-700 text-sm">
                      {categoryTotals.medium}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-emerald-700 text-sm">
                      {categoryTotals.low}
                    </td>
                    <td className="py-3 px-4 text-center font-heading text-base text-indigo-700">
                      {categoryTotals.total}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-slate-500 text-[11px] font-medium">
                      All Categories
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Dynamic classification totals computed directly from database records.</span>
            {onSwitchToRegister && (
              <button
                onClick={onSwitchToRegister}
                className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View records</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>
      </div>

      {/* SECTION C: HEAT MAP DATA AND 5x5 RISK HEAT MAP */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                C. Risk Assessment Heat Map &amp; Concentration Data
              </h2>
              <p className="text-xs text-slate-500">
                Likelihood (1–5) × Impact (1–5) matrix displaying risk concentration calibrated to Score = (L × I) + I
              </p>
            </div>
          </div>

          {/* Heatmap View Switcher (Matrix vs Table) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setHeatmapViewMode('matrix')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                heatmapViewMode === 'matrix' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              5×5 Heat Matrix
            </button>
            <button
              onClick={() => setHeatmapViewMode('table')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                heatmapViewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Heat Map Data Table
            </button>
          </div>
        </div>

        {heatmapViewMode === 'matrix' ? (
          <div>
            {/* 5x5 Matrix Layout */}
            <div className="overflow-x-auto">
              <div className="min-w-[640px] p-2 bg-slate-50/60 rounded-2xl border border-slate-200/80">
                {/* Impact Axis Header */}
                <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-700 py-1.5 flex items-center justify-center gap-1.5">
                  <span>Impact (Severity of Consequence)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Impact Columns Header */}
                <div className="grid grid-cols-6 gap-2 text-center text-xs font-bold text-slate-600 mb-2">
                  <div className="flex flex-col items-center justify-center text-[10px] text-slate-400 uppercase tracking-wider">
                    <span>Likelihood ↓</span>
                  </div>
                  {[1, 2, 3, 4, 5].map(imp => (
                    <div key={imp} className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="text-slate-900 font-black font-heading text-sm">{imp}</div>
                      <div className="text-[10px] text-slate-500 truncate" title={impactLabels[imp]}>
                        {impactLabels[imp].split(' - ')[1]}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Matrix Rows: Likelihood from 5 down to 1 */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(l => (
                    <div key={l} className="grid grid-cols-6 gap-2">
                      {/* Likelihood Y-Axis Cell */}
                      <div className="flex flex-col justify-center px-2 py-1.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-xs">
                        <span className="font-black text-slate-900 font-heading text-sm">{l}</span>
                        <span className="text-[10px] text-slate-500 truncate" title={likelihoodLabels[l]}>
                          {likelihoodLabels[l].split(' - ')[1]}
                        </span>
                      </div>

                      {/* 5 Impact Cells for this Likelihood */}
                      {[1, 2, 3, 4, 5].map(i => {
                        const score = (l * i) + i;
                        const count = heatmap?.[l]?.[i] || 0;
                        const cellColor = getHeatmapColor(score);
                        const cellDetails = statsData?.heatmapDetails?.[l]?.[i] || [];

                        return (
                          <div
                            key={i}
                            onClick={() => {
                              if (count > 0) {
                                setSelectedCell({
                                  l, i, score,
                                  rating: score >= 15 ? 'HIGH' : score >= 8 ? 'MEDIUM' : 'LOW',
                                  records: cellDetails
                                });
                              }
                            }}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-between transition-all shadow-2xs ${cellColor} ${
                              count > 0 ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:scale-[1.02]' : 'opacity-85'
                            }`}
                            title={`Likelihood ${l} × Impact ${i}: Score ${score}. ${count} risk(s). Click to inspect.`}
                          >
                            <div className="w-full flex items-center justify-between text-[11px] font-bold">
                              <span className="opacity-60 text-[9px]">Score</span>
                              <span className="text-sm sm:text-base font-black font-heading">{score}</span>
                            </div>

                            {/* Risk Count Badge */}
                            <div className="my-1.5">
                              {count > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white shadow-xs">
                                  <span>{count}</span>
                                  <span className="text-[9px] uppercase font-normal">{count === 1 ? 'risk' : 'risks'}</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-300 font-mono">—</span>
                              )}
                            </div>

                            <span className="text-[9px] text-slate-400 font-mono">
                              ({l}×{i})+{i}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-100 border border-rose-300"></span>
                  <strong>High (Score ≥ 15)</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300"></span>
                  <strong>Medium (Score 8–14)</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300"></span>
                  <strong>Low (Score &lt; 8)</strong>
                </span>
              </div>
              <span className="text-[11px] text-indigo-600 font-medium">
                💡 Tip: Click on any cell with risks to view the exact matching records.
              </span>
            </div>
          </div>
        ) : (
          /* Tabular Heat Map Data View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4 text-center">Likelihood</th>
                  <th className="py-2.5 px-4 text-center">Impact</th>
                  <th className="py-2.5 px-4 text-center">Score Formula</th>
                  <th className="py-2.5 px-4 text-center">Calculated Score</th>
                  <th className="py-2.5 px-4 text-center">Rating</th>
                  <th className="py-2.5 px-4 text-center">Active Risk Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {heatMapDataList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-4 text-center font-bold text-slate-800">
                      {item.likelihood} <span className="text-slate-400 font-normal">({likelihoodLabels[item.likelihood]?.split(' - ')[1]})</span>
                    </td>
                    <td className="py-2 px-4 text-center font-bold text-slate-800">
                      {item.impact} <span className="text-slate-400 font-normal">({impactLabels[item.impact]?.split(' - ')[1]})</span>
                    </td>
                    <td className="py-2 px-4 text-center font-mono text-slate-400">
                      ({item.likelihood} × {item.impact}) + {item.impact}
                    </td>
                    <td className="py-2 px-4 text-center font-black font-heading text-slate-900 text-sm">
                      {item.score}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.rating === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        item.rating === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.rating}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-center font-mono font-bold">
                      {item.count > 0 ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                          {item.count}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECTION D: VARIANCE RADAR DATA & VISUALIZATION */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                D. Variance Radar Visualization &amp; Category Metrics
              </h2>
              <p className="text-xs text-slate-500">
                Category-level comparison between Average Current Risk Score and Target Risk Appetite
              </p>
            </div>
          </div>

          {/* Chart Display Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setRadarViewMode('radar')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                radarViewMode === 'radar' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Radar Spider Chart
            </button>
            <button
              onClick={() => setRadarViewMode('bars')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                radarViewMode === 'bars' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Comparative Bars
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Chart View (Left 6 cols on desktop) */}
          <div className="lg:col-span-6 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center min-h-[380px]">
            {radarChartData.length > 0 && statsData?.totalRisks > 0 ? (
              <div className="w-full h-[340px]">
                {radarViewMode === 'radar' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarChartData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis 
                        dataKey="category" 
                        tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 30]} stroke="#cbd5e1" />
                      <Radar
                        name="Current Score"
                        dataKey="Current Score"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.4}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Target Score (Appetite)"
                        dataKey="Target Score"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          borderColor: '#334155', 
                          borderRadius: '0.75rem', 
                          color: '#fff',
                          fontSize: '12px'
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={radarChartData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis domain={[0, 30]} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          borderRadius: '0.75rem', 
                          color: '#fff',
                          fontSize: '12px' 
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Current Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Target Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="text-center py-12 space-y-2">
                <Radio className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No active risks to map</h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  Create risk records in the Risk Register to visualize category variance.
                </p>
              </div>
            )}
          </div>

          {/* Data Table (Right 6 cols on desktop) */}
          <div className="lg:col-span-6 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-2 text-center">Risks</th>
                  <th className="py-2.5 px-3 text-right">Ave Score</th>
                  <th className="py-2.5 px-3 text-right">Ave Target</th>
                  <th className="py-2.5 px-3 text-right">Variance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {varianceRadar.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {row.category}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">
                      {row.count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black font-heading text-slate-900">
                      {row.avgScore}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 font-heading">
                      {row.avgTarget}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                        row.variance > 0 ? 'text-amber-700 bg-amber-50 font-bold' :
                        row.count > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400'
                      }`}>
                        {row.variance > 0 ? `+${row.variance}` : row.variance}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'Gap to Close' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        row.status === 'Within Appetite' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200/70 mt-3 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 block">Interpretation of Radar Metrics:</span>
              <p>• <strong>Gap to Close:</strong> Current score exceeds Target Appetite, requiring active mitigation.</p>
              <p>• <strong>Within Appetite:</strong> Current controls adequately contain risk within organizational limits.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CELL INSPECTION MODAL (When clicking a 5x5 heatmap cell) */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black font-heading text-sm ${
                  selectedCell.rating === 'HIGH' ? 'bg-rose-100 text-rose-700 border border-rose-300' :
                  selectedCell.rating === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                  'bg-emerald-100 text-emerald-700 border border-emerald-300'
                }`}>
                  {selectedCell.score}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Heat Map Cell: Likelihood {selectedCell.l} × Impact {selectedCell.i}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated Score: <strong>{selectedCell.score}</strong> • Classification: <strong>{selectedCell.rating}</strong> • {selectedCell.records.length} Risk(s)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCell(null)}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal List of Risks */}
            <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar flex-1">
              {selectedCell.records.map((r) => (
                <div key={r._id} className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 transition-colors shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        #{r.riskNo}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{r.category}</span>
                      {r.subCategory && (
                        <span className="text-[11px] text-slate-400">› {r.subCategory}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Score: <strong className="font-heading">{r.currentScore}</strong></span>
                      <span className="text-slate-500">Target: <strong className="font-heading">{r.targetScore}</strong></span>
                      <span className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                        r.variance > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        Var: {r.variance > 0 ? `+${r.variance}` : r.variance}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {r.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                    <span>Owner: <strong>{r.riskOwner || 'Unassigned'}</strong></span>
                    {onViewRiskDetail && (
                      <button
                        onClick={() => {
                          setSelectedCell(null);
                          onViewRiskDetail(r);
                        }}
                        className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Full Risk Detail</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCell(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
