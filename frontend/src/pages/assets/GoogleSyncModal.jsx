import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, FileSpreadsheet, ExternalLink, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export default function GoogleSyncModal({ isOpen, onClose, onSyncComplete }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(null);

  if (!isOpen) return null;

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncError(null);
      const res = await api.post('/assets/sync-google-sheet');
      if (res.data?.success) {
        setSyncResult(res.data.summary);
        if (onSyncComplete) onSyncComplete();
      } else {
        setSyncError(res.data?.message || 'Sync failed');
      }
    } catch (err) {
      setSyncError(err.response?.data?.message || err.message || 'Error communicating with server');
    } finally {
      setIsSyncing(false);
    }
  };

  const sheets = [
    { gid: '1754930862', name: 'CBDP Asset Management Dashboard', type: 'KPIs & Summaries' },
    { gid: '1517243350', name: 'Asset Audit Tracker', type: 'Master Register (30 Assets)' },
    { gid: '861206349', name: 'QR Asset System', type: 'Tag Labels & Formats' },
    { gid: '1726563914', name: 'Field Kit & Inventory Tracking', type: 'Kit Stocks' },
    { gid: '1510015205', name: 'Stationery & Consumables Handover', type: 'Supplies' },
    { gid: '1933684115', name: 'Vehicle Logbook & Fuel Tracker', type: 'Fleet Logbook' },
    { gid: '2011906547', name: 'Asset Handover / Return Form', type: 'Custody Deeds' },
    { gid: '1017327203', name: 'Procurement & Disposal Workflow', type: 'Lifecycle Pipeline' },
    { gid: '671339665', name: 'Validation Lists & Reference Data', type: 'Master Dropdowns' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Google Sheets Live Data Synchronization</h2>
              <p className="text-xs text-slate-400">Sync all 9 worksheets directly into persistent database</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Source Info */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs font-semibold text-slate-700 block">Verified Source Spreadsheet:</span>
              <span className="text-xs font-mono text-slate-500">ID: 11ucgtB03mb7Pm3fJOREwhCDrlhYb8o2c</span>
            </div>
            <a
              href="https://docs.google.com/spreadsheets/d/11ucgtB03mb7Pm3fJOREwhCDrlhYb8o2c/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Open in Sheets <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Sync Result or Error */}
          {syncResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Synchronization Completed Successfully!
              </div>
              <p>Rows Processed: <strong>{syncResult.totalRowsProcessed}</strong></p>
              <p>New Assets Imported: <strong>{syncResult.newAssetsImported}</strong></p>
              <p>Existing Assets Updated: <strong>{syncResult.existingAssetsUpdated}</strong></p>
              <p className="text-slate-500 text-[11px] pt-1">Timestamp: {new Date(syncResult.timestamp).toLocaleString()}</p>
            </div>
          )}

          {syncError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <p className="font-bold">Sync Error:</p>
              <p>{syncError}</p>
            </div>
          )}

          {/* 9 Worksheets checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Worksheet Ingestion Channels (9 of 9 Available)
            </h4>
            <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              {sheets.map((s, idx) => (
                <div key={s.gid} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-slate-400 font-mono text-[10px]">{idx + 1}.</span>
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    <span className="text-[10px] text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded font-mono">
                      GID: {s.gid}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {s.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-500 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <span>
              Safe merge protection: Existing records in MongoDB are updated without overwriting audit notes, ensuring full referential integrity and audit compliance.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing Spreadsheets...' : 'Run Live Synchronization'}
          </button>
        </div>

      </div>
    </div>
  );
}
