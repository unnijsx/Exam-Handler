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

// Connect to MongoDB
connectDB();

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
