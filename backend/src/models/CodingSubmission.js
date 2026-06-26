const mongoose = require('mongoose');

const codingSubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true,
  },
  codeContent: {
    type: String,
    default: '',
  },
  codeFileUrl: {
    type: String,
    default: null,
  },
  ptFileUrl: {
    type: String,
    default: null,
  },
  screenshotTrainingUrl: {
    type: String,
    required: true,
  },
  screenshotAccuracyUrl: {
    type: String,
    required: true,
  },
  screenshotPredictionUrl: {
    type: String,
    required: true,
  },
  assignedClasses: {
    type: [String],
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CodingSubmission', codingSubmissionSchema);
