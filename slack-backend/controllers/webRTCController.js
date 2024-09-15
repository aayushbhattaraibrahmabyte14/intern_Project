const Call = require('../models/Call');

// Start a WebRTC call (video call)
exports.startCall = async (req, res) => {
    const { callerEmail, receiverEmail, isVideoCall } = req.body;

    // Create a new call session
    const call = new Call({ callerEmail, receiverEmail, status: 'initiated', isVideoCall });
    await call.save();

    // Notify the receiver about the incoming call
    req.io.to(receiverEmail).emit('incomingCall', { callerEmail, callId: call._id, isVideoCall });

    res.status(200).json({ message: 'Call started', callId: call._id });
};

// End a WebRTC call
exports.endCall = async (req, res) => {
    const { callId } = req.body;

    // Update call status to 'ended'
    await Call.findByIdAndUpdate(callId, { status: 'ended', endTime: Date.now() });

    // Notify participants about the call ending
    req.io.to(callId).emit('callEnded', { callId });

    res.status(200).json({ message: 'Call ended' });
};

// Join an ongoing WebRTC call
exports.joinCall = (req, res) => {
    const { callId, email } = req.body;

    // Notify other participants via signaling
    req.io.to(callId).emit('userJoined', { email });

    res.status(200).json({ message: `Joined call with ID: ${callId}` });
};
