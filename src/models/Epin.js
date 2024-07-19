const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  transferredFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transferredTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transferDate: { type: Date, default: Date.now }
});

const epinSchema = new mongoose.Schema({
  ePinId: { type: String, required: true, unique: true },
  type: { type: String, required: true }, // "login", "PMF"
  amount: { type: Number, required: true },
  status: { type: String, required: true, default: 'unused' }, // "unused", "used"
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transferHistory: [transferSchema], // Log transfer history
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  usedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const Epin = mongoose.model('Epin', epinSchema);
module.exports = Epin;