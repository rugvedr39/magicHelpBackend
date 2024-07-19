const express = require('express');
const router = express.Router();
const { getAllUsers, getAllTransactions, getAllEpins,getUserCounts,getEpins } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

router.get('/users', getAllUsers);
router.get('/transactions', getAllTransactions);
router.get('/epins', getAllEpins);
router.get('/getUserCounts', getUserCounts);
router.get('/getEpins', getEpins);

module.exports = router;
