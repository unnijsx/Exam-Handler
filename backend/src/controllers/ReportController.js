const Student = require('../models/Student');
const Result = require('../models/Result');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

// Export all results in Excel format
const exportExcelResults = async (req, res) => {
  try {
    const students = await Student.find({}).sort({ finalScore: -1 });
    const data = students.map((s, index) => ({
      'S.No': index + 1,
      'Full Name': s.fullName,
      'Email': s.email,
      'Status': s.examStatus.replace(/_/g, ' ').toUpperCase(),
      'MCQ Score (Max 50)': s.mcqScore !== null ? s.mcqScore : 'N/A',
      'Coding Score (Max 50)': s.codingScore !== null ? s.codingScore : 'N/A',
      'Final Score (Max 100)': s.finalScore !== null ? s.finalScore : 'N/A',
      'Assigned Classes': s.assignedClasses.join(', ') || 'N/A',
      'Submission Date': s.submissionTime ? new Date(s.submissionTime).toLocaleString() : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Grades');

    // Adjust column widths
    const maxLens = {};
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        const valStr = String(row[key]);
        maxLens[key] = Math.max(maxLens[key] || 10, valStr.length);
      });
    });
    worksheet['!cols'] = Object.keys(maxLens).map(key => ({ wch: maxLens[key] + 3 }));

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=EvalAI_Campus_Results.xlsx');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Excel export failed: ' + error.message });
  }
};

// Export all results summary as PDF Booklet
const exportPdfResults = async (req, res) => {
  try {
    const students = await Student.find({}).sort({ finalScore: -1 });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=EvalAI_Campus_General_Report.pdf');
    doc.pipe(res);

    // Header Branding
    doc.fillColor('#0F172A').fontSize(22).text('EvalAI Campus', { align: 'center' });
    doc.fontSize(12).fillColor('#2563EB').text('AI & Machine Learning Assessment Platform', { align: 'center' });
    doc.moveDown(1.5);
    
    doc.fillColor('#1E293B').fontSize(14).text('General Class Examination Report', { underline: true });
    doc.fontSize(9).fillColor('#64748B').text(`Generated Date: ${new Date().toLocaleString()}`);
    doc.moveDown(1.5);

    // Simple Table Layout
    const tableTop = doc.y;
    doc.fontSize(10).fillColor('#0F172A');
    
    // Headers
    doc.text('S.No', 30, tableTop, { width: 30 });
    doc.text('Student Name', 65, tableTop, { width: 140 });
    doc.text('Email', 210, tableTop, { width: 160 });
    doc.text('Status', 375, tableTop, { width: 80 });
    doc.text('MCQ (50)', 460, tableTop, { width: 45, align: 'right' });
    doc.text('Coding (50)', 510, tableTop, { width: 55, align: 'right' });
    doc.moveDown(0.5);
    
    doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
    doc.moveDown(0.5);

    students.forEach((s, idx) => {
      if (doc.y > 750) {
        doc.addPage();
        doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(30, doc.y).lineTo(565, doc.y).stroke();
        doc.moveDown(0.5);
      }
      
      const currentY = doc.y;
      doc.fontSize(9).fillColor('#1E293B');
      doc.text(idx + 1, 30, currentY, { width: 30 });
      doc.text(s.fullName, 65, currentY, { width: 140 });
      doc.text(s.email, 210, currentY, { width: 160 });
      doc.text(s.examStatus.replace(/_/g, ' '), 375, currentY, { width: 80 });
      doc.text(s.mcqScore !== null ? s.mcqScore : '-', 460, currentY, { width: 45, align: 'right' });
      doc.text(s.codingScore !== null ? s.codingScore : '-', 510, currentY, { width: 55, align: 'right' });
      
      doc.moveDown(0.8);
    });

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#64748B').text('EvalAI Campus Assessment © 2026 - All Rights Reserved.', { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'PDF booklet export failed: ' + error.message });
  }
};

// Generate individual Student printable Mark Sheet PDF
const exportIndividualMarksheet = async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const result = await Result.findOne({ studentId }).populate('studentId');
    const aiEval = result && result.aiEvaluation ? result.aiEvaluation : {
      codeQualityScore: 0,
      datasetHandlingScore: 0,
      cnnImplementationScore: 0,
      outputQualityScore: 0,
      overallSummary: 'Not evaluated.',
      suggestedScore: 0
    };

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Marksheet_${student.fullName.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    // Border Frame
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).strokeColor('#E2E8F0').lineWidth(2).stroke();

    // Brand Banner
    doc.fillColor('#0F172A').fontSize(24).text('EvalAI Campus', 50, 45, { align: 'left' });
    doc.fillColor('#2563EB').fontSize(10).text('AI & Machine Learning Assessment Platform', 50, 75);
    
    doc.strokeColor('#2563EB').lineWidth(2).moveTo(50, 90).lineTo(545, 90).stroke();
    doc.moveDown(2.5);

    // Title
    doc.fillColor('#0F172A').fontSize(16).text('OFFICIAL ACADEMIC MARK SHEET', { align: 'center' });
    doc.moveDown(1.5);

    // Student Info Panel (Boxed)
    const infoY = doc.y;
    doc.rect(50, infoY, 495, 80).fillColor('#F8FAFC').fill().strokeColor('#E2E8F0').lineWidth(1).stroke();
    
    doc.fillColor('#1E293B').fontSize(10);
    doc.text(`Student Name:  ${student.fullName}`, 65, infoY + 15);
    doc.text(`Email Address: ${student.email}`, 65, infoY + 30);
    doc.text(`Assigned Animal Classes: ${student.assignedClasses.join(', ') || 'N/A'}`, 65, infoY + 45);

    doc.text(`Exam Status: ${student.examStatus.replace(/_/g, ' ').toUpperCase()}`, 330, infoY + 15);
    doc.text(`Submission Date: ${student.submissionTime ? new Date(student.submissionTime).toLocaleDateString() : 'N/A'}`, 330, infoY + 30);
    doc.moveDown(6.5);

    // Score Board Panel
    doc.fillColor('#0F172A').fontSize(12).text('Score Breakout Summary', { underline: true });
    doc.moveDown(0.8);

    const scoreTableY = doc.y;
    doc.rect(50, scoreTableY, 495, 90).strokeColor('#E2E8F0').stroke();
    
    // Draw lines
    doc.moveTo(250, scoreTableY).lineTo(250, scoreTableY + 90).stroke();
    doc.moveTo(50, scoreTableY + 30).lineTo(545, scoreTableY + 30).stroke();
    doc.moveTo(50, scoreTableY + 60).lineTo(545, scoreTableY + 60).stroke();

    // Fill table values
    doc.fontSize(10).fillColor('#0F172A');
    doc.text('Assessment Phase', 60, scoreTableY + 10);
    doc.text('Obtained Marks / Total Max', 270, scoreTableY + 10);

    doc.fillColor('#1E293B');
    doc.text('Phase 1: MCQ Examination', 60, scoreTableY + 40);
    doc.text(`${student.mcqScore !== null ? student.mcqScore : '-'}  /  50`, 270, scoreTableY + 40);

    doc.text('Phase 2: Coding CNN Examination', 60, scoreTableY + 70);
    doc.text(`${student.codingScore !== null ? student.codingScore : '-'}  /  50`, 270, scoreTableY + 70);
    doc.moveDown(8);

    // Final Aggregate Box
    const finalY = doc.y;
    doc.rect(50, finalY, 495, 40).fillColor('#EFF6FF').fill().strokeColor('#BFDBFE').stroke();
    doc.fillColor('#1E3A8A').fontSize(12).text(`FINAL SCORE:  ${student.finalScore !== null ? student.finalScore : '-'} / 100`, 65, finalY + 14, { bold: true });
    doc.moveDown(3);

    // AI Evaluation Breakout Panel
    doc.fillColor('#0F172A').fontSize(12).text('Detailed AI Model Evaluation Details', { underline: true });
    doc.moveDown(0.8);

    const aiBreakdownY = doc.y;
    doc.fontSize(9).fillColor('#475569');
    doc.text(`Code Quality Structure:   ${aiEval.codeQualityScore} / 12.5`, 50, aiBreakdownY);
    doc.text(`Dataset Classes Filter:    ${aiEval.datasetHandlingScore} / 12.5`, 50, aiBreakdownY + 15);
    doc.text(`CNN Network Construction:  ${aiEval.cnnImplementationScore} / 12.5`, 300, aiBreakdownY);
    doc.text(`Visual Graph Convergence:  ${aiEval.outputQualityScore} / 12.5`, 300, aiBreakdownY + 15);

    doc.moveDown(3);

    // AI Overall feedback notes
    doc.fillColor('#0F172A').fontSize(11).text('Gemini Evaluation Summary:');
    doc.moveDown(0.5);
    
    // Simple sanitization of markdown bold markers for raw pdf display
    const cleanFeedback = aiEval.overallSummary.replace(/\*\*/g, '').replace(/\*/g, '');
    doc.fontSize(9).fillColor('#334155').text(cleanFeedback, 50, doc.y, {
      width: 495,
      align: 'justify',
      lineGap: 3
    });

    // Signature line
    doc.moveDown(4);
    if (doc.y > 750) {
      doc.addPage();
    }
    const signatureY = doc.y;
    doc.strokeColor('#94A3B8').lineWidth(1).moveTo(350, signatureY + 40).lineTo(520, signatureY + 40).stroke();
    doc.fontSize(9).fillColor('#64748B').text('Admin Authorized Signatory', 360, signatureY + 47);

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Marksheet generation failed: ' + error.message });
  }
};

module.exports = {
  exportExcelResults,
  exportPdfResults,
  exportIndividualMarksheet,
};
