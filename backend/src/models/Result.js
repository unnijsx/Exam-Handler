const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true,
  },
  mcqScore: {
    type: Number,
    required: true,
  },
  codingScore: {
    type: Number,
    required: true,
  },
  finalScore: {
    type: Number,
    required: true,
  },
  aiEvaluation: {
    codeQualityScore: { type: Number, default: 0 },
    datasetHandlingScore: { type: Number, default: 0 },
    cnnImplementationScore: { type: Number, default: 0 },
    outputQualityScore: { type: Number, default: 0 },
    overallSummary: { type: String, default: '' },
    suggestedScore: { type: Number, default: 0 }
  },
  markedByAdmin: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Result', resultSchema);
