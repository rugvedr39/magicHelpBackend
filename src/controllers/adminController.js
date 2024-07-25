const User = require('../models/User');
const Epin = require('../models/Epin');
const Transaction = require('../models/Transaction');

// Get all users
exports.getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Current page number, default to 1
  const limit = parseInt(req.query.limit) || 10; // Number of records per page, default to 10
  const search = req.query.search || ''; // Search query

  try {
    // Build query object
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('sponsorId', 'username')
      .sort({createdAt:-1}) // Populate sponsorId with username field
      .skip((page - 1) * limit) // Skip records
      .limit(limit); // Limit records per page

    const totalUsers = await User.countDocuments(query); // Count total users

    const totalPages = Math.ceil(totalUsers / limit); // Calculate total pages

    res.status(200).json({
      users,
      totalPages,
      currentPage: page,
      totalUsers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Get all transactions
exports.getAllTransactions = async (req, res) => {
  const transactions = await Transaction.find();
  res.status(200).json(transactions);
};

// Get all E-pins
exports.getAllEpins = async (req, res) => {
  const epins = await Epin.find();
  res.status(200).json(epins);
};

exports.getUserCounts = async (req, res) => {
  try {
    const totalUsers = await User.getTotalUsersCount();
    const usersJoinedToday = await User.getUsersJoinedTodayCount();

    res.status(200).json({
      totalUsers,
      usersJoinedToday
      // Add more counts as needed
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.getEpins = async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Current page number, default to 1
  const limit = parseInt(req.query.limit) || 10; // Number of records per page, default to 10

  try {
    const epins = await Epin.find()
      .skip((page - 1) * limit) // Skip records
      .limit(limit) // Limit records per page
      .populate('assignedTo transferHistory.transferredFrom transferHistory.transferredTo');

    const totalEpins = await Epin.countDocuments(); // Count total epins

    const totalPages = Math.ceil(totalEpins / limit); // Calculate total pages

    res.status(200).json({
      epins,
      totalPages,
      currentPage: page,
      totalEpins
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
