import mongoose from 'mongoose';

const securityPolicySchema = new mongoose.Schema({
  enforceStrongPasswords: {
    type: Boolean,
    default: true
  },
  sessionTimeout: {
    type: Number,
    default: 15 // in minutes
  },
  require2FA: {
    type: Boolean,
    default: false
  }
});

export const SecurityPolicy = mongoose.model('SecurityPolicy', securityPolicySchema);
