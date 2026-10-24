import fs from 'fs';
import path from 'path';

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
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

function cleanNumber(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// 1. Parse Reference Lists (GID 671339665)
const refRaw = fs.readFileSync('scripts/sheets_data/sheet_671339665.csv', 'utf8');
const refRows = parseCSV(refRaw);
const refHeaders = refRows[0];
const references = {
  categories: [],
  statuses: [],
  conditions: [],
  auditResults: [],
  riskLevels: [],
  locations: [],
  vehicles: [],
  workflowStatuses: [],
  projectDonors: []
};

for (let r = 1; r < refRows.length; r++) {
  const row = refRows[r];
  if (row[0]) references.categories.push(row[0]);
  if (row[1]) references.statuses.push(row[1]);
  if (row[2]) references.conditions.push(row[2]);
  if (row[3]) references.auditResults.push(row[3]);
  if (row[4] && isNaN(Number(row[4]))) references.riskLevels.push(row[4]);
  if (row[5]) references.locations.push(row[5]);
  if (row[6]) references.vehicles.push(row[6]);
  if (row[7]) references.workflowStatuses.push(row[7]);
  if (row[8]) references.projectDonors.push(row[8]);
}

// 2. Parse Master Asset Register (GID 1517243350)
const assetRaw = fs.readFileSync('scripts/sheets_data/sheet_1517243350.csv', 'utf8');
const assetRows = parseCSV(assetRaw);
const masterAssets = [];
for (let i = 1; i < assetRows.length; i++) {
  const r = assetRows[i];
  const assetId = r[0];
  if (!assetId || assetId.trim() === '' || assetId.startsWith('Total')) continue;

  const cost = cleanNumber(r[8]);
  const usefulLife = cleanNumber(r[9]) || 5;
  const annualDep = cleanNumber(r[10]) || (usefulLife > 0 && cost > 0 ? Math.round(cost / usefulLife) : 0);
  const bookVal = cleanNumber(r[11]);

  masterAssets.push({
    assetId: assetId.trim(),
    qrText: r[1] || `${assetId.trim()}|Name:${r[2] || ''}|Location:${r[5] || 'Head Office'}|Custodian:${r[6] || ''}`,
    name: r[2] || 'Unnamed Asset',
    category: r[3] || 'IT Equipment',
    projectDonor: r[4] || 'Core',
    location: r[5] || 'Head Office',
    custodian: r[6] || 'Unassigned',
    purchaseDate: r[7] ? new Date(r[7]).toISOString().split('T')[0] : '2022-01-01',
    purchaseCost: cost,
    usefulLifeYears: usefulLife,
    annualDepreciation: annualDep,
    currentBookValue: bookVal,
    condition: r[12] || 'Good',
    status: r[13] || (cost > 0 ? 'Active' : 'In Use'),
    lastAuditDate: r[14] || '2026-09-01',
    auditResult: r[15] || 'Verified',
    nextAuditDue: r[16] || '2027-02-28',
    riskFlag: r[17] || 'Low',
    remarks: r[18] || '',
    physicalTagLocation: 'Top Cover',
    qrLabelSize: '50mm x 30mm',
    qrPrintStatus: 'Ready',
    lastPrintedDate: '2026-04-15'
  });
}

// 3. Parse QR Asset System (GID 861206349) and enrich tags
const qrRaw = fs.readFileSync('scripts/sheets_data/sheet_861206349.csv', 'utf8');
const qrRows = parseCSV(qrRaw);
const qrTags = [];
for (let i = 1; i < qrRows.length; i++) {
  const r = qrRows[i];
  if (!r[0] || r[0].trim() === '') continue;
  qrTags.push({
    assetId: r[0].trim(),
    qrLabelText: r[1] || `${r[0].trim()} | CBDP`,
    labelSize: r[3] || '50mm x 30mm',
    printStatus: r[4] || 'Ready',
    physicalTagLocation: r[5] || 'Top cover',
    lastPrintedDate: r[6] || '',
    notes: r[7] || ''
  });
}

// 4. Parse Field Kit & Inventory (GID 1726563914)
const kitRaw = fs.readFileSync('scripts/sheets_data/sheet_1726563914.csv', 'utf8');
const kitRows = parseCSV(kitRaw);
const fieldKits = [];
for (let i = 1; i < kitRows.length; i++) {
  const r = kitRows[i];
  if (!r[0] || r[0].trim() === '' || !r[0].startsWith('KIT')) continue;
  fieldKits.push({
    itemCode: r[0].trim(),
    kitProject: r[1] || 'FISHNET',
    equipmentName: r[2] || '',
    category: r[3] || 'Field Equipment',
    location: r[4] || 'Warehouse',
    responsiblePerson: r[5] || 'Field Facilitator',
    openingQty: cleanNumber(r[6]),
    issuedQty: cleanNumber(r[7]),
    returnedQty: cleanNumber(r[8]),
    damagedQty: cleanNumber(r[9]),
    missingQty: cleanNumber(r[10]),
    availableQty: cleanNumber(r[11]),
    minimumStock: cleanNumber(r[12]),
    stockStatus: r[13] || 'OK',
    lastPhysicalCount: r[14] || '2026-04-10',
    remarks: r[15] || ''
  });
}

// 5. Parse Stationery / Consumables (GID 1510015205)
const consumableRaw = fs.readFileSync('scripts/sheets_data/sheet_1510015205.csv', 'utf8');
const consumableRows = parseCSV(consumableRaw);
const consumables = [];
for (let i = 1; i < consumableRows.length; i++) {
  const r = consumableRows[i];
  if (!r[0] || r[0].trim() === '') continue;
  consumables.push({
    name: r[0].trim(),
    quantity: cleanNumber(r[1]) || 1,
    handoverTo: r[2] || 'Field Logistics'
  });
}

// 6. Parse Vehicle Logbook (GID 1933684115)
const vehRaw = fs.readFileSync('scripts/sheets_data/sheet_1933684115.csv', 'utf8');
const vehRows = parseCSV(vehRaw);
const vehicleLogs = [];
for (let i = 1; i < vehRows.length; i++) {
  const r = vehRows[i];
  if (!r[0] || r[0].trim() === '' || !r[1] || r[1].trim() === '') continue;
  vehicleLogs.push({
    date: r[0],
    vehicleId: r[1].trim(),
    driver: r[2] || 'Staff Driver',
    startKm: cleanNumber(r[3]),
    endKm: cleanNumber(r[4]),
    tripKm: cleanNumber(r[5]),
    purposeRoute: r[6] || '',
    fuelLiters: cleanNumber(r[7]),
    fuelCost: cleanNumber(r[8]),
    costPerLiter: cleanNumber(r[9]),
    kmPerLiter: cleanNumber(r[10]),
    costPerKm: cleanNumber(r[11]),
    odometerCheck: r[12] || 'OK',
    approvedBy: r[13] || 'Admin',
    remarks: r[14] || ''
  });
}

// 7. Parse Asset Handover Template & Sample (GID 2011906547)
const handovers = [
  {
    formNo: 'HO-2026-001',
    date: '2026-04-05',
    type: 'Handover',
    projectDonor: 'FISHNET',
    handedOverBy: {
      name: 'Md. Nuruzzaman',
      designation: 'HR & Admin Officer',
      location: 'Head Office',
      contact: '+8801700000001'
    },
    receivedBy: {
      name: 'Reajul Islam',
      designation: 'Field Facilitator',
      location: 'Taltali Program Office',
      contact: '+8801700000002'
    },
    purpose: 'Quarterly field program implementation and community training',
    expectedReturnDate: '2026-09-30',
    actualReturnDate: '',
    status: 'Active',
    items: [
      {
        assetId: 'CBDP-AST-Core-Lap-01',
        assetName: 'Asus vivo Book 15.6" Core i3715',
        conditionHandover: 'Good',
        accessories: 'Charger, Laptop Bag, Wireless Mouse',
        qty: 1,
        conditionReturn: '',
        remarks: 'Issued for Taltali Field Office'
      },
      {
        assetId: 'KIT-001',
        assetName: 'Inflatable Life Jacket (10 pcs)',
        conditionHandover: 'Excellent',
        accessories: 'Whistle, Reflective Strap',
        qty: 10,
        conditionReturn: '',
        remarks: 'Emergency water safety kit'
      }
    ]
  }
];

// 8. Parse Workflow / Lifecycle (GID 1017327203)
const wfRaw = fs.readFileSync('scripts/sheets_data/sheet_1017327203.csv', 'utf8');
const wfRows = parseCSV(wfRaw);
const workflows = [];
for (let i = 1; i < wfRows.length; i++) {
  const r = wfRows[i];
  if (!r[0] || r[0].trim() === '' || !r[0].startsWith('REQ')) continue;
  workflows.push({
    requestId: r[0].trim(),
    assetName: r[1] || '',
    requestingDept: r[2] || '',
    budgetLine: r[3] || '',
    requisitionDate: r[4] || '',
    approvalDate: r[5] || '',
    rfqDate: r[6] || '',
    poDate: r[7] || '',
    receivedDate: r[8] || '',
    taggedDate: r[9] || '',
    assignedTo: r[10] || '',
    maintenanceDate: r[11] || '',
    disposalRequestDate: r[12] || '',
    disposalApprovalDate: r[13] || '',
    disposalDate: r[14] || '',
    currentStage: r[15] || 'Requisition',
    workflowStatus: r[16] || 'In Progress',
    leadTimeDays: cleanNumber(r[17]),
    remarks: r[18] || ''
  });
}

const seedData = {
  references,
  assets: masterAssets,
  qrTags,
  fieldKits,
  consumables,
  vehicleLogs,
  handovers,
  workflows
};

const targetPath = path.resolve('backend/src/data/officialAssets.json');
fs.writeFileSync(targetPath, JSON.stringify(seedData, null, 2), 'utf8');
console.log(`Generated officialAssets.json successfully!`);
console.log(`- Assets: ${masterAssets.length}`);
console.log(`- Field Kits: ${fieldKits.length}`);
console.log(`- Vehicle Logs: ${vehicleLogs.length}`);
console.log(`- Workflows: ${workflows.length}`);
console.log(`- QR Tags: ${qrTags.length}`);
console.log(`- Categories: ${references.categories.length}`);
