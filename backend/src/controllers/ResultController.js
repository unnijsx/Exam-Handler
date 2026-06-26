const Student = require('../models/Student');
const Result = require('../models/Result');
const Setting = require('../models/Setting');

// Get all student results
const getResultsList = async (req, res) => {
  try {
    const results = await Result.find({}).populate('studentId').sort({ finalScore: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Admin Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({});
    const notStarted = await Student.countDocuments({ examStatus: 'not_started' });
    const inProgress = await Student.countDocuments({ 
      examStatus: { $in: ['mcq_in_progress', 'coding_in_progress'] } 
    });
    const completed = await Student.countDocuments({ examStatus: 'completed' });

    // Scores metrics for completed students
    const completedStudents = await Student.find({ examStatus: 'completed' });
    let avgScore = 0;
    let highestScore = 0;
    let lowestScore = 0;

    if (completedStudents.length > 0) {
      const scores = completedStudents.map(s => s.finalScore || 0);
      const totalScoreSum = scores.reduce((sum, val) => sum + val, 0);
      avgScore = Math.round((totalScoreSum / completedStudents.length) * 10) / 10;
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
    }

    // Chart bins for MCQ and Coding
    // MCQ is out of 50
    const mcqDistribution = { '0-10': 0, '11-20': 0, '21-30': 0, '31-40': 0, '41-50': 0 };
    // Coding is out of 50
    const codingDistribution = { '0-10': 0, '11-20': 0, '21-30': 0, '31-40': 0, '41-50': 0 };
    // Overall is out of 100
    const overallDistribution = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };

    const allStudents = await Student.find({ examStatus: 'completed' });
    allStudents.forEach(st => {
      const mcq = st.mcqScore || 0;
      const coding = st.codingScore || 0;
      const final = st.finalScore || 0;

      // MCQ Bins
      if (mcq <= 10) mcqDistribution['0-10']++;
      else if (mcq <= 20) mcqDistribution['11-20']++;
      else if (mcq <= 30) mcqDistribution['21-30']++;
      else if (mcq <= 40) mcqDistribution['31-40']++;
      else mcqDistribution['41-50']++;

      // Coding Bins
      if (coding <= 10) codingDistribution['0-10']++;
      else if (coding <= 20) codingDistribution['11-20']++;
      else if (coding <= 30) codingDistribution['21-30']++;
      else if (coding <= 40) codingDistribution['31-40']++;
      else codingDistribution['41-50']++;

      // Overall Bins
      if (final <= 20) overallDistribution['0-20']++;
      else if (final <= 40) overallDistribution['21-40']++;
      else if (final <= 60) overallDistribution['41-60']++;
      else if (final <= 80) overallDistribution['61-80']++;
      else overallDistribution['81-100']++;
    });

    // Recent activity (e.g. last 5 updated students)
    const recentActivity = await Student.find({})
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('fullName email examStatus updatedAt');

    res.json({
      cards: {
        totalStudents,
        notStarted,
        inProgress,
        completed,
        avgScore,
        highestScore,
        lowestScore,
      },
      charts: {
        mcqDistribution,
        codingDistribution,
        overallDistribution,
      },
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current results publish status
const getPublishStatus = async (req, res) => {
  try {
    let setting = await Setting.findOne({});
    if (!setting) {
      setting = await Setting.create({});
    }
    res.json({ resultsPublished: setting.resultsPublished });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle global results publish status
const togglePublishStatus = async (req, res) => {
  try {
    let setting = await Setting.findOne({});
    if (!setting) {
      setting = await Setting.create({});
    }
    setting.resultsPublished = !setting.resultsPublished;
    await setting.save();
    res.json({ resultsPublished: setting.resultsPublished });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getResultsList,
  getDashboardStats,
  getPublishStatus,
  togglePublishStatus,
};
