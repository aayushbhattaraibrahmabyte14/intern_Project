const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
    callerEmail: { type: String, required: true },
    receiverEmail: { type: String, required: true },
    status: { type: String, enum: ['initiated', 'ended'], default: 'initiated' },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    isVideoCall: { type: Boolean, default: false } // Added field
});

const Call = mongoose.model('Call', CallSchema);
module.exports = Call;
