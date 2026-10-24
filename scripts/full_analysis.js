import fs from 'fs';
import path from 'path';

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  
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

  const allParsed = lines.map(parseLine);
  return allParsed;
}

const gids = [
  { gid: '1754930862', name: 'Dashboard' },
  { gid: '1517243350', name: 'Asset Audit Tracker' },
  { gid: '861206349', name: 'QR Asset System' },
  { gid: '1726563914', name: 'Field Kit & Inventory Tracking' },
  { gid: '1510015205', name: 'Stationery & Consumables Handover' },
  { gid: '1933684115', name: 'Vehicle Logbook & Fuel Tracker' },
  { gid: '2011906547', name: 'Asset Handover / Return Form' },
  { gid: '1017327203', name: 'Procurement & Disposal Workflow' },
  { gid: '671339665', name: 'Validation Lists & Dropdown Options' }
];

console.log('--- COMPREHENSIVE SHEET ANALYSIS ---');
for (const item of gids) {
  const filePath = path.resolve(`./scripts/sheets_data/sheet_${item.gid}.csv`);
  if (!fs.existsSync(filePath)) continue;
  const raw = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(raw);
  console.log(`\n========================================`);
  console.log(`GID: ${item.gid} | Name: ${item.name}`);
  console.log(`Total Rows: ${rows.length}`);
  
  if (item.gid === '1754930862') {
    // Print all dashboard rows
    rows.forEach(r => console.log(r.filter(x => x !== '').join(' | ')));
  } else if (item.gid === '2011906547') {
    // Print all handover template rows
    rows.forEach(r => console.log(r.filter(x => x !== '').join(' | ')));
  } else if (item.gid === '671339665') {
    const headers = rows[0];
    console.log('Columns:', headers);
    const dataRows = rows.slice(1).filter(r => r.some(c => c !== ''));
    console.log('Rows count:', dataRows.length);
    headers.forEach((h, colIdx) => {
      const vals = dataRows.map(r => r[colIdx]).filter(v => v && v !== '');
      console.log(`  ${h}: [${vals.join(', ')}]`);
    });
  } else {
    const headers = rows[0];
    console.log('Headers:', headers);
    const nonBlankRows = rows.slice(1).filter(r => {
      // Must have an ID or main name
      return r[0] && r[0].trim() !== '' && !r[0].startsWith('Total');
    });
    console.log(`Meaningful records count: ${nonBlankRows.length}`);
    if (nonBlankRows.length > 0) {
      console.log('First record:');
      const sample = {};
      headers.forEach((h, i) => {
        if (nonBlankRows[0][i]) sample[h || `Col_${i}`] = nonBlankRows[0][i];
      });
      console.log(sample);
    }
    // Also print IDs
    const ids = nonBlankRows.map(r => r[0]);
    console.log(`Sample IDs (first 10):`, ids.slice(0, 10));
  }
}
