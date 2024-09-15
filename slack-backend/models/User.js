const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true, minlength: 8 },
  otp: { type: String },
  otpExpires: { type: Date },
  otpRequestedAt: { type: Date },
  isVerified: { type: Boolean, default: false },
  fullName: { type: String, trim: true },
  displayName: { type: String, trim: true },
  title: { type: String, trim: true },
  timeZone: { type: String, trim: true },
  phone: { type: String, trim: true },
  joinedDate: { type: Date, default: Date.now },
  profilePicture: String,
  status: {
    type: {
      type: String,
      enum: [
        "In a meeting",
        "Sick",
        "Community",
        "On Vacation",
        "Remotely Working",
        "Custom Status",
      ],
      default: null,
    },
    text: { type: String } ,
    icon: { type: String }, // Field to store custom icon
    clearAfter: { type: Date },
    notifications: {
      enabled: { type: Boolean, default: false },
      disableAfter: { type: Date },
    },
  },
  profileStatus: {
    type: String,
    enum: ["Online", "Away", "Invisible"],
    default: "Online",
  },
  workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: "Workspace" }],
  currentWorkspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" }, // Added this field
});

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// OTP expiration check
userSchema.methods.isOtpExpired = function () {
  return this.otpExpires && Date.now() > this.otpExpires;
};

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
