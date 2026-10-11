import { TaxConfig } from '../models/TaxConfig.js';

export const createTaxRule = async (req, res) => {
  try {
    const { taxName, taxRate, type, description } = req.body;
    const taxRule = new TaxConfig({ taxName, taxRate, type, description });
    await taxRule.save();
    res.status(201).json({ success: true, data: taxRule, message: 'Tax rule created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Tax rule with this name already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTaxRules = async (req, res) => {
  try {
    const rules = await TaxConfig.find().sort({ createdAt: -1 });
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleTaxRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const taxRule = await TaxConfig.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!taxRule) return res.status(404).json({ success: false, message: 'Tax rule not found' });

    res.json({ success: true, data: taxRule, message: `Tax rule ${isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
