import fs from 'fs';

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  function parseLine(line) {
    const res = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i+1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === ',' && !inQ) {
        res.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    res.push(cur.trim());
    return res;
  }
  return lines.map(parseLine);
}

const raw = fs.readFileSync('scripts/sheets_data/sheet_1517243350.csv', 'utf8');
const rows = parseCSV(raw);
const headers = rows[0];

console.log('--- ALL 30 ASSETS IN SHEET 1517243350 ---');
const assets = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r[0] || r[0].trim() === '' || r[0].startsWith('Total')) continue;
  const obj = {};
  headers.forEach((h, idx) => {
    obj[h || `Col_${idx}`] = r[idx] || '';
  });
  assets.push(obj);
}

console.log(`Parsed ${assets.length} assets.`);
assets.forEach((a, idx) => {
  console.log(`[${idx+1}] ID: ${a['Asset ID']} | Name: ${a['Asset Name']} | Cat: ${a['Category']} | Loc: ${a['p']} | Cust: ${a['Custodian']} | Cost: ${a['Purchase Cost']} | BookVal: ${a['Current Book Value']} | Status: ${a['Status']} | Risk: ${a['Risk Flag']}`);
});
