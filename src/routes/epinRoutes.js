const express = require('express');
const router = express.Router();
const { generateEpin, getEpins, useEpin } = require('../controllers/epinController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateEpin);
router.get('/', protect, getEpins);
router.post('/use', protect, useEpin);

module.exports = router;
