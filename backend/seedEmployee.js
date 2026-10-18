import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from './src/models/User.js';
import { Employee } from './src/models/Employee.js';
import { AttendanceRecord } from './src/models/AttendanceRecord.js';
import { LeaveApplication } from './src/models/Leave.js';
import { Payroll } from './src/models/Payroll.js';
import { Expense } from './src/models/Expense.js';
import { Shift } from './src/models/Shift.js';
import { ShiftAssignment } from './src/models/ShiftAssignment.js';
import { Notice } from './src/models/Notice.js';
import { hashPassword } from './src/utils/authUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedEmployeeData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cbdp';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected successfully');

    const email = 'employee@cbdp.org';
    const password = 'ABCabc@123';

    // 1. Create or Find Employee Profile
    let employee = await Employee.findOne({ employeeCode: 'CBDP-EMP-001' });
    if (!employee) {
      employee = new Employee({
        employeeCode: 'CBDP-EMP-001',
        personalDetails: {
          firstName: 'Sarah',
          lastName: 'Jenkins',
          dob: new Date('1992-06-14'),
          phone: '+1 (555) 234-5678',
          contactAddress: '142 Green Avenue, Silicon Valley, CA'
        },
        jobDetails: {
          title: 'Senior Operations Officer',
          employmentType: 'FULL_TIME',
          joinDate: new Date('2023-01-15'),
          status: 'ACTIVE'
        },
        bankDetails: {
          accountNumber: '**** **** 8249',
          routingNumber: '021000021',
          taxId: 'US-928-11-4820'
        }
      });
      await employee.save();
      console.log('Created Employee Profile: Sarah Jenkins (CBDP-EMP-001)');
    } else {
      console.log('Employee Profile already exists: Sarah Jenkins');
    }

    // 2. Create or Update User Login
    const hashedPassword = await hashPassword(password);
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        passwordHash: hashedPassword,
        role: 'EMPLOYEE',
        employeeProfileId: employee._id,
        isActive: true
      });
      await user.save();
      console.log('Created Employee User: employee@cbdp.org / ABCabc@123');
    } else {
      user.passwordHash = hashedPassword;
      user.employeeProfileId = employee._id;
      user.role = 'EMPLOYEE';
      await user.save();
      console.log('Updated Employee User: employee@cbdp.org');
    }

    // 3. Shift and Assignment
    let shift = await Shift.findOne({ name: 'Standard Day Shift' });
    if (!shift) {
      shift = new Shift({
        name: 'Standard Day Shift',
        startTime: '09:00',
        endTime: '17:00',
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        isActive: true
      });
      await shift.save();
      console.log('Created Standard Day Shift (09:00 - 17:00)');
    }

    let assignment = await ShiftAssignment.findOne({ employeeId: employee._id, isActive: true });
    if (!assignment) {
      assignment = new ShiftAssignment({
        employeeId: employee._id,
        shiftId: shift._id,
        isActive: true
      });
      await assignment.save();
      console.log('Assigned Shift to Sarah Jenkins');
    }

    // 4. Sample Attendance Records (Past 5 days + today)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Seed recent days attendance
    for (let i = 4; i >= 1; i--) {
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - i);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      const exists = await AttendanceRecord.findOne({ employeeId: employee._id, date: pastDateStr });
      if (!exists) {
        const inTime = new Date(`${pastDateStr}T09:02:00`);
        const outTime = new Date(`${pastDateStr}T17:35:00`);
        const workMins = Math.floor((outTime - inTime) / 60000);

        await new AttendanceRecord({
          employeeId: employee._id,
          date: pastDateStr,
          checkIn: { timestamp: inTime, ip: '192.168.1.104' },
          checkOut: { timestamp: outTime, ip: '192.168.1.104' },
          totalWorkMinutes: workMins,
          status: 'PRESENT'
        }).save();
      }
    }

    // Ensure today's check-in exists for instant demo satisfaction
    let todayRecord = await AttendanceRecord.findOne({ employeeId: employee._id, date: todayStr });
    if (!todayRecord) {
      const todayCheckIn = new Date();
      todayCheckIn.setHours(9, 5, 0, 0);

      todayRecord = new AttendanceRecord({
        employeeId: employee._id,
        date: todayStr,
        checkIn: { timestamp: todayCheckIn, ip: '127.0.0.1' },
        status: 'PRESENT'
      });
      await todayRecord.save();
      console.log('Seeded today check-in for Sarah Jenkins (09:05 AM)');
    }

    // 5. Seed Leave Applications
    const existingLeaves = await LeaveApplication.countDocuments({ employeeId: employee._id });
    if (existingLeaves === 0) {
      await LeaveApplication.create([
        {
          employeeId: employee._id,
          leaveType: 'ANNUAL',
          startDate: new Date('2026-11-10'),
          endDate: new Date('2026-11-14'),
          totalDays: 5,
          reason: 'Annual family retreat and vacation',
          status: 'APPROVED'
        },
        {
          employeeId: employee._id,
          leaveType: 'SICK',
          startDate: new Date('2026-10-05'),
          endDate: new Date('2026-10-06'),
          totalDays: 2,
          reason: 'Severe seasonal flu with medical prescription',
          status: 'APPROVED'
        },
        {
          employeeId: employee._id,
          leaveType: 'CASUAL',
          startDate: new Date('2026-10-28'),
          endDate: new Date('2026-10-29'),
          totalDays: 2,
          reason: 'Personal family commitment and appointment',
          status: 'PENDING'
        }
      ]);
      console.log('Seeded 3 leave applications for Sarah Jenkins');
    }

    // 6. Seed Payslips
    const existingPayroll = await Payroll.countDocuments({ employeeId: employee._id });
    if (existingPayroll === 0) {
      await Payroll.create([
        {
          employeeId: employee._id,
          month: 10,
          year: 2026,
          baseSalary: 6200,
          allowances: 600,
          deductions: 300,
          netSalary: 6500,
          status: 'APPROVED'
        },
        {
          employeeId: employee._id,
          month: 9,
          year: 2026,
          baseSalary: 6200,
          allowances: 600,
          deductions: 300,
          netSalary: 6500,
          status: 'PAID'
        },
        {
          employeeId: employee._id,
          month: 8,
          year: 2026,
          baseSalary: 6200,
          allowances: 600,
          deductions: 300,
          netSalary: 6500,
          status: 'PAID'
        }
      ]);
      console.log('Seeded 3 payslips for Sarah Jenkins');
    }

    // 7. Seed Expense Claims
    const existingExpenses = await Expense.countDocuments({ employeeId: employee._id });
    if (existingExpenses === 0) {
      await Expense.create([
        {
          employeeId: employee._id,
          expenseType: 'TRAVEL',
          amount: 145.50,
          currency: 'USD',
          dateIncurred: new Date('2026-10-12'),
          description: 'Client coordination travel & cab fare to regional partner office',
          status: 'PENDING'
        },
        {
          employeeId: employee._id,
          expenseType: 'MEALS',
          amount: 68.20,
          currency: 'USD',
          dateIncurred: new Date('2026-10-08'),
          description: 'Lunch meeting with community program stakeholders',
          status: 'APPROVED'
        },
        {
          employeeId: employee._id,
          expenseType: 'SUPPLIES',
          amount: 89.00,
          currency: 'USD',
          dateIncurred: new Date('2026-09-22'),
          description: 'Workshop stationery and project flipcharts',
          status: 'REIMBURSED'
        }
      ]);
      console.log('Seeded 3 expense claims for Sarah Jenkins');
    }

    // 8. Seed Notices if none exist
    const noticeCount = await Notice.countDocuments();
    if (noticeCount === 0) {
      await Notice.create([
        {
          title: 'Quarterly All-Hands Meeting & Strategy Review',
          content: 'Join us this Thursday at 2:00 PM for the CBDP quarterly strategic overview and team achievements presentation.',
          authorId: employee._id,
          isActive: true
        },
        {
          title: 'Annual Health & Wellness Benefit Enrollment',
          content: 'Open enrollment for healthcare coverage and wellness benefits is open until the end of the month. Please review your profile details.',
          authorId: employee._id,
          isActive: true
        },
        {
          title: 'Holiday Schedule & Operations Notice',
          content: 'CBDP offices will observe the upcoming national holiday. Emergency contact guidelines have been distributed via email.',
          authorId: employee._id,
          isActive: true
        }
      ]);
      console.log('Seeded 3 company notices');
    }

    console.log('\n=========================================');
    console.log('SUCCESS! Seeded Employee Portal test data:');
    console.log('Email:    employee@cbdp.org');
    console.log('Password: ABCabc@123');
    console.log('Role:     EMPLOYEE');
    console.log('Name:     Sarah Jenkins');
    console.log('Code:     CBDP-EMP-001');
    console.log('=========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedEmployeeData();
