const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/AuthMiddleware');
const { getResultsList, getDashboardStats, getPublishStatus, togglePublishStatus } = require('../controllers/ResultController');

router.use(protectAdmin);

router.get('/', getResultsList);
router.get('/dashboard', getDashboardStats);
router.get('/publish-status', getPublishStatus);
router.post('/publish-toggle', togglePublishStatus);

module.exports = router;
