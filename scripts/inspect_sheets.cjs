const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('cbdp_event_tracker.xlsx');

console.log('Sheet Names:', workbook.SheetNames);

const report = {
  sheetNames: workbook.SheetNames,
  sheets: {}
};

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  // Find header row and non-empty rows
  report.sheets[sheetName] = {
    ref: sheet['!ref'],
    totalRows: range.e.r - range.s.r + 1,
    totalCols: range.e.c - range.s.c + 1,
    first10Rows: rows.slice(0, 10),
    sampleDataRows: rows.slice(1, 15).filter(r => r.some(cell => String(cell).trim() !== ''))
  };
});

fs.writeFileSync('spreadsheet_inspection.json', JSON.stringify(report, null, 2), 'utf-8');
console.log('Saved inspection report to spreadsheet_inspection.json');
