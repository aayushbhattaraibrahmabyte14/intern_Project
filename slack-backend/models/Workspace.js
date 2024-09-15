const mongoose = require('mongoose'); 

const workspaceSchema = new mongoose.Schema({
    name: String,
    logo: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    channels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }]
});

const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = Workspace;
