const mongoose = require('mongoose');

const leaveApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Personal', 'Medical', 'Emergency', 'Vacation', 'Other', 'personal', 'medical', 'emergency', 'vacation', 'other'],
    default: 'Personal'
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  attachment: {
    type: String, // Store filename/path of uploaded document
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LeaveApplication', leaveApplicationSchema);