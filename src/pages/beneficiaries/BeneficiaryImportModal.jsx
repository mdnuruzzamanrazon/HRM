import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  ArrowRight,
  Database
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function BeneficiaryImportModal({
  isOpen,
  onClose,
  onImportConfirm,
  activeForum = 'Upazilla Nagoric Forum',
  isImporting = false,
}) {
  const [file, setFile] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [workbook, setWorkbook] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [targetForum, setTargetForum] = useState(activeForum && activeForum !== 'ALL' ? activeForum : 'Upazilla Nagoric Forum');
  const [overwriteDuplicates, setOverwriteDuplicates] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setErrorMsg('');
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        if (wb.SheetNames.length > 0) {
          setSelectedSheet(wb.SheetNames[0]);
          parseSheet(wb, wb.SheetNames[0]);
        }
      } catch (err) {
        console.error('Failed to parse workbook:', err);
        setErrorMsg('Failed to read spreadsheet file. Please verify it is a valid Excel or CSV file.');
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const parseSheet = (wb, sheetName) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    // Convert to 2D array
    const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (rawData.length === 0) {
      setErrorMsg('Selected sheet appears to be empty.');
      setParsedRows([]);
      setPreviewRows([]);
      return;
    }

    // Find header row (either row with 'Sl No.' or 'Name' or row 0)
    let headerRowIdx = 0;
    for (let r = 0; r < Math.min(10, rawData.length); r++) {
      const row = rawData[r];
      if (
        row &&
        row.some(
          (c) =>
            typeof c === 'string' &&
            (c.toLowerCase().includes('name') ||
              c.toLowerCase().includes('sl no') ||
              c.toLowerCase().includes('district'))
        )
      ) {
        headerRowIdx = r;
        break;
      }
    }

    const headers = rawData[headerRowIdx];
    const records = [];

    for (let r = headerRowIdx + 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (row && row.some((c) => c !== undefined && c !== null && String(c).trim() !== '')) {
        const record = {};
        headers.forEach((h, idx) => {
          const colName = h ? String(h).trim().replace(/\r?\n/g, ' ') : `Col_${idx}`;
          record[colName] = row[idx] !== undefined ? row[idx] : '';
        });
        records.push(record);
      }
    }

    setParsedRows(records);
    setPreviewRows(records.slice(0, 5));
  };

  const handleSheetChange = (e) => {
    const sName = e.target.value;
    setSelectedSheet(sName);
    if (workbook) {
      parseSheet(workbook, sName);
    }
  };

  const handleConfirm = () => {
    if (parsedRows.length === 0) {
      setErrorMsg('No valid beneficiary records found to import.');
      return;
    }

    onImportConfirm({
      records: parsedRows,
      forumName: targetForum,
      overwriteDuplicates,
    });
  };

  const forumOptions = [
    'Upazilla Nagoric Forum',
    'Amtoli Sadar Union Nagoric Forum',
    'Arpangasia Union Nagoric Forum',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Import Beneficiary Spreadsheet</h3>
              <p className="text-xs text-emerald-200/80">
                Official Google Sheets (.xlsx / .csv) batch importer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/70 hover:bg-indigo-50/20 transition-all flex flex-col items-center justify-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {file ? file.name : 'Click or drag Excel / CSV file here'}
            </p>
            <p className="text-slate-500 text-[11px] mt-1">
              Supports .xlsx, .xls, and .csv exports from official CBDP Google Sheets
            </p>
          </div>

          {/* Options after file is loaded */}
          {sheetNames.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Worksheet Tab
                </label>
                <select
                  value={selectedSheet}
                  onChange={handleSheetChange}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  {sheetNames.map((sn) => (
                    <option key={sn} value={sn}>
                      {sn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Project Forum
                </label>
                <select
                  value={targetForum}
                  onChange={(e) => setTargetForum(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  {forumOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 pt-2 border-t border-slate-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="overwriteDuplicates"
                  checked={overwriteDuplicates}
                  onChange={(e) => setOverwriteDuplicates(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="overwriteDuplicates" className="text-slate-700 cursor-pointer">
                  Update/overwrite existing beneficiary records if contact number already exists
                </label>
              </div>
            </div>
          )}

          {/* Records Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Preview Detected Records ({parsedRows.length} total rows)
                </span>
                <span className="text-[11px] text-slate-400">Showing first {previewRows.length}</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-52 bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Sex</th>
                      <th className="px-3 py-2">Contact</th>
                      <th className="px-3 py-2">Occupation</th>
                      <th className="px-3 py-2">Union</th>
                      <th className="px-3 py-2">Village</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 font-medium text-slate-900">
                          {row['Name of the Beneficiary/Group Member '] || row.name || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-600">
                          {row['Sex (Female/Male/Transgender)'] || row.sex || '—'}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-slate-600">
                          {row['Contact Number (Self)'] || row.contactNo || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-600">
                          {row.Occupation || row.occupation || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-600">
                          {row['Union '] || row.union || '—'}
                        </td>
                        <td className="px-3 py-1.5 text-slate-600">
                          {row['Village/Institution'] || row.village || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {parsedRows.length > 0 ? `${parsedRows.length} records ready for import` : 'No file selected'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isImporting || parsedRows.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Confirm Import ({parsedRows.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
