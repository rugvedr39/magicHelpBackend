const express = require('express');
const router = express.Router();
const { calculateCommissions, getMlmStructure } = require('../controllers/mlmController');
const { protect } = require('../middleware/authMiddleware');

router.post('/calculate', protect, calculateCommissions);
router.get('/structure/:userId', protect, getMlmStructure);

module.exports = router;
