const express = require('express');
const router = express.Router();
const { calculateCommissions, getMlmStructure,getTeamByLevel,getLevelCounts } = require('../controllers/mlmController');
const { protect } = require('../middleware/authMiddleware');

router.post('/calculate', protect, calculateCommissions);
router.get('/structure/:userId', protect, getMlmStructure);

router.get('/level-counts/:userId', getLevelCounts);

// Route to get team members by level with pagination
router.get('/team-by-level/:userId', getTeamByLevel);

module.exports = router;
