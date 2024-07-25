const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['paid', 'unpaid', 'open','pending'], default: 'open' }, // Default to open
  amount: { type: Number, required: true },
  type: { type: String, required: true }, // "joining", "commission", "PMF"
  level: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  paidDate: { type: Date,default:null }, // Date when the transaction was paid
  utrNumber: { type: String,default:null } // UTR (Unique Transaction Reference) number
});

transactionSchema.index({ receiverId: 1 });
transactionSchema.index({ payerId: 1 });
transactionSchema.index({ level: 1 });
transactionSchema.index({ status: 1 });

transactionSchema.statics.getTopReceivers = async function (page = 1, limit = 10) {
  const Transaction = this; // 'this' refers to the Transaction model

  try {
    const skip = (page - 1) * limit;

    const topReceivers = await Transaction.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: '$receiverId', totalAmount: { $sum: '$amount' } } },
      { $sort: { totalAmount: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users', // Ensure the collection name is correct
          localField: '_id',
          foreignField: '_id',
          as: 'receiverInfo'
        }
      },
      { $unwind: '$receiverInfo' },
      {
        $project: {
          _id: 0,
          receiverId: '$_id',
          totalAmount: 1,
          name: '$receiverInfo.name',
          username: '$receiverInfo.username'
        }
      }
    ]);

    return topReceivers;
  } catch (error) {
    console.error('Error fetching top receivers:', error);
    throw error;
  }
};




// transactionSchema.statics.createPMFTransactionsIfNeeded = async function(receiverId, incomeThreshold = 10000) {
//   const Transaction = this; // 'this' refers to the Transaction model
//   try {
//     // Calculate total income for the receiverId
//     const totalIncome = await Transaction.aggregate([
//       { $match: { receiverId: new mongoose.Types.ObjectId(receiverId), status: 'paid' } },
//       { $group: { _id: '$receiverId', totalAmount: { $sum: '$amount' } } }
//     ]);

//     if (totalIncome.length > 0) {
//       const { totalAmount } = totalIncome[0];
//       const pmfTransactionsToCreate = Math.floor(totalAmount / incomeThreshold);

//       // Check if PMF transactions need to be created
//       const existingPMFTransactions = await Transaction.find({
//         payerId: Object(receiverId), // Set appropriately if needed
//         type: 'PMF',
//         status: 'open' // Assuming 'open' is the initial status for PMF transactions
//       });

//       if (existingPMFTransactions.length < pmfTransactionsToCreate) {
//         // Create PMF transactions up to pmfTransactionsToCreate
//         for (let i = existingPMFTransactions.length; i < pmfTransactionsToCreate; i++) {
//           const pmfTransaction = new Transaction({
//             payerId: Object(receiverId),// Set appropriately if needed
//             receiverId: null,
//             amount: 500, // Adjust amount as per your PMF fee requirement
//             type: 'PMF',
//             level: 0, // Set appropriately if needed
//             status: 'open', // Set initially as open
//             date: new Date()
//             // You can add additional fields like utrNumber or modify as per your schema
//           });

//           await pmfTransaction.save();
//         }
//       }
//     }
//   } catch (error) {
//     console.error('Error creating PMF transactions:', error);
//     // Handle error appropriately, e.g., log it or throw an exception
//   }
// };
  

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;