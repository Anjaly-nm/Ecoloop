const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Refers to collector (stored in User model with role = 'collector')
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
