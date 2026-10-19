import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Task } from './src/models/Task.js';
import { Employee } from './src/models/Employee.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedTasks = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cbdp';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for task seeding.');

    // Find Sarah Jenkins & Admin employee profiles
    const sarah = await Employee.findOne({ employeeCode: 'CBDP-EMP-001' });
    const admin = await Employee.findOne({ employeeCode: 'CBDP-ADMIN-001' });

    if (!sarah || !admin) {
      console.log('Sarah or Admin employee profile not found. Please run seedEmployee.js & seedAdmin.js first.');
      process.exit(0);
    }

    // Check existing tasks for Sarah
    const existing = await Task.countDocuments({ assignedTo: sarah._id });
    if (existing > 0) {
      console.log(`Sarah already has ${existing} tasks in MongoDB.`);
      process.exit(0);
    }

    const tasksToCreate = [
      {
        title: 'Complete Annual Workplace Safety Compliance & Fire Drill Log',
        description: 'Review the updated 2026 OSHA protocols and submit the quarterly facility evacuation inspection report.',
        instructions: '1. Inspect emergency exits and first aid kits on floor 3.\n2. Complete the standardized inspection checklist.\n3. Upload the signed inspection log in PDF or Word format.',
        assignedTo: sarah._id,
        assignedBy: admin._id,
        dueDate: new Date(Date.now() + 7 * 86400000), // Due in 7 days
        priority: 'HIGH',
        status: 'AWAITING_ACCEPTANCE',
        acceptanceStatus: 'PENDING',
        attachments: [],
        submissions: [],
        messages: [],
        timeline: [
          {
            action: 'ASSIGNED',
            actorId: admin._id,
            actorName: 'System Admin',
            actorRole: 'SUPER_ADMIN',
            timestamp: new Date(),
            details: 'Task assigned to Sarah Jenkins'
          }
        ]
      },
      {
        title: 'Deliver Regional Operations Budget & Vendor Cost Analysis',
        description: 'Prepare breakdown of Q3 vendor invoices, transportation expenditure, and cost optimization opportunities.',
        instructions: 'Please assemble the cost spreadsheet with variance analysis compared to Q2 and attach relevant vendor receipts/documents.',
        assignedTo: sarah._id,
        assignedBy: admin._id,
        dueDate: new Date(Date.now() + 12 * 86400000), // Due in 12 days
        priority: 'URGENT',
        status: 'IN_PROGRESS',
        acceptanceStatus: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 3600000),
        attachments: [],
        submissions: [],
        messages: [
          {
            messageId: 'msg-001',
            senderId: admin._id,
            senderName: 'System Admin',
            senderRole: 'SUPER_ADMIN',
            text: 'Please ensure transportation fuel surcharges are verified against last week receipts.',
            createdAt: new Date(Date.now() - 1800000)
          }
        ],
        timeline: [
          {
            action: 'ASSIGNED',
            actorId: admin._id,
            actorName: 'System Admin',
            actorRole: 'SUPER_ADMIN',
            timestamp: new Date(Date.now() - 86400000),
            details: 'Task assigned to Sarah Jenkins'
          },
          {
            action: 'ACCEPTED',
            actorId: sarah._id,
            actorName: 'Sarah Jenkins',
            actorRole: 'EMPLOYEE',
            timestamp: new Date(Date.now() - 3600000),
            details: 'Sarah Jenkins accepted the task assignment'
          },
          {
            action: 'IN_PROGRESS',
            actorId: sarah._id,
            actorName: 'Sarah Jenkins',
            actorRole: 'EMPLOYEE',
            timestamp: new Date(Date.now() - 3500000),
            details: 'Work started on deliverables'
          }
        ]
      },
      {
        title: 'Q3 Department Operations Policy Document Finalization',
        description: 'Review policy draft with cross-department managers and submit finalized handbook revisions.',
        instructions: 'Highlight changes in yellow and provide a summary of legal review recommendations.',
        assignedTo: sarah._id,
        assignedBy: admin._id,
        dueDate: new Date(Date.now() + 3 * 86400000),
        priority: 'MEDIUM',
        status: 'REVISION_REQUIRED',
        acceptanceStatus: 'ACCEPTED',
        acceptedAt: new Date(Date.now() - 172800000),
        attachments: [],
        submissions: [
          {
            version: 1,
            submittedAt: new Date(Date.now() - 86400000),
            notes: 'First draft of the updated operations handbook with appendix A.',
            files: [
              {
                fileId: 'sub-f-01',
                name: 'Operations_Policy_v1.docx',
                originalName: 'Operations_Policy_v1.docx',
                path: '',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                size: 342000,
                uploadedAt: new Date(Date.now() - 86400000)
              }
            ],
            status: 'REVISION_REQUIRED',
            reviewedAt: new Date(Date.now() - 43200000),
            reviewedBy: admin._id,
            feedback: 'Please expand Section 4 regarding remote work equipment maintenance and re-upload.'
          }
        ],
        messages: [
          {
            messageId: 'msg-002',
            senderId: admin._id,
            senderName: 'System Admin',
            senderRole: 'SUPER_ADMIN',
            text: 'Hi Sarah, Section 4 needs clarification on laptop warranty protocol before final approval.',
            createdAt: new Date(Date.now() - 43000000)
          }
        ],
        timeline: [
          {
            action: 'ASSIGNED',
            actorId: admin._id,
            actorName: 'System Admin',
            actorRole: 'SUPER_ADMIN',
            timestamp: new Date(Date.now() - 200000000),
            details: 'Task assigned to Sarah Jenkins'
          },
          {
            action: 'ACCEPTED',
            actorId: sarah._id,
            actorName: 'Sarah Jenkins',
            actorRole: 'EMPLOYEE',
            timestamp: new Date(Date.now() - 172800000),
            details: 'Accepted by Sarah Jenkins'
          },
          {
            action: 'SUBMITTED',
            actorId: sarah._id,
            actorName: 'Sarah Jenkins',
            actorRole: 'EMPLOYEE',
            timestamp: new Date(Date.now() - 86400000),
            details: 'Submission v1 uploaded (1 file)'
          },
          {
            action: 'REVISION_REQUIRED',
            actorId: admin._id,
            actorName: 'System Admin',
            actorRole: 'SUPER_ADMIN',
            timestamp: new Date(Date.now() - 43200000),
            details: 'HR requested revisions on Section 4'
          }
        ]
      }
    ];

    await Task.insertMany(tasksToCreate);
    console.log(`Successfully seeded ${tasksToCreate.length} test tasks for Sarah Jenkins in MongoDB!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding tasks:', error);
    process.exit(1);
  }
};

seedTasks();
