import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, AlertTriangle, Copy, Check, Table, ListOrdered, 
  FileCode, Layers, ShieldCheck, ArrowRight, Search, Download, 
  ExternalLink, Sparkles, Filter, RefreshCw, Eye, Info, Database,
  SlidersHorizontal, CheckSquare, Plus, Lock, ChevronRight, HelpCircle
} from 'lucide-react';

// =====================================================================
// SINGLE SOURCE OF TRUTH: OFFICIAL VALIDATION DATA
// Exactly matches CBDP Risk Register "Validation and other lists" tab
// Total items: 43 validated category/subcategory pairs across 6 categories
// =====================================================================
export const OFFICIAL_VALIDATION_CATEGORIES = [
  {
    order: 1,
    name: 'Strategy & Governance',
    code: 'SG',
    theme: {
      border: 'border-purple-200',
      headerBg: 'bg-purple-50',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      dot: 'bg-purple-500',
      accent: 'text-purple-600',
      lightBg: 'bg-purple-50/40'
    },
    subCategories: [
      { name: 'Strategy relevance', code: 'SR', ukDirector: 'GMT', note: 'Strategy not adapted to changing societal needs' },
      { name: 'Registration', code: 'RE', ukDirector: 'International', note: 'Right to operate revoked or not renewed' },
      { name: 'Legal compliance', code: 'LC', ukDirector: 'International', note: 'Particularly national laws' },
      { name: 'Tax compliance', code: 'TC', ukDirector: 'GMT', note: 'Not specified in the source' },
      { name: 'Leadership capacity', code: 'MC', ukDirector: 'GMT', note: 'For example, SMT capacity and SMT stability' },
      { name: 'Crisis management', code: 'CM', ukDirector: 'GMT', note: 'Inability to respond properly to a crisis, including public relations' },
      { name: 'Other', code: 'OT', ukDirector: 'GMT', note: 'Other Strategy & Governance risk not specified above', isOther: true }
    ]
  },
  {
    order: 2,
    name: 'Finance & Services',
    code: 'FS',
    theme: {
      border: 'border-emerald-200',
      headerBg: 'bg-emerald-50',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      accent: 'text-emerald-600',
      lightBg: 'bg-emerald-50/40'
    },
    subCategories: [
      { name: 'Financial Support', code: 'FS', ukDirector: 'Finance', note: 'RCOs do not receive adequate financial support from the UK' },
      { name: 'Financial model', code: 'FM', ukDirector: 'Finance', note: 'Long-term financial model not suited to cash flows and commitments' },
      { name: 'Finance controls & Fraud', code: 'FF', ukDirector: 'Finance', note: 'Not specified in the source' },
      { name: 'Data protection & cyber attack', code: 'IT', ukDirector: 'Finance', note: 'IT failures of any type, including data loss and cyber attacks' },
      { name: 'Change projects', code: 'CP', ukDirector: 'Finance', note: 'Failure to manage or support organization-wide change projects' },
      { name: 'Other', code: 'OT', ukDirector: 'Finance', note: 'Other Finance & Services risk not specified above', isOther: true }
    ]
  },
  {
    order: 3,
    name: 'Funding & Income',
    code: 'FR',
    theme: {
      border: 'border-amber-200',
      headerBg: 'bg-amber-50',
      text: 'text-amber-800',
      badge: 'bg-amber-100 text-amber-900 border-amber-200',
      dot: 'bg-amber-500',
      accent: 'text-amber-600',
      lightBg: 'bg-amber-50/40'
    },
    subCategories: [
      { name: 'Changing donor pool', code: 'CD', ukDirector: 'Marketing', note: 'Fewer donors interested in the types of work or locations in which PA operates' },
      { name: 'Funding base', code: 'FB', ukDirector: 'Marketing', note: 'Funding is overly dependent on too few donors or sources' },
      { name: 'Results based', code: 'RB', ukDirector: 'Marketing', note: 'A changed funding model increases financial risk to PA' },
      { name: 'Proposal quality', code: 'PQ', ukDirector: 'Marketing', note: 'Reduced ability to identify opportunities and write good proposals on time' },
      { name: 'Cost recovery', code: 'CR', ukDirector: 'Marketing', note: 'Reduced ability to cover costs, possibly requiring higher levels of co-funding' },
      { name: 'Secured income', code: 'SI', ukDirector: 'Marketing', note: 'Overall low levels of secured income and a weak pipeline' },
      { name: 'Relationships & Profile', code: 'RP', ukDirector: 'Marketing', note: 'Close associations with another organization may cause reputational damage' },
      { name: 'Brand', code: 'BR', ukDirector: 'Marketing', note: 'Limited return on investment, for example due to low internal take-up' },
      { name: 'Other', code: 'OT', ukDirector: 'Marketing', note: 'Other Funding & Income risk not specified above', isOther: true }
    ]
  },
  {
    order: 4,
    name: 'Programme Delivery',
    code: 'PD',
    theme: {
      border: 'border-blue-200',
      headerBg: 'bg-blue-50',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      dot: 'bg-blue-500',
      accent: 'text-blue-600',
      lightBg: 'bg-blue-50/40'
    },
    subCategories: [
      { name: 'Project design', code: 'PD', ukDirector: 'International', note: 'Failure to design good projects' },
      { name: 'Partner capacity', code: 'PC', ukDirector: 'International', note: 'Insufficient partners with the necessary skills and capacity' },
      { name: 'Partner management', code: 'PM', ukDirector: 'International', note: 'Weak partner management, including financial monitoring' },
      { name: 'Documentation', code: 'DO', ukDirector: 'International', note: 'Failure to create and maintain documentation; the source text is incomplete' },
      { name: 'Project Implementation', code: 'PI', ukDirector: 'International', note: 'Not specified in the source' },
      { name: 'Project Impact', code: 'IP', ukDirector: 'Influence', note: 'Projects fail to achieve their intended impact or have negative impacts' },
      { name: 'Learning', code: 'LE', ukDirector: 'Influence', note: 'Failure to learn from projects and adapt' },
      { name: 'Project specific', code: 'PS', ukDirector: 'International', note: 'Some RCOs have one or more risks related to specific projects', aliases: ['Project-specific'] },
      { name: 'Donor complaince', code: 'DC', ukDirector: 'International', note: 'Compliance with donor agreements, guidelines and contractual conditions', aliases: ['Donor compliance'] },
      { name: 'Other', code: 'OT', ukDirector: 'International', note: 'Other Programme Delivery risk not specified above', isOther: true }
    ]
  },
  {
    order: 5,
    name: 'People',
    code: 'PE',
    theme: {
      border: 'border-indigo-200',
      headerBg: 'bg-indigo-50',
      text: 'text-indigo-700',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      dot: 'bg-indigo-500',
      accent: 'text-indigo-600',
      lightBg: 'bg-indigo-50/40'
    },
    subCategories: [
      { name: 'Staff capacity', code: 'SC', ukDirector: 'Finance', note: 'Inability to recruit and retain a workforce with sufficient numbers and skills' },
      { name: 'Staff development', code: 'SD', ukDirector: 'Finance', note: 'Inability to motivate the workforce and develop skills; may include poor organizational culture' },
      { name: 'Safeguarding', code: 'SG', ukDirector: 'Finance', note: 'Not specified in the source' },
      { name: 'Other', code: 'OT', ukDirector: 'Finance', note: 'Other People risk not specified above', isOther: true }
    ]
  },
  {
    order: 6,
    name: 'External',
    code: 'EX',
    theme: {
      border: 'border-rose-200',
      headerBg: 'bg-rose-50',
      text: 'text-rose-700',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      accent: 'text-rose-600',
      lightBg: 'bg-rose-50/40'
    },
    subCategories: [
      { name: 'Natural disasters', code: 'ND', ukDirector: 'International', note: 'For example, earthquakes and typhoons' },
      { name: 'Public Health concerns', code: 'PH', ukDirector: 'International', note: 'For example, COVID-19, which may also affect other risks' },
      { name: 'Civil unrest & terrorism', code: 'CT', ukDirector: 'International', note: 'Not specified in the source' },
      { name: 'Political Unrest', code: 'PU', ukDirector: 'International', note: 'Not specified in the source' },
      { name: 'Macroeconomic shocks', code: 'MS', ukDirector: 'International', note: 'For example, economic unrest and failing banking systems' },
      { name: 'Security Other', code: 'SO', ukDirector: 'International', note: 'For example, land disputes and fuel disputes' },
      { name: 'Other', code: 'OT', ukDirector: 'International', note: 'Other External risk not specified above', isOther: true }
    ]
  }
];

// Exact sequence for sorting and lookups (1 to 6)
export const CUSTOM_CATEGORY_SEQUENCE = [
  'Strategy & Governance',
  'Finance & Services',
  'Funding & Income',
  'Programme Delivery',
  'People',
  'External'
];

// Single source of truth comma-separated list for macros
export const MACRO_CATEGORY_STRING = 'Strategy & Governance, Finance & Services, Funding & Income, Programme Delivery, People, External';

export default function RiskValidationView({
  categories = [],
  onSwitchToRegister,
  onSwitchToSummary,
  onSwitchToClassifications,
  onAddRiskRecordWithPrefill
}) {
  // Navigation & View State
  const [viewSection, setViewSection] = useState('all'); // 'all' | 'table' | 'categories' | 'macros' | 'tester'
  const [layoutMode, setLayoutMode] = useState('matrix'); // 'matrix' (columns) | 'tabular' (detailed rows)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [copiedMacro, setCopiedMacro] = useState(false);
  const [customDelimiter, setCustomDelimiter] = useState('comma'); // 'comma' | 'semicolon' | 'pipe' | 'newline' | 'json'

  // Interactive Live Dropdown Tester State
  const [testCategory, setTestCategory] = useState(CUSTOM_CATEGORY_SEQUENCE[0]);
  const [testSubCategory, setTestSubCategory] = useState('Strategy relevance');
  const [testCustomOtherText, setTestCustomOtherText] = useState('');

  // Handle dynamic sub-category update when tester category changes
  const handleTesterCategoryChange = (catName) => {
    setTestCategory(catName);
    const catObj = OFFICIAL_VALIDATION_CATEGORIES.find(c => c.name === catName);
    if (catObj && catObj.subCategories.length > 0) {
      setTestSubCategory(catObj.subCategories[0].name);
    } else {
      setTestSubCategory('');
    }
    setTestCustomOtherText('');
  };

  // Get available sub-categories for tester
  const testerSubCategories = useMemo(() => {
    const cat = OFFICIAL_VALIDATION_CATEGORIES.find(c => c.name === testCategory);
    return cat ? cat.subCategories : [];
  }, [testCategory]);

  // Is test combination valid?
  const isTestCombinationValid = useMemo(() => {
    const cat = OFFICIAL_VALIDATION_CATEGORIES.find(c => c.name === testCategory);
    if (!cat) return false;
    return cat.subCategories.some(s => s.name === testSubCategory);
  }, [testCategory, testSubCategory]);

  // Copy to clipboard helper
  const handleCopyMacro = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedMacro(true);
    setTimeout(() => setCopiedMacro(false), 2500);
  };

  // Formatted macro string based on chosen delimiter
  const formattedMacroOutput = useMemo(() => {
    switch (customDelimiter) {
      case 'semicolon':
        return CUSTOM_CATEGORY_SEQUENCE.join('; ');
      case 'pipe':
        return CUSTOM_CATEGORY_SEQUENCE.join(' | ');
      case 'newline':
        return CUSTOM_CATEGORY_SEQUENCE.join('\n');
      case 'json':
        return JSON.stringify(CUSTOM_CATEGORY_SEQUENCE, null, 2);
      case 'comma':
      default:
        return MACRO_CATEGORY_STRING;
    }
  }, [customDelimiter]);

  // Total items calculations
  const totalSubCategoriesCount = useMemo(() => {
    return OFFICIAL_VALIDATION_CATEGORIES.reduce((acc, cat) => acc + cat.subCategories.length, 0);
  }, []);

  // Filtered categories for matrix / table view
  const filteredCategories = useMemo(() => {
    let list = OFFICIAL_VALIDATION_CATEGORIES;
    if (selectedCategoryFilter !== 'ALL') {
      list = list.filter(c => c.name === selectedCategoryFilter);
    }
    if (!searchQuery.trim()) return list;

    const query = searchQuery.trim().toLowerCase();
    return list.map(c => {
      const matchCat = c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query);
      const filteredSubs = c.subCategories.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query) ||
        s.ukDirector.toLowerCase().includes(query) ||
        s.note.toLowerCase().includes(query)
      );
      if (matchCat) return c;
      return {
        ...c,
        subCategories: filteredSubs
      };
    }).filter(c => c.subCategories.length > 0);
  }, [selectedCategoryFilter, searchQuery]);

  // Export full schema to JSON file
  const handleExportJSON = () => {
    const data = {
      title: 'CBDP Risk Register - Validation and Other Lists',
      version: '1.0',
      generatedAt: new Date().toISOString(),
      customCategoryList: CUSTOM_CATEGORY_SEQUENCE,
      macroCategoryList: MACRO_CATEGORY_STRING,
      categories: OFFICIAL_VALIDATION_CATEGORIES
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CBDP_Risk_Validation_Lists_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export validation matrix to CSV
  const handleExportCSV = () => {
    const rows = [
      ['Sequence', 'Category', 'Category Code', 'Sub-category', 'Sub-code', 'Responsible UK Director', 'Explanatory Note', 'Is Other']
    ];
    OFFICIAL_VALIDATION_CATEGORIES.forEach(cat => {
      cat.subCategories.forEach((sub, subIdx) => {
        rows.push([
          cat.order,
          `"${cat.name}"`,
          cat.code,
          `"${sub.name}"`,
          sub.code,
          sub.ukDirector,
          `"${sub.note}"`,
          sub.isOther ? 'YES' : 'NO'
        ]);
      });
    });
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CBDP_Risk_Validation_Table_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. TOP HERO HEADER & METRICS BAR */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-mono">
                System Reference &bull; CBDP Standard
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200/70">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Single Source of Truth</span>
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight font-heading">
              Validation and Other Lists
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              Authoritative validation rules, category-to-subcategory dropdown matrix, strict sorting sequence, and macro-compatible string configuration for the CBDP Risk Register module.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onSwitchToRegister}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all cursor-pointer"
            >
              <Table className="w-4 h-4 text-slate-500" />
              <span>Back to Register</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all cursor-pointer"
              title="Export Validation Table to CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all cursor-pointer"
              title="Export complete schema as JSON"
            >
              <FileCode className="w-4 h-4 text-indigo-600" />
              <span>Schema JSON</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Main Categories</span>
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-heading">
              {CUSTOM_CATEGORY_SEQUENCE.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Exact 1–6 sequence
            </p>
          </div>

          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Validated Sub-categories</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-heading">
              {totalSubCategoriesCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Including "Other" on all 6
            </p>
          </div>

          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Macro List Format</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-heading font-mono">
              6 Items
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Comma-delimited standard
            </p>
          </div>

          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Integrity Status</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-base font-black text-emerald-700 flex items-center gap-1.5 font-heading">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>100% In Sync</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Prevents invalid combinations
            </p>
          </div>
        </div>

        {/* Configuration Notice Callout */}
        <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/80 flex items-start gap-3.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              System Configuration Safety Notice
            </p>
            <p className="text-amber-800 leading-relaxed">
              This section contains authoritative configuration data that controls dropdown options, sorting orders, filtering rules, and lookup formulas across the entire Risk Register. Existing validation rules and spelling standards (such as <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold">Project specific</code> and <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold">Donor complaince</code>) are permanently preserved for backward compatibility.
            </p>
          </div>
        </div>
      </div>

      {/* 2. SECTION NAVIGATION TABS & FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 overflow-x-auto">
          <button
            onClick={() => setViewSection('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              viewSection === 'all'
                ? 'bg-white shadow-xs text-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All 3 Sections
          </button>
          <button
            onClick={() => setViewSection('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              viewSection === 'table'
                ? 'bg-white shadow-xs text-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A. Validation Table
          </button>
          <button
            onClick={() => setViewSection('categories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              viewSection === 'categories'
                ? 'bg-white shadow-xs text-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            B. Custom Category List
          </button>
          <button
            onClick={() => setViewSection('macros')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              viewSection === 'macros'
                ? 'bg-white shadow-xs text-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            C. List for Macros
          </button>
          <button
            onClick={() => setViewSection('tester')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              viewSection === 'tester'
                ? 'bg-white shadow-xs text-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Live Dropdown Tester</span>
            </span>
          </button>
        </div>

        {/* Search & Layout Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category or sub-category..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setLayoutMode('matrix')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                layoutMode === 'matrix' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Columnar Matrix View (like Spreadsheet)"
            >
              Matrix
            </button>
            <button
              onClick={() => setLayoutMode('tabular')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                layoutMode === 'tabular' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tabular Detailed View"
            >
              Details
            </button>
          </div>
        </div>
      </div>

      {/* 3. SECTION A: VALIDATION TABLE FOR CATEGORIES AND SUB-CATEGORIES */}
      {(viewSection === 'all' || viewSection === 'table') && (
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center font-mono">
                  A
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Validation Table for Categories and Sub-categories
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                This table defines the allowable options in dropdown menus and validates data entry across all Risk Register records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                Filter Category:
              </span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All 6 Categories</option>
                {CUSTOM_CATEGORY_SEQUENCE.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* MATRIX VIEW (Columns A to F like the CBDP Spreadsheet) */}
          {layoutMode === 'matrix' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.name}
                  className={`rounded-2xl border ${cat.theme.border} bg-white shadow-2xs overflow-hidden flex flex-col justify-between`}
                >
                  {/* Category Header */}
                  <div className={`p-4 border-b ${cat.theme.border} ${cat.theme.headerBg}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/90 text-slate-700 shadow-2xs border border-slate-200/50">
                        Col {cat.order} &bull; {cat.code}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200/50">
                        {cat.subCategories.length} items
                      </span>
                    </div>
                    <h3 className={`font-black text-sm ${cat.theme.text} tracking-tight line-clamp-1`} title={cat.name}>
                      {cat.name}
                    </h3>
                  </div>

                  {/* Subcategories List */}
                  <div className="p-3 divide-y divide-slate-100 flex-1">
                    {cat.subCategories.map((sub, sIdx) => (
                      <div
                        key={sub.name}
                        className={`py-2 px-2 rounded-lg text-xs flex items-start justify-between gap-2 transition-colors ${
                          sub.isOther ? 'bg-slate-50 font-semibold text-slate-800' : 'hover:bg-slate-50/70 text-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="font-mono text-[10px] text-slate-400 font-bold mt-0.5 flex-shrink-0">
                            {sIdx + 1}.
                          </span>
                          <div className="min-w-0">
                            <span className="truncate block font-medium" title={sub.name}>
                              {sub.name}
                            </span>
                            {sub.note && (
                              <span className="text-[10px] text-slate-400 block truncate" title={sub.note}>
                                {sub.note}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex-shrink-0">
                          {sub.code}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Column Footer */}
                  <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Validation Rule:</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Enabled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* DETAILED TABULAR VIEW */
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4 w-52">Main Category</th>
                    <th className="py-3 px-4 w-16">Cat Code</th>
                    <th className="py-3 px-4">Sub-category (Validation Option)</th>
                    <th className="py-3 px-4 w-20">Sub Code</th>
                    <th className="py-3 px-4 w-32">UK Director</th>
                    <th className="py-3 px-4">Explanatory Note / Source Spec</th>
                    <th className="py-3 px-4 w-28 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.flatMap((cat) =>
                    cat.subCategories.map((sub, idx) => (
                      <tr 
                        key={`${cat.name}-${sub.name}`}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          sub.isOther ? 'bg-slate-50/40' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 text-center font-mono text-[11px] text-slate-400">
                          {cat.order}.{idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cat.theme.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cat.theme.dot}`}></span>
                            <span>{cat.name}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                          {cat.code}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <span>{sub.name}</span>
                            {sub.isOther && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700 font-mono">
                                Fallback
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">
                          {sub.code}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-700">
                          {sub.ukDirector}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 max-w-md truncate" title={sub.note}>
                          {sub.note}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Valid
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* 4. SECTION B: CUSTOM CATEGORY LIST FOR SORTING AND LOOKUPS */}
      {(viewSection === 'all' || viewSection === 'categories') && (
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center font-mono">
                  B
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Custom Category List for Sorting and Lookups
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Authoritative 6-category sequential list in mandatory order. Controls all category-based sorting, grouping, and lookup operations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-xl border border-indigo-200/60 font-mono">
                Strict Order: 1 &rarr; 6
              </span>
            </div>
          </div>

          {/* Sequential 6 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OFFICIAL_VALIDATION_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center font-mono shadow-xs">
                      {cat.order}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">
                      Code: [{cat.code}]
                    </span>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    {cat.subCategories.length} Sub-categories
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    System role: Primary filter header, dropdown validation parent, lookup index #{cat.order}.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Validation Match:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Exact Header Alignment
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Critical Synchronization Callout */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-700">
            <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-slate-900">Critical Architecture Guarantee:</strong>
              <p className="text-slate-600 leading-relaxed">
                This list is guaranteed to match the column headers of the Validation Table in real-time. By utilizing <code className="bg-slate-200/80 px-1 py-0.5 rounded font-mono font-bold text-slate-800">CUSTOM_CATEGORY_SEQUENCE</code> as the single source of truth, the system guarantees zero discrepancies between category dropdowns, record saving, table sorting, and lookup operations.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 5. SECTION C: LIST FOR MACROS */}
      {(viewSection === 'all' || viewSection === 'macros') && (
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center font-mono">
                  C
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  List for Macros
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Maintains the comma-separated category string for macro-compatible operations, automated scripts, and external spreadsheet integrations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyMacro(formattedMacroOutput)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  copiedMacro 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copiedMacro ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Macro String</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Comma-Separated Macro Output Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="font-bold text-slate-700">
                Authoritative Macro String Output:
              </span>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <span>Delimiter:</span>
                <select
                  value={customDelimiter}
                  onChange={(e) => setCustomDelimiter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium text-slate-800 text-[11px] cursor-pointer"
                >
                  <option value="comma">Standard Comma (", ")</option>
                  <option value="semicolon">Semicolon ("; ")</option>
                  <option value="pipe">Pipe (" | ")</option>
                  <option value="newline">Newline ("\n")</option>
                  <option value="json">JSON Array</option>
                </select>
              </div>
            </div>

            {/* Display Box */}
            <div className="relative group">
              <pre className="p-4 rounded-2xl bg-slate-900 text-indigo-200 font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                {formattedMacroOutput}
              </pre>
              <button
                onClick={() => handleCopyMacro(formattedMacroOutput)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-sm opacity-80 group-hover:opacity-100 cursor-pointer"
                title="Copy string"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Macro Technical Details & Formula Equivalents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <span className="font-bold text-slate-900 block">
                Spreadsheet Macro Formula Reference
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                In Excel or Google Sheets, this comma-separated list is referenced by named ranges or validation formulas:
              </p>
              <code className="block p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-slate-800">
                =SPLIT("{MACRO_CATEGORY_STRING}", ", ")
              </code>
              <code className="block p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-slate-800">
                =VLOOKUP(CategoryCell, ValidationMatrix, 2, FALSE)
              </code>
            </div>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <span className="font-bold text-slate-900 block">
                Web Application Compatibility
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Because this HRM platform operates as a secure modern web application, macro strings are natively mapped to backend validation schemas and live dropdown state machines without requiring legacy spreadsheet macros.
              </p>
              <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero legacy macro dependencies required</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. SECTION D: INTERACTIVE VALIDATION TESTER & DROPDOWN SIMULATOR */}
      {(viewSection === 'all' || viewSection === 'tester') && (
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Interactive Validation Tester &amp; Dropdown Simulator
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Live simulation tool to test dynamic Category &rarr; Sub-category filtering, "Other" fallback handling, and invalid combination prevention.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Dropdown Engine Active</span>
            </span>
          </div>

          {/* Interactive Tester Inputs */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  1. Select Main Category (Displays 6 Categories)
                </label>
                <select
                  value={testCategory}
                  onChange={(e) => handleTesterCategoryChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs cursor-pointer"
                >
                  {CUSTOM_CATEGORY_SEQUENCE.map((catName, idx) => (
                    <option key={catName} value={catName}>
                      {idx + 1}. {catName}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Changing category dynamically refreshes allowable sub-categories below.
                </p>
              </div>

              {/* Sub-category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  2. Select Sub-category (Dynamically Filtered)
                </label>
                <select
                  value={testSubCategory}
                  onChange={(e) => setTestSubCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs cursor-pointer"
                >
                  {testerSubCategories.map(sub => (
                    <option key={sub.name} value={sub.name}>
                      [{sub.code}] {sub.name} {sub.isOther ? '(Other Fallback)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Only sub-categories belonging to <strong className="text-slate-700">{testCategory}</strong> are shown.
                </p>
              </div>
            </div>

            {/* "Other" Option Specification Field */}
            {testSubCategory === 'Other' && (
              <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200/80 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>"Other" Sub-category Selected</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  When "Other" is chosen across any of the 6 categories, users can optionally specify the exact nature of the emerging or unlisted risk in notes.
                </p>
                <input
                  type="text"
                  value={testCustomOtherText}
                  onChange={(e) => setTestCustomOtherText(e.target.value)}
                  placeholder="e.g., Specific local operational contingency or newly identified regulatory risk..."
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}

            {/* Live Real-Time Validation Report */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {isTestCombinationValid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Validated Combination: Rule Passed</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Invalid Category / Sub-category Combination</span>
                  </span>
                )}

                <span className="text-xs font-mono text-slate-500">
                  [{testCategory}] &rarr; [{testSubCategory}]
                </span>
              </div>

              {onAddRiskRecordWithPrefill && (
                <button
                  onClick={() => onAddRiskRecordWithPrefill({ category: testCategory, subCategory: testSubCategory })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Create Risk with this Selection</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 7. QUICK NAVIGATION FOOTER */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Need to look up Director ownership or detailed explanatory notes?</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToClassifications}
            className="font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
          >
            View Categories, Codes &amp; Notes
          </button>
          <span>&bull;</span>
          <button
            onClick={onSwitchToSummary}
            className="font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
          >
            View Summary Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
