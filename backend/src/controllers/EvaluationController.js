const Student = require('../models/Student');
const CodingSubmission = require('../models/CodingSubmission');
const Result = require('../models/Result');
const { evaluateSubmission } = require('../services/GeminiService');
const path = require('path');
const fs = require('fs');

// AI Evaluate Student Submission
const aiEvaluateStudent = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const submission = await CodingSubmission.findOne({ studentId });
    if (!submission) {
      return res.status(404).json({ message: 'No coding submission found for this student.' });
    }

    // Resolve paths to absolute paths
    const getLocalPath = (webPath) => {
      if (!webPath) return null;
      const fileName = path.basename(webPath);
      return path.join(__dirname, '../../uploads', fileName);
    };

    const screenshotTrainingPath = getLocalPath(submission.screenshotTrainingUrl);
    const screenshotAccuracyPath = getLocalPath(submission.screenshotAccuracyUrl);
    const screenshotPredictionPath = getLocalPath(submission.screenshotPredictionUrl);

    let finalCodeContent = submission.codeContent || '';
    if (!finalCodeContent && submission.codeFileUrl) {
      try {
        const codeFilePath = getLocalPath(submission.codeFileUrl);
        if (codeFilePath && fs.existsSync(codeFilePath)) {
          const fileExt = path.extname(codeFilePath).toLowerCase();
          const fileRaw = fs.readFileSync(codeFilePath, 'utf8');
          if (fileExt === '.ipynb') {
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
            finalCodeContent = codeLines.join('\n');
          } else {
            finalCodeContent = fileRaw;
          }
        }
      } catch (err) {
        console.error('Failed to read fallback code file content:', err);
      }
    }
 
    // Call Gemini Evaluation Service
    const evaluation = await evaluateSubmission({
      assignedClasses: submission.assignedClasses,
      codeContent: finalCodeContent,
      screenshotTrainingPath,
      screenshotAccuracyPath,
      screenshotPredictionPath,
    });
 
    const getNumericScore = (val) => {
      const parsed = Number(val);
      return isNaN(parsed) ? 0 : parsed;
    };
 
    const suggestedScore = getNumericScore(evaluation.suggestedScore);
    const codeQualityScore = getNumericScore(evaluation.codeQualityScore);
    const datasetHandlingScore = getNumericScore(evaluation.datasetHandlingScore);
    const cnnImplementationScore = getNumericScore(evaluation.cnnImplementationScore);
    const outputQualityScore = getNumericScore(evaluation.outputQualityScore);
 
    const scaledSuggestedScore = Math.round(suggestedScore / 2);
    const scaledCodeQualityScore = codeQualityScore / 2;
    const scaledDatasetHandlingScore = datasetHandlingScore / 2;
    const scaledCnnImplementationScore = cnnImplementationScore / 2;
    const scaledOutputQualityScore = outputQualityScore / 2;
 
    // Save to Result
    const result = await Result.findOneAndUpdate(
      { studentId },
      {
        mcqScore: student.mcqScore || 0,
        codingScore: scaledSuggestedScore,
        finalScore: (student.mcqScore || 0) + scaledSuggestedScore,
        aiEvaluation: {
          codeQualityScore: scaledCodeQualityScore,
          datasetHandlingScore: scaledDatasetHandlingScore,
          cnnImplementationScore: scaledCnnImplementationScore,
          outputQualityScore: scaledOutputQualityScore,
          overallSummary: evaluation.overallSummary || 'No feedback provided.',
          suggestedScore: scaledSuggestedScore,
        },
      },
      { new: true, upsert: true }
    );

    // Update Student
    student.codingScore = scaledSuggestedScore;
    student.finalScore = (student.mcqScore || 0) + scaledSuggestedScore;
    student.aiEvaluationSummary = evaluation.overallSummary;
    await student.save();

    res.json({
      message: 'AI Evaluation completed successfully.',
      evaluation: {
        codeQualityScore: scaledCodeQualityScore,
        datasetHandlingScore: scaledDatasetHandlingScore,
        cnnImplementationScore: scaledCnnImplementationScore,
        outputQualityScore: scaledOutputQualityScore,
        overallSummary: evaluation.overallSummary,
        suggestedScore: scaledSuggestedScore,
      },
      result,
      student,
    });
  } catch (error) {
    console.error('AI Evaluation Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Override / Save Final Student Score manually
const overrideScore = async (req, res) => {
  const { studentId } = req.params;
  const { codingScore } = req.body;

  if (codingScore === undefined || isNaN(codingScore)) {
    return res.status(400).json({ message: 'Valid Coding Score is required.' });
  }

  const scoreNum = Number(codingScore);
  if (scoreNum < 0 || scoreNum > 50) {
    return res.status(400).json({ message: 'Coding score must be between 0 and 50.' });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    student.codingScore = scoreNum;
    student.finalScore = (student.mcqScore || 0) + scoreNum;
    await student.save();

    const result = await Result.findOneAndUpdate(
      { studentId },
      {
        codingScore: scoreNum,
        finalScore: (student.mcqScore || 0) + scoreNum,
        markedByAdmin: true,
      },
      { new: true, upsert: true }
    );

    res.json({
      message: 'Scores updated successfully.',
      student,
      result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  aiEvaluateStudent,
  overrideScore,
};
