const mongoose = require('mongoose');
const SelfMessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('SelfMessage', SelfMessageSchema);