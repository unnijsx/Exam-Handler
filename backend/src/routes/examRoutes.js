const express = require('express');
const router = express.Router();
const { protectStudent } = require('../middleware/AuthMiddleware');
const {
  getStudentSession,
  saveExamState,
  submitMcqExam,
  startExam,
  startCodingExam,
  requestPauseExam,
  getMyResult,
  getStudentProfile,
  saveFeedback,
} = require('../controllers/ExamController');

// All endpoints require student token
router.use(protectStudent);

router.get('/session', getStudentSession);
router.get('/my-result', getMyResult);
router.get('/profile', getStudentProfile);
router.post('/feedback', saveFeedback);
router.post('/start', startExam);
router.post('/start-coding', startCodingExam);
router.post('/save', saveExamState);
router.post('/submit-mcq', submitMcqExam);
router.post('/request-pause', requestPauseExam);

module.exports = router;
