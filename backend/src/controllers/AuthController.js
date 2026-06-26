const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Question = require('../models/Question');
const ExamSession = require('../models/ExamSession');

// Helper to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'evalai_campus_jwt_secret_key_2026', {
    expiresIn: '24h',
  });
};

// Admin Login
const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (admin && (await admin.comparePassword(password))) {
      res.json({
        _id: admin._id,
        email: admin.email,
        role: 'admin',
        token: generateToken(admin._id, 'admin'),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student Login
const studentLogin = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  try {
    const student = await Student.findOne({ email: email.toLowerCase().trim() });
    
    if (!student) {
      return res.status(404).json({ message: 'Student email is not registered by Admin.' });
    }

    if (student.examStatus === 'completed') {
      const Setting = require('../models/Setting');
      const setting = await Setting.findOne({});
      const resultsPublished = setting ? setting.resultsPublished : false;
 
      if (!resultsPublished) {
        return res.status(400).json({ 
          message: 'You have completed the exam. Results are not published yet. Please wait for them to get published.' 
        });
      }
    }

    // Check if ExamSession exists, if not, create one
    let session = await ExamSession.findOne({ studentId: student._id });
    
    if (!session) {
      // 1. Assign 3 random animal classes
      const allAnimals = [
        'Bear', 'Bird', 'Cow', 'Deer', 'Dolphin', 
        'Elephant', 'Giraffe', 'Horse', 'Kangaroo', 
        'Lion', 'Panda', 'Tiger', 'Zebra'
      ]; // Excluded Cat and Dog
      
      // Shuffle and pick 3
      const shuffledAnimals = [...allAnimals].sort(() => 0.5 - Math.random());
      student.assignedClasses = shuffledAnimals.slice(0, 3);
      student.examStatus = 'mcq_in_progress';
      await student.save();

      // 2. Select 50 random questions from Question Bank
      const allQuestions = await Question.find({});
      if (allQuestions.length < 50) {
        // Fallback: If bank has less than 50 questions, take all available
        console.warn(`Question Bank only has ${allQuestions.length} questions. Need at least 50.`);
      }
      
      const shuffledQuestions = [...allQuestions].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffledQuestions.slice(0, 50);
      const questionIds = selectedQuestions.map(q => q._id);

      // Shuffle options for each question to save in session
      const optionsShuffled = selectedQuestions.map(q => {
        return [...q.options].sort(() => 0.5 - Math.random());
      });

      // 3. Create the Session
      session = await ExamSession.create({
        studentId: student._id,
        mcqQuestions: questionIds,
        mcqOptionsShuffled: optionsShuffled,
        mcqAnswers: {},
        currentQuestionIndex: 0,
        mcqTimeRemaining: 7200, // 2 hours
        codingTimeRemaining: 10800, // 3 hours
        mcqCompleted: false,
        codingCompleted: false,
      });
    }

    res.json({
      _id: student._id,
      fullName: student.fullName,
      email: student.email,
      examStatus: student.examStatus,
      assignedClasses: student.assignedClasses,
      role: 'student',
      token: generateToken(student._id, 'student'),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  adminLogin,
  studentLogin,
};
