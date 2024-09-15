const User = require('../models/User');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register User
const registerUser = async (req, res) => {
const { email, password, confirmPassword } = req.body;

if (password !== confirmPassword) {
return res.status(400).json({ message: 'Passwords do not match' });
}

try {
const otp = generateOTP();
const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

const user = new User({ email, password, otp, otpExpires });
await user.save();

await sendEmail(email, 'Your OTP Code', `Your OTP code is ${otp}`);

res.status(201).json({ message: 'User registered. OTP sent to email' });
} catch (error) {
res.status(500).json({ message: 'Server error' });
}
};

// Verify OTP
const verifyOTP = async (req, res) => {
const { otp } = req.body;

try {
const user = await User.findOne({ otp });

if (!user) {
return res.status(400).json({ message: 'Invalid OTP' });
}

if (user.otpExpires < Date.now()) {
return res.status(400).json({ message: 'OTP expired' });
}

user.isVerified = true;
user.otp = undefined;
user.otpExpires = undefined;
user.otpRequestedAt = undefined;
await user.save();

res.status(200).json({ message: 'OTP verified. Registration complete' });
} catch (error) {
res.status(500).json({ message: 'Server error' });
}
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user and populate workspaces
        const user = await User.findOne({ email }).populate('workspaces');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1y' });

        // Send back the token, userId, and workspaces
        res.status(200).json({
            message: 'Login successful',
            token,
            userId: user._id, // Include the userId in the response
            email: user.email, // Optionally include the email
            workspaces: user.workspaces,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



// Request Password Recovery
const requestPasswordRecovery = async (req, res) => {
const { email } = req.body;

try {
const user = await User.findOne({ email });

if (!user) {
return res.status(400).json({ message: 'User not found' });
}

const otp = generateOTP();
const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

user.otp = otp;
user.otpExpires = otpExpires;
user.otpRequestedAt = Date.now();
await user.save();

await sendEmail(email, 'Password Recovery OTP', `Your OTP code is ${otp}`);

res.status(200).json({ message: 'OTP sent for password recovery. Check your email.' });
} catch (error) {
res.status(500).json({ message: 'Server error' });
}
};

// Verify Password Recovery OTP
const verifyPasswordRecoveryOTP = async (req, res) => {
const { otp, newPassword } = req.body;

try {
const user = await User.findOne({ otp });

if (!user) {
return res.status(400).json({ message: 'Invalid OTP' });
}

if (user.otpExpires < Date.now()) {
return res.status(400).json({ message: 'OTP expired' });
}

user.password = await bcrypt.hash(newPassword, 10);
user.otp = undefined;
user.otpExpires = undefined;
user.otpRequestedAt = undefined;
await user.save();

res.status(200).json({ message: 'Password successfully reset' });
} catch (error) {
res.status(500).json({ message: 'Server error' });
}
};

module.exports = {
registerUser,
verifyOTP,
loginUser,
requestPasswordRecovery,
verifyPasswordRecoveryOTP,
};
