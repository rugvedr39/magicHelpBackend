const { default: mongoose } = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Epin = require('../models/Epin');
const fetch = require('node-fetch');

exports.getTransactionsWithReceiverInfo = async (req, res) => {
  try {
    const { payerId } = req.params;
    // Fetch transactions where payerId matches
    const transactions = await Transaction.find({ payerId: Object(payerId),type:'commission'})
      .populate({
        path: 'receiverId',
        select: 'username email mobileNumber bankDetails upiNumber'
      })
      .exec();
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found' });
    }
    // Map transactions to include receiver info
    const transactionsWithReceiverInfo = transactions.map(transaction => ({
      _id: transaction._id,
      amount: transaction.amount,
      status: transaction.status,
      level: transaction.level,
      date: transaction.date,
      receiverInfo: {
        username: transaction.receiverId.username,
        email: transaction.receiverId.email,
        mobileNumber: transaction.receiverId.mobileNumber,
        bankDetails: transaction.receiverId.bankDetails,
        upiNumber: transaction.receiverId.upiNumber
      }
    }));

    res.status(200).json(transactionsWithReceiverInfo);
  } catch (error) {
    console.error('Error fetching transactions with receiver info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateTransactionUtrAndDate = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { utrNumber } = req.body;
    const transaction = await Transaction.findById(transactionId).
    populate('receiverId', 'name username mobileNumber').
    populate('payerId','name username mobileNumber');
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    transaction.utrNumber = utrNumber;
    transaction.status = "pending"
    transaction.paidDate = new Date();
    await transaction.save();
    res.status(200).json({ status:200,data:transaction,message: 'Transaction updated successfully' });


  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



exports.getTransactionsWithSenderInfo = async (req, res) => {
  try {
    const { payerId, level } = req.params;
    const page = parseInt(req.query.page) || 1; // Page number, default to 1
    const limit = parseInt(req.query.limit) || 10; // Number of transactions per page, default to 10

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ receiverId: payerId, level,type:'commission' })
      .populate({
        path: 'payerId',
        select: 'username email mobileNumber'
      })
      .skip(skip)
      .sort({ date: -1 }) 
      .limit(limit)
      .exec();

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found' });
    }

    const transactionsWithReceiverInfo = transactions.map(transaction => ({
      _id: transaction._id,
      amount: transaction.amount,
      status: transaction.status,
      level: transaction.level,
      date: transaction.date,
      utrNumber: transaction.utrNumber,
      PayerInfo: {
        username: transaction.payerId.username,
        email: transaction.payerId.email,
        mobileNumber: transaction.payerId.mobileNumber,
      }
    }));

    res.status(200).json(transactionsWithReceiverInfo);
  } catch (error) {
    console.error('Error fetching transactions with receiver info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getMatrixSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      {
        $match: {
          $or: [
            { receiverId: userObjectId },
            { payerId: userObjectId }
          ]
        }
      },
      {
        $group: {
          _id: {
            level: "$level",
            receiverId: "$receiverId",
            payerId: "$payerId",
            status: "$status",
            type:'commission'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.level",
          totalPeople: { $sum: { $cond: [{ $eq: ["$_id.receiverId", userObjectId] }, "$count", 0] } },
          paidPeople: { $sum: { $cond: [{ $and: [{ $eq: ["$_id.receiverId", userObjectId] }, { $eq: ["$_id.status", "paid"] }] }, "$count", 0] } },
          openPeople: { $sum: { $cond: [{ $and: [{ $eq: ["$_id.receiverId", userObjectId] }, { $eq: ["$_id.status", "open"] }] }, "$count", 0] } },
          userPaid: { $sum: { $cond: [{ $and: [{ $eq: ["$_id.payerId", userObjectId] }, { $eq: ["$_id.status", "paid"] }] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          level: "$_id",
          totalPeople: 1,
          paidPeople: 1,
          openPeople: 1,
          levelStatus: { $cond: [{ $gt: ["$userPaid", 0] }, "unlocked", "locked"] }
        }
      },
      {
        $sort: { level: 1 }
      }
    ];

    const results = await Transaction.aggregate(pipeline);

    const summary = {};
    for (let level = 1; level <= 10; level++) {
      const levelData = results.find(r => r.level === level) || {
        totalPeople: 0,
        paidPeople: 0,
        openPeople: 0,
        levelStatus: 'locked'
      };
      summary[`level${level}`] = levelData;
    }

    res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching matrix summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



exports.updateTransactionDone = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    transaction.status = "paid"
    transaction.paidDate = new Date();
    await transaction.save();
    await Transaction.createPMFTransactionsIfNeeded(transaction.receiverId.toString());
    res.status(200).json({ message: 'Transaction updated successfully' });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getPaymentToPiadOrNot = async (req, res) => {
  try{
    const {username,amount}=req.body
    const user = await User.findOne({username: username})
    const transaction = await Transaction.findOne({payerId:Object(user._id),amount:amount,status: 'paid',type:'commission'});
    if (transaction==null) {
      res.status(200).json({ message: 'User Has Not Upgraded The Level Please Contact User' });
    }else{
      const transactionPMF = await Transaction.findOne({payerId:Object(user._id),status: 'unpaid',type:'PMF'});
      if (transactionPMF!=null){
        res.status(200).json({ message: 'User Has Not Paid The PMF Please Contact User' });
      }else{
        res.status(200).json({ status:201 });
      }
    }
  } catch (error) {
    console.error('Error getting payment', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


exports.getTransactionsPMF = async (req, res) => {
  try {
    const { payerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ payerId: payerId, type: 'PMF' })
      .sort({ date: -1 }) // Sort by date, newest first
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ payerId: payerId, type: 'PMF' });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found' });
    }

    const transactionsWithReceiverInfo = transactions.map(transaction => ({
      _id: transaction._id,
      amount: transaction.amount,
      status: transaction.status,
      date: transaction.date,
    }));

    res.status(200).json({
      transactions: transactionsWithReceiverInfo,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching transactions with receiver info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.payPMF = async (req, res) => {
  try {
    const { transactionId,ePinId } = req.params;
    const transaction = await Transaction.findOne({_id: transactionId,type:'PMF',status:'open'});
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    const epin = await Epin.findOne({ ePinId, status: 'unused', type:"PMF" });
    if (!epin) {
      return res.status(400).json({ message: 'Invalid or already used E-pin' });
    }
    transaction.status = "paid"
    transaction.paidDate = new Date();
    await transaction.save();
    epin.status = 'used';
    epin.assignedTo = transaction.payerId;
    await epin.save();
    res.status(200).json({ message: 'successfully Payed PMF' });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
