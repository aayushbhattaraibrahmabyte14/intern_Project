const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
emoji: { type: String, required: true },
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Reaction', reactionSchema);
