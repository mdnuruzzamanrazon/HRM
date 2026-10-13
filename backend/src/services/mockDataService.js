// In-memory demo data store for CBDP HR platform
export const mockData = {
  adminUser: {
    _id: '6618d0987f83b1001a123456',
    email: 'mdnuruzzamanrazon@gmail.com',
    role: 'SUPER_ADMIN',
    employeeProfileId: '6618d0987f83b1001a123457',
    isTwoFactorEnabled: false,
    isActive: true,
  },

  adminEmployee: {
    _id: '6618d0987f83b1001a123457',
    employeeCode: 'CBDP-ADMIN-001',
    personalDetails: {
      firstName: 'System',
      lastName: 'Admin',
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
      personalDetails: { firstName: 'System', lastName: 'Admin' },
      jobDetails: { title: 'Super Administrator', department: 'Executive', status: 'ACTIVE', joinDate: '2023-01-01' },
      compensation: { baseSalary: 120000, currency: 'USD' },
    },
    {
      _id: '6618d0987f83b1001a123458',
      employeeCode: 'CBDP-ENG-002',
      personalDetails: { firstName: 'Sarah', lastName: 'Connor' },
      jobDetails: { title: 'Lead Software Architect', department: 'Engineering', status: 'ACTIVE', joinDate: '2023-03-15' },
      compensation: { baseSalary: 105000, currency: 'USD' },
    },
    {
      _id: '6618d0987f83b1001a123459',
      employeeCode: 'CBDP-HR-003',
      personalDetails: { firstName: 'Elena', lastName: 'Rostova' },
      jobDetails: { title: 'Senior HR Specialist', department: 'Human Resources', status: 'ACTIVE', joinDate: '2023-06-01' },
      compensation: { baseSalary: 78000, currency: 'USD' },
    },
    {
      _id: '6618d0987f83b1001a123460',
      employeeCode: 'CBDP-FIN-004',
      personalDetails: { firstName: 'Marcus', lastName: 'Vance' },
      jobDetails: { title: 'Finance & Payroll Director', department: 'Finance', status: 'ACTIVE', joinDate: '2022-11-10' },
      compensation: { baseSalary: 95000, currency: 'USD' },
    },
    {
      _id: '6618d0987f83b1001a123461',
      employeeCode: 'CBDP-MKT-005',
      personalDetails: { firstName: 'Aisha', lastName: 'Patel' },
      jobDetails: { title: 'Brand Marketing Lead', department: 'Marketing', status: 'ACTIVE', joinDate: '2024-01-15' },
      compensation: { baseSalary: 82000, currency: 'USD' },
    },
    {
      _id: '6618d0987f83b1001a123462',
      employeeCode: 'CBDP-ENG-006',
      personalDetails: { firstName: 'David', lastName: 'Kim' },
      jobDetails: { title: 'Frontend Systems Engineer', department: 'Engineering', status: 'ACTIVE', joinDate: '2024-02-01' },
      compensation: { baseSalary: 88000, currency: 'USD' },
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
      date: new Date().toISOString().split('T')[0],
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
      date: new Date().toISOString().split('T')[0],
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
      date: new Date().toISOString().split('T')[0],
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
      title: 'Complete Q3 Performance Self-Appraisals',
      description: 'Submit peer feedback and OKR achievements for the quarterly review cycle.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: '2026-10-25',
    },
    {
      _id: 'task-002',
      title: 'Review Engineering Health Insurance Add-ons',
      description: 'Elect optional dental and vision supplementary coverage plans.',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      dueDate: '2026-10-10',
    },
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
};
