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
