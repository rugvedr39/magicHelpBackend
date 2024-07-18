const mongoose = require('mongoose');

const mlmStructureSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  level: { type: Number, required: true },
  uplineId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const MlmStructure = mongoose.model('MlmStructure', mlmStructureSchema);
module.exports = MlmStructure;
