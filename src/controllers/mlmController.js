const { default: mongoose } = require('mongoose');
const MlmStructure = require('../models/MlmStructure');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Calculate and distribute commissions
exports.calculateCommissions = async (req, res) => {
  const { userId, amount } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  let currentLevel = 1;
  let sponsorId = user.sponsorId;

  while (currentLevel <= 10 && sponsorId) {
    const sponsor = await User.findById(sponsorId);

    if (sponsor) {
      const commissionAmount = amount * currentLevel;
      await Transaction.create({
        userId: sponsor._id,
        amount: commissionAmount,
        type: 'commission',
        level: currentLevel
      });

      sponsorId = sponsor.sponsorId;
      currentLevel++;
    } else {
      break;
    }
  }

  res.status(200).json({ message: 'Commissions distributed' });
};

// Get MLM structure for a user
exports.getMlmStructure = async (req, res) => {
  const userId = req.params.userId;
  const mlmStructure = await MlmStructure.find({ userId });

  res.status(200).json(mlmStructure);
};



exports.getLevelCounts = async (req, res) => {
  const { userId} = req.params;
  try {
    const levels = await MlmStructure.aggregate([
      { $match: { uplineId: new mongoose.Types.ObjectId(userId) } }, // Filter by userId
      { $group: { _id: "$level", count: { $sum: 1 } } },
      { $sort: { _id: 1 } } // Sort by level in ascending order
    ]);
    res.status(200).json(levels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeamByLevel = async (req, res) => {
  const { userId} = req.params;
  const level = parseInt(req.query.level); // The level to get the team members for
  const page = parseInt(req.query.page) || 1; // Current page number, default to 1
  const limit = parseInt(req.query.limit) || 10; // Number of records per page, default to 10

  if (isNaN(level) || level <= 0) {
    return res.status(400).json({ message: 'Invalid level parameter' });
  }

  try {
    const teamMembersAtLevel = await MlmStructure.find({ level,uplineId:Object(userId) })
      .skip((page - 1) * limit) // Skip records
      .limit(limit) // Limit records per page
      .populate('userId', 'username email mobileNumber') // Populate user details

    const totalMembersAtLevel = await MlmStructure.countDocuments({ level });

    const totalPages = Math.ceil(totalMembersAtLevel / limit); // Calculate total pages

    res.status(200).json({
      teamMembers: teamMembersAtLevel,
      totalPages,
      currentPage: page,
      totalMembers: totalMembersAtLevel
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
