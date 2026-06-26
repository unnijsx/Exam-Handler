const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protectAdmin } = require('../middleware/AuthMiddleware');
const {
  getQuestions,
  addQuestion,
  editQuestion,
  deleteQuestion,
  bulkUploadQuestions,
} = require('../controllers/QuestionController');

const upload = multer({ dest: 'uploads/' });

// Apply admin protection
router.use(protectAdmin);

router.route('/')
  .get(getQuestions)
  .post(addQuestion);

router.route('/:id')
  .put(editQuestion)
  .delete(deleteQuestion);

router.post('/bulk', upload.single('file'), bulkUploadQuestions);

module.exports = router;
