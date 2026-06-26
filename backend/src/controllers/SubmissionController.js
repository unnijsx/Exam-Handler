const CodingSubmission = require('../models/CodingSubmission');
const Student = require('../models/Student');
const ExamSession = require('../models/ExamSession');
const Result = require('../models/Result');
const path = require('path');
const fs = require('fs');

const submitCodingExam = async (req, res) => {
  try {
    const student = await Student.findById(req.student._id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (student.examStatus === 'completed') {
      return res.status(400).json({ message: 'Coding exam has already been submitted and locked.' });
    }

    // Check files uploaded by Multer
    const files = req.files || {};
    
    const screenshotTraining = files['screenshotTraining'] ? files['screenshotTraining'][0] : null;
    const screenshotAccuracy = files['screenshotAccuracy'] ? files['screenshotAccuracy'][0] : null;
    const screenshotPrediction = files['screenshotPrediction'] ? files['screenshotPrediction'][0] : null;
    
    const codeFile = files['codeFile'] ? files['codeFile'][0] : null;
    const ptFile = files['ptFile'] ? files['ptFile'][0] : null;

    // Validate mandatory screenshots
    if (!screenshotTraining || !screenshotAccuracy || !screenshotPrediction) {
      return res.status(400).json({ 
        message: 'Submission failed. You must upload all 3 mandatory screenshots: Training Completed, Accuracy Graph, and Prediction Output.' 
      });
    }

    // Get editor code content
    let codeContent = req.body.codeContent || '';

    // If a file is uploaded, extract content from it
    if (codeFile) {
      try {
        const filePath = codeFile.path;
        const fileExt = path.extname(codeFile.originalname).toLowerCase();
        const fileRaw = fs.readFileSync(filePath, 'utf8');

        if (fileExt === '.ipynb') {
          // Parse Jupyter Notebook JSON and extract code cell source lines
          const notebook = JSON.parse(fileRaw);
          const codeLines = [];
          if (notebook && Array.isArray(notebook.cells)) {
            notebook.cells.forEach(cell => {
              if (cell.cell_type === 'code' && Array.isArray(cell.source)) {
                codeLines.push(cell.source.join(''));
                codeLines.push('\n');
              }
            });
          }
          codeContent = codeLines.join('\n');
        } else {
          // Read normal code files (.py, .txt, etc.)
          codeContent = fileRaw;
        }
      } catch (err) {
        console.error('Failed to read uploaded code file content:', err);
      }
    }

    // Relative web paths for storage
    const getWebPath = (file) => file ? `/uploads/${file.filename}` : null;

    // Save CodingSubmission
    const submission = await CodingSubmission.findOneAndUpdate(
      { studentId: student._id },
      {
        studentId: student._id,
        codeContent,
        codeFileUrl: getWebPath(codeFile),
        ptFileUrl: getWebPath(ptFile),
        screenshotTrainingUrl: getWebPath(screenshotTraining),
        screenshotAccuracyUrl: getWebPath(screenshotAccuracy),
        screenshotPredictionUrl: getWebPath(screenshotPrediction),
        assignedClasses: student.assignedClasses,
        submittedAt: Date.now(),
      },
      { upsert: true, new: true }
    );

    // Update Student Status
    student.examStatus = 'completed';
    student.submissionTime = Date.now();
    student.codingScore = 0; // Default to 0 until evaluation
    student.finalScore = (student.mcqScore || 0) + 0;
    await student.save();

    // Lock session
    await ExamSession.findOneAndUpdate(
      { studentId: student._id },
      { codingCompleted: true, codingTimeRemaining: 0 }
    );

    // Initialize Result
    await Result.findOneAndUpdate(
      { studentId: student._id },
      {
        studentId: student._id,
        mcqScore: student.mcqScore || 0,
        codingScore: 0,
        finalScore: student.mcqScore || 0,
        aiEvaluation: {
          codeQualityScore: 0,
          datasetHandlingScore: 0,
          cnnImplementationScore: 0,
          outputQualityScore: 0,
          overallSummary: 'Not evaluated yet. Click "AI Evaluate" to start.',
          suggestedScore: 0
        },
        markedByAdmin: false,
      },
      { upsert: true }
    );

    res.json({
      message: 'Coding examination submitted successfully.',
      submission,
      examStatus: student.examStatus,
    });
  } catch (error) {
    console.error('Submission Error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitCodingExam,
};
