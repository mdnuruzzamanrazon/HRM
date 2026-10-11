import mongoose from 'mongoose';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';
import { Employee } from './src/models/Employee.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexushr');
    console.log('MongoDB Connected');

    const email = 'mdnuruzzamanrazon@gmail.com';
    const password = 'ABCabc@123';

    // Check if user already exists
    let adminUser = await User.findOne({ email });
    if (adminUser) {
      console.log('Admin user already exists. Updating password...');
      adminUser.passwordHash = await argon2.hash(password);
      await adminUser.save();
      console.log('Password updated successfully.');
      process.exit(0);
    }

    // Create Employee Profile
    const adminEmployee = new Employee({
      employeeCode: 'NX-ADMIN-001',
      personalDetails: {
        firstName: 'System',
        lastName: 'Admin',
      },
      jobDetails: {
        title: 'Super Administrator',
        joinDate: new Date(),
        status: 'ACTIVE'
      }
    });
    
    await adminEmployee.save();

    // Create User Profile
    const hashedPassword = await argon2.hash(password);
    adminUser = new User({
      email,
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      employeeProfileId: adminEmployee._id,
      isActive: true,
    });

    await adminUser.save();

    console.log('Super Admin user created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
