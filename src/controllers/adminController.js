const User = require('../models/User');
const Epin = require('../models/Epin');
const Transaction = require('../models/Transaction');

// Get all users
exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.status(200).json(users);
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
