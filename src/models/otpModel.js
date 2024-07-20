const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the OTP schema
const otpSchema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    match: [/^\d{10}$/, 'Please fill a valid phone number'],
  },
  otp: {
    type: String,
    required: true,
  },
  username:{
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: 300 } // TTL index to auto-remove documents after 5 minutes
  }
});

// Create the OTP model
const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
