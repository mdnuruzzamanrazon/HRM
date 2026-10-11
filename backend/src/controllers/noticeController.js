import { Notice } from '../models/Notice.js';

export const createNotice = async (req, res) => {
  try {
    const authorId = req.user.employeeProfileId;
    if (!authorId) return res.status(400).json({ success: false, message: 'Author ID missing.' });

    const { title, content, priority } = req.body;

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
