import fs from 'fs';
import path from 'path';

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

const sheetId = '11ucgtB03mb7Pm3fJOREwhCDrlhYb8o2c';
const outputDir = path.resolve('./scripts/sheets_data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function inspectAll() {
  console.log('Downloading all 9 sheets...');
  const results = [];

  for (const gid of gids) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Failed to fetch GID ${gid}: ${res.status} ${res.statusText}`);
        results.push({ gid, status: 'error', code: res.status });
        continue;
      }
      const csvText = await res.text();
      const filePath = path.join(outputDir, `sheet_${gid}.csv`);
      fs.writeFileSync(filePath, csvText, 'utf8');
      
      const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
      console.log(`\n========================================`);
      console.log(`GID: ${gid} | Lines: ${lines.length}`);
      console.log(`First 5 lines:`);
      lines.slice(0, 5).forEach((line, idx) => console.log(`  [${idx}]: ${line.slice(0, 150)}`));
      
      results.push({
        gid,
        status: 'ok',
        linesCount: lines.length,
        headerCandidate: lines[0],
        line1: lines[1]
      });
    } catch (err) {
      console.error(`Error fetching GID ${gid}:`, err.message);
      results.push({ gid, status: 'exception', error: err.message });
    }
  }

  fs.writeFileSync(path.join(outputDir, 'summary.json'), JSON.stringify(results, null, 2));
  console.log('\nAll sheets processed!');
}

inspectAll();
