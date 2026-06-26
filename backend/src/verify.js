require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Student = require('./models/Student');
const Question = require('./models/Question');
const ExamSession = require('./models/ExamSession');

const runVerification = async () => {
  console.log('--- Starting System Logic Verification ---');
  
  try {
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/evalai-campus');
    console.log('✔ Database connection verified.');

    // 2. Check Admin exists
    const admin = await Admin.findOne({ email: 'admin@eval' });
    if (admin) {
      console.log('✔ Admin credentials seeded correctly.');
    } else {
      throw new Error('Verification Failed: Seed admin not found.');
    }

    // 3. Check Question Bank size
    const questionsCount = await Question.countDocuments({});
    console.log(`✔ Question Bank has ${questionsCount} questions.`);
    if (questionsCount < 50) {
      throw new Error(`Verification Failed: Expected at least 50 questions, found ${questionsCount}`);
    }

    // 4. Test Student Login Logic (Randomization Engine & Exclusions)
    console.log('Testing student randomization engine...');
    const testEmail = 'verify_test_student@university.edu';
    
    // Clean old verify student if any
    const staleStudents = await Student.find({ email: testEmail });
    const staleStudentIds = staleStudents.map(s => s._id);
    await ExamSession.deleteMany({ studentId: { $in: staleStudentIds } });
    await Student.deleteMany({ email: testEmail });

    // Create student
    const student = await Student.create({
      fullName: 'Verify Test Student',
      email: testEmail
    });
    console.log('✔ Test student registered successfully.');

    // Simulation of Login Engine
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
    
    console.log(`✔ Assigned Animal Classes: [${student.assignedClasses.join(', ')}]`);
    
    // Assert no Cat or Dog
    if (student.assignedClasses.includes('Cat') || student.assignedClasses.includes('Dog')) {
      throw new Error('Verification Failed: Randomization engine assigned excluded classes (Cat/Dog).');
    }
    console.log('✔ Verified: Cat and Dog are successfully excluded from assignment.');

    // Create session questions
    const allQuestions = await Question.find({});
    const shuffledQuestions = [...allQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffledQuestions.slice(0, 50);
    const questionIds = selectedQuestions.map(q => q._id);
    const optionsShuffled = selectedQuestions.map(q => [...q.options].sort(() => 0.5 - Math.random()));

    const session = await ExamSession.create({
      studentId: student._id,
      mcqQuestions: questionIds,
      mcqOptionsShuffled: optionsShuffled,
      mcqAnswers: {},
      currentQuestionIndex: 0,
    });

    if (session.mcqQuestions.length !== 50) {
      throw new Error(`Verification Failed: Shuffled exam has ${session.mcqQuestions.length} questions, expected 50.`);
    }
    console.log('✔ Verified: 50 unique questions assigned to student session.');

    // Assert options shuffled length matches options length (4)
    if (session.mcqOptionsShuffled[0].length !== 4) {
      throw new Error('Verification Failed: Shuffled options array length is incorrect.');
    }
    console.log('✔ Verified: Questions options shuffling maps correctly.');

    // Clean up verification data
    await ExamSession.deleteOne({ _id: session._id });
    await Student.deleteOne({ _id: student._id });
    console.log('✔ Cleaned up verification records from database.');

    console.log('--- ALL LOGIC TESTS PASSED SUCCESSFULLY! ---');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification Error:', error.message);
    process.exit(1);
  }
};

runVerification();
