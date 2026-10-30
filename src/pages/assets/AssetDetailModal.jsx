import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import api from '../../services/api';
import {
  X,
  Printer,
  Calendar,
  DollarSign,
  ShieldAlert,
  MapPin,
  User,
  Clock,
  Sparkles,
  QrCode,
  Tag,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  ArrowRightLeft,
  Loader2
} from 'lucide-react';

export default function AssetDetailModal({ asset, isOpen, onClose, onEdit, onAllocate, onPrintSingle }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (asset && isOpen) {
      const qrContent = asset.qrText || `${asset.assetId}|Name:${asset.name}|Location:${asset.location}|Custodian:${asset.custodian}`;
      QRCode.toDataURL(qrContent, {
        width: 200,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));

      const targetKey = asset._id || asset.assetId;
      if (targetKey) {
        setHistoryLoading(true);
        api
          .get(`/assets/${targetKey}/assignments`)
          .then((res) => {
            if (res.data?.success) {
              setAssignmentHistory(res.data.data?.history || []);
            }
          })
          .catch(() => setAssignmentHistory([]))
          .finally(() => setHistoryLoading(false));
      }
    } else {
      setAssignmentHistory([]);
    }
  }, [asset, isOpen]);

  if (!isOpen || !asset) return null;

  const handleCopyQrText = () => {
    const qrContent = asset.qrText || `${asset.assetId}|Name:${asset.name}|Location:${asset.location}|Custodian:${asset.custodian}`;
    navigator.clipboard.writeText(qrContent);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
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

  const isAuditOverdue = asset.nextAuditDue && new Date(asset.nextAuditDue) < new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-white/10 text-indigo-200 font-semibold">
                  {asset.assetId}
                </span>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadge(asset.status)}`}>
                  {asset.status || 'Active'}
                </span>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getRiskBadge(asset.riskFlag)}`}>
                  {asset.riskFlag || 'Low'} Risk
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{asset.name}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Top Row: QR Label Card & Quick Financial Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* QR Label Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col items-center text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Physical QR Asset Tag
              </span>
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={`QR Code for ${asset.assetId}`} className="w-36 h-36" />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR...
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-slate-600 font-mono break-all line-clamp-2">
                {asset.qrText || `${asset.assetId} | CBDP`}
              </div>
              <div className="mt-3 flex gap-2 w-full">
                <button
                  type="button"
                  onClick={handleCopyQrText}
                  className="flex-1 py-1.5 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                >
                  {copySuccess ? 'Copied!' : 'Copy Text'}
                </button>
                <button
                  type="button"
                  onClick={() => onPrintSingle && onPrintSingle(asset)}
                  className="flex-1 py-1.5 px-3 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Label
                </button>
              </div>
            </div>

            {/* Financial Details Card */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white border border-slate-200 rounded-xl p-5">
              <div className="col-span-2 sm:col-span-3 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Financial & Depreciation Schedule
                </span>
                <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                  Straight-Line Model
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Purchase Cost</span>
                <span className="text-base font-bold text-slate-800">
                  {Number(asset.purchaseCost || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">BDT</span>
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Current Book Value</span>
                <span className="text-base font-bold text-emerald-600">
                  {Number(asset.currentBookValue || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">BDT</span>
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Annual Depreciation</span>
                <span className="text-base font-bold text-slate-700">
                  {Number(asset.annualDepreciation || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">BDT</span>
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Purchase Date</span>
                <span className="text-sm font-semibold text-slate-700">
                  {asset.purchaseDate || 'Not Recorded'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Useful Life</span>
                <span className="text-sm font-semibold text-slate-700">
                  {asset.usefulLifeYears || 5} Years
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Depreciation Progress</span>
                <div className="mt-1 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round(((Number(asset.purchaseCost || 1) - Number(asset.currentBookValue || 0)) / Number(asset.purchaseCost || 1)) * 100))}%`
                    }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Operational & Custody Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/70 border border-slate-200/80 rounded-xl p-5">
            <div>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Category
              </span>
              <span className="text-sm font-semibold text-slate-800 block mt-0.5">
                {asset.category || 'General'}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <FolderGit2 className="w-3.5 h-3.5" /> Project / Donor
              </span>
              <span className="text-sm font-semibold text-slate-800 block mt-0.5">
                {asset.projectDonor || 'Core'}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Location
              </span>
              <span className="text-sm font-semibold text-slate-800 block mt-0.5">
                {asset.location || 'Head Office'}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Custodian
              </span>
              <span className="text-sm font-semibold text-slate-800 block mt-0.5">
                {asset.custodian || 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Audit & Compliance Card */}
          <div className="border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Audit Status & Verification
              </span>
              {isAuditOverdue && (
                <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                  <AlertTriangle className="w-3.5 h-3.5" /> Next Audit Overdue
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-slate-400 block">Condition</span>
                <span className="text-sm font-semibold text-slate-800">
                  {asset.condition || 'Good'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Audit Result</span>
                <span className="text-sm font-semibold text-emerald-700">
                  {asset.auditResult || 'Verified'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Last Audit Date</span>
                <span className="text-sm font-semibold text-slate-700">
                  {asset.lastAuditDate || 'Not Audited'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Next Audit Due</span>
                <span className={`text-sm font-bold ${isAuditOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                  {asset.nextAuditDue || 'Not Scheduled'}
                </span>
              </div>
            </div>

            {asset.remarks && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                <span className="font-semibold text-slate-700">Audit Remarks: </span>
                {asset.remarks}
              </div>
            )}
          </div>

          {/* Physical Tagging Specs */}
          <div className="grid grid-cols-3 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
            <div>
              <span className="text-slate-400 block">Tag Location:</span>
              <span className="font-semibold text-slate-800">{asset.physicalTagLocation || 'Top cover'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Label Dimensions:</span>
              <span className="font-semibold text-slate-800">{asset.qrLabelSize || '50mm x 30mm'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Print Status:</span>
              <span className="font-semibold text-indigo-700">{asset.qrPrintStatus || 'Ready'}</span>
            </div>
          </div>

          {/* Project & Custody Movement History */}
          <div className="border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Project Allocation &amp; Custody Movement Ledger
                </span>
              </div>
              {asset.currentAssignment?.projectName ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Active Project: {asset.currentAssignment.projectCode || asset.currentAssignment.projectName}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                  Master Inventory / Head Office
                </span>
              )}
            </div>

            {historyLoading ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Loading custody movement history...</span>
              </div>
            ) : assignmentHistory.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                No project or custodian movement history recorded yet. This asset remains in the central master register.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {assignmentHistory.map((item) => (
                  <div
                    key={item._id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'TRANSFERRED'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-200/70 text-slate-600'
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="font-bold text-slate-800">
                          {item.projectCode ? `${item.projectCode} — ` : ''}
                          {item.projectName || item.department || item.assignmentType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Location: <strong>{item.location || 'N/A'}</strong> &bull; Custodian:{' '}
                        <strong>{item.custodianName || 'Unassigned'}</strong>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono shrink-0">
                      {item.assignedDate ? String(item.assignedDate).slice(0, 10) : ''}
                      {item.returnedDate ? ` → ${String(item.returnedDate).slice(0, 10)}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
          >
            Close
          </button>
          <div className="flex items-center gap-3">
            {onAllocate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAllocate(asset);
                }}
                className="px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition flex items-center gap-1.5"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Allocate / Transfer
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onEdit) onEdit(asset);
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
            >
              Edit Asset Profile
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
