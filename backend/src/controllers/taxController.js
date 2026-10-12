import mongoose from 'mongoose';
import { TaxConfig } from '../models/TaxConfig.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

export const createTaxRule = async (req, res) => {
  try {
    const { taxName, taxRate, type, description } = req.body;
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const newTax = { 
        _id: 'tax-' + Date.now(), 
        taxName, 
        name: taxName, 
        taxRate: Number(taxRate) || 0, 
        rate: Number(taxRate) || 0, 
        type, 
        description, 
        isActive: true,
        active: true,
        createdAt: new Date().toISOString() 
      };
      mockData.taxes.push(newTax);
      return res.status(201).json({ success: true, data: newTax, message: 'Tax rule created successfully' });
    }
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
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.taxes });
    }
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

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const rule = mockData.taxes.find(t => t._id === id);
      if (rule) {
        rule.isActive = isActive;
        rule.active = isActive;
      }
      return res.json({ 
        success: true, 
        data: rule || { _id: id, isActive }, 
        message: `Tax rule ${isActive ? 'activated' : 'deactivated'}` 
      });
    }

    const taxRule = await TaxConfig.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!taxRule) return res.status(404).json({ success: false, message: 'Tax rule not found' });

    res.json({ success: true, data: taxRule, message: `Tax rule ${isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
