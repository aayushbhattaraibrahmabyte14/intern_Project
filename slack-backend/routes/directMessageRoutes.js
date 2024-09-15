// / routes/directMessageRoutes.js
const express = require("express");
const router = express.Router();
const upload = require('../middleware/multer'); // Import the multer configuration
const { uploadAudio } = require('../controllers/directMessageController');
const authenticate = require('../middleware/authenticate'); // Ensure authentication
const {
  sendDirectMessage,
  // getDirectMessagesByReceiverId,
  editDirectMessage,
  deleteDirectMessage,
  forwardDirectMessage,
  getDirectMessages
  // getDirectMessagesBySenderId,
} = require("../controllers/directMessageController");

// Send a direct message
router.post("/send", authenticate, sendDirectMessage);
// Get direct messages by receiver ID
// router.get(
//   "/receiver/:receiverId",
//   authenticate,
//   getDirectMessagesByReceiverId
// );
// Get direct messages by sender ID
// router.get("/sender/:senderId", authenticate, getDirectMessagesBySenderId);
// Edit a direct message
router.put("/edit/:messageId", authenticate, editDirectMessage);
// Delete a direct message
router.delete("/delete/:messageId", authenticate, deleteDirectMessage);
// Forward a direct message
router.post("/forward", authenticate, forwardDirectMessage);
router.get("/messages/:otherUserId", authenticate, getDirectMessages);
// Route to handle audio file upload
router.post('/upload', authenticate, upload.single('audio'), uploadAudio);
module.exports = router;