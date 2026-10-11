import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  expenseType: { 
    type: String, 
    enum: ['TRAVEL', 'MEALS', 'SUPPLIES', 'TRAINING', 'OTHER'],
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0 
  },
  currency: {
    type: String,
    default: 'USD'
  },
  dateIncurred: { 
    type: Date, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  receiptUrl: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED'],
    default: 'PENDING'
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee' 
  },
  remarks: {
    type: String
  }
}, { timestamps: true });

export const Expense = mongoose.model('Expense', expenseSchema);
