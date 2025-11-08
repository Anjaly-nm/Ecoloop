const mongoose = require("mongoose");

const pickupSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  collector_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  category: { type: String },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  scheduled_date: { type: Date, required: true },
  status: { type: String, default: "pending" },
});

const Pickup = mongoose.models.Pickup || mongoose.model("Pickup", pickupSchema);
module.exports = Pickup;
