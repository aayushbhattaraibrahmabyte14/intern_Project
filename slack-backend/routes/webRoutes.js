const express = require('express');
const router = express.Router();
const webRTCController = require('../controllers/webRTCController');

// Start a WebRTC call
router.post('/start-call', webRTCController.startCall);

// End a WebRTC call
router.post('/end-call', webRTCController.endCall);

// Join a WebRTC call
router.post('/join-call', webRTCController.joinCall);

module.exports = router;
