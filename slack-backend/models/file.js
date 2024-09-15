const mongoose = require("mongoose");

// Define the schema for file metadata
const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true }, // Ensure filename is provided
  path: { type: String, required: true }, // Local path of the file
  mimetype: { type: String, required: true }, // MIME type of the file
  size: { type: Number, required: true }, // Size of the file in bytes
  createdAt: { type: Date, default: Date.now }, // Timestamp when the file was uploaded
  channelId: { type: String, required: false }, // Optional context for the file
  directMessageId: { type: String, required: false }, // Optional context for the file
});

// Create an index for fast searching
fileSchema.index({ channelId: 1, directMessageId: 1 });

module.exports = mongoose.model("File", fileSchema);
