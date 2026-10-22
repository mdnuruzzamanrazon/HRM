const fs = require('fs');
const areas = JSON.parse(fs.readFileSync('sheet_meta_data-areas.json', 'utf-8'));

// District to P-Code
const distPCode = {};
for (let i = 1; i < areas.length; i++) {
  const [dist, distCode] = areas[i];
  if (dist && distCode) {
    distPCode[dist.trim()] = distCode.trim();
  }
}

console.log('Districts and PCodes:', distPCode);
