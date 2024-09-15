const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const authenticate = require('../middleware/authenticate');

// Get Access Token
router.get('/token', authenticate, callController.getAccessToken);

// Initiate a direct call
router.post('/direct', authenticate, callController.initiateDirectCall);

// Initiate a group call
router.post('/group', authenticate, callController.initiateGroupCall);

module.exports = router;
