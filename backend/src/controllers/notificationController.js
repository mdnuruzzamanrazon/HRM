import { Notification } from '../models/Notification.js';

// Get notifications for the logged-in user
export const getMyNotifications = async (req, res) => {
  try {
    const recipientId = req.user.employeeProfileId;
    const notifications = await Notification.find({ recipientId })
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark a single notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: req.user.employeeProfileId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const recipientId = req.user.employeeProfileId;
    await Notification.updateMany({ recipientId, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin/System utility to push a notification
export const pushNotification = async (req, res) => {
  try {
    const { recipientId, title, message, type, link } = req.body;
    
    // Default to self if recipientId is not provided (for testing purposes)
    const targetId = recipientId || req.user.employeeProfileId;

    const notification = new Notification({
      recipientId: targetId,
      title,
      message,
      type,
      link
    });

    await notification.save();
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
