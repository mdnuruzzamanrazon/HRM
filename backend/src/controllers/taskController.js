import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';

export const createTask = async (req, res) => {
  try {
    const assignedBy = req.user?.employeeProfileId || mockData.adminEmployee._id;
    const { title, description, assignedTo, dueDate, priority } = req.body;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const newTask = {
        _id: 'task-' + Date.now(),
        title,
        description,
        assignedTo: mockData.employees[1],
        assignedBy: mockData.adminEmployee,
        dueDate: dueDate || '2026-10-30',
        priority: priority || 'MEDIUM',
        status: 'PENDING',
      };
      mockData.tasks.unshift(newTask);
      return res.status(201).json({ success: true, data: newTask, message: 'Task assigned successfully' });
    }

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy,
      dueDate,
      priority
    });

    await task.save();
    res.status(201).json({ success: true, data: task, message: 'Task assigned successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: mockData.tasks });
    }
    const { role, employeeProfileId } = req.user;
    let query = {};
    
    // Employees only see their own tasks. Admins/Managers see all.
    if (role === 'EMPLOYEE') {
      query = { assignedTo: employeeProfileId };
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'personalDetails employeeCode')
      .populate('assignedBy', 'personalDetails')
      .sort({ dueDate: 1 });
      
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findByIdAndUpdate(id, { status }, { new: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.json({ success: true, data: task, message: `Task moved to ${status.replace('_', ' ')}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
