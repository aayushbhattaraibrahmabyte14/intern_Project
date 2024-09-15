// models/DirectMessage.js
const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
    content: { type: String, required: false }, // Make content optional for voice messages
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    forwardedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    voiceMessageUrl: { type: String, required: false }, // New field for voice messages
    audio: { type: String }, // Store URL or file reference
    video: { type: String }, // Store URL or file reference
    image: { type: String }, // Store URL or file reference
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DirectMessage', directMessageSchema);
