import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import { Employee } from './src/models/Employee.js';
import { hashPassword } from './src/utils/authUtils.js';

const seedNuruzzaman = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cbdp';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');

    const email = 'nuruzzamanrazon62@gmail.com';
    const password = 'ABCabc@123';

    let employee = await Employee.findOne({ email });
    if (!employee) {
      employee = new Employee({
        employeeCode: 'CBDP-EMP-007',
        email,
        personalDetails: {
          firstName: 'Nuruzzaman',
          lastName: 'Razon',
          email,
          phone: '+880 1700-000000',
          contactAddress: 'Dhaka, Bangladesh',
        },
        jobDetails: {
          title: 'Senior Operations Director',
          department: 'Executive Operations',
          employmentType: 'FULL_TIME',
          joinDate: new Date('2024-01-01'),
          status: 'ACTIVE',
        },
        isDeleted: false,
      });
      await employee.save();
      console.log('Created Employee Profile for Nuruzzaman Razon');
    } else {
      console.log('Employee Profile already exists for Nuruzzaman Razon');
    }

    let user = await User.findOne({ email });
    const passwordHash = await hashPassword(password);

    if (!user) {
      user = new User({
        email,
        passwordHash,
        role: 'EMPLOYEE',
        employeeProfileId: employee._id,
        isActive: true,
        mustChangePassword: false,
        tokenVersion: 1,
        isDeleted: false,
      });
      await user.save();
      console.log('Created User Account for nuruzzamanrazon62@gmail.com');
    } else {
      user.passwordHash = passwordHash;
      user.isActive = true;
      user.employeeProfileId = employee._id;
      user.isDeleted = false;
      await user.save();
      console.log('Updated User Account for nuruzzamanrazon62@gmail.com');
    }

    employee.userId = user._id;
    await employee.save();

    console.log('Successfully registered and linked nuruzzamanrazon62@gmail.com');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding user:', err);
    process.exit(1);
  }
};

seedNuruzzaman();
