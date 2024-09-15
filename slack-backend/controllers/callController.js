const twilioUtils = require('../utils/twilioUtils');
const User = require('../models/User');
const Channel = require('../models/Channels');

// Generate Access Token for a user
const getAccessToken = (req, res) => {
try {
const identity = req.user.id;
const token = twilioUtils.generateAccessToken(identity);
res.status(200).json({ token });
} catch (error) {
console.error('Error generating access token:', error);
res.status(500).json({ message: 'Server error' });
}
};

// Initiate a direct call
const initiateDirectCall = async (req, res) => {
try {
const { receiverId } = req.body;

const receiver = await User.findById(receiverId);
if (!receiver) {
return res.status(404).json({ message: 'Receiver not found' });
}

const callData = {
to: receiverId,
from: req.user.id,
};

req.io.to(receiverId).emit('incomingCall', callData);
res.status(200).json({ message: 'Call initiated', callData });
} catch (error) {
console.error('Error initiating direct call:', error);
res.status(500).json({ message: 'Server error' });
}
};

// Initiate a group call in a channel
const initiateGroupCall = async (req, res) => {
try {
const { channelId } = req.body;

const channel = await Channel.findById(channelId);
if (!channel) {
return res.status(404).json({ message: 'Channel not found' });
}

const roomName = `channel-${channelId}-${uuidv4()}`;
const room = await twilioUtils.createVoiceRoom(roomName);

req.io.to(channelId).emit('incomingGroupCall', { roomName });
res.status(200).json({ message: 'Group call initiated', room });
} catch (error) {
console.error('Error initiating group call:', error);
res.status(500).json({ message: 'Server error' });
}
};

module.exports = {
getAccessToken,
initiateDirectCall,
initiateGroupCall,
};
