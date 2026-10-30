import mongoose from 'mongoose';

const auditTrailItemSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['CREATED', 'UPDATED', 'AUDITED', 'DELETED', 'RESTORED', 'TRANSFERRED', 'STATUS_CHANGE', 'QR_PRINTED', 'SYNC_IMPORTED', 'PROJECT_ASSIGNED', 'PROJECT_RETURNED'],
    },
    performedBy: {
      type: String,
      default: 'System',
    },
    userEmail: {
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

const assetSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      required: [true, 'Asset ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    qrText: {
      type: String,
      trim: true,
      default: '',
    },
    name: {
      type: String,
      required: [true, 'Asset Name is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'IT Equipment',
      index: true,
    },
    projectDonor: {
      type: String,
      trim: true,
      default: 'Core',
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Head Office',
      index: true,
    },
    custodian: {
      type: String,
      trim: true,
      default: 'Unassigned',
      index: true,
    },
    purchaseDate: {
      type: String,
      default: '',
    },
    purchaseCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    usefulLifeYears: {
      type: Number,
      default: 5,
      min: 1,
    },
    annualDepreciation: {
      type: Number,
      default: 0,
    },
    currentBookValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    condition: {
      type: String,
      trim: true,
      default: 'Good',
    },
    status: {
      type: String,
      trim: true,
      default: 'Active',
      index: true,
    },
    lastAuditDate: {
      type: String,
      default: '',
    },
    auditResult: {
      type: String,
      trim: true,
      default: 'Verified',
    },
    nextAuditDue: {
      type: String,
      default: '',
    },
    riskFlag: {
      type: String,
      trim: true,
      default: 'Low',
      index: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    physicalTagLocation: {
      type: String,
      default: 'Top cover',
    },
    qrLabelSize: {
      type: String,
      default: '50mm x 30mm',
    },
    qrPrintStatus: {
      type: String,
      enum: ['Ready', 'Pending', 'Printed'],
      default: 'Ready',
    },
    lastPrintedDate: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    currentAssignment: {
      assignmentType: {
        type: String,
        enum: ['PROJECT', 'DEPARTMENT', 'HEAD_OFFICE', 'UNASSIGNED'],
        default: 'HEAD_OFFICE',
      },
      projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RiskProject',
        default: null,
        index: true,
      },
      projectCode: {
        type: String,
        trim: true,
        default: '',
      },
      projectName: {
        type: String,
        trim: true,
        default: '',
      },
      department: {
        type: String,
        trim: true,
        default: '',
      },
      location: {
        type: String,
        trim: true,
        default: 'Head Office',
      },
      custodianEmployeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null,
      },
      custodianName: {
        type: String,
        trim: true,
        default: 'Unassigned',
      },
      assignedDate: {
        type: Date,
        default: null,
      },
      expectedReturnDate: {
        type: Date,
        default: null,
      },
      notes: {
        type: String,
        trim: true,
        default: '',
      },
    },
    auditTrail: [auditTrailItemSchema],
  },
  {
    timestamps: true,
  }
);

// Pre-save calculation for depreciation & QR Text
assetSchema.pre('save', function (next) {
  if (this.purchaseCost > 0 && this.usefulLifeYears > 0) {
    this.annualDepreciation = Math.round(this.purchaseCost / this.usefulLifeYears);
  }
  if (!this.qrText) {
    this.qrText = `${this.assetId}|Name:${this.name}|Location:${this.location}|Custodian:${this.custodian}`;
  }
  if (typeof next === 'function') next();
});

const Asset = mongoose.models.Asset || mongoose.model('Asset', assetSchema);

export default Asset;
