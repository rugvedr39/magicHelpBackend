const express = require('express');
const router = express.Router();
const { getAllUsers, getAllTransactions, getAllEpins } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

router.get('/users', protect, getAllUsers);
router.get('/transactions', protect, getAllTransactions);
router.get('/epins', protect, getAllEpins);

module.exports = router;
