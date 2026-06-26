const Student = require('../models/Student');
const ExamSession = require('../models/ExamSession');
const CodingSubmission = require('../models/CodingSubmission');
const Result = require('../models/Result');
const fs = require('fs');
const csv = require('csv-parser');

// Get all students with search & filter
const getStudents = async (req, res) => {
  const { search, status } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (status && status !== 'all') {
    query.examStatus = status;
  }

  try {
    const students = await Student.find(query).sort({ createdAt: -1 });
    
    // Fetch corresponding sessions to map pause state
    const sessions = await ExamSession.find({ studentId: { $in: students.map(s => s._id) } });
    const sessionMap = {};
    sessions.forEach(sess => {
      sessionMap[sess.studentId.toString()] = {
        isPaused: sess.isPaused || false,
        pauseRequested: sess.pauseRequested || false
      };
    });

    const studentsWithPause = students.map(student => {
      const studentObj = student.toObject();
      const sessInfo = sessionMap[student._id.toString()] || { isPaused: false, pauseRequested: false };
      studentObj.isPaused = sessInfo.isPaused;
      studentObj.pauseRequested = sessInfo.pauseRequested;
      return studentObj;
    });

    res.json(studentsWithPause);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single student details (including submission data)
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const session = await ExamSession.findOne({ studentId: student._id }).populate('mcqQuestions');
    const submission = await CodingSubmission.findOne({ studentId: student._id });
    const result = await Result.findOne({ studentId: student._id });

    res.json({
      student,
      session,
      submission,
      result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add student
const addStudent = async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    return res.status(400).json({ message: 'Full Name and Email are required.' });
  }

  try {
    const studentExists = await Student.findOne({ email: email.toLowerCase().trim() });
    if (studentExists) {
      return res.status(400).json({ message: 'Student email already exists.' });
    }

    const student = await Student.create({
      fullName,
      email: email.toLowerCase().trim(),
    });

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit student
const editStudent = async (req, res) => {
  const { fullName, email, examStatus } = req.body;

  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (email) {
      const emailLower = email.toLowerCase().trim();
      if (emailLower !== student.email) {
        const studentExists = await Student.findOne({ email: emailLower });
        if (studentExists) {
          return res.status(400).json({ message: 'Email is already in use by another student.' });
        }
        student.email = emailLower;
      }
    }

    if (fullName) student.fullName = fullName;
    if (examStatus) student.examStatus = examStatus;

    const updatedStudent = await student.save();
    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Clean up related session, submission, result
    await ExamSession.deleteOne({ studentId: student._id });
    await CodingSubmission.deleteOne({ studentId: student._id });
    await Result.deleteOne({ studentId: student._id });
    
    await student.deleteOne();
    
    res.json({ message: 'Student and related records deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Import students from CSV
const importStudents = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV file.' });
  }

  const results = [];
  const errors = [];
  let successCount = 0;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      // Normalize columns (handle lowercase, spaces)
      const fullName = data.fullName || data['Full Name'] || data.fullname || data.name || data.Name;
      const email = data.email || data['Email Address'] || data.Email || data.emailAddress;
      
      if (fullName && email) {
        results.push({
          fullName: fullName.trim(),
          email: email.toLowerCase().trim(),
        });
      } else {
        errors.push(`Invalid row structure: ${JSON.stringify(data)}`);
      }
    })
    .on('end', async () => {
      // Delete temporary file
      fs.unlinkSync(req.file.path);

      try {
        for (const item of results) {
          const studentExists = await Student.findOne({ email: item.email });
          if (!studentExists) {
            await Student.create(item);
            successCount++;
          } else {
            errors.push(`Skipped duplicate email: ${item.email}`);
          }
        }
        res.json({
          message: `Successfully imported ${successCount} students.`,
          errors,
        });
      } catch (err) {
        res.status(500).json({ message: 'Error saving imported students: ' + err.message });
      }
    })
    .on('error', (err) => {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: 'Error reading CSV file: ' + err.message });
    });
};

// Admin Toggle Pause Student Exam Session
const togglePauseStudentExam = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const session = await ExamSession.findOne({ studentId: student._id });
    if (!session) {
      return res.status(404).json({ message: 'Exam session not found for this student.' });
    }

    session.isPaused = !session.isPaused;
    session.pauseRequested = false; // Reset request flag on action
    await session.save();

    res.json({
      message: `Exam session successfully ${session.isPaused ? 'paused' : 'resumed'}.`,
      isPaused: session.isPaused,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Global Pause All Active Exam Sessions
const pauseAllTimers = async (req, res) => {
  try {
    const activeStudents = await Student.find({
      examStatus: { $in: ['mcq_in_progress', 'coding_in_progress'] }
    });
    const studentIds = activeStudents.map(s => s._id);

    await ExamSession.updateMany(
      { studentId: { $in: studentIds } },
      { $set: { isPaused: true, pauseRequested: false } }
    );

    res.json({ message: 'All active student exam sessions have been paused.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Global Resume All Paused Exam Sessions
const resumeAllTimers = async (req, res) => {
  try {
    const activeStudents = await Student.find({
      examStatus: { $in: ['mcq_in_progress', 'coding_in_progress'] }
    });
    const studentIds = activeStudents.map(s => s._id);

    await ExamSession.updateMany(
      { studentId: { $in: studentIds } },
      { $set: { isPaused: false, pauseRequested: false } }
    );

    res.json({ message: 'All active student exam sessions have been resumed.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Global End All In-Progress Exams
const endAllExams = async (req, res) => {
  try {
    const activeStudents = await Student.find({
      examStatus: { $in: ['mcq_in_progress', 'coding_in_progress'] }
    });

    for (const student of activeStudents) {
      student.examStatus = 'completed';
      if (student.mcqScore === null) {
        student.mcqScore = 0;
      }
      if (student.codingScore === null) {
        student.codingScore = 0;
      }
      student.finalScore = (student.mcqScore || 0) + (student.codingScore || 0);
      student.submissionTime = Date.now();
      await student.save();

      await ExamSession.updateOne(
        { studentId: student._id },
        { $set: { mcqCompleted: true, codingCompleted: true, isPaused: false, pauseRequested: false } }
      );
    }

    res.json({ message: 'All in-progress student exams have been locked and ended.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Global Reset All Exams (Destructive Clean Up)
const resetAllExams = async (req, res) => {
  try {
    await ExamSession.deleteMany({});
    await CodingSubmission.deleteMany({});
    await Result.deleteMany({});

    await Student.updateMany(
      {},
      {
        $set: {
          examStatus: 'not_started',
          mcqScore: null,
          codingScore: null,
          finalScore: null,
          assignedClasses: [],
          aiEvaluationSummary: null,
          submissionTime: null,
          feedback: null
        }
      }
    );

    res.json({ message: 'All student exam sessions, submissions, and results have been completely reset.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
