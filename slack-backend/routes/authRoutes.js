const express = require('express');
const {
registerUser,
verifyOTP,
loginUser,
requestPasswordRecovery,
verifyPasswordRecoveryOTP,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);
router.post('/request-password-recovery', requestPasswordRecovery);
router.post('/verify-recovery-otp', verifyPasswordRecoveryOTP);

module.exports = router;
