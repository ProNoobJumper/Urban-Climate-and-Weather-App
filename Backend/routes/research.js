const express = require('express');
const multer = require('multer');
const path = require('path');
const researchController = require('../controllers/researchController');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || 5242880) },
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.json', '.xls', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: CSV, XLSX, JSON, XLS, PDF'));
    }
  }
});

// Public routes
router.get('/verified', researchController.getVerifiedData);
router.get('/:id', researchController.getUploadById);
router.get('/:id/download', researchController.downloadFile);

// Protected routes (require authentication)
router.post('/upload', auth, upload.single('file'), researchController.uploadData);
router.get('/my/uploads', auth, researchController.getMyUploads);

// Admin routes (require admin role)
router.put('/:id/verify', auth, researchController.verifyUpload);

module.exports = router;