
const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true
  },
  expiredAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 60 * 60 * 1000) 
  }
}, {
  timestamps: true
});

tokenSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });


const TokenModel = mongoose.model('Token', tokenSchema);
module.exports = TokenModel;
