const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  examStatus: {
    type: String,
    enum: ['not_started', 'mcq_in_progress', 'coding_in_progress', 'completed'],
    default: 'not_started',
  },
  mcqScore: {
    type: Number,
    default: null,
  },
  codingScore: {
    type: Number,
    default: null,
  },
  finalScore: {
    type: Number,
    default: null,
  },
  assignedClasses: {
    type: [String],
    default: [],
  },
  aiEvaluationSummary: {
    type: String,
    default: null,
  },
  submissionTime: {
    type: Date,
    default: null,
  },
  feedback: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Student', studentSchema);
