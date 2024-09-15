// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  forwardedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
