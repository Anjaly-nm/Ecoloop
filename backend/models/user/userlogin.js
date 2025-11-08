const mongoose = require('mongoose');

const userLoginSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loginAt: { type: Date, default: Date.now },       // optional: client IP
  userAgent: { type: String },   // optional: browser/device info
});

module.exports = mongoose.model('UserLogin', userLoginSchema);
