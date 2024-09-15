// routes/threadRoutes.js
const express = require('express');
const router = express.Router();
const threadController = require('../controllers/threadController');
const authMiddleware = require('../middleware/authenticate');

// Create a new thread
router.post('/create', authMiddleware, threadController.createThread);

// Add a reply to a thread
router.post('/reply', authMiddleware, threadController.addReply);

module.exports = router;
