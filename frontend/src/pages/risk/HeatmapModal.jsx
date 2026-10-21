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
        bg: 'bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-rose-950',
        badge: 'bg-rose-600 text-white',
        border: 'border-rose-200',
        label: 'HIGH'
      };
    }
    if (score >= 8) {
      return {
        bg: 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-950',
        badge: 'bg-amber-600 text-white',
        border: 'border-amber-200',
        label: 'MED'
      };
    }
    return {
      bg: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950',
      badge: 'bg-emerald-600 text-white',
      border: 'border-emerald-200',
      label: 'LOW'
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200/80 bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                5×5 Risk Assessment Heat Matrix
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                Formula: Score = (Likelihood × Impact) + Impact
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Legend Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3 sm:p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-900">High Risk (Red): </span>
                <span className="text-slate-600 font-medium">15 or over</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-900">Medium Risk (Amber): </span>
                <span className="text-slate-600 font-medium">8 to 14</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-900">Low Risk (Green): </span>
                <span className="text-slate-600 font-medium">Below 8</span>
              </div>
            </div>
          </div>

          {/* Interactive Matrix */}
          <div className="overflow-x-auto touch-pan-x">
            {/* Mobile swipe hint */}
            <div className="sm:hidden text-[11px] text-slate-400 pb-1.5 flex items-center gap-1 font-medium">
              <span>Swipe horizontally to view full matrix →</span>
            </div>
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
                  <div key={col.value} className="p-2 bg-slate-100/70 rounded-lg border border-slate-200/80">
                    <div className="text-slate-900 font-bold">{col.value}</div>
                    <div className="text-[10px] text-slate-500 truncate">{col.label.split(' - ')[1]}</div>
                  </div>
                ))}
              </div>

              {/* Matrix Rows */}
              <div className="space-y-2">
                {likelihoodRows.map(row => (
                  <div key={row.value} className="grid grid-cols-6 gap-2">
                    {/* Y-axis Label */}
                    <div className="flex flex-col justify-center px-2 py-1 bg-slate-100/70 rounded-lg border border-slate-200/80 text-xs">
                      <span className="font-bold text-slate-900">{row.value}</span>
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
                          className={`relative p-3 rounded-xl border flex flex-col items-center justify-between transition-all duration-150 cursor-pointer shadow-2xs ${theme.bg} ${theme.border}`}
                          title={`Likelihood ${row.value} × Impact ${col.value} = Score ${score} (${theme.label})`}
                        >
                          <div className="w-full flex items-center justify-between text-[11px] font-bold">
                            <span className="opacity-60 text-[10px]">Score</span>
                            <span className="text-sm font-black font-heading">{score}</span>
                          </div>

                          <div className="my-1">
                            {count > 0 ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold shadow-xs ${theme.badge}`}>
                                {count} {count === 1 ? 'risk' : 'risks'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">—</span>
                            )}
                          </div>

                          <span className="text-[9px] font-bold tracking-widest uppercase opacity-70">
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

          <div className="flex items-start gap-2.5 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-950">
            <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p>
              Click any cell in the matrix to immediately filter the Risk Register table to risks matching that exact Likelihood and Impact combination.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200/80 bg-slate-50/70">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer text-center"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
