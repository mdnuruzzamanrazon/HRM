const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('cbdp_event_tracker.xlsx');
const sheet = workbook.Sheets['Data entry sheet'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

const headers = rows[5]; // Row 6
console.log('Headers count:', headers.length);

const records = [];
for (let i = 6; i < rows.length; i++) {
  const r = rows[i];
  if (r.some(cell => String(cell).trim() !== '')) {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.replace(/\r?\n/g, ' ').trim()] = r[idx];
    });
    records.push(obj);
  }
}

console.log('Total non-empty records:', records.length);
fs.writeFileSync('spreadsheet_data_entry_records.json', JSON.stringify(records, null, 2), 'utf-8');
console.log('Wrote to spreadsheet_data_entry_records.json');
