import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load location data from data/bangladeshLocations.json
let locationHierarchy = null;

try {
  const filePath = path.join(__dirname, '../data/bangladeshLocations.json');
  if (fs.existsSync(filePath)) {
    locationHierarchy = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
} catch (err) {
  console.error('[LocationController] Failed to load location hierarchy:', err.message);
}

// 1. Get all 8 divisions
export const getDivisions = (req, res) => {
  try {
    const divisions = locationHierarchy ? locationHierarchy.divisions : [
      'Barishal', 'Chattogram', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'
    ];
    res.json({
      success: true,
      data: divisions,
      total: divisions.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get districts (optionally filtered by division)
export const getDistricts = (req, res) => {
  try {
    const { division } = req.query;
    if (!locationHierarchy) {
      return res.status(500).json({ success: false, message: 'Location data unavailable' });
    }

    let districts = [];
    if (division && locationHierarchy.divisionDistricts[division]) {
      districts = locationHierarchy.divisionDistricts[division];
    } else {
      districts = Object.keys(locationHierarchy.districtUpazilas).sort();
    }

    res.json({
      success: true,
      division: division || 'ALL',
      data: districts,
      total: districts.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get upazilas for a district
export const getUpazilas = (req, res) => {
  try {
    const { district } = req.query;
    if (!locationHierarchy) {
      return res.status(500).json({ success: false, message: 'Location data unavailable' });
    }

    if (!district) {
      return res.status(400).json({ success: false, message: 'District query parameter is required' });
    }

    const upazilas = locationHierarchy.districtUpazilas[district] || [];
    res.json({
      success: true,
      district,
      data: upazilas,
      total: upazilas.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get unions for an upazila
export const getUnions = (req, res) => {
  try {
    const { district, upazila } = req.query;
    if (!locationHierarchy) {
      return res.status(500).json({ success: false, message: 'Location data unavailable' });
    }

    if (!district || !upazila) {
      return res.status(400).json({ success: false, message: 'District and Upazila parameters are required' });
    }

    const upaKey = `${district}__${upazila}`;
    const unions = locationHierarchy.upazilaUnions[upaKey] || [];

    res.json({
      success: true,
      district,
      upazila,
      data: unions,
      total: unions.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get complete hierarchy
export const getFullHierarchy = (req, res) => {
  try {
    if (!locationHierarchy) {
      return res.status(500).json({ success: false, message: 'Location data unavailable' });
    }
    res.json({
      success: true,
      data: locationHierarchy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
