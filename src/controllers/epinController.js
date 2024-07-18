const Epin = require('../models/Epin');
const User = require('../models/User');

// Generate E-pin
exports.generateEpin = async (req, res) => {
  const { type, amount, count,assignedTo } = req.body;

  if (!count || count <= 0) {
    return res.status(400).json({ message: 'Count must be a positive number' });
  }

  let sponsorId = null;
  if (assignedTo) {
    const sponsor = await User.findOne({ username: assignedTo });
    if (!sponsor) {
      return res.status(400).json({ message: 'Invalid username' });
    }
    sponsorId = sponsor._id;
  }

  const epins = [];
  for (let i = 0; i < count; i++) {
    const ePinId = `EPIN-${Date.now()}-${i}`;

    const epin = {
      ePinId,
      type,
      amount,
      assignedTo: sponsorId,
      status: 'unused',
    };

    epins.push(epin);
  }

  const createdEpins = await Epin.insertMany(epins);

  res.status(200).json(createdEpins);
};

// Get all E-pins
exports.getEpins = async (req, res) => {
  const epins = await Epin.find();

  res.status(200).json(epins);
};

// Use E-pin
exports.useEpin = async (req, res) => {
  const { ePinId } = req.body;
  const epin = await Epin.findOne({ ePinId, status: 'unused' });

  if (!epin) {
    return res.status(404).json({ message: 'E-pin not found or already used' });
  }

  epin.status = 'used';
  await epin.save();

  res.status(200).json({ message: 'E-pin used' });
};
