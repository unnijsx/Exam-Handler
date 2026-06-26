const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true,
  },
  mcqQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
  // Store options in a specific shuffled order so that refresh doesn't change options order
  mcqOptionsShuffled: [[String]],
  mcqAnswers: {
    type: Map,
    of: String,
    default: {},
  },
  currentQuestionIndex: {
    type: Number,
    default: 0,
  },
  mcqTimeRemaining: {
    type: Number,
    default: 7200, // 2 Hours in seconds
  },
  codingTimeRemaining: {
    type: Number,
    default: 10800, // 3 Hours in seconds
  },
  mcqCompleted: {
    type: Boolean,
    default: false,
  },
  codingCompleted: {
    type: Boolean,
    default: false,
  },
  examStarted: {
    type: Boolean,
    default: false,
  },
  examStartedAt: {
    type: Date,
    default: null,
  },
  codingStarted: {
    type: Boolean,
    default: false,
  },
  codingStartedAt: {
    type: Date,
    default: null,
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
  pauseRequested: {
    type: Boolean,
    default: false,
  },
  lastSavedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ExamSession', examSessionSchema);
