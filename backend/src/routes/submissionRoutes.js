const express = require('express');
const router = express.Router();
const { protectStudent } = require('../middleware/AuthMiddleware');
const { submissionUpload } = require('../middleware/UploadMiddleware');
const { submitCodingExam } = require('../controllers/SubmissionController');

router.post('/', protectStudent, submissionUpload, submitCodingExam);

module.exports = router;
