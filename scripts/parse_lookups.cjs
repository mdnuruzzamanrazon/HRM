const fs = require('fs');

const dataLevel = JSON.parse(fs.readFileSync('sheet_Data_level.json', 'utf-8'));
const consortium = JSON.parse(fs.readFileSync('sheet_meta-data-consortium-partner.json', 'utf-8'));

console.log('=== DATA LEVEL LOOKUPS ===');
const headers = dataLevel[0];
const columns = {};

headers.forEach((h, colIdx) => {
  if (h && h.trim()) {
    const vals = [];
    for (let r = 1; r < dataLevel.length; r++) {
      const v = dataLevel[r][colIdx];
      if (v && String(v).trim()) {
        vals.push(String(v).trim());
      }
    }
    columns[h.trim()] = vals;
  }
});

console.log(JSON.stringify(columns, null, 2));

console.log('\n=== CONSORTIUM PARTNERS ===');
console.log('Header:', consortium[0]);
console.log('Rows count:', consortium.length);
const partners = [];
for (let r = 1; r < consortium.length; r++) {
  if (consortium[r].some(c => String(c).trim())) {
    partners.push(consortium[r]);
  }
}
console.log('Sample Partners:');
partners.slice(0, 15).forEach(p => console.log(JSON.stringify(p)));
