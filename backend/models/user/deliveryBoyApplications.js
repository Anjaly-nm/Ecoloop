const mongoose = require("mongoose");

const deliveryBoyApplicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  vehicleType: {
    type: String,
    required: true,
  },
  experience: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    default: "Pending", // Pending, Approved, Rejected
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("DeliveryBoyApplication", deliveryBoyApplicationSchema);