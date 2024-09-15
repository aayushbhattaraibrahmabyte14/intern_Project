const express = require('express');
const router = express.Router();
const { sendMessage, getMessagesByChannelId, getMessagesByReceiverId, forwardMessage, editMessage, deleteMessage, sendDirectMessage } = require('../controllers/messageController');
const authenticate = require('../middleware/authenticate');

// Send a message
router.post('/send', authenticate, sendMessage);

// Get messages by channel ID
router.get('/channel/:channelId', authenticate, getMessagesByChannelId);

// Get messages by receiver ID
router.get('/receiver/:receiverId', authenticate, getMessagesByReceiverId);

// Forward a message to other users
router.post('/forward', authenticate, forwardMessage);

// Edit a message
router.put('/edit/:messageId', authenticate, editMessage);

// Delete a message
router.delete('/delete/:messageId', authenticate, deleteMessage);

router.post('/direct', authenticate, sendDirectMessage);





module.exports = router;
