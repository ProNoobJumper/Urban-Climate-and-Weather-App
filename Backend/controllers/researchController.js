/**
 * Research Controller
 * Handles research data uploads, verification, and retrieval
 */

const ResearchUpload = require('../models/ResearchUpload');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Upload research data
 * @route POST /api/research/upload
 * @access Protected (researcher, admin)
 */
const uploadData = async (req, res) => {
  try {
    const { title, description, dataType, city, startDate, endDate, methodology } = req.body;
    
    // Validate required fields
    if (!title || !description || !dataType) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and data type are required'
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Create research upload record
    const upload = new ResearchUpload({
      uploadedBy: req.userId,
      title: title,
      description: description,
      dataType: dataType,
      city: city,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      methodology: methodology,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'pending',
      uploadDate: new Date()
    });
    
    await upload.save();
    
    logger.info(`Research data uploaded: ${title} by user ${req.userId}`);
    
    res.status(201).json({
      success: true,
      message: 'Research data uploaded successfully',
      upload: {
        id: upload._id,
        title: upload.title,
        status: upload.status,
        uploadDate: upload.uploadDate
      }
    });
    
  } catch (error) {
    logger.error('Upload data error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all verified research data
 * @route GET /api/research/verified
 */
const getVerifiedData = async (req, res) => {
  try {
    const { city, dataType, page = 1, limit = 20 } = req.query;
    
    const query = { status: 'verified' };
    
    if (city) query.city = city;
    if (dataType) query.dataType = dataType;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const uploads = await ResearchUpload.find(query)
      .populate('uploadedBy', 'fullName email organization')
      .populate('verifiedBy', 'fullName email')
      .sort({ verifiedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await ResearchUpload.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: uploads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    logger.error('Get verified data error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get user's own uploads
 * @route GET /api/research/my-uploads
 * @access Protected
 */
const getMyUploads = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { uploadedBy: req.userId };
    
    if (status) query.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const uploads = await ResearchUpload.find(query)
      .populate('verifiedBy', 'fullName email')
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await ResearchUpload.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: uploads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    logger.error('Get my uploads error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get single upload by ID
 * @route GET /api/research/:id
 */
const getUploadById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const upload = await ResearchUpload.findById(id)
      .populate('uploadedBy', 'fullName email organization')
      .populate('verifiedBy', 'fullName email')
      .lean();
    
    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }
    
    // Check if user has permission to view
    if (upload.status !== 'verified' && upload.uploadedBy._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      success: true,
      data: upload
    });
    
  } catch (error) {
    logger.error('Get upload by ID error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Verify/reject research upload
 * @route PUT /api/research/:id/verify
 * @access Protected (admin only)
 */
const verifyUpload = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "verified" or "rejected"'
      });
    }
    
    const upload = await ResearchUpload.findById(id);
    
    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }
    
    upload.status = status;
    upload.verifiedBy = req.userId;
    upload.verifiedDate = new Date();
    upload.verificationFeedback = feedback;
    
    await upload.save();
    
    logger.info(`Upload ${id} ${status} by user ${req.userId}`);
    
    res.status(200).json({
      success: true,
      message: `Upload ${status} successfully`,
      upload: {
        id: upload._id,
        status: upload.status,
        verifiedDate: upload.verifiedDate
      }
    });
    
  } catch (error) {
    logger.error('Verify upload error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Download research file
 * @route GET /api/research/:id/download
 */
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const upload = await ResearchUpload.findById(id);
    
    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }
    
    // Check if file exists
    try {
      await fs.access(upload.filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }
    
    // Increment download count
    upload.downloadCount = (upload.downloadCount || 0) + 1;
    await upload.save();
    
    logger.info(`File downloaded: ${upload.fileName} (${id})`);
    
    res.download(upload.filePath, upload.fileName);
    
  } catch (error) {
    logger.error('Download file error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  uploadData,
  getVerifiedData,
  getMyUploads,
  getUploadById,
  verifyUpload,
  downloadFile
};
