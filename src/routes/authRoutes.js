const express = require('express');
const router = express.Router();
const { registerUser, authUser, getUserProfile, updateUserProfile, checkUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/checkUser/:username', checkUser);

module.exports = router;
