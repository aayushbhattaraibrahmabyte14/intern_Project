const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the directory where files will be saved
const uploadDir = path.join(__dirname, '../uploads/files');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Define storage for the uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Use the defined directory
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`); // Rename the file with a timestamp to avoid name collisions
    }
});

// Extend allowed file types to handle more than images
const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',            // PDFs
    'application/msword',         // .doc files
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx files
    'video/mp4',                  // MP4 video files
    'video/x-matroska'            // MKV video files
];

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type'), false); // Reject the file
    }
    cb(null, true); // Accept the file if the type is valid
};

// Set a larger file size limit (e.g., 100MB for videos or large files)
const fileSizeLimit = 100 * 1024 * 1024; // 100MB limit

// Configure multer with storage, file filter, and file size limit
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: fileSizeLimit }
});

// Export the multer configuration for use in your routes
module.exports = upload;
