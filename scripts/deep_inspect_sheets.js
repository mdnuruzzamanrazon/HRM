import fs from 'fs';
import path from 'path';

const outputDir = path.resolve('./scripts/sheets_data');
const gids = [
  '1754930862',
  '1517243350',
  '861206349',
  '1726563914',
  '1510015205',
  '1933684115',
  '2011906547',
  '1017327203',
  '671339665'
];

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

for (const gid of gids) {
  const file = path.join(outputDir, `sheet_${gid}.csv`);
  if (!fs.existsSync(file)) continue;
  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  console.log(`\n======================================================`);
  console.log(`SHEET GID: ${gid} (Total non-empty lines: ${lines.length})`);
  console.log(`======================================================`);
  
  const parsedLines = lines.map(parseCSVLine);
  
  // Show header and non-empty rows
  if (gid === '1754930862' || gid === '2011906547') {
    // Show first 15 lines as table
    parsedLines.slice(0, 15).forEach((row, idx) => {
      console.log(`Line ${idx}: ${JSON.stringify(row.filter(c => c !== ''))}`);
    });
  } else {
    const headers = parsedLines[0];
    console.log('Headers (' + headers.length + ' columns):');
    headers.forEach((h, idx) => console.log(`  [col ${idx}]: "${h}"`));
    
    const validRows = parsedLines.slice(1).filter(r => r.some(cell => cell.trim() !== ''));
    console.log(`Valid data rows count: ${validRows.length}`);
    console.log('Sample Row 1:');
    if (validRows.length > 0) {
      headers.forEach((h, idx) => {
        if (h || validRows[0][idx]) {
          console.log(`    ${h || 'Col_' + idx}: ${validRows[0][idx]}`);
        }
      });
    }
    if (validRows.length > 1) {
      console.log('Sample Row 2:');
      headers.forEach((h, idx) => {
        if (h || validRows[1][idx]) {
          console.log(`    ${h || 'Col_' + idx}: ${validRows[1][idx]}`);
        }
      });
    }
  }
}
