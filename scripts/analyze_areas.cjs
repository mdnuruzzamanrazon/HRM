const fs = require('fs');
const areas = JSON.parse(fs.readFileSync('sheet_meta_data-areas.json', 'utf-8'));
const headers = areas[0];
console.log('Headers:', headers);

const districts = new Set();
const upazilas = new Set();
const unions = new Set();
const districtToUpazilas = {};

for (let i = 1; i < areas.length; i++) {
  const [dist, distCode, upa, upaCode, uni, uniCode] = areas[i];
  if (dist && dist.trim()) districts.add(dist.trim());
  if (dist && upa && upa.trim()) {
    upazilas.add(`${dist.trim()} -> ${upa.trim()}`);
    districtToUpazilas[dist.trim()] = districtToUpazilas[dist.trim()] || new Set();
    districtToUpazilas[dist.trim()].add(upa.trim());
  }
  if (upa && uni && uni.trim()) {
    unions.add(`${upa.trim()} -> ${uni.trim()}`);
  }
}

console.log('Total Distinct Districts in sheet:', districts.size);
console.log('Total Distinct District-Upazila pairs in sheet:', upazilas.size);
console.log('Total Distinct Upazila-Union pairs in sheet:', unions.size);
console.log('\nAll Districts in sheet (' + districts.size + '):');
const distList = Array.from(districts).sort();
console.log(distList.join(', '));
