const mongoose = require('mongoose');
const { ANOMALY_TYPES, RISK_LEVELS } = require('../utils/constants');

const anomalySchema = new mongoose.Schema({
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  budget: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget'
  },
  type: {
    type: String,
    enum: Object.values(ANOMALY_TYPES),
    required: [true, 'Anomaly type is required']
  },
  riskLevel: {
    type: String,
    enum: Object.values(RISK_LEVELS),
    default: RISK_LEVELS.MEDIUM
  },
  title: {
    type: String,
    required: [true, 'Anomaly title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  detectedDate: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    default: 0
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'false_positive', 'escalated', 'pending', 'dismissed'],
    default: 'open'
  },
  investigatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  investigationNotes: {
    type: String,
    trim: true
  },
  investigationDate: Date,
  resolvedDate: Date,
  resolution: {
    type: String,
    trim: true
  },
  aiAnalysis: {
    type: String,
    trim: true
  },
  aiInsights: {
    type: String,
    trim: true
  },
  aiRiskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'needs_review', 'likely_false_positive', 'verified', 'dismissed'],
    default: 'pending'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  relatedAnomalies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Anomaly'
  }]
}, {
  timestamps: true
});

// Indexes
anomalySchema.index({ transaction: 1 });
anomalySchema.index({ budget: 1 });
anomalySchema.index({ status: 1, riskLevel: 1 });
anomalySchema.index({ detectedDate: -1 });

// Virtual for days open
anomalySchema.virtual('daysOpen').get(function() {
  const start = this.detectedDate;
  const end = this.resolvedDate || new Date();
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

anomalySchema.set('toJSON', { virtuals: true });
anomalySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Anomaly', anomalySchema);
