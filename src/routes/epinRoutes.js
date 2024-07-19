const express = require('express');
const router = express.Router();
const { generateEpin, getEpins, useEpin,transferEPINsByCount } = require('../controllers/epinController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', generateEpin);
router.get('/:UserId', getEpins);
router.post('/use', protect, useEpin);
router.post('/transferEPINsByCount', transferEPINsByCount);

module.exports = router;
