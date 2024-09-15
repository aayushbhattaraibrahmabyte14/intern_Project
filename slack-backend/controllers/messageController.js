const Message = require('../models/Message');
const User = require('../models/User');
const Channel = require('../models/Channels');
const mentionUtils = require('../utils/mentionUtils'); // Ensure this utility is correctly implemented

// Send a message
const sendMessage = async (req, res) => {
try {
const { channelId, content } = req.body;

if (!channelId || !content) {
return res.status(400).json({ message: 'Channel ID and content are required' });
}

// Extract mentions from the content
const mentions = await mentionUtils.parseMentions(content);

// Create a new message
const message = new Message({
channel: channelId,
content,
sender: req.user.id,
mentions
});

await message.save();

// Emit message to the channel
req.io.to(channelId).emit('receiveMessage', message);

res.status(201).json({ message: 'Message sent successfully', messageData: message });
} catch (error) {
console.error('Error sending message:', error);
res.status(500).json({ message: 'Server error' });
}
};

// Get messages by channel ID
const getMessagesByChannelId = async (req, res) => {
const { channelId } = req.params;

try {
    const messages = await Message.find({ channel: channelId })
    .populate('sender')
    .populate('channel', 'fullName')
    .sort({ timestamp: 'asc' }); // Ensure messages are sorted
  

if (!messages || messages.length === 0) {
return res.status(404).json({ message: 'No messages found' });
}

res.status(200).json({ messages });
} catch (error) {
console.error('Error fetching messages by channel ID:', error);
res.status(500).json({ message: 'Server error', error: error.message || error });
}
};

// Get messages by receiver ID
const getMessagesByReceiverId = async (req, res) => {
const { receiverId } = req.params;

try {
    const messages = await Message.find({ receiver: receiverId })
    .populate('sender', 'fullname email')
    .populate('receiver', 'fullname')
    .sort({ timestamp: 'asc' }); // Ensure messages are sorted
  
if (!messages || messages.length === 0) {
return res.status(404).json({ message: 'No messages found' });
}

res.status(200).json({ messages });
} catch (error) {
console.error('Error fetching messages by receiver ID:', error);
res.status(500).json({ message: 'Server error', error: error.message || error });
}
};

// Function to forward a message
const forwardMessage = async (req, res) => {
const { messageId, userIds } = req.body;

try {
if (!messageId || !userIds || !userIds.length) {
return res.status(400).json({ message: 'Message ID and user IDs are required' });
}

// Find the message to be forwarded
const message = await Message.findById(messageId);
if (!message) {
return res.status(404).json({ message: 'Message not found' });
}

// Find users to forward the message to
const users = await User.find({ _id: { $in: userIds } });
if (users.length !== userIds.length) {
return res.status(404).json({ message: 'Some users not found' });
}

// Update the message to track forwarded users
message.forwardedTo = [...new Set([...message.forwardedTo, ...userIds])];
await message.save();

res.status(200).json({ message: 'Message forwarded successfully', message });
} catch (error) {
console.error('Error forwarding message:', error);
res.status(500).json({ message: 'Server error' });
}
};

// Edit a message
const editMessage = async (req, res) => {
const { messageId } = req.params;
const { newContent } = req.body;
const userId = req.user.id;

try {
// Find the message by ID
const message = await Message.findById(messageId);
if (!message) {
return res.status(404).json({ message: 'Message not found' });
}

// Check if the user is the sender of the message
if (message.sender.toString() !== userId) {
    return res.status(403).json({ message: 'You can only edit your own messages' });
  }
  

// Update the message content
message.content = newContent;
await message.save();

// Emit event to notify about the message update
req.io.to(message.channel).emit('messageUpdated', { messageId, newContent });

res.status(200).json({ message: 'Message updated successfully', message });
} catch (error) {
console.error('Error editing message:', error);
res.status(500).json({ message: 'Server error', error: error.message || error });
}
};

// Delete a message
const deleteMessage = async (req, res) => {
const { messageId } = req.params;

try {
// Find and delete the message
const result = await Message.findByIdAndDelete(messageId);
if (!result) {
return res.status(404).json({ message: 'Message not found' });
}

res.status(200).json({ message: 'Message deleted successfully' });
} catch (error) {
console.error('Error deleting message:', error);
res.status(500).json({ message: 'Server error', error: error.message || error });
}
};
// Send a direct message
const sendDirectMessage = async (req, res) => {
try {
const { receiverId, content } = req.body;

if (!receiverId || !content) {
return res.status(400).json({ message: 'Receiver ID and content are required' });
}

// Extract mentions from the content
const mentions = await mentionUtils.parseMentions(content);

// Create a new message
const message = new Message({
receiver: receiverId,
content,
sender: req.user.id,
mentions
});

await message.save();

// Emit message to the receiver's private room
req.io.to(receiverId).emit('receiveDirectMessage', message);

res.status(201).json({ message: 'Direct message sent successfully', messageData: message });
} catch (error) {
console.error('Error sending direct message:', error);
res.status(500).json({ message: 'Server error' });
}
};


module.exports = {
sendMessage,
getMessagesByChannelId,
getMessagesByReceiverId,
forwardMessage,
editMessage,
deleteMessage,
sendDirectMessage
};
