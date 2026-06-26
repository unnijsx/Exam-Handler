const Question = require('../models/Question');
const fs = require('fs');
const csv = require('csv-parser');

// Get all questions
const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({}).sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add single question
const addQuestion = async (req, res) => {
  const { topic, questionText, options, correctAnswer } = req.body;

  if (!topic || !questionText || !options || !correctAnswer) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!Array.isArray(options) || options.length !== 4) {
    return res.status(400).json({ message: 'Options must be an array of exactly 4 items.' });
  }

  if (!options.includes(correctAnswer)) {
    return res.status(400).json({ message: 'Correct answer must match one of the options.' });
  }

  try {
    const question = await Question.create({
      topic,
      questionText,
      options,
      correctAnswer,
    });
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Edit single question
const editQuestion = async (req, res) => {
  const { topic, questionText, options, correctAnswer } = req.body;

  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (topic) question.topic = topic;
    if (questionText) question.questionText = questionText;
    if (options) {
      if (!Array.isArray(options) || options.length !== 4) {
        return res.status(400).json({ message: 'Options must be exactly 4 items.' });
      }
      question.options = options;
    }
    if (correctAnswer) {
      const activeOptions = options || question.options;
      if (!activeOptions.includes(correctAnswer)) {
        return res.status(400).json({ message: 'Correct answer must match one of the options.' });
      }
      question.correctAnswer = correctAnswer;
    }

    const updatedQuestion = await question.save();
    res.json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete question
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    await question.deleteOne();
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk upload questions (handles both JSON array and CSV upload)
const bulkUploadQuestions = async (req, res) => {
  // Scenario A: JSON Payload
  if (req.body && Array.isArray(req.body.questions)) {
    try {
      const questionsData = req.body.questions;
      const createdQuestions = await Question.insertMany(questionsData);
      return res.status(201).json({
        message: `Successfully uploaded ${createdQuestions.length} questions.`,
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error inserting questions: ' + error.message });
    }
  }

  // Scenario B: CSV Upload
  if (req.file) {
    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        const topic = data.topic || data.Topic;
        const questionText = data.questionText || data.QuestionText || data.question || data.Question;
        const o1 = data.option1 || data.o1 || data.Option1;
        const o2 = data.option2 || data.o2 || data.Option2;
        const o3 = data.option3 || data.o3 || data.Option3;
        const o4 = data.option4 || data.o4 || data.Option4;
        const correctAnswer = data.correctAnswer || data.CorrectAnswer || data.answer || data.Answer;

        if (topic && questionText && o1 && o2 && o3 && o4 && correctAnswer) {
          const options = [o1.trim(), o2.trim(), o3.trim(), o4.trim()];
          if (options.includes(correctAnswer.trim())) {
            results.push({
              topic: topic.trim(),
              questionText: questionText.trim(),
              options,
              correctAnswer: correctAnswer.trim(),
            });
          } else {
            errors.push(`Row answer mismatches options: ${JSON.stringify(data)}`);
          }
        } else {
          errors.push(`Invalid row structure: ${JSON.stringify(data)}`);
        }
      })
      .on('end', async () => {
        fs.unlinkSync(req.file.path);
        try {
          if (results.length === 0) {
            return res.status(400).json({
              message: 'No valid questions found in CSV.',
              errors,
            });
          }
          const createdQuestions = await Question.insertMany(results);
          res.json({
            message: `Successfully imported ${createdQuestions.length} questions.`,
            errors,
          });
        } catch (err) {
          res.status(500).json({ message: 'Error inserting questions from CSV: ' + err.message });
        }
      })
      .on('error', (err) => {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error reading CSV file: ' + err.message });
      });
  } else {
    res.status(400).json({ message: 'No questions payload or CSV file uploaded.' });
  }
};

module.exports = {
  getQuestions,
  addQuestion,
  editQuestion,
  deleteQuestion,
  bulkUploadQuestions,
};
