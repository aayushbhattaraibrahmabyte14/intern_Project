const User = require("../models/User");
const fs = require('fs');
const path = require('path');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log("Fetched profile:", user);
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getCurrentUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log("Fetched current user profile:", user);
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching current user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, displayName, title, phone, profilePicture } = req.body;
    const userId = req.user.id;

    let updateData = { fullName, displayName, title, phone };

    if (profilePicture) {
      // Determine file extension based on base64 string type
      let base64Data, ext;
      if (profilePicture.startsWith('data:image/png;base64,')) {
        base64Data = profilePicture.replace(/^data:image\/png;base64,/, "");
        ext = 'png';
      } else if (profilePicture.startsWith('data:image/jpeg;base64,')) {
        base64Data = profilePicture.replace(/^data:image\/jpeg;base64,/, "");
        ext = 'jpg';
      } else {
        return res.status(400).json({ message: 'Unsupported image format' });
      }

      // Save the file with the appropriate extension
      const filePath = path.join(__dirname, '../uploads', `${userId}.${ext}`);
      fs.writeFileSync(filePath, base64Data, 'base64');
      console.log("Profile picture saved at:", filePath);

      updateData.profilePicture = `/uploads/${userId}.${ext}`; // Adjust path if necessary
    }

    // Update the user profile in the database
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    console.log("Updated user profile:", updatedUser);
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const createProfile = async (req, res) => {
  try {
    const { fullName, displayName, title, timeZone, phone } = req.body;
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields if they are provided, otherwise keep the existing values
    user.fullName = fullName || user.fullName;
    user.displayName = displayName || user.displayName;
    user.title = title || user.title;
    user.timeZone = timeZone || user.timeZone;
    user.phone = phone || user.phone;
    user.profilePicture = profilePicture || user.profilePicture;

    // Save the updated profile
    await user.save();
    console.log("Profile created/updated:", user);

    res.status(200).json({
      message: "Profile created successfully",
      user: {
        ...user._doc,
        profilePicture: profilePicture || user.profilePicture // Ensure correct picture path is sent
      }
    });
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Fetch all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    console.log("Fetched all users:", users);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log("Fetched user by ID:", user);
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// Function to set or update user status
const setStatus = async (req, res) => {
  try {
    const { type, text, clearAfter, notifications, icon } = req.body;
    console.log("Received status update:", { type, text, clearAfter, notifications, icon });
    // Check for valid status types
    const validStatusTypes = [
      "In a meeting",
      "Sick",
      "Community",
      "On Vacation",
      "Remotely Working",
      "Custom Status" // Ensure custom status is included if you use it
    ];

    if (!validStatusTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid status type" });
    }

    const clearAfterDate = clearAfter
      ? new Date(Date.now() + parseDuration(clearAfter))
      : null;

    const disableAfterDate =
      notifications?.enabled && notifications?.disableAfter
        ? new Date(Date.now() + parseDuration(notifications.disableAfter))
        : null;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update user status
    user.status = {
      type,
      text,
      clearAfter: clearAfterDate,
      notifications: {
        enabled: notifications?.enabled || false,
        disableAfter: disableAfterDate,
      },
      icon // Add icon to status
    };

    await user.save();
    console.log("Updated user status:", user.status);

    if (disableAfterDate) {
      const reenableNotificationsTime = new Date(
        disableAfterDate.getTime() + parseDuration(notifications.disableAfter)
      );
      scheduleNotificationReenable(req.user.id, reenableNotificationsTime);
    }

    res.status(200).json({ message: "Status updated successfully", user });
  } catch (error) {
    console.error("Error setting status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to delete custom status
const deleteCustomStatus = async (req, res) => {
  try {

// Define valid status types
const validStatusTypes = [
  "In a meeting",
  "Sick",
  "Community",
  "On Vacation",
  "Remotely Working",
  "Custom Status"
];

    // Find the user by ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user has a valid status
    if (!user.status || !validStatusTypes.includes(user.status.type)) {
      return res.status(400).json({ message: "No valid status to delete" });
    }

    // Clear the status fields
    user.status = {
      type: null,
      text: null,
      icon: null,
      clearAfter: null,
      notifications: {
        enabled: false,
        disableAfter: null
      }
    };

    // Save the updated user profile
    await user.save();
    console.log("Status removed:", user);

    res.status(200).json({ message: "Status removed successfully" });
  } catch (error) {
    console.error("Error removing status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getProfileStatusById = async (req, res) => {
  try {
    const { id } = req.params; // Extract user ID from the URL parameters
    const user = await User.findById(id); // Find user by ID

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the status in a consistent format
    res.status(200).json({ profileStatus: user.profileStatus });
  } catch (error) {
    console.error("Error fetching profile status by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// Utility function to parse duration string (e.g., '15m' to milliseconds)
const parseDuration = (duration) => {
  const match = duration.match(/^(\d+)([smh])$/);
  if (!match) return 0;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "m":
      return value * 60 * 1000; // minutes to milliseconds
    case "h":
      return value * 60 * 60 * 1000; // hours to milliseconds
    case "s":
      return value * 1000; // seconds to milliseconds
    default:
      return 0;
  }
};

// Function to schedule re-enabling notifications
const scheduleNotificationReenable = (userId, time) => {
  const delay = time.getTime() - Date.now();
  setTimeout(async () => {
    try {
      const user = await User.findById(userId);
      if (user) {
        user.status.notifications.enabled = true;
        user.status.notifications.disableAfter = null;
        await user.save();
        console.log("Re-enabled notifications for user:", userId);
      }
    } catch (error) {
      console.error("Error re-enabling notifications:", error);
    }
  }, delay);
};

// Function to get user status
const getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    console.log("Fetched user status:", user.profileStatus); // Make sure to use the correct property
    res.status(200).json({ profileStatus: user.profileStatus }); // Return status in an object for consistency
  } catch (error) {
    console.error("Error fetching status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getCustomStatus = async (req, res) => {
  try {
    // Extract user ID from the request parameters
    const { userId } = req.params;
    
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Extract the user's custom status
    const customStatus = user.status ;

    // Return the custom status data to the client
    res.status(200).json({ message: "Custom status fetched successfully", customStatus });
  } catch (error) {
    console.error("Error fetching custom status:", error);
    res.status(500).json({ message: "Server error" });
  }
};



const setProfileStatus = async (req, res) => {
  try {
    console.log("Request body:", req.body); // Log the entire request body

    const { status } = req.body;
    console.log("Received profileStatus:", status );

    if (!["Online", "Away", "Invisible"].includes( status )) {
      return res.status(400).json({ message: "Invalid profile status" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profileStatus = status ;
    await user.save();

    console.log("Updated profile status:", user.status);
    res.status(200).json({ message: "Profile status updated successfully", user });
  } catch (error) {
    console.error("Error setting profile status:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const profilePictureUrl = user.profilePicture
      ? `${req.protocol}://${req.get('host')}${user.profilePicture}`
      : null;

    res.status(200).json({ profilePictureUrl });
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Function to delete profile picture
const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.profilePicture) {
      return res.status(400).json({ message: "No profile picture to delete" });
    }

    // Get the path of the profile picture
    const picturePath = path.join(__dirname, '../uploads', path.basename(user.profilePicture));

    // Delete the picture from the file system
    fs.unlink(picturePath, (err) => {
      if (err) {
        console.error("Error deleting the profile picture file:", err);
        return res.status(500).json({ message: "Error deleting profile picture file" });
      }

      console.log("Profile picture deleted from filesystem:", picturePath);
    });

    // Set profile picture URL to null in the database
    user.profilePicture = null;
    await user.save();

    console.log("Profile picture removed from user data:", user);
    res.status(200).json({ message: "Profile picture deleted successfully" });

  } catch (error) {
    console.error("Error deleting profile picture:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  createProfile,
  getAllUsers,
  getUserById,
  setStatus,
  getStatus,
  setProfileStatus,
  getCurrentUserProfile,
  getProfilePicture,
  deleteProfilePicture,
  getCustomStatus,
  getProfileStatusById,
  deleteCustomStatus
};