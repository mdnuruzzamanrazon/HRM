const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('cbdp_event_tracker.xlsx');

let output = '';

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  output += `\n=======================================================\n`;
  output += `SHEET: [${sheetName}]\n`;
  output += `Total Rows: ${rows.length}\n`;
  output += `=======================================================\n`;
  
  // Print non-empty rows up to 40
  let count = 0;
  for (let i = 0; i < rows.length && count < 40; i++) {
    const row = rows[i];
    if (row.some(c => String(c).trim() !== '')) {
      output += `Row ${i + 1}: ${JSON.stringify(row)}\n`;
      count++;
    }
  }
});

fs.writeFileSync('detailed_sheet_analysis.txt', output, 'utf-8');
console.log('Detailed sheet analysis written to detailed_sheet_analysis.txt');
