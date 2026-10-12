import mongoose from 'mongoose';
import { Notice } from '../models/Notice.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

export const createNotice = async (req, res) => {
  try {
    const authorId = req.user?.employeeProfileId || mockData.adminEmployee._id;
    const { title, content, priority } = req.body;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const newNotice = {
        _id: 'not-' + Date.now(),
        title,
        content,
        priority: priority || 'MEDIUM',
        author: 'HR Admin',
        createdAt: new Date().toISOString(),
      };
      mockData.notices.unshift(newNotice);
      return res.status(201).json({ success: true, data: newNotice, message: 'Notice posted successfully' });
    }

    const notice = new Notice({
      title,
      content,
      priority,
      authorId
    });

    await notice.save();
    res.status(201).json({ success: true, data: notice, message: 'Notice posted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getActiveNotices = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.notices });
    }
    const notices = await Notice.find({ isActive: true })
      .populate('authorId', 'personalDetails employeeCode')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
