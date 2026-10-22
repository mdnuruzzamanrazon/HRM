const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('cbdp_event_tracker.xlsx');

const output = {};

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  output[sheetName] = rows;
});

// Let's print out summary of each metadata sheet
console.log('Sheet Names:', Object.keys(output));

['Data level', 'meta-data-consortium-partner', 'meta_data-areas', 'meta-data-area-context', 'Instraction'].forEach(name => {
  if (output[name]) {
    fs.writeFileSync(`sheet_${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`, JSON.stringify(output[name], null, 2));
    console.log(`Wrote sheet_${name} (${output[name].length} rows)`);
  }
});

// Also print the exact columns of "Data entry sheet"
const headerRow = output['Data entry sheet'][5]; // Row 6 (0-indexed 5)
console.log('\nData Entry Sheet Columns (Count: ' + headerRow.length + '):');
headerRow.forEach((h, idx) => {
  console.log(`[Col ${idx + 1}] ${h.replace(/\r?\n/g, ' ')}`);
});
