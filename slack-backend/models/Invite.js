// models/Invite.js
const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }, // Make this optional
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Track who created the invite
});

module.exports = mongoose.model('Invite', inviteSchema);
