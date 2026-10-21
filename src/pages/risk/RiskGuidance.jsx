import React, { useState } from 'react';
import { 
  BookOpen, ShieldAlert, CheckCircle2, XCircle, ArrowRight, 
  HelpCircle, AlertTriangle, Calculator, UserCheck, Clock, 
  Layers, Flame, FileText, ChevronRight, Compass, Sparkles,
  Info, ExternalLink, ArrowUpRight, Scale, Check, X
} from 'lucide-react';
import { calculateRiskScore, getRiskRating, calculateVariance } from '../../utils/riskCalculations.js';

export default function RiskGuidance({ onSwitchToRegister, onSwitchToSummary }) {
  // Interactive Live Scoring Calculator state for Topic B & C
  const [testLikelihood, setTestLikelihood] = useState(3);
  const [testImpact, setTestImpact] = useState(3);
  const [testTarget, setTestTarget] = useState(6);

  const calcScore = calculateRiskScore(testLikelihood, testImpact);
  const calcRating = getRiskRating(calcScore);
  const calcVariance = calculateVariance(calcScore, testTarget);

  const likelihoodLabels = {
    1: 'Very unlikely (< 10%)',
    2: 'Quite unlikely (10% - 30%)',
    3: 'Possible (30% - 60%)',
    4: 'Likely (60% - 85%)',
    5: 'Very likely (> 85%)'
  };

  const impactLabels = {
    1: 'Almost none',
    2: 'Some small impact',
    3: 'Considerable impact',
    4: 'Serious effects',
    5: 'Catastrophic effects'
  };

  // 5x5 Heat Map Data
  const likelihoodRows = [
    { value: 5, label: '5 - Very likely' },
    { value: 4, label: '4 - Likely' },
    { value: 3, label: '3 - Possible' },
    { value: 2, label: '2 - Quite unlikely' },
    { value: 1, label: '1 - Very unlikely' }
  ];

  const impactCols = [
    { value: 1, label: '1 - Almost none' },
    { value: 2, label: '2 - Some small impact' },
    { value: 3, label: '3 - Considerable impact' },
    { value: 4, label: '4 - Serious effects' },
    { value: 5, label: '5 - Catastrophic effects' }
  ];

  const getHeatmapColor = (score) => {
    if (score >= 15) {
      return 'bg-rose-50 text-rose-950 border-rose-200 hover:bg-rose-100/90';
    }
    if (score >= 8) {
      return 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100/90';
    }
    return 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100/90';
  };

  const getHeatmapBadge = (score) => {
    if (score >= 15) {
      return <span className="text-[9px] font-bold text-rose-700 uppercase">High (15+)</span>;
    }
    if (score >= 8) {
      return <span className="text-[9px] font-bold text-amber-700 uppercase">Med (8-14)</span>;
    }
    return <span className="text-[9px] font-bold text-emerald-700 uppercase">Low (&lt;8)</span>;
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>CBDP Governance Standard</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-heading text-white">
            Guidance on Completing a Risk Register
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            This comprehensive governance manual establishes the official methodology for identifying risks,
            applying the approved formula <span className="text-indigo-300 font-mono font-semibold">(Likelihood × Impact) + Impact</span>,
            calibrating risk appetite, creating enforceable mitigation actions, and maintaining enterprise accountability.
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

            <a
              href="https://docs.google.com/spreadsheets/d/104jTZdrIK1yuaXTtFHlrRnSGiw3R1nsaIfCsWtEb-gI/edit?gid=2014507561#gid=2014507561"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs border border-slate-700/80 transition-colors"
            >
              <span>View Source Spreadsheet Template</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <ShieldAlert className="w-96 h-96 text-indigo-400 -mr-16" />
        </div>
      </div>

      {/* 2. JUMP-LINK NAVIGATION PILLS */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2 overflow-x-auto custom-scrollbar text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 whitespace-nowrap">
          Quick Jump:
        </span>
        <button
          onClick={() => scrollToSection('guidance-statement')}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium whitespace-nowrap transition-colors"
        >
          A. Risk Statement
        </button>
        <button
          onClick={() => scrollToSection('guidance-scoring')}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium whitespace-nowrap transition-colors"
        >
          B. Scoring Matrix
        </button>
        <button
          onClick={() => scrollToSection('guidance-scores')}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium whitespace-nowrap transition-colors"
        >
          C. Current, Target & Variance
        </button>
        <button
          onClick={() => scrollToSection('guidance-rag')}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium whitespace-nowrap transition-colors"
        >
          D. RAG Ratings
        </button>
        <button
          onClick={() => scrollToSection('guidance-heatmap')}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium whitespace-nowrap transition-colors"
        >
          E. 5×5 Heat Map
        </button>
        <button
          onClick={() => scrollToSection('guidance-mitigation')}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium whitespace-nowrap transition-colors"
        >
          F. Mitigation Plans
        </button>
        <button
          onClick={() => scrollToSection('guidance-people')}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium whitespace-nowrap transition-colors"
        >
          G. Responsible Roles
        </button>
      </div>

      {/* TOPIC A: RISK STATEMENT FORMULATION */}
      <section id="guidance-statement" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
            A
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
              Formulating an Effective Risk Statement
            </h2>
            <p className="text-xs text-slate-500">
              Clear separation between the underlying hazard and its organizational consequence
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          A high-quality risk statement avoids vague generalizations. Under the official CBDP Risk Register guidance,
          every risk statement must briefly and clearly articulate two distinct components:
        </p>

        {/* The Two Components Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                1. The Risk (What Could Go Wrong)
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clearly states the specific hazard, vulnerability, or uncertain event that might occur. This is the root threat event.
            </p>
            <div className="pt-1">
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Example: Insufficient cash balances
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                2. The Impact (What Could Happen as a Result)
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clearly states the tangible consequence or operational damage to the project, beneficiaries, finances, or legal standing if the risk materializes.
            </p>
            <div className="pt-1">
              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Example: Inability to pay critical suppliers, halting field work
              </span>
            </div>
          </div>
        </div>

        {/* Real Source Document Example Spotlight */}
        <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white p-5 rounded-2xl border border-indigo-100 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Source Document Benchmark Example</span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                Compliant Risk Statement
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
              <span className="bg-indigo-50 text-indigo-900 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                "Risk of insufficient cash balances"
              </span>{' '}
              <span className="text-slate-400 font-semibold">[The Risk]</span>{' '}
              <span className="text-slate-500 font-bold">preventing</span>{' '}
              <span className="bg-rose-50 text-rose-900 font-bold px-1.5 py-0.5 rounded border border-rose-200">
                "an organization from paying its suppliers on time, leading to critical service interruptions."
              </span>{' '}
              <span className="text-slate-400 font-semibold">[The Consequence]</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            Visual emphasis should always make it effortless to identify what might trigger the problem versus how severely it will impact operations.
          </p>
        </div>
      </section>

      {/* TOPIC B: RISK SCORING METHODOLOGY & FORMULA */}
      <section id="guidance-scoring" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 font-bold text-sm">
            B
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
              Risk Scoring: Likelihood, Impact & Approved Formula
            </h2>
            <p className="text-xs text-slate-500">
              Approved CBDP mathematical evaluation: Score = (Likelihood × Impact) + Impact
            </p>
          </div>
        </div>

        {/* Formula Highlight Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-white p-5 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700">
              Official Mathematical Formula
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              Score = (Likelihood × Impact) + Impact
            </div>
            <p className="text-xs text-slate-600">
              Impact is weighted twice: as a multiplier with likelihood, plus an additive term. This ensures that severe consequence risks escalate immediately.
            </p>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-xs text-amber-900 font-semibold shadow-2xs whitespace-nowrap">
            Max Score: (5 × 5) + 5 = 30
          </div>
        </div>

        {/* Structured Scoring Table (from Source Document) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 text-center w-20">Score</th>
                <th className="py-3 px-4 w-1/2">Likelihood (Probability of Occurrence)</th>
                <th className="py-3 px-4 w-1/2">Impact (Severity of Consequence)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 text-center font-bold text-slate-900 font-heading text-sm">1</td>
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-800">Very unlikely</span>
                  <span className="text-slate-400 block text-[11px]">Negligible chance of happening (&lt; 10%)</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-800">Almost none</span>
                  <span className="text-slate-400 block text-[11px]">Negligible disruption; routine absorption</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 text-center font-bold text-slate-900 font-heading text-sm">2</td>
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-800">Quite unlikely</span>
                  <span className="text-slate-400 block text-[11px]">Low probability; improbable in standard cycles</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-800">Some small impact</span>
                  <span className="text-slate-400 block text-[11px]">Minor delays or minimal financial variance</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 text-center font-bold text-slate-900 font-heading text-sm">3</td>
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-800">Possible</span>
                  <span className="text-slate-400 block text-[11px]">Reasonable chance; could occur during the project</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-800">Considerable impact</span>
                  <span className="text-slate-400 block text-[11px]">Noticeable disruption to project deliverables or budget</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 text-center font-bold text-slate-900 font-heading text-sm">4</td>
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-800">Likely</span>
                  <span className="text-slate-400 block text-[11px]">High probability; expected to occur unless intervened</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-800">Serious effects</span>
                  <span className="text-slate-400 block text-[11px]">Major project milestone jeopardy; serious financial impact</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-3 px-4 text-center font-bold text-slate-900 font-heading text-sm">5</td>
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-800">Very likely</span>
                  <span className="text-slate-400 block text-[11px]">Almost certain to happen without immediate controls</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-800">Catastrophic effects</span>
                  <span className="text-slate-400 block text-[11px]">Project termination, legal breach, severe safeguarding failure</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Live Formula Playground */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-indigo-600" />
              Interactive Formula Calculator
            </span>
            <span className="text-[10px] text-slate-500">Test combinations in real-time</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Likelihood (1–5)</label>
              <select
                value={testLikelihood}
                onChange={(e) => setTestLikelihood(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} - {likelihoodLabels[n]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Impact (1–5)</label>
              <select
                value={testImpact}
                onChange={(e) => setTestImpact(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} - {impactLabels[n]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Target Score (Appetite)</label>
              <input
                type="number"
                value={testTarget}
                onChange={(e) => setTestTarget(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold"
              />
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Calculated Output</span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-xl font-black text-slate-900 font-heading">{calcScore}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  calcRating === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  calcRating === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {calcRating}
                </span>
                <span className={`text-[11px] font-bold ${calcVariance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  Var: {calcVariance > 0 ? `+${calcVariance}` : calcVariance}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOPIC C: CURRENT SCORE, TARGET SCORE, AND VARIANCE */}
      <section id="guidance-scores" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm">
            C
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
              Current Score, Target Score (Risk Appetite), and Variance
            </h2>
            <p className="text-xs text-slate-500">
              Understanding baseline risk, target appetite, and the quantitative mitigation gap
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Current Score */}
          <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                Field 9
              </span>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Current Score
              </h3>
              <p className="text-slate-600 leading-relaxed mt-1">
                Represents the <strong>current level of risk</strong> existing right now, taking into account any existing systems, controls, and management safeguards currently in operation.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 font-mono text-[11px]">
              Calculated via: (L × I) + I
            </div>
          </div>

          {/* Target Score */}
          <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
                Field 10
              </span>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Target Score (Risk Appetite)
              </h3>
              <p className="text-slate-600 leading-relaxed mt-1">
                The level of risk the organization <strong>aims to achieve</strong> by proactively reducing likelihood, impact, or both. The source document notes that this is often referred to as <strong>Risk Appetite</strong>.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 text-[11px] font-medium">
              Established by Project Steering Committee
            </div>
          </div>

          {/* Variance */}
          <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                Field 11
              </span>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Variance (Gap to Close)
              </h3>
              <p className="text-slate-600 leading-relaxed mt-1">
                The exact mathematical difference between Current Score and Target Score:
                <br />
                <span className="font-mono font-bold text-slate-800">Variance = Current Score − Target Score</span>.
                A positive variance indicates that further mitigation actions are mandatory to bring the risk into alignment.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 text-[11px] font-medium">
              Identifies active mitigation priority
            </div>
          </div>
        </div>
      </section>

      {/* TOPIC D: RAG RISK RATINGS */}
      <section id="guidance-rag" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold text-sm">
            D
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
              Risk Ratings (RAG Classification Rules)
            </h2>
            <p className="text-xs text-slate-500">
              Three-tiered triage system determining escalation and monitoring frequency
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* High Risk (Red) */}
          <div className="p-5 rounded-2xl border border-rose-200/80 bg-rose-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                High Risk (Red)
              </span>
              <span className="text-xs font-bold text-rose-900 font-mono">Scores ≥ 15</span>
            </div>
            <p className="text-xs text-rose-950 leading-relaxed">
              <strong>Mandatory Protocol:</strong> Immediate executive attention required. Concrete, timebound mitigation plans must be drafted and approved within 48 hours. Active weekly monitoring.
            </p>
            <div className="pt-1 text-[11px] text-rose-700 font-medium">
              Examples: Score 15, 18, 20, 24, 25, 30
            </div>
          </div>

          {/* Medium Risk (Amber) */}
          <div className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-600 text-white shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                Medium Risk (Amber)
              </span>
              <span className="text-xs font-bold text-amber-900 font-mono">Scores 8 to 14</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed">
              <strong>Mandatory Protocol:</strong> Active mitigation required. Risk Owner must specify controls to lower likelihood or impact down to the agreed risk appetite target. Monthly progress review.
            </p>
            <div className="pt-1 text-[11px] text-amber-700 font-medium">
              Examples: Score 8, 9, 10, 12
            </div>
          </div>

          {/* Low Risk (Green) */}
          <div className="p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                Low Risk (Green)
              </span>
              <span className="text-xs font-bold text-emerald-900 font-mono">Scores below 8</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed">
              <strong>Mandatory Protocol:</strong> Routine review and management monitoring. Accepted within normal operational appetite. Standard quarterly review to verify controls remain functional.
            </p>
            <div className="pt-1 text-[11px] text-emerald-700 font-medium">
              Examples: Score 2, 3, 4, 5, 6
            </div>
          </div>
        </div>
      </section>

      {/* TOPIC E: RISK ASSESSMENT HEAT MAP (5x5 MATRIX) */}
      <section id="guidance-heatmap" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm">
            E
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
              Risk Assessment Heat Map (5×5 Likelihood × Impact Matrix)
            </h2>
            <p className="text-xs text-slate-500">
              Visual risk distribution calibrated strictly to the approved CBDP scoring methodology
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          The 5×5 matrix plots <strong>Likelihood</strong> on the vertical axis (from 5 down to 1) against <strong>Impact</strong> on the horizontal axis (from 1 up to 5).
          Every cell displays the mathematical result of <span className="font-mono font-bold text-slate-800">Score = (Likelihood × Impact) + Impact</span> and its corresponding RAG rating:
        </p>

        {/* 5x5 Matrix Layout */}
        <div className="overflow-x-auto">
          <div className="min-w-[620px] p-2 bg-slate-50/50 rounded-2xl border border-slate-200/80">
            {/* Top Impact Axis Label */}
            <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-700 py-1">
              Impact (Severity of Consequence) →
            </div>

            {/* Header Columns */}
            <div className="grid grid-cols-6 gap-2 text-center text-xs font-bold text-slate-600 mb-2">
              <div className="flex items-center justify-center text-[11px] text-slate-400">
                Likelihood ↓
              </div>
              {impactCols.map(col => (
                <div key={col.value} className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-slate-900 font-black font-heading">{col.value}</div>
                  <div className="text-[10px] text-slate-500 truncate" title={col.label}>{col.label.split(' - ')[1]}</div>
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            <div className="space-y-2">
              {likelihoodRows.map(row => (
                <div key={row.value} className="grid grid-cols-6 gap-2">
                  {/* Y-axis Label */}
                  <div className="flex flex-col justify-center px-2 py-1.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-xs">
                    <span className="font-black text-slate-900 font-heading">{row.value}</span>
                    <span className="text-[10px] text-slate-500 truncate" title={row.label}>{row.label.split(' - ')[1]}</span>
                  </div>

                  {/* 5 Impact Cells */}
                  {impactCols.map(col => {
                    const score = (row.value * col.value) + col.value;
                    const colorClass = getHeatmapColor(score);

                    return (
                      <div
                        key={col.value}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-between transition-all shadow-2xs ${colorClass}`}
                      >
                        <div className="w-full flex items-center justify-between text-[11px] font-bold">
                          <span className="opacity-60 text-[10px]">Score</span>
                          <span className="text-sm sm:text-base font-black font-heading">{score}</span>
                        </div>
                        <div className="mt-1">
                          {getHeatmapBadge(score)}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono mt-1">
                          ({row.value}×{col.value})+{col.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How to Interpret the Heat Map */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <span className="font-bold text-slate-800 block">How to Interpret Risk Movement:</span>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li><strong>Initial Position:</strong> New risks typically enter in the upper right or middle zones (Amber or Red).</li>
            <li><strong>Mitigating Likelihood:</strong> Successful preventive controls move the risk downward on the vertical axis (e.g. from row 4 to row 2).</li>
            <li><strong>Mitigating Impact:</strong> Successful contingency plans or supplier negotiation move the risk leftward on the horizontal axis (e.g. from col 4 to col 2).</li>
            <li><strong>Final Goal:</strong> Migration toward the bottom-left green zone (Low Risk, Scores &lt; 8).</li>
          </ul>
        </div>
      </section>

      {/* TOPIC F: MITIGATION PLANS (WEAK VS EFFECTIVE EXAMPLES) */}
      <section id="guidance-mitigation" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold text-sm">
            F
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
              Mitigation Plans: Effective vs. Weak Actions
            </h2>
            <p className="text-xs text-slate-500">
              Prohibiting open-ended phrases and requiring concrete, timebound deliverables
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          The source guidance strictly establishes that open-ended statements using words such as <strong>“ongoing”</strong> or <strong>“continuous review”</strong> are 
          <span className="text-rose-600 font-bold"> NOT acceptable</span> as mitigation actions. A valid mitigation plan must represent a specific, verifiable intervention.
        </p>

        {/* Comparison: Weak vs Effective */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weak Example Card */}
          <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/30 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Weak / Unacceptable Action (From Source)</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs font-mono text-rose-900 font-bold">
              “Ongoing monitoring of cash in bank.”
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <span className="font-bold text-rose-900 block">Why this is insufficient:</span>
              <ul className="list-disc list-inside space-y-1">
                <li>Has <strong>no defined completion point</strong> or deliverable.</li>
                <li>Merely describes standard day-to-day work rather than a mitigation action.</li>
                <li>Provides no mechanism to measure whether risk likelihood or impact was reduced.</li>
              </ul>
            </div>
          </div>

          {/* Effective Examples Card */}
          <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Effective / Compliant Actions (From Source)</span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-xs text-slate-800">
                <span className="font-bold text-emerald-800 block">1. Action to reduce Likelihood:</span>
                <span className="font-semibold text-slate-900">“Establish a system for weekly cash balance checks.”</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Introduces an automated weekly reporting routine to catch cash shortfalls early.</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-xs text-slate-800">
                <span className="font-bold text-emerald-800 block">2. Action to reduce Impact:</span>
                <span className="font-semibold text-slate-900">“Negotiate longer payment terms with suppliers.”</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Increases working capital buffer, minimizing operational disruption if cash tightens.</span>
              </div>
            </div>
          </div>
        </div>

        {/* The Two Mandatory Criteria */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
          <span className="font-bold text-slate-900 block">
            Every Approved Mitigation Action MUST Have:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">1. Clearly Identified Person / Role Responsible:</strong>
                <span className="text-slate-500">A designated owner accountable for executing the action.</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">2. Defined Completion Deadline:</strong>
                <span className="text-slate-500">A specific calendar due date (e.g. 15 Nov 2026), never "ongoing".</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOPIC G: RESPONSIBLE PEOPLE & ACCOUNTABILITY */}
      <section id="guidance-people" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-bold text-sm">
            G
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
              Responsible People & Accountability Standards
            </h2>
            <p className="text-xs text-slate-500">
              Institutional continuity through job-title assignment over personal names
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Best Practice Recommendation */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-900">Job Titles Preferred Over Personal Names</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              The source guidance explicitly recommends recording <strong>job titles</strong> (e.g. <em>Project Manager</em>, <em>Finance Director</em>, <em>HR Logistics Officer</em>) rather than individual names.
            </p>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-700 font-medium text-[11px]">
              Why: Personal names rapidly become outdated when employees change roles, depart, or take leave. Job titles ensure the responsibility remains tied to the official organizational mandate.
            </div>
          </div>

          {/* Accountability Mechanism */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-slate-900">Single-Point Accountability</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Assigning a specific responsible role eliminates ambiguity. When a risk or mitigation action is owned by "Everyone" or an entire committee, accountability is diffused and progress is frequently delayed.
            </p>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-700 font-medium text-[11px]">
              Result: The Risk Owner is directly responsible for reporting status updates during quarterly governance reviews.
            </div>
          </div>
        </div>

        {/* Back to Risk Register CTA Footer */}
        {onSwitchToRegister && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={onSwitchToRegister}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <span>Return to Risk Register Table</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
