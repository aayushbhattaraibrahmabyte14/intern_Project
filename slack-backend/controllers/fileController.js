const path = require('path');
const fs = require('fs');
const mongoose = require("mongoose"); // Import mongoose for ObjectId validation
const File = require("../models/file"); // Import the File model

// Local storage directory
const UPLOAD_DIR = path.join(__dirname, '../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Function to upload a file to local storage

exports.uploadFiles = async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
  
      const { channelId, directMessageId } = req.body;
  
      if (!channelId && !directMessageId) {
        return res.status(400).json({
          message: "No context provided (channelId or directMessageId)",
        });
      }
  
      // Array to hold file metadata promises
      const uploadedFiles = req.files.map(async (file) => {
        const filePath = path.join(__dirname, '../uploads/files', file.filename);
  
        const newFile = new File({
          filename: file.filename,
          path: filePath, // Path to the file on disk
          mimetype: file.mimetype,
          size: file.size,
          channelId: channelId || null,
          directMessageId: directMessageId || null,
        });
  
        // Save file metadata to the database
        const savedFile = await newFile.save();
  
        // Log file details
        console.log(`File uploaded:`);
        console.log(`Name: ${savedFile.filename}`);
        console.log(`Size: ${savedFile.size} bytes`);
        console.log(`ID: ${savedFile._id}`);
        console.log(`Path: ${savedFile.path}`);
  
        return savedFile;
      });
  
      const filesData = await Promise.all(uploadedFiles);
  
      res.status(201).json({
        message: "Files uploaded successfully",
        files: filesData,
      });
    } catch (err) {
      console.error("Error in uploadFiles:", err);
      res.status(500).json({ message: "File upload failed", error: err.message });
    }
  };

// Function to get all files
exports.getAllFiles = async (req, res) => {
  try {
    const { channelId, directMessageId, filename } = req.query;

    let query = {};
    if (channelId) {
      query.channelId = channelId;
    } else if (directMessageId) {
      query.directMessageId = directMessageId;
    } else if (filename) {
      query.filename = filename;
    }

    const files = await File.find(query);

    // Return files with their local path as URLs
    const filesWithUrls = files.map((file) => ({
      ...file._doc,
      url: `/uploads/${file.filename}`, // Local URL to access files
    }));

    res.json(filesWithUrls);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve files", error: err.message });
  }
};

// Function to get a file by its ID
exports.getFileById = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json({ ...file._doc, url: `/uploads/${file.filename}` });
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve file", error: err.message });
  }
};



exports.deleteFileById = async (req, res) => {
    try {
      const { fileId } = req.params;
  
      // Validate if fileId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
  
      // Find the file metadata in the database
      const file = await File.findById(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
  
      // Delete the file from the filesystem
      if (fs.existsSync(file.path)) {
        fs.unlink(file.path, async (err) => {
          if (err) {
            console.error("Failed to delete file from disk:", err);
            return res.status(500).json({ message: "Failed to delete file from disk", error: err.message });
          }
  
          // Delete the file metadata from the database
          try {
            await File.findByIdAndDelete(fileId);
            res.json({ message: "File deleted successfully" });
          } catch (dbErr) {
            console.error("Failed to delete file metadata from database:", dbErr);
            res.status(500).json({ message: "Failed to delete file metadata from database", error: dbErr.message });
          }
        });
      } else {
        res.status(404).json({ message: "File not found on disk" });
      }
    } catch (err) {
      console.error("Error in deleteFileById:", err);
      res.status(500).json({ message: "File deletion failed", error: err.message });
    }
  };