const mongoose = require("mongoose");

const deliveryBoyAssignmentSchema = new mongoose.Schema({
    wardNumber: { type: String, required: true, unique: true }, // One ward per assignment (ensures unique ward)
    deliveryBoyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DeliveryBoyAssignment", deliveryBoyAssignmentSchema);
