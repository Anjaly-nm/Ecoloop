const mongoose = require("mongoose");

const collectorApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  status: { type: String, default: "Pending" }, // Pending / Approved / Rejected
}, { timestamps: true });

// IMPORTANT: Use the exact model name as in your code
module.exports = mongoose.models.CollectorApplications || mongoose.model("CollectorApplications", collectorApplicationSchema);
