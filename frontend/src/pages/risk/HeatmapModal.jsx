import React from 'react';
import { X, Info, Flame, AlertCircle } from 'lucide-react';

export default function HeatmapModal({ isOpen, onClose, heatmapData, onSelectCell }) {
  if (!isOpen) return null;

  // Likelihood: 5 down to 1
  const likelihoodRows = [
    { value: 5, label: '5 - Very likely' },
    { value: 4, label: '4 - Likely' },
    { value: 3, label: '3 - Possible' },
    { value: 2, label: '2 - Quite unlikely' },
    { value: 1, label: '1 - Very unlikely' }
  ];

  // Impact: 1 up to 5
  const impactCols = [
    { value: 1, label: '1 - Almost none' },
    { value: 2, label: '2 - Some small' },
    { value: 3, label: '3 - Considerable' },
    { value: 4, label: '4 - Serious' },
    { value: 5, label: '5 - Catastrophic' }
  ];

  const getCellScore = (l, i) => (l * i) + i;

  const getCellTheme = (score) => {
    if (score >= 15) {
      return {
        bg: 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-300 text-rose-950',
        badge: 'bg-rose-600 text-white',
        border: 'border-rose-400',
        label: 'HIGH'
      };
    }
    if (score >= 8) {
      return {
        bg: 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-300 text-amber-950',
        badge: 'bg-amber-600 text-white',
        border: 'border-amber-400',
        label: 'MED'
      };
    }
    return {
      bg: 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-300 text-emerald-950',
      badge: 'bg-emerald-600 text-white',
      border: 'border-emerald-400',
      label: 'LOW'
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 rounded-xl border border-indigo-400/30">
              <Flame className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                CBDP 5×5 Risk Assessment Heat Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Formula: Score = (Likelihood × Impact) + Impact
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Legend Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-600 shadow-xs flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-900">High Risk (Red): </span>
                <span className="text-slate-600 font-semibold">15 or over</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-xs flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-900">Medium Risk (Amber): </span>
                <span className="text-slate-600 font-semibold">8 to 14</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-xs flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-900">Low Risk (Green): </span>
                <span className="text-slate-600 font-semibold">Below 8</span>
              </div>
            </div>
          </div>

          {/* Interactive Matrix */}
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              {/* Top Impact Axis Label */}
              <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                Impact → (Consequence severity)
              </div>

              {/* Grid Header (Impact columns) */}
              <div className="grid grid-cols-6 gap-2 text-center text-xs font-bold text-slate-600 mb-2">
                <div className="flex items-center justify-center text-[11px] text-slate-400">
                  Likelihood ↓
                </div>
                {impactCols.map(col => (
                  <div key={col.value} className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                    <div className="text-slate-900 font-extrabold">{col.value}</div>
                    <div className="text-[10px] text-slate-500 truncate">{col.label.split(' - ')[1]}</div>
                  </div>
                ))}
              </div>

              {/* Matrix Rows */}
              <div className="space-y-2">
                {likelihoodRows.map(row => (
                  <div key={row.value} className="grid grid-cols-6 gap-2">
                    {/* Y-axis Label */}
                    <div className="flex flex-col justify-center px-2 py-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                      <span className="font-extrabold text-slate-900">{row.value}</span>
                      <span className="text-[10px] text-slate-500 truncate">{row.label.split(' - ')[1]}</span>
                    </div>

                    {/* 5 Impact Cells for this likelihood */}
                    {impactCols.map(col => {
                      const score = getCellScore(row.value, col.value);
                      const theme = getCellTheme(score);
                      const count = heatmapData?.[row.value]?.[col.value] || 0;

                      return (
                        <button
                          key={col.value}
                          type="button"
                          onClick={() => {
                            if (onSelectCell) {
                              onSelectCell(row.value, col.value);
                              onClose();
                            }
                          }}
                          className={`relative p-3 rounded-xl border flex flex-col items-center justify-between transition-all duration-150 cursor-pointer ${theme.bg} ${theme.border}`}
                          title={`Likelihood ${row.value} × Impact ${col.value} = Score ${score} (${theme.label})`}
                        >
                          <div className="w-full flex items-center justify-between text-[11px] font-black">
                            <span className="opacity-70 text-[10px]">Score</span>
                            <span className="text-sm font-black">{score}</span>
                          </div>

                          <div className="my-1">
                            {count > 0 ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black shadow-xs ${theme.badge}`}>
                                {count} {count === 1 ? 'risk' : 'risks'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">—</span>
                            )}
                          </div>

                          <span className="text-[9px] font-bold tracking-widest uppercase opacity-75">
                            {theme.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900">
            <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p>
              Click any cell in the matrix to immediately filter the Risk Register table to risks matching that exact Likelihood and Impact combination.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
