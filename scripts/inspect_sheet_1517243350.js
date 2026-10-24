import fs from 'fs';

const lines = fs.readFileSync('scripts/sheets_data/sheet_1517243350.csv', 'utf8').split(/\r?\n/).filter(l => l.trim().length > 0);
console.log('Headers in 1517243350:');
const headers = lines[0].split(',');
headers.forEach((h, i) => console.log(`${i}: ${h}`));
console.log('\nTotal lines:', lines.length);

// Count non-empty actual asset records
let actualAssets = 0;
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  if (parts[0] && parts[0].trim() !== '') {
    actualAssets++;
    if (actualAssets <= 10) {
      console.log(`Asset ${actualAssets}: ID=${parts[0]}, Name=${parts[2]}, Cat=${parts[3]}, Cost=${parts[8]}`);
    }
  }
}
console.log('Total non-empty Asset rows:', actualAssets);
