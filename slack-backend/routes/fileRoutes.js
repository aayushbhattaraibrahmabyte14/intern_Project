const express = require("express");
const multer = require("multer");
const path = require("path"); // For working with file paths
const fs = require("fs"); // To interact with the filesystem
const router = express.Router();
const authenticate = require('../middleware/authenticate');

const {
  uploadFiles,
  getAllFiles,
  getFileById,
  deleteFileById,
  
} = require("../controllers/fileController");

// Define the directory where files will be saved
const uploadDir = path.join(__dirname, "../uploads/files");

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save files to the 'uploads/files' directory
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get the file extension
    cb(null, `${Date.now()}-${file.originalname}`); // Rename the file to avoid name collisions
  }
});

// Configure multer with storage settings and a 50MB file size limit
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit per file
});

// Route to upload multiple files (up to 10)
router.post("/upload", upload.array("files", 10),authenticate, uploadFiles); 

// Route to get all files based on query parameters
router.get("/get-all-files",authenticate, getAllFiles);

// Route to get a file by ID
router.get("/files/:fileId",authenticate, getFileById);

// Route to get recent files
// router.get("/get-recent-files", getRecentFiles);

// Route to delete a file by ID
router.delete("/files/:fileId", authenticate, deleteFileById); // Add this route

module.exports = router;
