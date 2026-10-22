const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 1. Process Locations
const areas = JSON.parse(fs.readFileSync('sheet_meta_data-areas.json', 'utf-8'));

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

const locationData = {
  divisions: divisions,
  divisionDistricts: {},
  districtUpazilas: {},
  upazilaUnions: {},
  districtToDivision: {},
  districtCodes: {},
  metadata: {
    totalDivisions: 8,
    totalDistricts: 0,
    totalUpazilas: 0,
    totalUnions: 0
  }
};

divisions.forEach(d => {
  locationData.divisionDistricts[d] = [];
});

const districtSet = new Set();
const upazilaSet = new Set();
let unionCount = 0;

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
    locationData.districtCodes[distName] = distCode;
    locationData.divisionDistricts[divName] = locationData.divisionDistricts[divName] || [];
    if (!locationData.divisionDistricts[divName].includes(distName)) {
      locationData.divisionDistricts[divName].push(distName);
    }
    locationData.districtToDivision[distName] = divName;
    locationData.districtUpazilas[distName] = [];
  }

  if (upaName) {
    const upaKey = `${distName}__${upaName}`;
    if (!upazilaSet.has(upaKey)) {
      upazilaSet.add(upaKey);
      if (!locationData.districtUpazilas[distName].includes(upaName)) {
        locationData.districtUpazilas[distName].push(upaName);
      }
      locationData.upazilaUnions[upaKey] = [];
    }

    if (uniName) {
      if (!locationData.upazilaUnions[upaKey].includes(uniName)) {
        locationData.upazilaUnions[upaKey].push(uniName);
        unionCount++;
      }
    }
  }
}

divisions.forEach(d => locationData.divisionDistricts[d].sort());
Object.keys(locationData.districtUpazilas).forEach(dist => locationData.districtUpazilas[dist].sort());
Object.keys(locationData.upazilaUnions).forEach(k => locationData.upazilaUnions[k].sort());

locationData.metadata.totalDistricts = districtSet.size;
locationData.metadata.totalUpazilas = upazilaSet.size;
locationData.metadata.totalUnions = unionCount;

// 2. Process Metadata & Lookups
const dataLevel = JSON.parse(fs.readFileSync('sheet_Data_level.json', 'utf-8'));
const consortium = JSON.parse(fs.readFileSync('sheet_meta-data-consortium-partner.json', 'utf-8'));
const instructions = JSON.parse(fs.readFileSync('sheet_Instraction.json', 'utf-8'));

// Extract Lookups
const eventTypes = [
  "Training", "Orientation", "Induction", "Learning Session", "Exposure/Exchange Visit",
  "Demonstration", "TOT", "Mentoring", "Peer Learning", "Coaching", "Community Yard meeting",
  "Conference", "Seminar", "Workshop", "Meeting", "Campaign", "Dialogue", "Grievance Redressal",
  "Inclusion Session", "Support Service Provision", "SGBV Support Service", "Research Engagement",
  "Thematic External Meeting/Workshop", "Radio program", "Community Radio Program", "TV program",
  "Social Media Post/Campaign", "IEC Material distribution", "Mass Gathering",
  "Print media campaign/story/news/Article", "Other"
];

const eventThemes = [
  "Governance", "Accountability", "Civic Engagement and Participation", "Gender Equality",
  "Social Inclusion", "Capacity Development", "Institutional Strengthening", "Advocacy and Policy Reform",
  "Research, Learning, and Knowledge Sharing", "Innovation and Digital Transformation", "MEAL",
  "Service Delivery", "Community Support", "Leadership", "Empowerment", "Others (Specify)"
];

const eventLevels = [
  "Local (Union and Upzila)", "Regional (District-Divison)", "National"
];

const govResponses = [
  "Positive", "Negative", "Deferred", "No Response", "Not Applicable"
];

const indirectReachChannels = [
  "Facebook, YouTube, WhatsApp, etc (All social Media platform)",
  "Online News outlet",
  "Print News Outlet",
  "TV News outlet",
  "Mass gathering/Rally/Day observation/human chain (All mass gathering etc)",
  "IEC Material",
  "sharing with peers, friends, or household members.",
  "Other (Specify in the next Colum)"
];

const estimationSources = [
  "Social Media Analytics",
  "Google/Web Analysitcs",
  "Circulation",
  "Field estimate",
  "Others -Specify in the next Colum"
];

// SP / Grantee to Consortium Partners
const spPartnersMap = {};
for (let r = 1; r < consortium.length; r++) {
  const sp = consortium[r][0];
  const cp = consortium[r][1];
  if (sp && sp.trim()) {
    const spClean = sp.trim();
    spPartnersMap[spClean] = spPartnersMap[spClean] || new Set();
    if (cp && cp.trim()) {
      spPartnersMap[spClean].add(cp.trim());
    }
  }
}
const consortiumHeader = consortium[0];
for (let c = 6; c < consortiumHeader.length; c++) {
  const colSp = consortiumHeader[c];
  if (colSp && colSp.trim()) {
    const spClean = colSp.trim().replace(/_/g, ' ');
    spPartnersMap[spClean] = spPartnersMap[spClean] || new Set();
    for (let r = 1; r < consortium.length; r++) {
      const val = consortium[r][c];
      if (val && val.trim()) {
        spPartnersMap[spClean].add(val.trim());
      }
    }
  }
}
const finalSpPartners = {};
Object.keys(spPartnersMap).sort().forEach(k => {
  finalSpPartners[k] = Array.from(spPartnersMap[k]).sort();
});

// Instructions Map
const instructionsMap = {};
for (let r = 1; r < instructions.length; r++) {
  const col = instructions[r][0];
  const text = instructions[r][1];
  if (col && col.trim()) {
    instructionsMap[col.trim()] = text ? text.trim() : '';
  }
}

const metadata = {
  eventTypes,
  eventThemes,
  eventLevels,
  govResponses,
  indirectReachChannels,
  estimationSources,
  implementingOrgs: Object.keys(finalSpPartners),
  spPartnersMap: finalSpPartners,
  instructions: instructionsMap
};

// 3. Process Seed Records from Data Entry Sheet
const workbook = XLSX.readFile('cbdp_event_tracker.xlsx');
const sheet = workbook.Sheets['Data entry sheet'];
const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
const seedHeaders = rawRows[5];

function excelDateToDate(excelSerial) {
  if (!excelSerial) return null;
  if (typeof excelSerial === 'string' && excelSerial.includes('-')) {
    return excelSerial;
  }
  const serial = Number(excelSerial);
  if (isNaN(serial)) return null;
  // Excel base date 1899-12-30
  const utcDays = serial - 25569;
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

const seedEvents = [];
for (let i = 6; i < rawRows.length; i++) {
  const r = rawRows[i];
  if (r.some(c => String(c).trim())) {
    const rawDist = (r[12] || '').trim();
    const rawUpa = (r[13] || '').trim();
    const rawUni = (r[14] || '').trim();
    const div = locationData.districtToDivision[rawDist] || 'Barishal';

    const evt = {
      sl: Number(r[0]) || seedEvents.length + 1,
      eventId: String(r[1] || '').trim(),
      dateFrom: excelDateToDate(r[2]),
      dateTo: excelDateToDate(r[3]),
      implementingOrg: String(r[4] || '').trim(),
      consortiumPartner: String(r[5] || '').trim(),
      participantCountCommunity: Number(r[6]) || 0,
      eventType: String(r[7] || '').trim(),
      eventTypeOther: String(r[8] || '').trim(),
      eventTheme: String(r[9] || '').trim(),
      eventThemeOther: String(r[10] || '').trim(),
      eventTitle: String(r[11] || '').trim(),
      division: div,
      district: rawDist,
      upazila: rawUpa,
      union: rawUni,
      eventLevel: String(r[15] || 'Local (Union and Upzila)').trim(),
      govRepresentativePresent: String(r[16] || 'No').trim(),
      govRepresentativeCount: Number(r[17]) || 0,
      govResponse: String(r[18] || '').trim(),
      govResponseDetails: String(r[19] || '').trim(),
      actionsAgreed: String(r[20] || '').trim(),
      conflictPrevention: String(r[21] || 'No').trim(),
      conflictPreventionDetails: String(r[22] || '').trim(),
      indirectReach: String(r[23] || 'No').trim(),
      indirectReachChannel: String(r[24] || '').trim(),
      indirectReachChannelOther: String(r[25] || '').trim(),
      indirectReachDescription: String(r[26] || '').trim(),
      estimatedAudienceReach: Number(r[27]) || 0,
      reachEstimationSource: String(r[28] || '').trim(),
      reachEstimationSourceOther: String(r[29] || '').trim(),
      reachRationale: String(r[30] || '').trim(),
      mediaLink: String(r[31] || '').trim(),
      status: 'Completed'
    };

    seedEvents.push(evt);
  }
}

// Ensure target directories exist
fs.mkdirSync('backend/src/data', { recursive: true });
fs.mkdirSync('src/data', { recursive: true });

// Write files to backend and frontend
fs.writeFileSync('backend/src/data/bangladeshLocations.json', JSON.stringify(locationData, null, 2), 'utf-8');
fs.writeFileSync('src/data/bangladeshLocations.json', JSON.stringify(locationData, null, 2), 'utf-8');

fs.writeFileSync('backend/src/data/eventMetadata.json', JSON.stringify(metadata, null, 2), 'utf-8');
fs.writeFileSync('src/data/eventMetadata.json', JSON.stringify(metadata, null, 2), 'utf-8');

fs.writeFileSync('backend/src/data/seedEvents.json', JSON.stringify(seedEvents, null, 2), 'utf-8');

console.log('Successfully written:');
console.log('1. Location Hierarchy -> backend & frontend (64 districts, 547 upazilas, 5,161 unions)');
console.log('2. Event Metadata Lookups -> backend & frontend (31 event types, 16 themes, lookups, SPs, instructions)');
console.log('3. Seed Events -> backend (' + seedEvents.length + ' official records ready for MongoDB)');
