import React, { useState, useMemo } from 'react';
import { 
  Layers, Search, Filter, Download, ArrowRight, ShieldAlert,
  Info, CheckCircle2, AlertTriangle, ExternalLink, Plus,
  ChevronDown, ChevronUp, Tag, Building2, UserCheck, BookOpen,
  HelpCircle, Eye, RefreshCw, Sparkles, SlidersHorizontal
} from 'lucide-react';

// Official CBDP Standard Classification Reference Data
export const CBDP_STANDARD_CLASSIFICATIONS = [
  // A. Strategy & Governance (SG)
  {
    category: 'Strategy & Governance',
    categoryCode: 'SG',
    subCategory: 'Strategy relevance',
    subCode: 'SR',
    ukDirector: 'GMT',
    note: 'Strategy not adapted to changing societal needs'
  },
  {
    category: 'Strategy & Governance',
    categoryCode: 'SG',
    subCategory: 'Registration',
    subCode: 'RE',
    ukDirector: 'International',
    note: 'Right to operate revoked or not renewed'
  },
  {
    category: 'Strategy & Governance',
    categoryCode: 'SG',
    subCategory: 'Legal compliance',
    subCode: 'LC',
    ukDirector: 'International',
    note: 'Particularly national laws'
  },
  {
    category: 'Strategy & Governance',
    categoryCode: 'SG',
    subCategory: 'Tax compliance',
    subCode: 'TC',
    ukDirector: 'GMT',
    note: 'Not specified in the source'
  },
  {
    category: 'Strategy & Governance',
    categoryCode: 'SG',
    subCategory: 'Leadership capacity',
    subCode: 'MC',
    ukDirector: 'GMT',
    note: 'For example, SMT capacity and SMT stability'
  },
  {
    category: 'Strategy & Governance',
    categoryCode: 'SG',
    subCategory: 'Crisis management',
    subCode: 'CM',
    ukDirector: 'GMT',
    note: 'Inability to respond properly to a crisis, including public relations'
  },

  // B. Finance & Services (FS)
  {
    category: 'Finance & Services',
    categoryCode: 'FS',
    subCategory: 'Financial Support',
    subCode: 'FS',
    ukDirector: 'Finance',
    note: 'RCOs do not receive adequate financial support from the UK'
  },
  {
    category: 'Finance & Services',
    categoryCode: 'FS',
    subCategory: 'Financial model',
    subCode: 'FM',
    ukDirector: 'Finance',
    note: 'Long-term financial model not suited to cash flows and commitments'
  },
  {
    category: 'Finance & Services',
    categoryCode: 'FS',
    subCategory: 'Finance controls & Fraud',
    subCode: 'FF',
    ukDirector: 'Finance',
    note: 'Not specified in the source'
  },
  {
    category: 'Finance & Services',
    categoryCode: 'FS',
    subCategory: 'Data protection & cyber attack',
    subCode: 'IT',
    ukDirector: 'Finance',
    note: 'IT failures of any type, including data loss and cyber attacks'
  },
  {
    category: 'Finance & Services',
    categoryCode: 'FS',
    subCategory: 'Change projects',
    subCode: 'CP',
    ukDirector: 'Finance',
    note: 'Failure to manage or support organization-wide change projects'
  },

  // C. Funding & Income (FR)
  {
    category: 'Funding & Income',
    categoryCode: 'FR',
    subCategory: 'Changing donor pool',
    subCode: 'CD',
    ukDirector: 'Marketing',
    note: 'Fewer donors interested in the types of work or locations in which PA operates'
  },
  {
    category: 'Funding & Income',
    categoryCode: 'FR',
    subCategory: 'Funding base',
    subCode: 'FB',
    ukDirector: 'Marketing',
    note: 'Funding is overly dependent on too few donors or sources'
  },
  {
    category: 'Funding & Income',
    categoryCode: 'FR',
    subCategory: 'Results based',
    subCode: 'RB',
    ukDirector: 'Marketing',
    note: 'A changed funding model increases financial risk to PA'
  },
  {
    category: 'Funding & Income',
    categoryCode: 'FR',
    subCategory: 'Proposal quality',
    subCode: 'PQ',
    ukDirector: 'Marketing',
    note: 'Reduced ability to identify opportunities and write good proposals on time'
  },
  {
    category: 'Funding & Income',
    categoryCode: 'FR',
    subCategory: 'Cost recovery',
    subCode: 'CR',
    ukDirector: 'Marketing',
    note: 'Reduced ability to cover costs, possibly requiring higher levels of co-funding'
  },
  {
    category: 'Funding & Income',
    categoryCode: 'FR',
    subCategory: 'Secured income',
    subCode: 'SI',
    ukDirector: 'Marketing',
    note: 'Overall low levels of secured income and a weak pipeline'
  },
  {
    category: 'Funding & Income',
    categoryCode: 'FR',
    subCategory: 'Relationships & Profile',
    subCode: 'RP',
    ukDirector: 'Marketing',
    note: 'Close associations with another organization may cause reputational damage'
  },
  {
    category: 'Funding & Income',
    categoryCode: 'FR',
    subCategory: 'Brand',
    subCode: 'BR',
    ukDirector: 'Marketing',
    note: 'Limited return on investment, for example due to low internal take-up'
  },

  // D. Programme Delivery (PD)
  {
    category: 'Programme Delivery',
    categoryCode: 'PD',
    subCategory: 'Project design',
    subCode: 'PD',
    ukDirector: 'International',
    note: 'Failure to design good projects'
  },
  {
    category: 'Programme Delivery',
    categoryCode: 'PD',
    subCategory: 'Partner capacity',
    subCode: 'PC',
    ukDirector: 'International',
    note: 'Insufficient partners with the necessary skills and capacity'
  },
  {
    category: 'Programme Delivery',
    categoryCode: 'PD',
    subCategory: 'Partner management',
    subCode: 'PM',
    ukDirector: 'International',
    note: 'Weak partner management, including financial monitoring'
  },
  {
    category: 'Programme Delivery',
    categoryCode: 'PD',
    subCategory: 'Documentation',
    subCode: 'DO',
    ukDirector: 'International',
    note: 'Failure to create and maintain documentation; the source text is incomplete'
  },
  {
    category: 'Programme Delivery',
    categoryCode: 'PD',
    subCategory: 'Project Implementation',
    subCode: 'PI',
    ukDirector: 'International',
    note: 'Not specified in the source'
  },
  {
    category: 'Programme Delivery',
    categoryCode: 'PD',
    subCategory: 'Project Impact',
    subCode: 'IP',
    ukDirector: 'Influence',
    note: 'Projects fail to achieve their intended impact or have negative impacts'
  },
  {
    category: 'Programme Delivery',
    categoryCode: 'PD',
    subCategory: 'Learning',
    subCode: 'LE',
    ukDirector: 'Influence',
    note: 'Failure to learn from projects and adapt'
  },
  {
    category: 'Programme Delivery',
    categoryCode: 'PD',
    subCategory: 'Project-specific',
    subCode: 'PS',
    ukDirector: 'International',
    note: 'Some RCOs have one or more risks related to specific projects'
  },
  {
    category: 'Programme Delivery',
    categoryCode: 'PD',
    subCategory: 'Donor compliance',
    subCode: 'DC',
    ukDirector: 'International',
    note: 'Not specified in the source'
  },

  // E. People
  {
    category: 'People',
    categoryCode: 'PE',
    subCategory: 'Staff capacity',
    subCode: 'SC',
    ukDirector: 'Finance',
    note: 'Inability to recruit and retain a workforce with sufficient numbers and skills'
  },
  {
    category: 'People',
    categoryCode: 'PE',
    subCategory: 'Staff development',
    subCode: 'SD',
    ukDirector: 'Finance',
    note: 'Inability to motivate the workforce and develop skills; may include poor organizational culture'
  },
  {
    category: 'People',
    categoryCode: 'PE',
    subCategory: 'Safeguarding',
    subCode: 'SG',
    ukDirector: 'Finance',
    note: 'Not specified in the source'
  },

  // F. External (EX)
  {
    category: 'External',
    categoryCode: 'EX',
    subCategory: 'Natural disasters',
    subCode: 'ND',
    ukDirector: 'International',
    note: 'For example, earthquakes and typhoons'
  },
  {
    category: 'External',
    categoryCode: 'EX',
    subCategory: 'Public Health concerns',
    subCode: 'PH',
    ukDirector: 'International',
    note: 'For example, COVID-19, which may also affect other risks'
  },
  {
    category: 'External',
    categoryCode: 'EX',
    subCategory: 'Civil unrest & terrorism',
    subCode: 'CT',
    ukDirector: 'International',
    note: 'Not specified in the source'
  },
  {
    category: 'External',
    categoryCode: 'EX',
    subCategory: 'Political Unrest',
    subCode: 'PU',
    ukDirector: 'International',
    note: 'Not specified in the source'
  },
  {
    category: 'External',
    categoryCode: 'EX',
    subCategory: 'Macroeconomic shocks',
    subCode: 'MS',
    ukDirector: 'International',
    note: 'For example, economic unrest and failing banking systems'
  },
  {
    category: 'External',
    categoryCode: 'EX',
    subCategory: 'Security Other',
    subCode: 'SO',
    ukDirector: 'International',
    note: 'For example, land disputes and fuel disputes'
  }
];

export default function RiskCategoriesView({
  categories = [],
  onSwitchToRegister,
  onSwitchToSummary,
  onSwitchToGuidance,
  onUseClassification,
  onOpenCategoryModal
}) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDirector, setSelectedDirector] = useState('ALL');
  const [layoutMode, setLayoutMode] = useState('grouped'); // 'grouped' | 'table'
  const [expandedCategories, setExpandedCategories] = useState({
    'Strategy & Governance': true,
    'Finance & Services': true,
    'Funding & Income': true,
    'Programme Delivery': true,
    'People': true,
    'External': true
  });

  // Toggle category collapse
  const toggleCategory = (catName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  // Expand / Collapse all
  const setAllExpanded = (expand) => {
    const newState = {};
    const cats = ['Strategy & Governance', 'Finance & Services', 'Funding & Income', 'Programme Delivery', 'People', 'External'];
    cats.forEach(c => { newState[c] = expand; });
    setExpandedCategories(newState);
  };

  // Director Color Helper
  const getDirectorBadge = (director) => {
    switch (director) {
      case 'GMT':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
          dot: 'bg-purple-500',
          full: 'Governance Management Team'
        };
      case 'International':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
          dot: 'bg-blue-500',
          full: 'International Operations'
        };
      case 'Finance':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dot: 'bg-emerald-500',
          full: 'Finance & Systems'
        };
      case 'Marketing':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dot: 'bg-amber-500',
          full: 'Marketing & Partnerships'
        };
      case 'Influence':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
          dot: 'bg-rose-500',
          full: 'Influence & Impact'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          full: director || 'Unassigned'
        };
    }
  };

  // Category Color Map
  const getCategoryTheme = (catName) => {
    switch (catName) {
      case 'Strategy & Governance':
        return {
          headerBg: 'bg-purple-50/60 border-purple-200/70',
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
          iconColor: 'text-purple-600',
          barColor: 'bg-purple-600'
        };
      case 'Finance & Services':
        return {
          headerBg: 'bg-emerald-50/60 border-emerald-200/70',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          iconColor: 'text-emerald-600',
          barColor: 'bg-emerald-600'
        };
      case 'Funding & Income':
        return {
          headerBg: 'bg-amber-50/60 border-amber-200/70',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
          iconColor: 'text-amber-600',
          barColor: 'bg-amber-600'
        };
      case 'Programme Delivery':
        return {
          headerBg: 'bg-blue-50/60 border-blue-200/70',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-600',
          barColor: 'bg-blue-600'
        };
      case 'People':
        return {
          headerBg: 'bg-pink-50/60 border-pink-200/70',
          badgeBg: 'bg-pink-100 text-pink-800 border-pink-200',
          iconColor: 'text-pink-600',
          barColor: 'bg-pink-600'
        };
      case 'External':
        return {
          headerBg: 'bg-slate-100/70 border-slate-200',
          badgeBg: 'bg-slate-200 text-slate-800 border-slate-300',
          iconColor: 'text-slate-700',
          barColor: 'bg-slate-700'
        };
      default:
        return {
          headerBg: 'bg-indigo-50/60 border-indigo-200/70',
          badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          iconColor: 'text-indigo-600',
          barColor: 'bg-indigo-600'
        };
    }
  };

  // Build unified items list (Standard CBDP plus any custom additions from DB categories)
  const allClassificationItems = useMemo(() => {
    // Start with the standard 37 CBDP items
    const standardItems = [...CBDP_STANDARD_CLASSIFICATIONS];
    
    // Check if there are database categories with custom subcategories
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        if (cat.subCategories && cat.subCategories.length > 0) {
          cat.subCategories.forEach(sub => {
            const exists = standardItems.some(
              item => item.category.toLowerCase() === cat.name.toLowerCase() &&
                      item.subCategory.toLowerCase() === sub.name.toLowerCase()
            );
            if (!exists) {
              standardItems.push({
                category: cat.name,
                categoryCode: cat.code || 'CT',
                subCategory: sub.name,
                subCode: sub.code || 'OT',
                ukDirector: sub.ukDirector || 'General',
                note: sub.note || 'Custom organizational classification',
                isCustom: true
              });
            }
          });
        }
      });
    }

    return standardItems;
  }, [categories]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return allClassificationItems.filter(item => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Director filter
      if (selectedDirector !== 'ALL' && item.ukDirector !== selectedDirector) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchCat = item.category.toLowerCase().includes(q);
        const matchCatCode = item.categoryCode.toLowerCase().includes(q);
        const matchSub = item.subCategory.toLowerCase().includes(q);
        const matchSubCode = item.subCode.toLowerCase().includes(q);
        const matchDir = item.ukDirector.toLowerCase().includes(q);
        const matchNote = item.note.toLowerCase().includes(q);
        if (!matchCat && !matchCatCode && !matchSub && !matchSubCode && !matchDir && !matchNote) {
          return false;
        }
      }

      return true;
    });
  }, [allClassificationItems, selectedCategory, selectedDirector, searchTerm]);

  // Grouped items by Category
  const groupedCategories = useMemo(() => {
    const map = {};
    filteredItems.forEach(item => {
      if (!map[item.category]) {
        map[item.category] = {
          name: item.category,
          code: item.categoryCode,
          items: []
        };
      }
      map[item.category].items.push(item);
    });
    return Object.values(map);
  }, [filteredItems]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Category', 'Code', 'Sub-category', 'Subcode', 'UK Director', 'Explanatory Note'];
    const rows = filteredItems.map(item => [
      `"${item.category}"`,
      `"${item.categoryCode}"`,
      `"${item.subCategory}"`,
      `"${item.subCode}"`,
      `"${item.ukDirector}"`,
      `"${item.note.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `CBDP_Risk_Categories_Codes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>CBDP Risk Taxonomy &amp; Codes Standard</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-heading text-white">
            Risk Categories, Codes, and Notes
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            Official organizational taxonomy supporting accurate risk categorization across all projects.
            Every risk record is linked to a standard category, code, sub-category, subcode, responsible
            UK Director department, and official explanatory note.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {onSwitchToRegister && (
              <button
                onClick={onSwitchToRegister}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <span>Back to Risk Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onSwitchToSummary && (
              <button
                onClick={onSwitchToSummary}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-xs border border-slate-700/80 transition-colors shadow-sm cursor-pointer"
              >
                <span>Summary Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onSwitchToGuidance && (
              <button
                onClick={onSwitchToGuidance}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-xs border border-slate-700/80 transition-colors shadow-sm cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Guidance Manual</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-xs border border-slate-700/80 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Master CSV</span>
            </button>

            {onOpenCategoryModal && (
              <button
                onClick={onOpenCategoryModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-900/60 hover:bg-indigo-900/90 text-indigo-200 hover:text-white font-medium text-xs border border-indigo-700/60 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Classification</span>
              </button>
            )}

            <a
              href="https://docs.google.com/spreadsheets/d/104jTZdrIK1yuaXTtFHlrRnSGiw3R1nsaIfCsWtEb-gI/edit?gid=1112286288#gid=1112286288"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs border border-slate-700/80 transition-colors"
            >
              <span>View CBDP Codes Source Sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Layers className="w-96 h-96 text-indigo-400 -mr-16" />
        </div>
      </div>

      {/* 2. STATS & ARCHITECTURE OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Main Categories</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-950 font-heading">6</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Strategy, Finance, Income, Programme, People, External</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sub-Categories</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Tag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-950 font-heading">
            {allClassificationItems.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">37 official CBDP standard subcodes + active extensions</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">UK Director Divisions</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-950 font-heading">5</div>
          <p className="text-[11px] text-slate-500 mt-0.5">GMT, International, Finance, Marketing, Influence</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Source Status</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 font-heading">100% Verified</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Verbatim preservation of source codes and notes</p>
        </div>
      </div>

      {/* 3. CODE CONFLICT & OVERLAP ADVISORY BANNER */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-amber-950 uppercase tracking-wide">
                Important Code Standard Notice: Preserved Duplicate Codes
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 text-amber-900 border border-amber-300">
                CBDP Standard Compliance
              </span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Per official CBDP documentation, several codes share identical abbreviations across different classification levels:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
              <div className="bg-white/80 rounded-xl p-2.5 border border-amber-200/90">
                <span className="font-bold text-amber-950 block font-mono">Code 'FS'</span>
                <span className="text-slate-600">
                  Category: <strong>Finance &amp; Services</strong> <br />
                  Subcode: <strong>Financial Support</strong>
                </span>
              </div>
              <div className="bg-white/80 rounded-xl p-2.5 border border-amber-200/90">
                <span className="font-bold text-amber-950 block font-mono">Code 'SG'</span>
                <span className="text-slate-600">
                  Category: <strong>Strategy &amp; Governance</strong> <br />
                  Subcode: <strong>Safeguarding</strong> (under People)
                </span>
              </div>
              <div className="bg-white/80 rounded-xl p-2.5 border border-amber-200/90">
                <span className="font-bold text-amber-950 block font-mono">Code 'PD'</span>
                <span className="text-slate-600">
                  Category: <strong>Programme Delivery</strong> <br />
                  Subcode: <strong>Project design</strong>
                </span>
              </div>
            </div>
            <p className="text-[11px] text-amber-800 italic pt-1">
              * The system maintains distinct database keys for all records while strictly preserving authentic abbreviations without renaming. Category context is always clearly distinguished in the interface and backend models.
            </p>
          </div>
        </div>
      </div>

      {/* 4. SEARCH & FILTER CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search category, code (e.g. SG, IT, TC), sub-category, UK Director, or note keywords..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Filters & Mode Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Category Dropdown Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Categories ({allClassificationItems.length})</option>
                <option value="Strategy & Governance">A. Strategy &amp; Governance (6)</option>
                <option value="Finance & Services">B. Finance &amp; Services (5)</option>
                <option value="Funding & Income">C. Funding &amp; Income (8)</option>
                <option value="Programme Delivery">D. Programme Delivery (9)</option>
                <option value="People">E. People (3)</option>
                <option value="External">F. External (6)</option>
              </select>
            </div>

            {/* UK Director Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">UK Director:</span>
              <select
                value={selectedDirector}
                onChange={(e) => setSelectedDirector(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Directors</option>
                <option value="GMT">GMT (Governance Management Team)</option>
                <option value="International">International</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Influence">Influence</option>
              </select>
            </div>

            {/* Layout Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setLayoutMode('grouped')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  layoutMode === 'grouped'
                    ? 'bg-white shadow-xs text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View grouped by Category"
              >
                Grouped Cards
              </button>
              <button
                onClick={() => setLayoutMode('table')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  layoutMode === 'table'
                    ? 'bg-white shadow-xs text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View Flat Master Table"
              >
                Master Table
              </button>
            </div>

            {/* Reset Filters */}
            {(searchTerm || selectedCategory !== 'ALL' || selectedDirector !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                  setSelectedDirector('ALL');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 custom-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories ({allClassificationItems.length})
          </button>
          
          {[
            { name: 'Strategy & Governance', code: 'SG', count: 6 },
            { name: 'Finance & Services', code: 'FS', count: 5 },
            { name: 'Funding & Income', code: 'FR', count: 8 },
            { name: 'Programme Delivery', code: 'PD', count: 9 },
            { name: 'People', code: 'PE', count: 3 },
            { name: 'External', code: 'EX', count: 6 }
          ].map(c => (
            <button
              key={c.name}
              onClick={() => setSelectedCategory(c.name)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === c.name
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="font-mono text-[10px] opacity-80">[{c.code}]</span>
              <span>{c.name}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                {c.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Result Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-800">{filteredItems.length}</strong> of{' '}
            <strong>{allClassificationItems.length}</strong> classification subcodes
            {searchTerm && <span> matching "<em>{searchTerm}</em>"</span>}
          </div>
          {layoutMode === 'grouped' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAllExpanded(true)}
                className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
              >
                Expand All
              </button>
              <span>•</span>
              <button
                onClick={() => setAllExpanded(false)}
                className="text-[11px] text-indigo-600 hover:underline cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. DATA DISPLAY (Grouped Cards or Master Table) */}
      {layoutMode === 'grouped' ? (
        /* GROUPED BY CATEGORY VIEW */
        <div className="space-y-6">
          {groupedCategories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No matching classification codes found</h4>
              <p className="text-xs text-slate-400">Try adjusting your search terms or filter selections.</p>
            </div>
          ) : (
            groupedCategories.map((group) => {
              const theme = getCategoryTheme(group.name);
              const isExpanded = expandedCategories[group.name] !== false;

              return (
                <div
                  key={group.name}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                >
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(group.name)}
                    className={`px-5 py-4 ${theme.headerBg} border-b flex items-center justify-between cursor-pointer select-none`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${theme.barColor}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${theme.badgeBg}`}>
                            {group.code}
                          </span>
                          <h3 className="text-base font-black text-slate-900 tracking-tight font-heading">
                            {group.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {group.items.length} standardized {group.items.length === 1 ? 'subcode' : 'subcodes'} assigned
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600 bg-white/80 px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                        {group.items.length} {group.items.length === 1 ? 'Record' : 'Records'}
                      </span>
                      <button
                        type="button"
                        className="p-1 rounded-lg text-slate-500 hover:bg-white/60 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Category Subcodes Table */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-3 px-4 w-16">Subcode</th>
                            <th className="py-3 px-4 w-48">Sub-category</th>
                            <th className="py-3 px-4 w-36">UK Director</th>
                            <th className="py-3 px-5">Explanatory Note</th>
                            <th className="py-3 px-4 text-right w-36">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.items.map((item, idx) => {
                            const directorBadge = getDirectorBadge(item.ukDirector);
                            const isSharedCode = ['FS', 'SG', 'PD'].includes(item.subCode);
                            const isNoteBlank = !item.note || item.note.toLowerCase().includes('not specified in the source');

                            return (
                              <tr
                                key={item.subCode + '-' + idx}
                                className="hover:bg-indigo-50/20 transition-colors group"
                              >
                                {/* Subcode Badge */}
                                <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold font-mono">
                                      {item.subCode}
                                    </span>
                                    {isSharedCode && (
                                      <span
                                        className="w-1.5 h-1.5 rounded-full bg-amber-500"
                                        title={`Shared code: ${item.subCode}`}
                                      />
                                    )}
                                  </div>
                                </td>

                                {/* Sub-category Name */}
                                <td className="py-3.5 px-4 font-semibold text-slate-900">
                                  <div className="flex items-center gap-1.5">
                                    <span>{item.subCategory}</span>
                                    {item.isCustom && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                                        Custom
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* UK Director Department */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${directorBadge.bg}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${directorBadge.dot}`}></span>
                                    <span>{item.ukDirector}</span>
                                  </span>
                                </td>

                                {/* Explanatory Note */}
                                <td className="py-3.5 px-5 text-slate-600 leading-relaxed">
                                  {isNoteBlank ? (
                                    <span className="inline-flex items-center gap-1.5 text-slate-400 italic text-[11px]">
                                      <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                      <span>Not specified in the source document</span>
                                    </span>
                                  ) : (
                                    <div className="text-slate-700 max-w-xl">
                                      {item.note}
                                      {item.note.includes('incomplete') && (
                                        <span className="ml-1 text-[10px] text-amber-600 font-semibold underline">
                                          (Incomplete in source)
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Action */}
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  {onUseClassification && (
                                    <button
                                      onClick={() => onUseClassification(item)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-200 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                                      title={`Use [${item.categoryCode}-${item.subCode}] in a new risk record`}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Use in New Risk</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* FLAT MASTER TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-200/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Master Classification Index
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Structured master table matching all columns in CBDP specification
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
              {filteredItems.length} Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-44">Category</th>
                  <th className="py-3.5 px-3 w-16">Code</th>
                  <th className="py-3.5 px-4 w-48">Sub-category</th>
                  <th className="py-3.5 px-3 w-16">Subcode</th>
                  <th className="py-3.5 px-4 w-32">UK Director</th>
                  <th className="py-3.5 px-5">Explanatory Note</th>
                  <th className="py-3.5 px-4 text-right w-36">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => {
                  const directorBadge = getDirectorBadge(item.ukDirector);
                  const isSharedCode = ['FS', 'SG', 'PD'].includes(item.subCode);
                  const isNoteBlank = !item.note || item.note.toLowerCase().includes('not specified in the source');

                  return (
                    <tr
                      key={item.categoryCode + '-' + item.subCode + '-' + idx}
                      className="hover:bg-indigo-50/20 transition-colors"
                    >
                      {/* Category */}
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {item.category}
                      </td>

                      {/* Category Code */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {item.categoryCode}
                        </span>
                      </td>

                      {/* Sub-category */}
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {item.subCategory}
                      </td>

                      {/* Subcode */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        <div className="inline-flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {item.subCode}
                          </span>
                          {isSharedCode && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-amber-500"
                              title={`Shared code: ${item.subCode}`}
                            />
                          )}
                        </div>
                      </td>

                      {/* UK Director */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${directorBadge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${directorBadge.dot}`}></span>
                          <span>{item.ukDirector}</span>
                        </span>
                      </td>

                      {/* Explanatory Note */}
                      <td className="py-3 px-5 text-slate-600 leading-relaxed">
                        {isNoteBlank ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-400 italic text-[11px]">
                            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>Not specified in the source</span>
                          </span>
                        ) : (
                          <div className="text-slate-700 max-w-xl">
                            {item.note}
                            {item.note.includes('incomplete') && (
                              <span className="ml-1 text-[10px] text-amber-600 font-semibold underline">
                                (Incomplete in source)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {onUseClassification && (
                          <button
                            onClick={() => onUseClassification(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-200 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                            title={`Use [${item.categoryCode}-${item.subCode}] in a new risk record`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Use in New Risk</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. BOTTOM REFERENCE ARCHITECTURE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Integration with Add &amp; Edit Risk Record
              </h4>
              <p className="text-[11px] text-slate-500">How classifications are bound to risk entries</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            When creating or editing a risk record, selecting a Category dynamically limits the Sub-category dropdown
            to only authorized subcodes. Selecting a sub-category automatically resolves the assigned UK Director and
            displays the CBDP Explanatory Note, ensuring consistent organizational governance.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                UK Director Accountability Divisions
              </h4>
              <p className="text-[11px] text-slate-500">Departmental ownership breakdown</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="block text-purple-700">GMT (4 Subcodes)</strong>
              <span className="text-slate-500">Strategy, Tax, Leadership, Crisis</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="block text-blue-700">International (15 Subcodes)</strong>
              <span className="text-slate-500">Legal, Projects, External Shocks</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="block text-emerald-700">Finance (8 Subcodes)</strong>
              <span className="text-slate-500">Financial Support, HR, Safeguarding</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="block text-amber-700">Marketing (8 Subcodes)</strong>
              <span className="text-slate-500">Donors, Proposals, Profile, Brand</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
              <strong className="block text-rose-700">Influence (2 Subcodes)</strong>
              <span className="text-slate-500">Project Impact &amp; Learning</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
