const express = require('express');
const router = express.Router();
const reactionController = require('../controllers/reactionController');
const authMiddleware = require('../middleware/authenticate');

router.post('/add', authMiddleware, reactionController.addReaction);
router.post('/remove', authMiddleware, reactionController.removeReaction);

module.exports = router;
