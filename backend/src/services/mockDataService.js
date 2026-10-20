import fs from 'fs';
import path from 'path';
import os from 'os';

const STORE_PATH = path.join(os.tmpdir(), 'cbdp_hrm_persistent_store.json');

// In-memory demo data store for CBDP HR platform
export const mockData = {
  adminUser: {
    _id: '6618d0987f83b1001a123456',
    email: 'mdnuruzzamanrazon@gmail.com',
    role: 'SUPER_ADMIN',
    employeeProfileId: '6618d0987f83b1001a123457',
    isTwoFactorEnabled: false,
    isActive: true,
    mustChangePassword: false,
    tokenVersion: 1,
  },

  employeeUser: {
    _id: '6618d0987f83b1001a123458',
    email: 'employee@cbdp.org',
    role: 'EMPLOYEE',
    employeeProfileId: '6618d0987f83b1001a123458',
    isTwoFactorEnabled: false,
    isActive: true,
    mustChangePassword: false,
    tokenVersion: 1,
  },

  users: [
    {
      _id: '6618d0987f83b1001a123456',
      email: 'mdnuruzzamanrazon@gmail.com',
      role: 'SUPER_ADMIN',
      employeeProfileId: '6618d0987f83b1001a123457',
      isTwoFactorEnabled: false,
      isActive: true,
      mustChangePassword: false,
      tokenVersion: 1,
    },
    {
      _id: '6618d0987f83b1001a123458',
      email: 'employee@cbdp.org',
      role: 'EMPLOYEE',
      employeeProfileId: '6618d0987f83b1001a123458',
      isTwoFactorEnabled: false,
      isActive: true,
      mustChangePassword: false,
      tokenVersion: 1,
    },
    {
      _id: 'user-emp-002',
      email: 'robert.chen@cbdp.org',
      role: 'EMPLOYEE',
      employeeProfileId: '6ad55c85756ca88a01f6bb5f',
      isTwoFactorEnabled: false,
      isActive: true,
      mustChangePassword: false,
      tokenVersion: 1,
    }
  ],

  adminEmployee: {
    _id: '6618d0987f83b1001a123457',
    employeeCode: 'CBDP-ADMIN-001',
    email: 'mdnuruzzamanrazon@gmail.com',
    userId: '6618d0987f83b1001a123456',
    isDeleted: false,
    personalDetails: {
      firstName: 'System',
      lastName: 'Admin',
      email: 'mdnuruzzamanrazon@gmail.com',
      phone: '+1 (555) 019-2834',
      dateOfBirth: '1990-05-15',
      gender: 'MALE',
    },
    jobDetails: {
      title: 'Chief Technology & HR Officer',
      department: 'Executive Management',
      joinDate: '2023-01-01',
      status: 'ACTIVE',
      employmentType: 'FULL_TIME',
    },
    compensation: {
      baseSalary: 125000,
      currency: 'USD',
    },
  },

  employees: [
    {
      _id: '6618d0987f83b1001a123457',
      employeeCode: 'CBDP-ADMIN-001',
      email: 'mdnuruzzamanrazon@gmail.com',
      userId: '6618d0987f83b1001a123456',
      isDeleted: false,
      personalDetails: { firstName: 'System', lastName: 'Admin', email: 'mdnuruzzamanrazon@gmail.com' },
      jobDetails: { title: 'Super Administrator', department: 'Executive Management', status: 'ACTIVE', joinDate: '2023-01-01', employmentType: 'FULL_TIME' },
      compensation: { baseSalary: 120000, currency: 'USD' },
      userAccount: {
        _id: '6618d0987f83b1001a123456',
        email: 'mdnuruzzamanrazon@gmail.com',
        role: 'SUPER_ADMIN',
        isActive: true,
        mustChangePassword: false,
        lastLoginAt: null
      }
    },
    {
      _id: '6618d0987f83b1001a123458',
      employeeCode: 'CBDP-EMP-001',
      email: 'employee@cbdp.org',
      userId: '6618d0987f83b1001a123458',
      isDeleted: false,
      personalDetails: { firstName: 'Sarah', lastName: 'Jenkins', email: 'employee@cbdp.org' },
      jobDetails: { title: 'Lead Software Architect', department: 'Engineering & Technology', status: 'ACTIVE', joinDate: '2023-03-15', employmentType: 'FULL_TIME' },
      compensation: { baseSalary: 105000, currency: 'USD' },
      userAccount: {
        _id: '6618d0987f83b1001a123458',
        email: 'employee@cbdp.org',
        role: 'EMPLOYEE',
        isActive: true,
        mustChangePassword: false,
        lastLoginAt: null
      }
    },
    {
      _id: '6ad55c85756ca88a01f6bb5f',
      employeeCode: 'CBDP-EMP-002',
      email: 'robert.chen@cbdp.org',
      userId: 'user-emp-002',
      isDeleted: false,
      personalDetails: { firstName: 'Robert', lastName: 'Chen', email: 'robert.chen@cbdp.org' },
      jobDetails: { title: 'Senior HR Specialist', department: 'Human Resources', status: 'ACTIVE', joinDate: '2023-06-01', employmentType: 'FULL_TIME' },
      compensation: { baseSalary: 78000, currency: 'USD' },
      userAccount: {
        _id: 'user-emp-002',
        email: 'robert.chen@cbdp.org',
        role: 'EMPLOYEE',
        isActive: true,
        mustChangePassword: false,
        lastLoginAt: null
      }
    },
  ],

  attendance: [
    {
      _id: 'att-001',
      employeeId: {
        _id: '6618d0987f83b1001a123457',
        employeeCode: 'CBDP-ADMIN-001',
        personalDetails: { firstName: 'System', lastName: 'Admin' }
      },
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      checkIn: '08:58 AM',
      checkOut: '05:30 PM',
      status: 'PRESENT',
      workHours: 8.5,
    },
    {
      _id: 'att-002',
      employeeId: {
        _id: '6618d0987f83b1001a123458',
        employeeCode: 'CBDP-ENG-002',
        personalDetails: { firstName: 'Sarah', lastName: 'Connor' }
      },
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      checkIn: '09:05 AM',
      checkOut: '06:00 PM',
      status: 'PRESENT',
      workHours: 8.9,
    },
    {
      _id: 'att-003',
      employeeId: {
        _id: '6618d0987f83b1001a123459',
        employeeCode: 'CBDP-HR-003',
        personalDetails: { firstName: 'Elena', lastName: 'Rostova' }
      },
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      checkIn: '09:18 AM',
      checkOut: null,
      status: 'LATE',
      workHours: 7.2,
    },
    {
      _id: 'att-004',
      employeeId: {
        _id: '6618d0987f83b1001a123460',
        employeeCode: 'CBDP-FIN-004',
        personalDetails: { firstName: 'Marcus', lastName: 'Vance' }
      },
      date: new Date().toISOString().split('T')[0],
      checkIn: '08:45 AM',
      checkOut: '05:15 PM',
      status: 'PRESENT',
      workHours: 8.5,
    },
  ],

  leaves: [
    {
      _id: 'leave-001',
      employeeId: {
        _id: '6618d0987f83b1001a123458',
        employeeCode: 'CBDP-ENG-002',
        personalDetails: { firstName: 'Sarah', lastName: 'Connor' }
      },
      leaveType: 'ANNUAL',
      startDate: '2026-10-18',
      endDate: '2026-10-22',
      daysCount: 5,
      reason: 'Family vacation and personal rejuvenation',
      status: 'APPROVED',
      appliedAt: '2026-10-10',
      createdAt: '2026-10-10',
    },
    {
      _id: 'leave-002',
      employeeId: {
        _id: '6618d0987f83b1001a123461',
        employeeCode: 'CBDP-MKT-005',
        personalDetails: { firstName: 'Aisha', lastName: 'Patel' }
      },
      leaveType: 'SICK',
      startDate: '2026-10-14',
      endDate: '2026-10-15',
      daysCount: 2,
      reason: 'Seasonal flu recovery',
      status: 'PENDING',
      appliedAt: '2026-10-12',
      createdAt: '2026-10-12',
    },
  ],

  payrolls: [
    {
      _id: 'pay-001',
      employeeId: {
        _id: '6618d0987f83b1001a123458',
        employeeCode: 'CBDP-ENG-002',
        personalDetails: { firstName: 'Sarah', lastName: 'Connor' }
      },
      payPeriod: 'October 2026',
      month: 10,
      year: 2026,
      baseSalary: 8750,
      allowances: 850,
      deductions: 620,
      netSalary: 8980,
      status: 'PAID',
      paymentDate: '2026-10-01',
    },
    {
      _id: 'pay-002',
      employeeId: {
        _id: '6618d0987f83b1001a123460',
        employeeCode: 'CBDP-FIN-004',
        personalDetails: { firstName: 'Marcus', lastName: 'Vance' }
      },
      payPeriod: 'October 2026',
      month: 10,
      year: 2026,
      baseSalary: 7916,
      allowances: 600,
      deductions: 540,
      netSalary: 7976,
      status: 'PAID',
      paymentDate: '2026-10-01',
    },
  ],

  shifts: [
    { _id: 'shift-1', name: 'Morning General', startTime: '09:00', endTime: '17:00', workingHours: 8, gracePeriodMinutes: 15 },
    { _id: 'shift-2', name: 'Evening Flex', startTime: '13:00', endTime: '21:00', workingHours: 8, gracePeriodMinutes: 15 },
    { _id: 'shift-3', name: 'Night Critical', startTime: '21:00', endTime: '05:00', workingHours: 8, gracePeriodMinutes: 15 },
  ],

  expenses: [
    {
      _id: 'exp-001',
      employeeId: {
        _id: '6618d0987f83b1001a123458',
        employeeCode: 'CBDP-ENG-002',
        personalDetails: { firstName: 'Sarah', lastName: 'Connor' }
      },
      category: 'TRAVEL',
      expenseType: 'TRAVEL',
      amount: 450.00,
      currency: 'USD',
      description: 'Flight ticket for Tech Summit 2026',
      status: 'APPROVED',
      dateIncurred: '2026-10-05',
      createdAt: '2026-10-05',
    },
    {
      _id: 'exp-002',
      employeeId: {
        _id: '6618d0987f83b1001a123462',
        employeeCode: 'CBDP-ENG-006',
        personalDetails: { firstName: 'David', lastName: 'Kim' }
      },
      category: 'EQUIPMENT',
      expenseType: 'EQUIPMENT',
      amount: 180.00,
      currency: 'USD',
      description: 'Ergonomic mechanical keyboard & trackpad',
      status: 'PENDING',
      dateIncurred: '2026-10-11',
      createdAt: '2026-10-11',
    },
  ],

  notices: [
    {
      _id: 'not-001',
      title: 'Annual Company Retreat 2026 Announced',
      content: 'We are thrilled to announce our 2026 Global Offsite scheduled for December 12-15 in San Francisco! RSVP via the HR portal.',
      category: 'GENERAL',
      priority: 'HIGH',
      author: 'HR Communications',
      createdAt: '2026-10-08',
    },
    {
      _id: 'not-002',
      title: 'Quarterly Security Compliance Review',
      content: 'All team members must complete the mandatory 2FA security audit and password hygiene check by October 31st.',
      category: 'SECURITY',
      priority: 'MEDIUM',
      author: 'IT Security Team',
      createdAt: '2026-10-11',
    },
  ],

  tasks: [
    {
      _id: 'task-001',
      title: 'Complete Annual Workplace Safety Compliance & Fire Drill Log',
      description: 'Review the updated 2026 OSHA protocols and submit the quarterly facility evacuation inspection report.',
      instructions: '1. Inspect emergency exits and first aid kits on floor 3.\n2. Complete the standardized inspection checklist.\n3. Upload the signed inspection log in PDF or Word format.',
      assignedTo: {
        _id: '6618d0987f83b1001a123458',
        employeeCode: 'CBDP-EMP-001',
        personalDetails: { firstName: 'Sarah', lastName: 'Jenkins' }
      },
      assignedBy: {
        _id: '6618d0987f83b1001a123456',
        employeeCode: 'CBDP-ADMIN-001',
        personalDetails: { firstName: 'System', lastName: 'Admin' }
      },
      dueDate: '2026-10-28',
      priority: 'HIGH',
      status: 'AWAITING_ACCEPTANCE',
      acceptanceStatus: 'PENDING',
      attachments: [],
      submissions: [],
      messages: [],
      timeline: [
        {
          action: 'ASSIGNED',
          actorName: 'System Admin',
          actorRole: 'SUPER_ADMIN',
          timestamp: new Date().toISOString(),
          details: 'Task assigned to Sarah Jenkins'
        }
      ],
      createdAt: new Date().toISOString()
    },
    {
      _id: 'task-002',
      title: 'Deliver Regional Operations Budget & Vendor Cost Analysis',
      description: 'Prepare breakdown of Q3 vendor invoices, transportation expenditure, and cost optimization opportunities.',
      instructions: 'Please assemble the cost spreadsheet with variance analysis compared to Q2.',
      assignedTo: {
        _id: '6618d0987f83b1001a123458',
        employeeCode: 'CBDP-EMP-001',
        personalDetails: { firstName: 'Sarah', lastName: 'Jenkins' }
      },
      assignedBy: {
        _id: '6618d0987f83b1001a123456',
        employeeCode: 'CBDP-ADMIN-001',
        personalDetails: { firstName: 'System', lastName: 'Admin' }
      },
      dueDate: '2026-10-31',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      acceptanceStatus: 'ACCEPTED',
      acceptedAt: new Date().toISOString(),
      attachments: [],
      submissions: [],
      messages: [
        {
          messageId: 'msg-01',
          senderName: 'System Admin',
          senderRole: 'SUPER_ADMIN',
          text: 'Please include the regional fuel surcharge estimates in row 42.',
          createdAt: new Date().toISOString()
        }
      ],
      timeline: [
        {
          action: 'ASSIGNED',
          actorName: 'System Admin',
          actorRole: 'SUPER_ADMIN',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          details: 'Task assigned to Sarah Jenkins'
        },
        {
          action: 'ACCEPTED',
          actorName: 'Sarah Jenkins',
          actorRole: 'EMPLOYEE',
          timestamp: new Date().toISOString(),
          details: 'Sarah Jenkins accepted the assignment'
        }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      _id: 'task-003',
      title: 'Review Engineering Health Insurance Add-ons',
      description: 'Elect optional dental and vision supplementary coverage plans.',
      instructions: 'Complete and sign the enrollment form.',
      assignedTo: {
        _id: '6618d0987f83b1001a123458',
        employeeCode: 'CBDP-EMP-001',
        personalDetails: { firstName: 'Sarah', lastName: 'Jenkins' }
      },
      assignedBy: {
        _id: '6618d0987f83b1001a123456',
        employeeCode: 'CBDP-ADMIN-001',
        personalDetails: { firstName: 'System', lastName: 'Admin' }
      },
      dueDate: '2026-10-10',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      acceptanceStatus: 'ACCEPTED',
      acceptedAt: new Date(Date.now() - 500000000).toISOString(),
      attachments: [],
      submissions: [
        {
          _id: 'sub-001',
          version: 1,
          submittedAt: new Date(Date.now() - 400000000).toISOString(),
          notes: 'Completed enrollment questionnaire and plan selection.',
          files: [
            {
              fileId: 'f-001',
              name: 'Benefits_Form_Signed.pdf',
              originalName: 'Benefits_Form_Signed.pdf',
              path: '',
              size: 245000,
              mimeType: 'application/pdf'
            }
          ],
          status: 'APPROVED',
          feedback: 'All forms in order. Enrolled successfully.'
        }
      ],
      messages: [],
      timeline: [
        {
          action: 'COMPLETED',
          actorName: 'System Admin',
          actorRole: 'SUPER_ADMIN',
          timestamp: new Date(Date.now() - 350000000).toISOString(),
          details: 'HR approved submission and marked task completed.'
        }
      ],
      createdAt: new Date(Date.now() - 600000000).toISOString()
    }
  ],

  notifications: [
    {
      _id: 'ntf-001',
      title: 'Leave Approved',
      message: 'Your leave application for Oct 18 - Oct 22 has been approved by HR.',
      type: 'LEAVE',
      read: false,
      createdAt: '2026-10-12T10:30:00Z',
    },
    {
      _id: 'ntf-002',
      title: 'Payslip Ready',
      message: 'October 2026 digital payslip is now available for download.',
      type: 'PAYROLL',
      read: true,
      createdAt: '2026-10-01T09:00:00Z',
    },
  ],

  tracking: [
    {
      _id: 'trk-001',
      employeeId: {
        _id: '6618d0987f83b1001a123457',
        employeeCode: 'CBDP-ADMIN-001',
        personalDetails: { firstName: 'System', lastName: 'Admin' }
      },
      activityType: 'LOCATION_CHECKIN',
      description: 'HQ Campus North Entrance - Secure Card Access',
      ipAddress: '192.168.1.100',
      deviceInfo: 'MacBook Pro 16 / Chrome Enterprise',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'trk-002',
      employeeId: {
        _id: '6618d0987f83b1001a123458',
        employeeCode: 'CBDP-ENG-002',
        personalDetails: { firstName: 'Sarah', lastName: 'Connor' }
      },
      activityType: 'SYSTEM_LOGIN',
      description: 'Authenticated via Zero-Trust Gateway',
      ipAddress: '192.168.1.142',
      deviceInfo: 'Dell Precision / Edge Browser',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],

  taxes: [
    { _id: 'tax-1', name: 'Federal Income Tax Tier 1', taxName: 'Federal Income Tax Tier 1', rate: 12.0, taxRate: 12.0, type: 'PERCENTAGE', active: true, isActive: true, createdAt: '2026-10-01' },
    { _id: 'tax-2', name: 'State Disability Insurance (SDI)', taxName: 'State Disability Insurance (SDI)', rate: 1.2, taxRate: 1.2, type: 'PERCENTAGE', active: true, isActive: true, createdAt: '2026-10-01' },
    { _id: 'tax-3', name: 'Medicare Healthcare Withholding', taxName: 'Medicare Healthcare Withholding', rate: 1.45, taxRate: 1.45, type: 'PERCENTAGE', active: true, isActive: true, createdAt: '2026-10-01' },
    { _id: 'tax-4', name: 'Social Security Administration (OASDI)', taxName: 'Social Security Administration (OASDI)', rate: 6.2, taxRate: 6.2, type: 'PERCENTAGE', active: true, isActive: true, createdAt: '2026-10-01' },
  ],

  security: {
    sessions: [
      {
        _id: 'sess-001',
        ipAddress: '127.0.0.1 (Current)',
        deviceInfo: 'Chrome on Windows 11',
        location: 'Local / Cloud Tunnel',
        lastActive: new Date().toISOString(),
        isCurrent: true,
      },
    ],
    policies: {
      passwordMinLength: 8,
      requireSpecialChar: true,
      requireUppercase: true,
      twoFactorRequiredForAdmin: false,
      sessionTimeoutMinutes: 60,
    },
  },

  workplaces: [
    {
      _id: '6618d0987f83b1001a123990',
      name: 'CBDP Head Office & Operations Center',
      code: 'BD-HQ01',
      address: 'Nabogram Road, Barishal 8200',
      city: 'Barishal',
      country: 'Bangladesh',
      coordinates: { lat: 22.703934, lng: 90.339038 },
      radiusMeters: 100,
      maxAccuracyThreshold: 200,
      isDefault: true,
      isActive: true,
      geofenceEnforced: true,
      description: 'Primary corporate operations center and country head office in Bangladesh.',
      attendanceCount: 24,
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      _id: '6618d0987f83b1001a123991',
      name: 'CBDP Global Operations Headquarters',
      code: 'HQ-MAIN',
      address: '100 Innovation Way, Tech Campus Suite 400',
      city: 'San Francisco, CA',
      country: 'United States',
      coordinates: { lat: 37.774929, lng: -122.419416 },
      radiusMeters: 100,
      maxAccuracyThreshold: 200,
      isDefault: false,
      isActive: true,
      geofenceEnforced: true,
      description: 'Primary corporate facility and executive technology center.',
      attendanceCount: 14,
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      _id: '6618d0987f83b1001a123992',
      name: 'Manhattan Regional Division',
      code: 'BR-NY01',
      address: '350 Fifth Ave, Empire Tower Level 42',
      city: 'New York, NY',
      country: 'United States',
      coordinates: { lat: 40.748441, lng: -73.985664 },
      radiusMeters: 150,
      maxAccuracyThreshold: 250,
      isDefault: false,
      isActive: true,
      geofenceEnforced: true,
      description: 'East coast financial and operations branch.',
      attendanceCount: 9,
      createdAt: '2026-02-15T00:00:00.000Z'
    }
  ],
};

export function saveStoreToDisk() {
  try {
    const data = {
      employees: mockData.employees,
      users: mockData.users
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[PersistentStore] Error saving store to disk:', err.message);
  }
}

export function loadStoreFromDisk() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.employees) && parsed.employees.length > 0) {
        const existingCodes = new Set(mockData.employees.map(e => e.employeeCode));
        parsed.employees.forEach(emp => {
          if (!existingCodes.has(emp.employeeCode)) {
            mockData.employees.unshift(emp);
            existingCodes.add(emp.employeeCode);
          }
        });
      }
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        const existingEmails = new Set(mockData.users.map(u => u.email?.toLowerCase()));
        parsed.users.forEach(u => {
          if (u.email && !existingEmails.has(u.email.toLowerCase())) {
            mockData.users.push(u);
            existingEmails.add(u.email.toLowerCase());
          }
        });
      }
    }
  } catch (err) {
    console.error('[PersistentStore] Error loading store from disk:', err.message);
  }
}

// Initial load on startup
loadStoreFromDisk();


