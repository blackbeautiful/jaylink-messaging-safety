const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const ApiError = require('../utils/api-error.util');
const logger = require('../config/logger');

// Ensure upload directories exist
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    try {
      fs.mkdirSync(directory, { recursive: true });
      logger.info(`Created directory: ${directory}`);
    } catch (error) {
      logger.error(`Failed to create directory ${directory}: ${error.message}`);
      throw new Error(`Failed to create upload directory: ${error.message}`);
    }
  }
};

// CSV upload directory path
const csvUploadDir = path.join(process.cwd(), config.upload.directory, 'csv');
ensureDirectoryExists(csvUploadDir);

// Define storage for CSV uploads
const csvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, csvUploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.csv';
    cb(null, `contact-import-${uniqueSuffix}${ext}`);
  },
});

// CSV file filter function
const csvFileFilter = (_req, file, cb) => {
  // Check file type
  const allowedTypes = config.upload.allowedCsvTypes;
  const mimetype = file.mimetype;
  
  if (allowedTypes.includes(mimetype)) {
    return cb(null, true);
  }
  
  const error = new ApiError(`Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`, 400);
  return cb(error, false);
};

// CSV upload middleware
const uploadCsv = multer({
  storage: csvStorage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: config.upload.maxCsvSize,
  },
}).single('file');

// Middleware function that handles errors properly
const csvUploadMiddleware = (req, res, next) => {
  uploadCsv(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError(`File is too large. Maximum size is ${config.upload.maxCsvSize / (1024 * 1024)}MB`, 400));
        }
        return next(new ApiError(`File upload error: ${err.message}`, 400));
      }
      
      // An unknown error occurred
      return next(err);
    }
    
    // Check if file exists in request
    if (!req.file) {
      return next(new ApiError('No file uploaded. Please select a CSV file.', 400));
    }
    
    next();
  });
};

module.exports = {
  csvUploadMiddleware,
};