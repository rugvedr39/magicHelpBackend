const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);


router.get('/top-receivers', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
      const topReceivers = await Transaction.getTopReceivers(parseInt(page), parseInt(limit));
      res.status(200).json(topReceivers);
    } catch (error) {
        console.error(error);
      res.status(500).json({ message: 'Error fetching top receivers', error });
    }
  });


module.exports = router;
