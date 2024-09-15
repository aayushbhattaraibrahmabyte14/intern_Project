const express = require('express');
const {
createChannel,
joinChannel,
leaveChannel,
updateChannelSettings,
getMessagesByChannel,
getChannelById,
sendMessage,
getChannelByName,
addMemberToChannel ,
removeMemberFromChannel,
createMultipleChannels,
createChannels,
getChannelsByWorkspace,
getMessagesForChannel
} = require('../controllers/channelController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();



router.post('/create', authenticate, createChannels);
router.post('/:channelId/join', authenticate, joinChannel);
router.post('/:channelId/leave', authenticate, leaveChannel);
router.put('/:channelId/settings', authenticate, updateChannelSettings);
router.get('/workspace/:workspaceId', authenticate, getChannelsByWorkspace);
router.get('/:channelId', authenticate, getChannelById);
router.get('/name/:name', authenticate, getChannelByName);
router.post('/send-message', sendMessage);
router.post('/:channelId/add-member', authenticate, addMemberToChannel); 
router.post("/:channelId/remove-member", authenticate, removeMemberFromChannel);
router.post('/workspaces/:workspaceId/channels/create-multiple', authenticate, createMultipleChannels);
router.get('/message/:channelId', authenticate, getMessagesByChannel);
module.exports = router;
