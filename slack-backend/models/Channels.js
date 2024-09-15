const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const channelSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" }, // Optional field with default value
  visibility: { // Field to determine if the channel is public or private
    type: String,
    enum: ['public', 'private'], // Valid values for visibility
    default: 'public' // Default value if none is provided
  },
  workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true }, // Reference to the workspace
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Array of user references
  messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }] // Array of message references
});

module.exports = mongoose.model('Channel', channelSchema);
