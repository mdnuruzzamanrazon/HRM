import mongoose from 'mongoose';
import { Employee } from './src/models/Employee.js';
import { User } from './src/models/User.js';

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/cbdp');
    console.log('Connected to MongoDB for employee synchronization migration...');

    // 1. Remove test employee Alice Wonder if exists
    await Employee.deleteMany({ employeeCode: 'CBDP-TEST-001' });
    await User.deleteMany({ email: 'alice.wonder@cbdp.org' });

    // 2. Sync all existing employees with their users
    const users = await User.find();
    console.log(`Found ${users.length} users in database.`);

    for (const u of users) {
      if (u.employeeProfileId) {
        const emp = await Employee.findById(u.employeeProfileId);
        if (emp) {
          emp.email = u.email;
          if (!emp.personalDetails) emp.personalDetails = {};
          emp.personalDetails.email = u.email;
          emp.userId = u._id;
          if (!emp.jobDetails.department) {
            emp.jobDetails.department = u.role === 'SUPER_ADMIN' ? 'Executive Management' : 'Operations';
          }
          await emp.save();
          console.log(`Synced Employee ${emp.employeeCode} (${emp.personalDetails.firstName} ${emp.personalDetails.lastName}) with email: ${emp.email}`);
        }
      }
    }

    // 3. Make sure any employee without a user gets checked
    const unlinkedEmps = await Employee.find({ email: { $exists: false } });
    for (const emp of unlinkedEmps) {
      const generatedEmail = `${emp.personalDetails.firstName.toLowerCase()}.${emp.personalDetails.lastName.toLowerCase()}@cbdp.org`;
      emp.email = generatedEmail;
      emp.personalDetails.email = generatedEmail;
      await emp.save();
      console.log(`Assigned email to previously unlinked employee: ${emp.employeeCode} -> ${generatedEmail}`);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
})();
