const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const genrateOTP = require('../utils/generateOTP');
const generateOTP = require('../utils/generateOTP');

//2FA logic
const enable2FA = async (req, res) => {
    const userId = req.user.id;

    try{
        const otp = generateOTP();
        const otpExpires = Date.now() + 10 * 60 * 1000; 

        // Send OTP to user's email
        await sendEmail(req.user.email, 'Your OTP Code', `Your OTP code is ${otp}. It is valid for 10 minutes.`);

        res.status(200).json({ message: 'OTP sent to your email. Please verify.' });
    } catch (error) {
        res.status(500).json({ message: 'Error enabling 2FA', error });
    }
};
const verify2FASetup = async (req, res) => {
    const { otp } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.otpExpires < Date.now()) return res.status(400).json({ message: 'OTP expired' });
        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

        // Clear OTP fields after successful verification
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: '2FA setup successful' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying OTP', error });
    }
};


module.exports = {
    enable2FA,
    verify2FASetup

};