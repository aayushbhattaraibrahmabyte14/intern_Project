// controllers/directMessageController.js
const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');
const mentionUtils = require('../utils/mentionUtils'); // Ensure this utility is correctly implemented
const SelfMessage = require("../models/selfMessage"); // New model for self-messages
const path = require('path');
const fs = require('fs');
const { getIO } = require("../socket");

const uploadAudio = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // File information
        const { filename, path: filePath } = req.file;

        // You can process the file here or save the file information to the database

        // Example response with file info
        res.status(201).json({
            message: 'Audio file uploaded successfully',
            file: {
                filename,
                path: filePath,
                url: `/uploads/files/${filename}` // URL to access the uploaded file
            }
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Server error', error: error.message || error });
    }
};




// Send a direct message
const sendDirectMessage = async (req, res) => {
  try {
    const { receiverId, content, audio, video, image, fileIds } = req.body; // Add fileIds here
    const senderId = req.user.id;

    if (!receiverId || !content) {
      return res.status(400).json({ message: "Receiver ID and content are required" });
    }

    const message = new DirectMessage({
      content,
      sender: senderId,
      receiver: receiverId,
      audio,
      video,
      image,
      files: fileIds || [] // Link files to the message
    });

    await message.save();

    const messageData = {
      id: message._id,
      content,
      sender: senderId,
      receiver: receiverId,
      createdAt: message.createdAt,
      audio: message.audio,
      video: message.video,
      image: message.image,
      files: message.files // Include files in the response
    };

    const io = getIO();
    io.emit("sendDirectMessage", messageData);

    return res.status(201).json({
      message: "Direct message sent successfully",
      messageData
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Server error" });
  }
};




const getDirectMessages = async (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.params;

  try {
    let messages;

    if (userId === otherUserId) {
      messages = await SelfMessage.find({ sender: userId }).sort({ createdAt: 1 });
    } else {
      messages = await DirectMessage.find({
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId },
        ],
      })
        .populate("sender", "name email")
        .populate("receiver", "name email")
        .populate("files") // Populate files
        .sort({ createdAt: 1 });
    }

    if (!messages || messages.length === 0) {
      return res.status(404).json({ message: "No messages found" });
    }

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Server error", error: error.message || error });
  }
};



// Edit a direct message
const editDirectMessage = async (req, res) => {
  const { messageId } = req.params;
  const { newContent } = req.body;
  const userId = req.user.id;

  try {
    console.log("Received data:", { messageId, newContent });

    if (!newContent) {
      return res.status(400).json({ message: "New content is required" });
    }

    const message = await DirectMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can only edit your own messages" });
    }

        // Update the message content
        message.content = newContent;
        message.updatedAt = new Date();
        message.edited = true;
        await message.save();

         // Fetch the updated message with populated fields
    const updatedMessage = await DirectMessage.findById(messageId)
    .populate("sender", "username")
    .populate("receiver", "username");

        // Emit event to notify about the message update
        req.io.to(message.receiver.toString()).emit('messageUpdated', { messageId, newContent });

        res.status(200).json({ message: 'Message updated successfully', message });
    } catch (error) {
        console.error('Error editing direct message:', error);
        res.status(500).json({ message: 'Server error', error: error.message || error });
    }
};

// Delete a direct message
const deleteDirectMessage = async (req, res) => {
    const { messageId } = req.params;

    try {
        // Find and delete the message
        const result = await DirectMessage.findByIdAndDelete(messageId);
        if (!result) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting direct message:', error);
        res.status(500).json({ message: 'Server error', error: error.message || error });
    }
};

// Forward a direct message
const forwardDirectMessage = async (req, res) => {
    const { messageId, userIds } = req.body;

    try {
        if (!messageId || !userIds || !userIds.length) {
            return res.status(400).json({ message: 'Message ID and user IDs are required' });
        }

        // Find the message to be forwarded
        const message = await DirectMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Find users to forward the message to
        const users = await User.find({ _id: { $in: userIds } });
        if (users.length !== userIds.length) {
            return res.status(404).json({ message: 'Some users not found' });
        }

        // Update the message to track forwarded users
        message.forwardedTo = [...new Set([...message.forwardedTo, ...userIds])]; // Prevent duplicates
        await message.save();

        // Emit the forwarded message to the new recipients
        userIds.forEach(userId => {
            req.io.to(userId).emit('receiveDirectMessage', { ...message.toObject(), forwarded: true });
        });

        res.status(200).json({ message: 'Message forwarded successfully', message });
    } catch (error) {
        console.error('Error forwarding direct message:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    sendDirectMessage,
    editDirectMessage,
    deleteDirectMessage,
    forwardDirectMessage,
    getDirectMessages,
    uploadAudio
};
