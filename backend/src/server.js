const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const questionRoutes = require('./routes/questionRoutes');
const examRoutes = require('./routes/examRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const resultRoutes = require('./routes/resultRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Connect to MongoDB and run autoseed check
connectDB().then(() => {
  autoSeed();
});

const autoSeed = async () => {
  try {
    const Admin = require('./models/Admin');
    const Question = require('./models/Question');
    const { questionsData } = require('./seed');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@eval';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admineval123';

    let admin = await Admin.findOne({ email: adminEmail.toLowerCase().trim() });
    if (!admin) {
      console.log(`AutoSeed: Admin "${adminEmail}" not found. Seeding default admin...`);
      admin = new Admin({
        email: adminEmail.toLowerCase().trim(),
        password: adminPassword,
      });
      await admin.save();
      console.log(`AutoSeed: Seeded admin account: ${adminEmail}`);
    } else {
      const isMatch = await admin.comparePassword(adminPassword);
      if (!isMatch) {
        console.log(`AutoSeed: Admin password mismatch with environment. Updating password...`);
        admin.password = adminPassword;
        await admin.save();
        console.log(`AutoSeed: Admin password updated successfully.`);
      } else {
        console.log(`AutoSeed: Admin "${adminEmail}" check passed.`);
      }
    }

    console.log('AutoSeed: Syncing MCQ Question bank with seed data...');
    const existingQuestions = await Question.find({});
    const existingMap = new Map(existingQuestions.map(q => [q.questionText, q]));
    const seedTexts = new Set(questionsData.map(q => q.questionText));
    
    // 1. Delete questions no longer in seed.js (like YOLO and NLP)
    let deleteCount = 0;
    for (const eq of existingQuestions) {
      if (!seedTexts.has(eq.questionText)) {
        await Question.deleteOne({ _id: eq._id });
        deleteCount++;
      }
    }
    if (deleteCount > 0) {
      console.log(`AutoSeed: Deleted ${deleteCount} deprecated questions (e.g. YOLO/NLP).`);
    }

    // 2. Insert new questions or update modified ones
    let insertCount = 0;
    let updateCount = 0;
    for (const sq of questionsData) {
      const eq = existingMap.get(sq.questionText);
      if (eq) {
        const optionsMatch = eq.options.length === sq.options.length && 
                             eq.options.every((val, index) => val === sq.options[index]);
        if (eq.topic !== sq.topic || !optionsMatch || eq.correctAnswer !== sq.correctAnswer) {
          eq.topic = sq.topic;
          eq.options = sq.options;
          eq.correctAnswer = sq.correctAnswer;
          await eq.save();
          updateCount++;
        }
      } else {
        await Question.create(sq);
        insertCount++;
      }
    }
    console.log(`AutoSeed: MCQ sync complete. Seeded ${questionsData.length} total. Inserted ${insertCount}, updated ${updateCount} questions.`);
  } catch (error) {
    console.error('AutoSeed: Error during automatic check/seeding:', error.message);
  }
};

// Global Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'https://evalai.rheox.online'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app');
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// Set helmet, and disable contentSecurityPolicy if it causes issues serving static files or adjust it
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/reports', reportRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'EvalAI Campus API Server is running.' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 13697;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
