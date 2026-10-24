import mongoose from 'mongoose';
import { User } from '../backend/src/models/User.js';

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/cbdp');
  const u = await User.findOne();
  console.log('User found in DB:', u ? { id: u._id, email: u.email, role: u.role, tokenVersion: u.tokenVersion, isActive: u.isActive } : 'None');
  process.exit(0);
}
check();
