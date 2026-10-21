import mongoose from 'mongoose';
import { calculateRiskScore, getRiskRating, calculateVariance } from '../utils/riskCalculations.js';

const riskRecordSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RiskProject',
      required: [true, 'Project association is required'],
      index: true,
    },
    // 1. Risk No.
    riskNo: {
      type: Number,
      required: [true, 'Risk No. is required'],
      index: true,
    },
    // 2. Date Added
    dateAdded: {
      type: Date,
      default: Date.now,
    },
    // 3. Category
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    // 4. Sub-category
    subCategory: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    // Category Code & Subcode Classification Metadata
    categoryCode: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    subCode: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    ukDirector: {
      type: String,
      trim: true,
      default: '',
    },
    explanatoryNote: {
      type: String,
      trim: true,
      default: '',
    },
    // 5. Description of Risk
    description: {
      type: String,
      required: [true, 'Description of Risk is required'],
      trim: true,
    },
    // 6. Risk Owner
    riskOwner: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    // 7. Likelihood (1 - 5)
    likelihood: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Likelihood rating (1-5) is required'],
      default: 1,
    },
    // 8. Impact (1 - 5)
    impact: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Impact rating (1-5) is required'],
      default: 1,
    },
    // 9. Current Score = (Likelihood x Impact) + Impact
    currentScore: {
      type: Number,
      default: 0,
      index: true,
    },
    // 10. Target Score
    targetScore: {
      type: Number,
      default: null,
    },
    // 11. Variance = Current Score - Target Score
    variance: {
      type: Number,
      default: 0,
    },
    // 12. Mitigation Required / Action
    mitigationAction: {
      type: String,
      trim: true,
      default: '',
    },
    // 13. Date Action Is to Be Completed By
    actionDueDate: {
      type: Date,
      default: null,
    },
    // 14. Person Monitoring
    personMonitoring: {
      type: String,
      trim: true,
      default: '',
    },
    // 15. Notes
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    // 16. Assessment Result
    assessmentResult: {
      type: String,
      trim: true,
      default: '',
    },
    // 17. Review Date
    reviewDate: {
      type: Date,
      default: null,
    },
    // 18. Assessed Likelihood (1 - 5)
    assessedLikelihood: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    // 19. Assessed Impact (1 - 5)
    assessedImpact: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    // 20. Assessment Score = (Assessed Likelihood x Assessed Impact) + Assessed Impact
    assessmentScore: {
      type: Number,
      default: null,
    },

    // RAG Rating & Meta Indicators
    riskRating: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'LOW',
      index: true,
    },
    assessmentRating: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW', null],
      default: null,
    },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'MITIGATED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure calculations and ratings are always accurate
riskRecordSchema.pre('save', function () {
  if (this.likelihood && this.impact) {
    this.currentScore = calculateRiskScore(this.likelihood, this.impact);
    this.riskRating = getRiskRating(this.currentScore);
    this.variance = calculateVariance(this.currentScore, this.targetScore);
  }

  if (this.assessedLikelihood && this.assessedImpact) {
    this.assessmentScore = calculateRiskScore(this.assessedLikelihood, this.assessedImpact);
    this.assessmentRating = getRiskRating(this.assessmentScore);
  } else {
    this.assessmentScore = null;
    this.assessmentRating = null;
  }
});

export const RiskRecord = mongoose.model('RiskRecord', riskRecordSchema);
