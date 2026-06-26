const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

const protectAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'evalai_campus_jwt_secret_key_2026');
      
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(401).json({ message: 'Not authorized, admin not found' });
      }
      
      req.admin = admin;
      req.userRole = 'admin';
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const protectStudent = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'evalai_campus_jwt_secret_key_2026');
      
      const student = await Student.findById(decoded.id);
      if (!student) {
        return res.status(401).json({ message: 'Not authorized, student not found' });
      }
      
      // If student has already completed the exam, lock them out unless it's just fetching their completed landing page
      if (student.examStatus === 'completed' && req.baseUrl + req.path !== '/api/exam/status') {
        // Allow reading their submission or stats, but block updates unless submitting feedback
        if (req.method !== 'GET' && !req.originalUrl.includes('/feedback')) {
          return res.status(403).json({ message: 'Exam already submitted and locked' });
        }
      }

      req.student = student;
      req.userRole = 'student';
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = {
  protectAdmin,
  protectStudent,
};
