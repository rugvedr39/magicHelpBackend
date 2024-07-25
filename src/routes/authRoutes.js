const express = require('express');
const router = express.Router();
const { registerUser, authUser, getUserProfile, 
    updateUserProfile, checkUser,genrateOtp,veryfyOtpAndChangePassword,authUseradminloginuser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/login', authUser);
router.post('/login/admin', authUseradminloginuser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/checkUser/:username', checkUser);
// to check phone number
router.get('/otpsend/:phoneNumber/:username', genrateOtp);
router.post('/veryfyOtp', veryfyOtpAndChangePassword);

module.exports = router;
