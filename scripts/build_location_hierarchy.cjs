const fs = require('fs');

const areas = JSON.parse(fs.readFileSync('sheet_meta_data-areas.json', 'utf-8'));

// Division mapping based on P-Code prefix
const divisionMap = {
  'BD10': 'Barishal',
  'BD20': 'Chattogram',
  'BD30': 'Dhaka',
  'BD40': 'Khulna',
  'BD45': 'Mymensingh',
  'BD50': 'Rajshahi',
  'BD55': 'Rangpur',
  'BD60': 'Sylhet'
};

const divisions = [
  'Barishal',
  'Chattogram',
  'Dhaka',
  'Khulna',
  'Mymensingh',
  'Rajshahi',
  'Rangpur',
  'Sylhet'
];

const structured = {
  divisions: divisions,
  divisionDistricts: {},
  districtUpazilas: {},
  upazilaUnions: {},
  districtToDivision: {},
  metadata: {
    totalDivisions: 8,
    totalDistricts: 0,
    totalUpazilas: 0,
    totalUnions: 0
  }
};

divisions.forEach(d => {
  structured.divisionDistricts[d] = [];
});

const districtSet = new Set();
const upazilaSet = new Set();
const unionCount = { count: 0 };

for (let i = 1; i < areas.length; i++) {
  const [distNameRaw, distCodeRaw, upaNameRaw, upaCodeRaw, uniNameRaw, uniCodeRaw] = areas[i];
  if (!distNameRaw || !distCodeRaw) continue;

  const distName = distNameRaw.trim();
  const distCode = distCodeRaw.trim();
  const upaName = upaNameRaw ? upaNameRaw.trim() : '';
  const upaCode = upaCodeRaw ? upaCodeRaw.trim() : '';
  const uniName = uniNameRaw ? uniNameRaw.trim() : '';
  const uniCode = uniCodeRaw ? uniCodeRaw.trim() : '';

  const divCode = distCode.slice(0, 4);
  const divName = divisionMap[divCode] || 'Dhaka';

  if (!districtSet.has(distName)) {
    districtSet.add(distName);
    structured.divisionDistricts[divName] = structured.divisionDistricts[divName] || [];
    if (!structured.divisionDistricts[divName].includes(distName)) {
      structured.divisionDistricts[divName].push(distName);
    }
    structured.districtToDivision[distName] = divName;
    structured.districtUpazilas[distName] = [];
  }

  if (upaName) {
    const upaKey = `${distName}__${upaName}`;
    if (!upazilaSet.has(upaKey)) {
      upazilaSet.add(upaKey);
      if (!structured.districtUpazilas[distName].includes(upaName)) {
        structured.districtUpazilas[distName].push(upaName);
      }
      structured.upazilaUnions[upaKey] = [];
    }

    if (uniName) {
      if (!structured.upazilaUnions[upaKey].includes(uniName)) {
        structured.upazilaUnions[upaKey].push(uniName);
        unionCount.count++;
      }
    }
  }
}

// Sort all arrays alphabetically
divisions.forEach(d => {
  structured.divisionDistricts[d].sort();
});
Object.keys(structured.districtUpazilas).forEach(dist => {
  structured.districtUpazilas[dist].sort();
});
Object.keys(structured.upazilaUnions).forEach(k => {
  structured.upazilaUnions[k].sort();
});

structured.metadata.totalDistricts = districtSet.size;
structured.metadata.totalUpazilas = upazilaSet.size;
structured.metadata.totalUnions = unionCount.count;

console.log('Location Hierarchy Built:');
console.log('Divisions:', structured.divisions.length);
console.log('Districts:', structured.metadata.totalDistricts);
console.log('Upazilas:', structured.metadata.totalUpazilas);
console.log('Unions:', structured.metadata.totalUnions);

fs.writeFileSync('bangladesh_location_hierarchy.json', JSON.stringify(structured, null, 2), 'utf-8');
console.log('Saved to bangladesh_location_hierarchy.json');
