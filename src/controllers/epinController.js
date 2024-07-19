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

  res.status(200).json({message: "Epin Created Success"});
};

// Get all E-pins
exports.getEpins = async (req, res) => {
  const {UserId} = req.params
  const epins = await Epin.find({
    $or: [
      { assignedTo: UserId },
      { 'transferHistory.transferredFrom': UserId }
    ]
  }).populate('assignedTo transferHistory.transferredFrom transferHistory.transferredTo');

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




exports.transferEPINsByCount = async (req, res) => {
  const { count, assignedToUsername, transferredFromId } = req.body;

  try {
    const assignedToUser = await User.findOne({ username: assignedToUsername });

    if (!assignedToUser) {
      return res.status(404).json({ message: 'Assigned to user not found.' });
    }

    // Fetch the EPINs to be transferred
    const epins = await Epin.find({ status: 'unused', assignedTo: transferredFromId }).limit(count);

    if (epins.length !== count) {
      return res.status(400).json({ message: 'Insufficient unused EPINs available for transfer.' });
    }

    const epinIds = epins.map(epin => epin._id);

    const updatedEpins = await Epin.updateMany(
      { _id: { $in: epinIds } },
      {
        assignedTo: assignedToUser._id,
        updatedAt: Date.now(),
        $push: {
          transferHistory: {
            transferredFrom: transferredFromId,
            transferredTo: assignedToUser._id,
            transferDate: Date.now()
          }
        }
      }
    );

    res.status(200).json({ message: 'EPINs transferred successfully.', updatedEpins });
  } catch (error) {
    console.error('Error transferring EPINs:', error);
    res.status(500).json({ message: 'Failed to transfer EPINs. Please try again.' });
  }
};
