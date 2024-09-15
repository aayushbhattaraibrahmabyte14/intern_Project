const Thread = require('../models/Thread');
const Message = require('../models/Message');

// Create a new thread
const createThread = async (req, res) => {
try {
const { messageId } = req.body;

if (!messageId) {
console.log('Message ID is required');
return res.status(400).json({ message: 'Message ID is required' });
}

// Check if the message exists
const message = await Message.findById(messageId);
if (!message) {
console.log('Message not found');
return res.status(400).json({ message: 'Message not found' });
}

console.log('Creating thread with messageId:', messageId);

// Create a new thread
const thread = new Thread({
parentMessage: messageId, // Ensure parentMessage is correctly assigned
createdBy: req.user.id
});

await thread.save();
res.status(201).json({ message: 'Thread created successfully', thread });
} catch (error) {
console.error('Error creating thread:', error);
res.status(500).json({ message: 'Server error' });
}
};

// Add a reply to a thread
const addReply = async (req, res) => {
try {
const { threadId, content } = req.body;

if (!threadId || !content) {
console.log('Thread ID and content are required');
return res.status(400).json({ message: 'Thread ID and content are required' });
}

// Create a new reply message
const reply = new Message({
content,
sender: req.user.id
});

await reply.save();

// Add reply to the thread
const thread = await Thread.findById(threadId);
if (!thread) {
console.log('Thread not found');
return res.status(400).json({ message: 'Thread not found' });
}

thread.replies.push(reply._id);
await thread.save();

res.status(201).json({ message: 'Reply added successfully', thread });
} catch (error) {
console.error('Error adding reply:', error);
res.status(500).json({ message: 'Server error' });
}
};

module.exports = {
createThread,
addReply
};
