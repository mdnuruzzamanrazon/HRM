import mongoose from 'mongoose';

const auditTrailItemSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATED', 'UPDATED', 'STATUS_CHANGE', 'DELAY_LOGGED', 'APPEAL_RECORDED', 'CLOSED', 'DELETED', 'RESTORED'],
  },
  performedBy: {
    type: String,
    default: 'System',
  },
  userEmail: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: String,
    default: '',
  },
}, { _id: true });

const complaintRecordSchema = new mongoose.Schema(
  {
    // Associated Project (optional or default)
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RiskProject',
      index: true,
    },
    projectName: {
      type: String,
      trim: true,
      default: 'CBDP Women & Girls Empowerment Initiative',
    },

    // 1. Serial Number (S.No.) - Unique record identifier
    sNo: {
      type: String,
      required: [true, 'Serial Number (S.No.) is required'],
      unique: true,
      trim: true,
      index: true,
    },
    seqNumber: {
      type: Number,
      index: true,
    },

    // 2. Date Complaint or Feedback Received
    dateReceived: {
      type: Date,
      required: [true, 'Date Complaint or Feedback Received is required'],
      index: true,
    },

    // 3. Receiving Channel
    receivingChannel: {
      type: String,
      required: [true, 'Receiving Channel is required'],
      trim: true,
      index: true,
    },
    receivingChannelOther: {
      type: String,
      trim: true,
      default: '',
    },

    // 4. Feedback / Complainant's Name & Address
    isAnonymous: {
      type: Boolean,
      default: false,
      index: true,
    },
    complainantName: {
      type: String,
      trim: true,
      default: '',
    },
    complainantAddress: {
      type: String,
      trim: true,
      default: '',
    },

    // 5. Complainant's Contact Phone Number (and number called from if different)
    complainantPhone: {
      type: String,
      trim: true,
      default: '',
    },
    numberCalledFrom: {
      type: String,
      trim: true,
      default: '',
    },

    // 6. Complaint Type / Category
    complaintCategory: {
      type: String,
      required: [true, 'Complaint Type / Category is required'],
      trim: true,
      index: true,
    },
    complaintCategoryOther: {
      type: String,
      trim: true,
      default: '',
    },

    // 7. Description of Feedback or Complaint / Allegation / Issue
    description: {
      type: String,
      required: [true, 'Description of feedback or complaint is required'],
      trim: true,
    },

    // 8. Gender of Complainant
    complainantGender: {
      type: String,
      enum: ['Female', 'Male', 'Non-binary', 'Other', 'Prefer not to say', 'Not recorded'],
      default: 'Prefer not to say',
    },

    // 9. Age of Complainant
    complainantAge: {
      type: String,
      trim: true,
      default: '',
    },

    // 10. Does Complainant Have a Disability?
    complainantDisability: {
      type: String,
      enum: ['Yes', 'No', 'Prefer not to say', 'Not recorded'],
      default: 'Not recorded',
    },

    // 11. Concerned Partner / Organization Name
    partnerOrgName: {
      type: String,
      required: [true, 'Concerned Partner / Organization Name is required'],
      trim: true,
      index: true,
    },
    assignedFocalPerson: {
      type: String,
      trim: true,
      default: '',
    },

    // 12. Actions Taken and Issue Redressal
    actionsTaken: {
      type: String,
      trim: true,
      default: '',
    },

    // 13. Reason for Delay and Complainant Notification (for > 30 days unresolved)
    delayReason: {
      type: String,
      trim: true,
      default: '',
    },
    isComplainantNotifiedOfDelay: {
      type: String,
      enum: ['Yes', 'No', 'Pending', 'Not applicable'],
      default: 'Not applicable',
    },
    delayNotificationDate: {
      type: Date,
      default: null,
    },
    delayNotificationNotes: {
      type: String,
      trim: true,
      default: '',
    },

    // 14. Current Status [Open / Closed]
    status: {
      type: String,
      enum: ['Open', 'Closed'],
      default: 'Open',
      index: true,
    },

    // 15. Date Complaint Closed
    dateClosed: {
      type: Date,
      default: null,
    },

    // 16. Appeal Date (If Needed)
    hasAppeal: {
      type: Boolean,
      default: false,
      index: true,
    },
    appealDate: {
      type: Date,
      default: null,
    },

    // 17. Appeal Outcome
    appealOutcome: {
      type: String,
      trim: true,
      default: '',
    },
    appealStatus: {
      type: String,
      enum: ['None', 'Pending Review', 'Upheld', 'Overturned', 'Dismissed'],
      default: 'None',
    },

    // 18. Final Closing Date After Appeal
    finalClosingDateAfterAppeal: {
      type: Date,
      default: null,
    },

    // Safeguarding, Confidentiality & Audit Metadata
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    confidentialityLevel: {
      type: String,
      enum: ['Standard', 'Confidential', 'Strictly Confidential'],
      default: 'Confidential',
    },
    auditTrail: [auditTrailItemSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    needsProjectReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    projectReviewNote: {
      type: String,
      trim: true,
      default: '',
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save validation and normalization hook
complaintRecordSchema.pre('save', function () {
  // If status is Closed, ensure dateClosed exists
  if (this.status === 'Closed' && !this.dateClosed) {
    this.dateClosed = new Date();
  }

  // Validate dateClosed >= dateReceived
  if (this.dateClosed && this.dateReceived && new Date(this.dateClosed) < new Date(this.dateReceived)) {
    throw new Error('Date Complaint Closed cannot precede the Date Received.');
  }

  // Validate appealDate >= dateReceived
  if (this.appealDate && this.dateReceived && new Date(this.appealDate) < new Date(this.dateReceived)) {
    throw new Error('Appeal Date cannot precede the Date Received.');
  }

  // Validate finalClosingDateAfterAppeal >= appealDate
  if (this.finalClosingDateAfterAppeal && this.appealDate && new Date(this.finalClosingDateAfterAppeal) < new Date(this.appealDate)) {
    throw new Error('Final Closing Date After Appeal cannot precede the Appeal Date.');
  }

  // Track appeal flag
  if (this.appealDate || (this.appealOutcome && this.appealOutcome.trim().length > 0)) {
    this.hasAppeal = true;
    if (this.appealStatus === 'None') {
      this.appealStatus = 'Pending Review';
    }
  }

  // If anonymous, normalize complainant name if empty
  if (this.isAnonymous && (!this.complainantName || this.complainantName.trim() === '')) {
    this.complainantName = 'Anonymous Complainant';
  }
});

complaintRecordSchema.index({ projectId: 1, isDeleted: 1, dateReceived: -1 });
complaintRecordSchema.index({ projectId: 1, isDeleted: 1, status: 1 });
complaintRecordSchema.index({ projectId: 1, isDeleted: 1, complaintCategory: 1 });

export const ComplaintRecord = mongoose.model('ComplaintRecord', complaintRecordSchema);
