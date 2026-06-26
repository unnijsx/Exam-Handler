const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protectAdmin } = require('../middleware/AuthMiddleware');
const {
  getStudents,
  getStudentById,
  addStudent,
  editStudent,
  deleteStudent,
  importStudents,
  togglePauseStudentExam,
  pauseAllTimers,
  resumeAllTimers,
  endAllExams,
  resetAllExams,
} = require('../controllers/StudentController');

const upload = multer({ dest: 'uploads/' });

// Apply admin protection to all routes here
router.use(protectAdmin);

router.route('/')
  .get(getStudents)
  .post(addStudent);

router.post('/global/pause-all', pauseAllTimers);
router.post('/global/resume-all', resumeAllTimers);
router.post('/global/end-all', endAllExams);
router.post('/global/reset-all', resetAllExams);

router.route('/:id')
  .get(getStudentById)
  .put(editStudent)
  .delete(deleteStudent);

router.post('/:id/pause-toggle', togglePauseStudentExam);

router.post('/import', upload.single('file'), importStudents);

module.exports = router;
