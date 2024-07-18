const mongoose = require('mongoose');

const epinSchema = new mongoose.Schema({
  ePinId: { type: String, required: true, unique: true },
  type: { type: String, required: true }, // "login", "PMF"
  amount: { type: Number, required: true },
  status: { type: String, required: true, default: 'unused' }, // "unused", "used"
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Epin = mongoose.model('Epin', epinSchema);
module.exports = Epin;