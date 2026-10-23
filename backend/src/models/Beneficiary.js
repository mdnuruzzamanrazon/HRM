import mongoose from 'mongoose';

const auditTrailItemSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['CREATED', 'UPDATED', 'STATUS_CHANGE', 'DELETED', 'RESTORED', 'IMPORT_SEEDED', 'BATCH_IMPORTED'],
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
  },
  { _id: true }
);

const beneficiarySchema = new mongoose.Schema(
  {
    // 1. Unique System Identifier
    beneficiaryId: {
      type: String,
      required: [true, 'Beneficiary ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // 2. Serial Number (from Source Worksheet: Sl No.)
    sl: {
      type: Number,
      index: true,
    },

    // 3. Project & CSO Information (from Source Header)
    projectName: {
      type: String,
      trim: true,
      default: 'NAGORIC Project',
      index: true,
    },
    csoName: {
      type: String,
      trim: true,
      default: 'Community Based Development Project (CBDP)',
    },
    category: {
      type: String,
      trim: true,
      default: 'Direct Beneficiary Information',
    },

    // 4. Source Worksheet & Forum Specification
    forumName: {
      type: String,
      required: [true, 'Forum Name is required'],
      trim: true,
      index: true,
    },
    forumType: {
      type: String,
      enum: ['UPAZILA_FORUM', 'UNION_FORUM', 'COMMUNITY_GROUP', 'OTHER'],
      default: 'UNION_FORUM',
      index: true,
    },
    groupNameCode: {
      type: String,
      trim: true,
      default: '',
    },
    sourceGid: {
      type: String,
      trim: true,
      default: '',
    },

    // 5. Personal & Demographic Information
    name: {
      type: String,
      required: [true, 'Beneficiary Name is required'],
      trim: true,
      index: true,
    },
    sex: {
      type: String,
      required: [true, 'Sex is required'],
      enum: ['Male', 'Female', 'Transgender', 'Other'],
      default: 'Female',
      index: true,
    },
    motherName: {
      type: String,
      trim: true,
      default: '',
    },
    age: {
      type: Number,
      min: [1, 'Age must be positive'],
      max: [120, 'Age must be realistic'],
      index: true,
    },
    occupation: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },

    // 6. Contact Information
    contactNo: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    alternativeContactNo: {
      type: String,
      trim: true,
      default: '',
    },

    // 7. Administrative Location Hierarchy (Division -> District -> Upazila -> Union)
    division: {
      type: String,
      required: [true, 'Division is required'],
      trim: true,
      default: 'Barishal',
      index: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      default: 'Barguna',
      index: true,
    },
    upazila: {
      type: String,
      required: [true, 'Upazila is required'],
      trim: true,
      default: 'Amtoli',
      index: true,
    },
    union: {
      type: String,
      required: [true, 'Union is required'],
      trim: true,
      index: true,
    },
    village: {
      type: String,
      trim: true,
      default: '', // Source: Village/Institution
    },
    detailAddress: {
      type: String,
      trim: true,
      default: '',
    },

    // 8. Social Inclusion, Ethnicity & Disability (Official Sheet Fields)
    adibashi: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
      index: true,
    },
    dalit: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
      index: true,
    },
    disability: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
      index: true,
    },

    // 9. Additional Notes & Metadata
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },

    // Multi-Forum Representation Indicator
    crossForumMember: {
      type: Boolean,
      default: false,
      index: true,
    },
    linkedForums: {
      type: [String],
      default: [],
    },

    // 10. Audit Trail
    auditTrail: [auditTrailItemSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for fast hierarchical search and filtering
beneficiarySchema.index({ division: 1, district: 1, upazila: 1, union: 1 });
beneficiarySchema.index({ projectName: 1, forumName: 1 });
beneficiarySchema.index({ name: 'text', contactNo: 'text', occupation: 'text', village: 'text' });

const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);

export default Beneficiary;
