const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/AuthMiddleware');
const {
  exportExcelResults,
  exportPdfResults,
  exportIndividualMarksheet,
} = require('../controllers/ReportController');

router.use(protectAdmin);

router.get('/excel', exportExcelResults);
router.get('/pdf-book', exportPdfResults);
router.get('/marksheet/:studentId', exportIndividualMarksheet);

module.exports = router;
