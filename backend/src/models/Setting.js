const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  mcqDuration: {
    type: Number,
    default: 7200, // 2 Hours in seconds
  },
  codingDuration: {
    type: Number,
    default: 10800, // 3 Hours in seconds
  },
  totalMcqQuestions: {
    type: Number,
    default: 50,
  },
  resultsPublished: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Setting', settingSchema);
