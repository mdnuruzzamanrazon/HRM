const fs = require('fs');
const consortium = JSON.parse(fs.readFileSync('sheet_meta-data-consortium-partner.json', 'utf-8'));

// The sheet has two sections or multiple columns:
// Col 0: SP/Grantee, Col 1: Consortium partner
// Also columns 6+ are individual SP/Grantees with their partners listed below them.
const spPartnersMap = {};
const allSpGrantees = new Set();
const allConsortiumPartners = new Set();

// Let's parse Col 0 and Col 1:
for (let r = 1; r < consortium.length; r++) {
  const sp = consortium[r][0];
  const cp = consortium[r][1];
  if (sp && sp.trim()) {
    const spClean = sp.trim();
    allSpGrantees.add(spClean);
    spPartnersMap[spClean] = spPartnersMap[spClean] || new Set();
    if (cp && cp.trim()) {
      spPartnersMap[spClean].add(cp.trim());
      allConsortiumPartners.add(cp.trim());
    }
  }
}

// Also check columns 6 to end in row 0:
const header = consortium[0];
for (let c = 6; c < header.length; c++) {
  const colSp = header[c];
  if (colSp && colSp.trim()) {
    const spName = colSp.trim().replace(/_/g, ' ');
    allSpGrantees.add(spName);
    spPartnersMap[spName] = spPartnersMap[spName] || new Set();
    for (let r = 1; r < consortium.length; r++) {
      const val = consortium[r][c];
      if (val && val.trim()) {
        spPartnersMap[spName].add(val.trim());
        allConsortiumPartners.add(val.trim());
      }
    }
  }
}

// Convert sets to arrays
const finalMap = {};
Object.keys(spPartnersMap).sort().forEach(k => {
  finalMap[k] = Array.from(spPartnersMap[k]).sort();
});

console.log('SP/Grantees count:', Object.keys(finalMap).length);
console.log('Sample SPs:', Object.keys(finalMap).slice(0, 10));
console.log('MJF partners:', finalMap['Manushr_Jonno_Foundation_MJF'] || finalMap['Manushr Jonno Foundation MJF']);
fs.writeFileSync('consortium_partners_map.json', JSON.stringify(finalMap, null, 2), 'utf-8');
console.log('Saved to consortium_partners_map.json');
