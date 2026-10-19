import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { Task } from '../models/Task.js';
import { Notification } from '../models/Notification.js';
import { Employee } from '../models/Employee.js';
import { isDemoMode } from '../config/db.js';
import { mockData } from '../services/mockDataService.js';
import { getUploadDirectory } from '../utils/fileUpload.js';

// Helper to check if user has HR administrative rights
const isHrAdmin = (user) => {
  return ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'].includes(user?.role);
};

// Helper to get employee ID from user
const getEmployeeId = (user) => {
  if (!user) return null;
  if (user.employeeProfileId?._id) return user.employeeProfileId._id.toString();
  if (user.employeeProfileId) return user.employeeProfileId.toString();
  return null;
};

// Helper to get employee name from user
const getEmployeeName = (user) => {
  if (user?.employeeProfileId?.personalDetails) {
    const { firstName, lastName } = user.employeeProfileId.personalDetails;
    return `${firstName || ''} ${lastName || ''}`.trim() || user.email;
  }
  return user?.email?.split('@')[0] || 'User';
};

// Helper to push in-app notification
const createNotification = async ({ recipientId, title, message, type = 'TASK', link = '' }) => {
  try {
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      mockData.notifications = mockData.notifications || [];
      mockData.notifications.unshift({
        _id: 'notif-' + Date.now() + '-' + Math.round(Math.random() * 1000),
        recipientId,
        title,
        message,
        type,
        link,
        isRead: false,
        createdAt: new Date().toISOString()
      });
      return;
    }

    if (recipientId) {
      await Notification.create({
        recipientId,
        title,
        message,
        type,
        link
      });
    }
  } catch (err) {
    console.error('[Notification Helper Error]:', err.message);
  }
};

// 1. Create and Assign Task (HR/Admin)
export const createTask = async (req, res) => {
  try {
    const assignedById = getEmployeeId(req.user) || mockData.adminEmployee?._id;
    const { title, description, instructions, assignedTo, dueDate, priority } = req.body;

    if (!title || !assignedTo || !dueDate) {
      return res.status(400).json({ success: false, message: 'Title, assignee, and due date are required' });
    }

    // Process uploaded initial files/attachments from HR
    const attachments = (req.files || []).map((file) => ({
      fileId: 'att-' + Date.now() + '-' + Math.round(Math.random() * 1e6),
      name: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date()
    }));

    const actorName = getEmployeeName(req.user);

    // In-memory demo fallback
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const assignedEmp = mockData.employees?.find(e => e._id.toString() === assignedTo.toString()) || mockData.employees[1] || mockData.adminEmployee;
      const newTask = {
        _id: 'task-' + Date.now(),
        title,
        description: description || '',
        instructions: instructions || '',
        assignedTo: assignedEmp,
        assignedBy: mockData.adminEmployee,
        dueDate: dueDate,
        priority: priority || 'MEDIUM',
        status: 'AWAITING_ACCEPTANCE',
        acceptanceStatus: 'PENDING',
        attachments,
        submissions: [],
        messages: [],
        timeline: [
          {
            action: 'ASSIGNED',
            actorName,
            actorRole: req.user?.role || 'SUPER_ADMIN',
            timestamp: new Date(),
            details: `Task assigned to ${assignedEmp.personalDetails?.firstName || 'Employee'}`
          }
        ],
        createdAt: new Date().toISOString()
      };

      mockData.tasks = mockData.tasks || [];
      mockData.tasks.unshift(newTask);

      // Notify employee
      await createNotification({
        recipientId: assignedTo,
        title: `New Task Assigned: ${title}`,
        message: `HR assigned you a new task. Please review the details and accept the assignment.`,
        type: 'TASK',
        link: `/employee/tasks?taskId=${newTask._id}`
      });

      return res.status(201).json({ success: true, data: newTask, message: 'Task assigned successfully' });
    }

    const task = new Task({
      title,
      description: description || '',
      instructions: instructions || '',
      assignedTo,
      assignedBy: assignedById,
      dueDate,
      priority: priority || 'MEDIUM',
      status: 'AWAITING_ACCEPTANCE',
      acceptanceStatus: 'PENDING',
      attachments,
      submissions: [],
      messages: [],
      timeline: [
        {
          action: 'ASSIGNED',
          actorId: assignedById,
          actorName,
          actorRole: req.user.role,
          timestamp: new Date(),
          details: 'Task created and assigned by HR'
        }
      ]
    });

    await task.save();

    // Populate employee details for response
    await task.populate('assignedTo', 'personalDetails employeeCode jobDetails');
    await task.populate('assignedBy', 'personalDetails employeeCode');

    // Notify employee
    await createNotification({
      recipientId: assignedTo,
      title: `New Task Assigned: ${title}`,
      message: `HR assigned you a new task with deadline ${new Date(dueDate).toLocaleDateString()}. Please review and accept.`,
      type: 'TASK',
      link: `/employee/tasks?taskId=${task._id}`
    });

    res.status(201).json({ success: true, data: task, message: 'Task assigned successfully' });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2. Get All Tasks (Role-based access enforcement)
export const getTasks = async (req, res) => {
  try {
    const user = req.user;
    const currentEmpId = getEmployeeId(user);

    // In-memory demo mode fallback
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      let filteredTasks = mockData.tasks || [];
      if (!isHrAdmin(user)) {
        // Strict employee isolation
        filteredTasks = filteredTasks.filter(t => {
          const tEmpId = t.assignedTo?._id?.toString() || t.assignedTo?.toString();
          return tEmpId === currentEmpId;
        });
      }
      return res.json({ success: true, data: filteredTasks });
    }

    let query = {};

    // STRICT ACCESS CONTROL:
    // Regular employees CANNOT see any tasks other than their own!
    if (!isHrAdmin(user)) {
      if (!currentEmpId) {
        return res.json({ success: true, data: [] });
      }
      query = { assignedTo: currentEmpId };
    } else {
      // HR/Admin can apply filters
      const { employeeId, status, priority, search } = req.query;
      if (employeeId) query.assignedTo = employeeId;
      if (status && status !== 'ALL') query.status = status;
      if (priority && priority !== 'ALL') query.priority = priority;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'personalDetails employeeCode jobDetails')
      .populate('assignedBy', 'personalDetails employeeCode')
      .populate('submissions.reviewedBy', 'personalDetails employeeCode')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Single Task By ID (With security check)
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const currentEmpId = getEmployeeId(user);

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const task = (mockData.tasks || []).find(t => t._id.toString() === id.toString());
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      // Enforce access control
      const assignedEmpId = task.assignedTo?._id?.toString() || task.assignedTo?.toString();
      if (!isHrAdmin(user) && assignedEmpId !== currentEmpId) {
        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this task' });
      }

      return res.json({ success: true, data: task });
    }

    const task = await Task.findById(id)
      .populate('assignedTo', 'personalDetails employeeCode jobDetails')
      .populate('assignedBy', 'personalDetails employeeCode')
      .populate('submissions.reviewedBy', 'personalDetails employeeCode');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // STRICT ACCESS CONTROL
    const assignedEmpId = task.assignedTo?._id?.toString() || task.assignedTo?.toString();
    if (!isHrAdmin(user) && assignedEmpId !== currentEmpId) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this task' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Error getting task by id:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Employee Accepts Task
export const acceptTask = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const currentEmpId = getEmployeeId(user);
    const actorName = getEmployeeName(user);

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const task = (mockData.tasks || []).find(t => t._id.toString() === id.toString());
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      task.status = 'ACCEPTED';
      task.acceptanceStatus = 'ACCEPTED';
      task.acceptedAt = new Date().toISOString();
      task.timeline = task.timeline || [];
      task.timeline.unshift({
        action: 'ACCEPTED',
        actorName,
        actorRole: user.role,
        timestamp: new Date(),
        details: 'Task assignment accepted by employee'
      });

      // Notify HR
      await createNotification({
        recipientId: task.assignedBy?._id || mockData.adminEmployee._id,
        title: `Task Accepted: ${task.title}`,
        message: `${actorName} has accepted the assigned task.`,
        type: 'TASK',
        link: `/task?taskId=${task._id}`
      });

      return res.json({ success: true, data: task, message: 'Task accepted successfully' });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Validate that current user is the assigned employee
    const assignedEmpId = task.assignedTo?.toString();
    if (assignedEmpId !== currentEmpId && !isHrAdmin(user)) {
      return res.status(403).json({ success: false, message: 'Only the assigned employee can accept this task' });
    }

    task.status = 'ACCEPTED';
    task.acceptanceStatus = 'ACCEPTED';
    task.acceptedAt = new Date();

    task.timeline.unshift({
      action: 'ACCEPTED',
      actorId: currentEmpId,
      actorName,
      actorRole: user.role,
      timestamp: new Date(),
      details: 'Task assignment accepted by employee'
    });

    await task.save();
    await task.populate('assignedTo', 'personalDetails employeeCode jobDetails');
    await task.populate('assignedBy', 'personalDetails employeeCode');

    // Notify HR
    await createNotification({
      recipientId: task.assignedBy?._id || task.assignedBy,
      title: `Task Accepted: ${task.title}`,
      message: `${actorName} has accepted the assigned task.`,
      type: 'TASK',
      link: `/task?taskId=${task._id}`
    });

    res.json({ success: true, data: task, message: 'Task accepted successfully' });
  } catch (error) {
    console.error('Error accepting task:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// 5. Employee Starts Task (Transitions to IN_PROGRESS)
export const startTask = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const currentEmpId = getEmployeeId(user);
    const actorName = getEmployeeName(user);

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const task = (mockData.tasks || []).find(t => t._id.toString() === id.toString());
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
      task.status = 'IN_PROGRESS';
      task.timeline = task.timeline || [];
      task.timeline.unshift({
        action: 'IN_PROGRESS',
        actorName,
        actorRole: user.role,
        timestamp: new Date(),
        details: 'Employee began active work on the deliverable'
      });
      return res.json({ success: true, data: task, message: 'Task is now in progress' });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const assignedEmpId = task.assignedTo?.toString();
    if (assignedEmpId !== currentEmpId && !isHrAdmin(user)) {
      return res.status(403).json({ success: false, message: 'Only the assigned employee can start this task' });
    }

    task.status = 'IN_PROGRESS';
    task.timeline.unshift({
      action: 'IN_PROGRESS',
      actorId: currentEmpId,
      actorName,
      actorRole: user.role,
      timestamp: new Date(),
      details: 'Employee began active work on the deliverable'
    });

    await task.save();
    res.json({ success: true, data: task, message: 'Task is now in progress' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 6. Employee Submits Work (Multiple file formats + notes + versioning)
export const submitTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const user = req.user;
    const currentEmpId = getEmployeeId(user);
    const actorName = getEmployeeName(user);

    // Process submitted files
    const uploadedFiles = (req.files || []).map((file) => ({
      fileId: 'subfile-' + Date.now() + '-' + Math.round(Math.random() * 1e6),
      name: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date()
    }));

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const task = (mockData.tasks || []).find(t => t._id.toString() === id.toString());
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      task.submissions = task.submissions || [];
      const newVersion = task.submissions.length + 1;
      const isResubmission = task.status === 'REVISION_REQUIRED';

      const newSubmission = {
        _id: 'sub-' + Date.now(),
        version: newVersion,
        submittedAt: new Date().toISOString(),
        notes: notes || '',
        files: uploadedFiles,
        status: 'SUBMITTED',
        feedback: ''
      };

      task.submissions.unshift(newSubmission);
      task.status = isResubmission ? 'RESUBMITTED' : 'SUBMITTED';

      task.timeline = task.timeline || [];
      task.timeline.unshift({
        action: isResubmission ? 'RESUBMITTED' : 'SUBMITTED',
        actorName,
        actorRole: user.role,
        timestamp: new Date(),
        details: `Work submitted (Version ${newVersion}) with ${uploadedFiles.length} file(s).`
      });

      // Notify HR
      await createNotification({
        recipientId: task.assignedBy?._id || mockData.adminEmployee._id,
        title: `${isResubmission ? 'Work Resubmitted' : 'Work Submitted'}: ${task.title}`,
        message: `${actorName} submitted Version ${newVersion} deliverables for review.`,
        type: 'TASK',
        link: `/task?taskId=${task._id}`
      });

      return res.json({ success: true, data: task, message: 'Deliverables submitted successfully' });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const assignedEmpId = task.assignedTo?.toString();
    if (assignedEmpId !== currentEmpId && !isHrAdmin(user)) {
      return res.status(403).json({ success: false, message: 'Only the assigned employee can submit work for this task' });
    }

    const newVersion = (task.submissions?.length || 0) + 1;
    const isResubmission = task.status === 'REVISION_REQUIRED';

    const newSubmission = {
      version: newVersion,
      submittedAt: new Date(),
      notes: notes || '',
      files: uploadedFiles,
      status: 'SUBMITTED',
      feedback: ''
    };

    task.submissions.unshift(newSubmission);
    task.status = isResubmission ? 'RESUBMITTED' : 'SUBMITTED';

    task.timeline.unshift({
      action: isResubmission ? 'RESUBMITTED' : 'SUBMITTED',
      actorId: currentEmpId,
      actorName,
      actorRole: user.role,
      timestamp: new Date(),
      details: `Work submitted (Version ${newVersion}) with ${uploadedFiles.length} file(s).`
    });

    await task.save();
    await task.populate('assignedTo', 'personalDetails employeeCode jobDetails');
    await task.populate('assignedBy', 'personalDetails employeeCode');

    // Notify HR
    await createNotification({
      recipientId: task.assignedBy?._id || task.assignedBy,
      title: `${isResubmission ? 'Work Resubmitted' : 'Work Submitted'}: ${task.title}`,
      message: `${actorName} submitted Version ${newVersion} deliverables for review.`,
      type: 'TASK',
      link: `/task?taskId=${task._id}`
    });

    res.json({ success: true, data: task, message: 'Deliverables submitted successfully' });
  } catch (error) {
    console.error('Error submitting task:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// 7. HR Review Management (Under Review, Request Revision, Approve / Complete)
export const reviewTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, feedback } = req.body;
    const user = req.user;
    const hrEmpId = getEmployeeId(user);
    const actorName = getEmployeeName(user);

    if (!isHrAdmin(user)) {
      return res.status(403).json({ success: false, message: 'Only HR administrators can review task submissions' });
    }

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const task = (mockData.tasks || []).find(t => t._id.toString() === id.toString());
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      const latestSub = task.submissions?.[0];

      if (action === 'UNDER_REVIEW') {
        task.status = 'UNDER_REVIEW';
        if (latestSub) latestSub.status = 'UNDER_REVIEW';
        task.timeline.unshift({
          action: 'UNDER_REVIEW',
          actorName,
          actorRole: user.role,
          timestamp: new Date(),
          details: 'HR began active review of submitted deliverables'
        });
      } else if (action === 'REQUEST_REVISION') {
        task.status = 'REVISION_REQUIRED';
        if (latestSub) {
          latestSub.status = 'REVISION_REQUIRED';
          latestSub.feedback = feedback || 'Revisions required';
          latestSub.reviewedAt = new Date().toISOString();
        }
        task.timeline.unshift({
          action: 'REVISION_REQUIRED',
          actorName,
          actorRole: user.role,
          timestamp: new Date(),
          details: `HR requested corrections: ${feedback || 'Please update and resubmit'}`
        });

        // Notify employee
        await createNotification({
          recipientId: task.assignedTo?._id || task.assignedTo,
          title: `Revision Requested: ${task.title}`,
          message: `HR reviewed your submission and requested revisions: "${feedback || 'Please see details'}"`,
          type: 'TASK',
          link: `/employee/tasks?taskId=${task._id}`
        });
      } else if (action === 'APPROVE') {
        task.status = 'COMPLETED';
        if (latestSub) {
          latestSub.status = 'APPROVED';
          latestSub.feedback = feedback || 'Approved without issues';
          latestSub.reviewedAt = new Date().toISOString();
        }
        task.timeline.unshift({
          action: 'COMPLETED',
          actorName,
          actorRole: user.role,
          timestamp: new Date(),
          details: `HR approved the final deliverable. Task marked as completed.`
        });

        // Notify employee
        await createNotification({
          recipientId: task.assignedTo?._id || task.assignedTo,
          title: `Task Approved: ${task.title}`,
          message: `Congratulations! Your deliverable has been approved and the task is complete.`,
          type: 'TASK',
          link: `/employee/tasks?taskId=${task._id}`
        });
      }

      return res.json({ success: true, data: task, message: `Task status updated to ${task.status}` });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const latestSub = task.submissions?.[0];

    if (action === 'UNDER_REVIEW') {
      task.status = 'UNDER_REVIEW';
      if (latestSub) latestSub.status = 'UNDER_REVIEW';
      task.timeline.unshift({
        action: 'UNDER_REVIEW',
        actorId: hrEmpId,
        actorName,
        actorRole: user.role,
        timestamp: new Date(),
        details: 'HR began active review of submitted deliverables'
      });
    } else if (action === 'REQUEST_REVISION') {
      task.status = 'REVISION_REQUIRED';
      if (latestSub) {
        latestSub.status = 'REVISION_REQUIRED';
        latestSub.feedback = feedback || 'Revisions required';
        latestSub.reviewedAt = new Date();
        latestSub.reviewedBy = hrEmpId;
      }
      task.timeline.unshift({
        action: 'REVISION_REQUIRED',
        actorId: hrEmpId,
        actorName,
        actorRole: user.role,
        timestamp: new Date(),
        details: `HR requested corrections: ${feedback || 'Please update and resubmit'}`
      });

      // Notify employee
      await createNotification({
        recipientId: task.assignedTo,
        title: `Revision Requested: ${task.title}`,
        message: `HR reviewed your submission and requested revisions: "${feedback || 'Please review notes and submit an updated version.'}"`,
        type: 'TASK',
        link: `/employee/tasks?taskId=${task._id}`
      });
    } else if (action === 'APPROVE') {
      task.status = 'COMPLETED';
      if (latestSub) {
        latestSub.status = 'APPROVED';
        latestSub.feedback = feedback || 'Approved without issues';
        latestSub.reviewedAt = new Date();
        latestSub.reviewedBy = hrEmpId;
      }
      task.timeline.unshift({
        action: 'COMPLETED',
        actorId: hrEmpId,
        actorName,
        actorRole: user.role,
        timestamp: new Date(),
        details: `HR approved the final deliverable. Task marked as completed.`
      });

      // Notify employee
      await createNotification({
        recipientId: task.assignedTo,
        title: `Task Approved: ${task.title}`,
        message: `Congratulations! Your deliverable has been approved and the task is complete.`,
        type: 'TASK',
        link: `/employee/tasks?taskId=${task._id}`
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid review action. Allowed: UNDER_REVIEW, REQUEST_REVISION, APPROVE' });
    }

    await task.save();
    await task.populate('assignedTo', 'personalDetails employeeCode jobDetails');
    await task.populate('assignedBy', 'personalDetails employeeCode');
    await task.populate('submissions.reviewedBy', 'personalDetails employeeCode');

    res.json({ success: true, data: task, message: `Task status updated to ${task.status}` });
  } catch (error) {
    console.error('Error reviewing task:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// 8. Add Message to Task Discussion Thread
export const addTaskMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const user = req.user;
    const currentEmpId = getEmployeeId(user);
    const actorName = getEmployeeName(user);

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
    }

    const newMessage = {
      messageId: 'msg-' + Date.now() + '-' + Math.round(Math.random() * 1e6),
      senderId: currentEmpId,
      senderName: actorName,
      senderRole: user.role,
      text: text.trim(),
      createdAt: new Date()
    };

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const task = (mockData.tasks || []).find(t => t._id.toString() === id.toString());
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      task.messages = task.messages || [];
      task.messages.push(newMessage);

      // Notify other party
      const isSenderHR = isHrAdmin(user);
      const recipientId = isSenderHR ? (task.assignedTo?._id || task.assignedTo) : (task.assignedBy?._id || mockData.adminEmployee._id);

      await createNotification({
        recipientId,
        title: `New Message on Task: ${task.title}`,
        message: `${actorName}: ${text.length > 60 ? text.substring(0, 57) + '...' : text}`,
        type: 'TASK',
        link: isSenderHR ? `/employee/tasks?taskId=${task._id}` : `/task?taskId=${task._id}`
      });

      return res.json({ success: true, data: newMessage, message: 'Message posted' });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Validate access
    const assignedEmpId = task.assignedTo?.toString();
    if (!isHrAdmin(user) && assignedEmpId !== currentEmpId) {
      return res.status(403).json({ success: false, message: 'Not authorized to post messages on this task' });
    }

    task.messages.push(newMessage);
    await task.save();

    // Notify other party
    const isSenderHR = isHrAdmin(user);
    const recipientId = isSenderHR ? task.assignedTo : task.assignedBy;

    await createNotification({
      recipientId,
      title: `New Message on Task: ${task.title}`,
      message: `${actorName}: ${text.length > 60 ? text.substring(0, 57) + '...' : text}`,
      type: 'TASK',
      link: isSenderHR ? `/employee/tasks?taskId=${task._id}` : `/task?taskId=${task._id}`
    });

    res.json({ success: true, data: newMessage, message: 'Message posted' });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// 9. Secure File Download (Restricted to HR or Assigned Employee only)
export const downloadTaskFile = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const user = req.user;
    const currentEmpId = getEmployeeId(user);

    let task;
    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      task = (mockData.tasks || []).find(t => t._id.toString() === id.toString());
    } else {
      task = await Task.findById(id);
    }

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // STRICT ACCESS CONTROL:
    // Only HR administrators or the assigned employee can access task files!
    const assignedEmpId = task.assignedTo?._id?.toString() || task.assignedTo?.toString();
    if (!isHrAdmin(user) && assignedEmpId !== currentEmpId) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not have permission to download this file' });
    }

    // Find the requested file across HR attachments and submission versions
    let targetFile = null;
    if (task.attachments) {
      targetFile = task.attachments.find(f => f.fileId === fileId);
    }

    if (!targetFile && task.submissions) {
      for (const sub of task.submissions) {
        if (sub.files) {
          const match = sub.files.find(f => f.fileId === fileId);
          if (match) {
            targetFile = match;
            break;
          }
        }
      }
    }

    if (!targetFile) {
      return res.status(404).json({ success: false, message: 'Requested file attachment not found' });
    }

    const filePath = targetFile.path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server disk storage' });
    }

    // Safe download with original filename
    res.download(filePath, targetFile.originalName);
  } catch (error) {
    console.error('Error downloading task file:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Update Task Status (Direct status changer for Kanban / quick moves)
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;
    const actorName = getEmployeeName(user);

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const task = (mockData.tasks || []).find(t => t._id.toString() === id.toString());
      if (task) {
        task.status = status;
        task.timeline = task.timeline || [];
        task.timeline.unshift({
          action: status,
          actorName,
          actorRole: user.role,
          timestamp: new Date(),
          details: `Task status updated to ${status}`
        });
      }
      return res.json({ success: true, data: task, message: `Task moved to ${status}` });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.status = status;
    task.timeline.unshift({
      action: status,
      actorId: getEmployeeId(user),
      actorName,
      actorRole: user.role,
      timestamp: new Date(),
      details: `Task status updated to ${status}`
    });

    await task.save();
    res.json({ success: true, data: task, message: `Task moved to ${status}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 11. Edit Task Details (HR only)
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, instructions, dueDate, priority } = req.body;
    const user = req.user;
    const actorName = getEmployeeName(user);

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      const task = (mockData.tasks || []).find(t => t._id.toString() === id.toString());
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (instructions !== undefined) task.instructions = instructions;
      if (dueDate) task.dueDate = dueDate;
      if (priority) task.priority = priority;

      task.timeline.unshift({
        action: 'UPDATED',
        actorName,
        actorRole: user.role,
        timestamp: new Date(),
        details: 'Task details or deadline updated by HR'
      });

      return res.json({ success: true, data: task, message: 'Task updated successfully' });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (instructions !== undefined) task.instructions = instructions;
    if (dueDate) task.dueDate = dueDate;
    if (priority) task.priority = priority;

    task.timeline.unshift({
      action: 'UPDATED',
      actorId: getEmployeeId(user),
      actorName,
      actorRole: user.role,
      timestamp: new Date(),
      details: 'Task details or deadline updated by HR'
    });

    await task.save();
    res.json({ success: true, data: task, message: 'Task updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 12. Delete / Cancel Task (HR only)
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDemoMode() || mongoose.connection.readyState !== 1) {
      mockData.tasks = (mockData.tasks || []).filter(t => t._id.toString() !== id.toString());
      return res.json({ success: true, message: 'Task deleted successfully' });
    }

    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
