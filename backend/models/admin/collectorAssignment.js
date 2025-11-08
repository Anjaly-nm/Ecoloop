const mongoose = require("mongoose");

const collectorAssignmentSchema = new mongoose.Schema({
  wardNumber: { type: String, required: true }, // changed to match your User field
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  collectorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("CollectorAssignment", collectorAssignmentSchema);
