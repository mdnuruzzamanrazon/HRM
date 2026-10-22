import mongoose from 'mongoose';

const auditTrailItemSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATED', 'UPDATED', 'STATUS_CHANGE', 'DELETED', 'RESTORED', 'IMPORT_SEEDED'],
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

const eventRecordSchema = new mongoose.Schema(
  {
    // 1. Serial Number (SL)
    sl: {
      type: Number,
      required: true,
      index: true,
    },

    // 2. Event / Activity ID (YYYYMMXXEVNN)
    eventId: {
      type: String,
      required: [true, 'Event / Activity ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // 3. Date From (YYYY-MM-DD)
    dateFrom: {
      type: Date,
      required: [true, 'Start date (Date from) is required'],
      index: true,
    },

    // 4. Date To (YYYY-MM-DD)
    dateTo: {
      type: Date,
      default: null,
      index: true,
    },

    // 5. Implementing Organization's Name (SP / Grantee)
    implementingOrg: {
      type: String,
      required: [true, 'Implementing Organization is required'],
      trim: true,
      index: true,
    },

    // 6. If Implementing Organization is Consortium Partner
    consortiumPartner: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },

    // 7. Number of participants from Community / CBO / CSO
    participantCountCommunity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // 8. Event Type
    eventType: {
      type: String,
      required: [true, 'Event Type is required'],
      trim: true,
      index: true,
    },

    // 9. If Other, Specify Type
    eventTypeOther: {
      type: String,
      trim: true,
      default: '',
    },

    // 10. Event Theme
    eventTheme: {
      type: String,
      required: [true, 'Event Theme is required'],
      trim: true,
      index: true,
    },

    // 11. If Other Theme, Please specify
    eventThemeOther: {
      type: String,
      trim: true,
      default: '',
    },

    // 12. Event Title / Description
    eventTitle: {
      type: String,
      required: [true, 'Event Title / Description is required'],
      trim: true,
      maxlength: [500, 'Title cannot exceed 500 characters'],
    },

    // 13. Administrative Division (Barishal, Chattogram, Dhaka, Khulna, Mymensingh, Rajshahi, Rangpur, Sylhet)
    division: {
      type: String,
      required: [true, 'Division is required'],
      trim: true,
      index: true,
    },

    // 14. Administrative District
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      index: true,
    },

    // 15. Administrative Upazila / Thana
    upazila: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },

    // 16. Administrative Union
    union: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },

    // 17. Level of the event
    eventLevel: {
      type: String,
      enum: ['Local (Union and Upzila)', 'Regional (District-Divison)', 'National'],
      default: 'Local (Union and Upzila)',
      index: true,
    },

    // 18. Government Representative Present
    govRepresentativePresent: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
      index: true,
    },

    // 19. If, Number of Gov. Rep Participants
    govRepresentativeCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // 20. Government Response
    govResponse: {
      type: String,
      enum: ['Positive', 'Negative', 'Deferred', 'No Response', 'Not Applicable', ''],
      default: '',
      index: true,
    },

    // 21. What was the response (max 250 characters)
    govResponseDetails: {
      type: String,
      trim: true,
      default: '',
    },

    // 22. Summarise actions agreed during the event (max 250 characters)
    actionsAgreed: {
      type: String,
      trim: true,
      default: '',
    },

    // 23. Does this event/activity contribute/Addresses Issues to prevent conflicts?
    conflictPrevention: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
      index: true,
    },

    // 24. If yes, How (max 250 characters)
    conflictPreventionDetails: {
      type: String,
      trim: true,
      default: '',
    },

    // 25. Does this event generate any indirect reach?
    indirectReach: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
      index: true,
    },

    // 26. If yes, through which channel or medium?
    indirectReachChannel: {
      type: String,
      trim: true,
      default: '',
    },

    // 27. Other - Channel/Medium
    indirectReachChannelOther: {
      type: String,
      trim: true,
      default: '',
    },

    // 28. Description of the msg/content
    indirectReachDescription: {
      type: String,
      trim: true,
      default: '',
    },

    // 29. Est. Audience Reach
    estimatedAudienceReach: {
      type: Number,
      default: 0,
      min: 0,
    },

    // 30. Source of Estimation
    reachEstimationSource: {
      type: String,
      trim: true,
      default: '',
    },

    // 31. If other (Specify with 3-5 words)
    reachEstimationSourceOther: {
      type: String,
      trim: true,
      default: '',
    },

    // 32. Rationale of reach count
    reachRationale: {
      type: String,
      trim: true,
      default: '',
    },

    // 33. If any link, paste it here
    mediaLink: {
      type: String,
      trim: true,
      default: '',
    },

    // Management Status
    status: {
      type: String,
      enum: ['Upcoming', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Completed',
      index: true,
    },

    // Optional Project Linkage
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RiskProject',
      index: true,
    },
    projectName: {
      type: String,
      trim: true,
      default: 'Community Based Development Project (CBDP)',
    },

    // Remarks & Notes
    remarks: {
      type: String,
      trim: true,
      default: '',
    },

    // Audit Trail
    auditTrail: [auditTrailItemSchema],

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes for fast cascading queries
eventRecordSchema.index({ division: 1, district: 1, upazila: 1 });
eventRecordSchema.index({ eventType: 1, eventTheme: 1, dateFrom: -1 });
eventRecordSchema.index({ implementingOrg: 1, dateFrom: -1 });
eventRecordSchema.index({ isDeleted: 1, dateFrom: -1 });

// Text Index for full-text search across titles, descriptions, IDs, and locations
eventRecordSchema.index({
  eventId: 'text',
  eventTitle: 'text',
  implementingOrg: 'text',
  consortiumPartner: 'text',
  district: 'text',
  upazila: 'text',
  union: 'text',
  govResponseDetails: 'text',
  actionsAgreed: 'text',
});

const EventRecord = mongoose.models.EventRecord || mongoose.model('EventRecord', eventRecordSchema);

export default EventRecord;
