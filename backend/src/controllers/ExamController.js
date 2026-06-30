const ExamSession = require('../models/ExamSession');
const Student = require('../models/Student');
const Question = require('../models/Question');

// Retrieve student's exam session (strips correctAnswer for security)
const getStudentSession = async (req, res) => {
  try {
    const session = await ExamSession.findOne({ studentId: req.student._id })
      .populate({
        path: 'mcqQuestions',
        select: 'topic questionText options' // Exclude correctAnswer
      });

    if (!session) {
      return res.status(404).json({ message: 'Exam session not found.' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Auto-Save Exam State (answers, index, remaining time)
const saveExamState = async (req, res) => {
  const { mcqAnswers, currentQuestionIndex, mcqTimeRemaining, codingTimeRemaining } = req.body;

  try {
    // Only fetch isPaused field to avoid loading massive arrays like mcqOptionsShuffled
    const session = await ExamSession.findOne({ studentId: req.student._id }, 'isPaused');
    if (!session) {
      return res.status(404).json({ message: 'Exam session not found.' });
    }

    const updateFields = {};
    if (mcqAnswers) updateFields.mcqAnswers = mcqAnswers;
    if (currentQuestionIndex !== undefined) updateFields.currentQuestionIndex = currentQuestionIndex;
    
    if (!session.isPaused) {
      if (mcqTimeRemaining !== undefined) updateFields.mcqTimeRemaining = mcqTimeRemaining;
      if (codingTimeRemaining !== undefined) updateFields.codingTimeRemaining = codingTimeRemaining;
    }
    
    updateFields.lastSavedAt = Date.now();

    await ExamSession.updateOne({ _id: session._id }, { $set: updateFields });

    res.json({ message: 'Progress saved successfully.', lastSavedAt: updateFields.lastSavedAt, isPaused: session.isPaused });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve minimal exam session status (isPaused, pauseRequested, etc.) for lightweight polling
const getStudentExamStatus = async (req, res) => {
  try {
    const session = await ExamSession.findOne(
      { studentId: req.student._id },
      'isPaused pauseRequested mcqCompleted codingCompleted'
    );
    if (!session) {
      return res.status(404).json({ message: 'Exam session not found.' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit MCQ Exam (calculates score and lock MCQ section)
const submitMcqExam = async (req, res) => {
  try {
    const session = await ExamSession.findOne({ studentId: req.student._id });
    if (!session) {
      return res.status(404).json({ message: 'Exam session not found.' });
    }

    if (session.mcqCompleted) {
      return res.status(400).json({ message: 'MCQ Examination has already been submitted.' });
    }

    // Lock MCQ
    session.mcqCompleted = true;
    await session.save();

    // Calculate MCQ Score
    let correctCount = 0;
    const questionsList = session.mcqQuestions;
    const answersMap = session.mcqAnswers;

    for (const qId of questionsList) {
      const question = await Question.findById(qId);
      if (question) {
        const studentAns = answersMap.get(qId.toString());
        if (studentAns && studentAns.trim() === question.correctAnswer.trim()) {
          correctCount++;
        }
      }
    }

    // Save MCQ score to Student
    const student = await Student.findById(req.student._id);
    student.mcqScore = correctCount; // Since there are 50 questions, score is correct count
    student.examStatus = 'coding_in_progress';
    await student.save();

    res.json({
      message: 'MCQ exam submitted successfully.',
      mcqScore: student.mcqScore,
      examStatus: student.examStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start the Exam session (sets examStarted: true)
const startExam = async (req, res) => {
  try {
    const session = await ExamSession.findOne({ studentId: req.student._id });
    if (!session) {
      return res.status(404).json({ message: 'Exam session not found.' });
    }

    if (session.examStarted) {
      return res.status(400).json({ message: 'Exam has already started.' });
    }

    session.examStarted = true;
    session.examStartedAt = Date.now();
    session.lastSavedAt = Date.now();
    await session.save();

    res.json({
      message: 'Exam started successfully.',
      session
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start the Coding Exam session (sets codingStarted: true)
const startCodingExam = async (req, res) => {
  try {
    const session = await ExamSession.findOne({ studentId: req.student._id });
    if (!session) {
      return res.status(404).json({ message: 'Exam session not found.' });
    }

    if (session.codingStarted) {
      return res.status(400).json({ message: 'Coding exam has already started.' });
    }

    session.codingStarted = true;
    session.codingStartedAt = Date.now();
    session.lastSavedAt = Date.now();
    await session.save();

    res.json({
      message: 'Coding exam started successfully.',
      session
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request Pause
const requestPauseExam = async (req, res) => {
  try {
    const session = await ExamSession.findOne({ studentId: req.student._id });
    if (!session) {
      return res.status(404).json({ message: 'Exam session not found.' });
    }

    session.pauseRequested = true;
    await session.save();

    res.json({
      message: 'Pause request sent successfully.',
      session
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get logged in student's results (if published)
const getMyResult = async (req, res) => {
  try {
    const Setting = require('../models/Setting');
    const setting = await Setting.findOne({});
    const resultsPublished = setting ? setting.resultsPublished : false;
 
    if (!resultsPublished) {
      return res.status(403).json({ message: 'Results are not published yet.' });
    }
 
    const Result = require('../models/Result');
    const result = await Result.findOne({ studentId: req.student._id }).populate('studentId');
    if (!result) {
      return res.status(404).json({ message: 'Result not found.' });
    }
 
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
// Get logged in student's profile (including feedback status)
const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
// Save feedback submitted by student
const saveFeedback = async (req, res) => {
  const { feedback } = req.body;
  if (!feedback) {
    return res.status(400).json({ message: 'Feedback text is required.' });
  }
 
  try {
    const student = await Student.findById(req.student._id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    student.feedback = feedback;
    await student.save();
    res.json({ message: 'Feedback submitted successfully.', student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
module.exports = {
  getStudentSession,
  saveExamState,
  getStudentExamStatus,
  submitMcqExam,
  startExam,
  startCodingExam,
  requestPauseExam,
  getMyResult,
  getStudentProfile,
  saveFeedback,
};
