const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/AuthMiddleware');
const { aiEvaluateStudent, overrideScore } = require('../controllers/EvaluationController');

router.use(protectAdmin);

router.post('/:studentId/evaluate', aiEvaluateStudent);
router.post('/:studentId/override', overrideScore);

module.exports = router;
