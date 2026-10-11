const mongoose = require('mongoose');
const argon2 = require('argon2');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'FINANCE_OFFICER', 'EMPLOYEE'],
    required: true,
  },
  employeeProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, strict: false });

// Avoid overwriting model if already compiled
const User = mongoose.models.User || mongoose.model('User', userSchema);

const createOrUpdateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm_db');
    console.log('Connected to MongoDB');

    const email = 'mdnuruzzamanrazon@gmail.com';
    const password = 'ABCabc@123';
    
    const passwordHash = await argon2.hash(password);

    const user = await User.findOneAndUpdate(
      { email },
      { 
        $set: {
          email,
          passwordHash,
          role: 'SUPER_ADMIN',
          isActive: true
        }
      },
      { upsert: true, new: true }
    );

    console.log('Admin account credentials forcefully reset:', user.email);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createOrUpdateAdmin();
