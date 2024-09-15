const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authenticate");

const upload = require("../middleware/multer"); // Import multer middleware


// Use multer middleware for profile-picture upload
router.post(
  "/create",
  authMiddleware,
  upload.single("profilePicture"),
  userController.createProfile
);
router.get("/get-profile", authMiddleware, userController.getProfile);
router.put("/update", authMiddleware, userController.updateProfile);
router.get("/users", authMiddleware, userController.getAllUsers); // Fetch all users
router.get("/users/:id", authMiddleware, userController.getUserById);
router.post("/status", authMiddleware, userController.setStatus);
router.get("/users/:userId/custom-status", authMiddleware, userController.getCustomStatus);
router.post("/profile-status", authMiddleware, userController.setProfileStatus);
router.get('/profile-status',authMiddleware, userController.getStatus);
router.get("/profile/:id/profile-status", authMiddleware, userController.getProfileStatusById);
router.get("/profile", authMiddleware, userController.getCurrentUserProfile);
router.get("/profile-picture", authMiddleware, userController.getProfilePicture);
router.delete('/profile/picture', authMiddleware, userController.deleteProfilePicture);
router.delete("/custom-status", authMiddleware, userController.deleteCustomStatus);
module.exports = router;



