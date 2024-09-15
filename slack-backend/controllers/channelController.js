const mongoose = require('mongoose');
const Channel = require("../models/Channels");
const Workspace = require("../models/Workspace");
const User = require("../models/User");``
const Message = require("../models/Message");
const { getIO } = require("../socket"); // Adjust the path to where getIO is defined

// Create a new channel
const createChannels = async (req, res) => {
  const { channels, workspaceId } = req.body; // channels is an array of channel details
  const userId = req.user.id;
  
  if (!Array.isArray(channels) || channels.length === 0) {
    return res.status(400).json({ message: 'No channels provided' });
  }

  try {
    // Verify workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const createdChannels = [];

    for (const channelData of channels) {
      const { name, description, isPrivate } = channelData;
      
      // Create new channel
      const channel = new Channel({
        name,
        description,
        isPrivate,
        workspace: workspaceId,
        members: [userId],
      });

      await channel.save();
      createdChannels.push(channel);
    }

    res.status(201).json({
      message: 'Channels created successfully',
      channels: createdChannels
    });
  } catch (error) {
    console.error('Error creating channels:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
//join a channel
const joinChannel = async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user.id;
  try {
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    // Check if the user is already a member
    if (channel.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "Already a member of the channel" });
    }
    // Add user to channel members
    channel.members.push(userId);
    await channel.save();
    // Notify all members of the channel
    const io = getIO();
    channel.members.forEach((memberId) => {
      io.to(memberId.toString()).emit("userJoinedChannel", {
        userId,
        channelId,
        message: "A new user has joined the channel",
      });
    });
    res.status(200).json({ message: "Joined channel successfully", channel });
  } catch (error) {
    console.error("Error joining channel:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const leaveChannel = async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user.id;
  try {
    // Find the channel by ID
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    // Check if the user is a member of the channel
    if (!channel.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User not a member of the channel" });
    }
    // Remove the user from the channel's members list
    channel.members = channel.members.filter(
      (member) => member.toString() !== userId
    );
    await channel.save();
    // Notify remaining members that a user has left the channel
    const io = getIO();
    io.to(channelId).emit("userLeftChannel", {
      userId,
      channelId,
    });
    console.log(`Notification sent: User ${userId} left channel ${channelId}`);
    // Send success response
    res.status(200).json({ message: "Left channel successfully", channel });
  } catch (error) {
    // Handle any errors
    console.error("Error leaving channel:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};
// Function to get channels by workspace ID
const getChannelsByWorkspace = async (req, res) => {
  try {
      const { workspaceId } = req.params;
      // Find channels by workspace ID
      const channels = await Channel.find({ workspace: workspaceId });

      if (channels.length === 0) {
          return res.status(404).json({ message: 'No channels found for this workspace' });
      }

      res.status(200).json({ channels });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
};
// Update channel settings
const updateChannelSettings = async (req, res) => {
  const { channelId } = req.params;
  const { description, visibility, permissions } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: "Invalid channel ID" });
    }
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    if (description !== undefined) channel.description = description;
    if (visibility !== undefined) channel.visibility = visibility;
    if (permissions !== undefined) channel.permissions = permissions;
    await channel.save();
    res
      .status(200)
      .json({ message: "Channel settings updated successfully", channel });
  } catch (error) {
    console.error("Error updating channel settings:", error); // Log the error
    res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};
// Fetch channel by ID
const getChannelById = async (req, res) => {
  const { channelId } = req.params;
  console.log(`Received request to fetch channel by ID: ${channelId}`);
  try {
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      console.log(`Invalid channel ID: ${channelId}`);
      return res.status(400).json({ message: "Invalid channel ID" });
    }
    const channel = await Channel.findById(channelId);
    if (!channel) {
      console.log(`Channel not found for ID: ${channelId}`);
      return res.status(404).json({ message: "Channel not found" });
    }
    console.log(`Channel found: ${JSON.stringify(channel)}`);
    res.status(200).json(channel);
  } catch (error) {
    console.error("Error fetching channel by ID:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};
// Fetch channel by name
const getChannelByName = async (req, res) => {
  const { name } = req.params;
  console.log(`Received request to fetch channel by name: ${name}`);
  try {
    const channel = await Channel.findOne({ name });
    if (!channel) {
      console.log(`Channel not found for name: ${name}`);
      return res.status(404).json({ message: "Channel not found" });
    }
    console.log(`Channel found: ${JSON.stringify(channel)}`);
    res.status(200).json(channel);
  } catch (error) {
    console.error("Error fetching channel by name:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};
// Handle sending messages
const sendMessage = async (req, res) => {
  const { channelId, senderId, content } = req.body;
  try {
    // Check if the channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      console.error(`Channel not found for ID: ${channelId}`);
      return res.status(404).json({ message: "Channel not found" });
    }
    // Check if the user exists
    const user = await User.findById(senderId);
    if (!user) {
      console.error(`User not found for ID: ${senderId}`);
      return res.status(404).json({ message: "User not found" });
    }
    // Create a new message
    const message = new Message({
      sender: senderId,
      content,
      timestamp: new Date(),
    });
    // Save the message to the database
    await message.save();
    // Add the message to the channel's messages array
    channel.messages.push(message);
    await channel.save();
    // Emit the message to the channel using Socket.IO
    req.io.to(channelId).emit("newMessage", message);
    res.status(201).json({ message: "Message sent successfully", message });
  } catch (error) {
    console.error("Error sending message:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};
///add memebre to the channel
const addMemberToChannel = async (req, res) => {
  const { channelId } = req.params;
  const { userId } = req.body;
  try {
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    // Check if user is already a member
    if (channel.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User is already a member of the channel" });
    }
    channel.members.push(userId);
    await channel.save();
    // Notify existing members about the new member
    const io = getIO();
    io.to(channelId).emit("userAddedToChannel", {
      userId,
      channelId,
    });
    console.log(
      `Notification sent: User ${userId} added to channel ${channelId}`
    );
    res
      .status(200)
      .json({ message: "User added to channel successfully", channel });
  } catch (error) {
    console.error("Error adding member to channel:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message || error });
  }
};
// Remove a member from a channel
const removeMemberFromChannel = async (req, res) => {
  const { channelId } = req.params;
  const { userId } = req.body;
  try {
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    if (!channel.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User is not a member of the channel" });
    }
    channel.members = channel.members.filter(
      (memberId) => memberId.toString() !== userId
    );
    await channel.save();
    // Notify remaining members about the user removal
    const io = getIO();
    io.to(channelId).emit("userRemovedFromChannel", {
      userId,
      channelId,
    });
    console.log(
      `Notification sent: User ${userId} removed from channel ${channelId}`
    );
    res.status(200).json({ message: "User removed from channel" });
  } catch (error) {
    console.error("Error removing user from channel:", error);
    res.status(500).json({
      message: "Error removing user from channel",
      error: error.message || "Unknown error occurred",
    });
  }
};

const createMultipleChannels = async (req, res) => {
  const workspaceId = req.params.workspaceId; // Get workspaceId from URL
  const { channels } = req.body; // Channels data from request body
  const userId = req.user.id; // Assuming you have user ID from authentication middleware

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    return res.status(400).json({ message: "Invalid workspace ID" });
  }

  try {
    // Find the workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      console.log(`Workspace not found for ID: ${workspaceId}`);
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Validate channels input
    if (!Array.isArray(channels) || channels.length === 0) {
      return res.status(400).json({ message: "Channels array is required" });
    }

    const createdChannels = [];
    for (const channelData of channels) {
      const { name, description, visibility } = channelData;

      // Validate channel data
      if (!name) {
        return res.status(400).json({ message: "Channel name is required" });
      }

      // Map visibility string to boolean
      const isPrivate = visibility === 'private'; // 'private' maps to true, 'public' maps to false

      // Create a new channel
      const channel = new Channel({
        name,
        description,
        isPrivate, // Use `isPrivate` to match the schema
        workspace: workspaceId,
        members: [userId]
      });

      // Save the channel and add to createdChannels array
      await channel.save();
      createdChannels.push(channel);
    }

    // Respond with the created channels
    res.status(201).json({
      message: "Channels created successfully",
      channels: createdChannels
    });
  } catch (error) {
    console.error("Error creating channels:", error);
    res.status(500).json({ message: "Server error", error: error.message || error });
  }
};

const getMessagesByChannel = async (req, res) => {
  const { channelId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: 'Invalid channel ID' });
    }

    const channel = await Channel.findById(channelId)
      .populate({
        path: 'messages',
        populate: {
          path: 'sender', // Populate the sender field
          select: 'username email' // Specify which fields to return
        }
      });

    if (!channel || !channel.messages.length) {
      return res.status(404).json({ message: 'No messages found for this channel' });
    }

    res.status(200).json({ messages: channel.messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message || error });
  }
};







module.exports = {
  createChannels,
  joinChannel,
  leaveChannel,
  updateChannelSettings,
  getChannelsByWorkspace,
  getChannelById,
  sendMessage,
  getChannelByName,
  addMemberToChannel,
  removeMemberFromChannel,
  createMultipleChannels,
  getMessagesByChannel
  
};