const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const studentId = req.student ? req.student._id.toString() : 'temp';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${studentId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter rules
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'screenshotTraining' || 
      file.fieldname === 'screenshotAccuracy' || 
      file.fieldname === 'screenshotPrediction') {
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format. Only PNG, JPG, JPEG are allowed for screenshots.'), false);
    }
  } else if (file.fieldname === 'codeFile') {
    if (['.py', '.ipynb', '.txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid code file format. Only .py, .ipynb, .txt are allowed.'), false);
    }
  } else if (file.fieldname === 'ptFile') {
    if (ext === '.pt') {
      cb(null, true);
    } else {
      cb(new Error('Invalid weights file format. Only .pt is allowed.'), false);
    }
  } else {
    cb(new Error('Unexpected file field.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Multer fields configuration for submission
const submissionUpload = upload.fields([
  { name: 'codeFile', maxCount: 1 },
  { name: 'ptFile', maxCount: 1 },
  { name: 'screenshotTraining', maxCount: 1 },
  { name: 'screenshotAccuracy', maxCount: 1 },
  { name: 'screenshotPrediction', maxCount: 1 },
]);

module.exports = {
  submissionUpload,
  uploadDir,
};
