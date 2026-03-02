const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    default: ""
  },
  // Keep 'image' for backward compatibility (thumbnail)
  image: {
    type: String,
    default: ""
  },
  // New: Multiple images support
  images: [{
    type: String
  }],
  // New: Waste Details
  wasteType: {
    type: String,
    default: ""
  },
  wasteQuantity: {
    type: Number,
    default: 0
  },
  productOutputQuantity: {
    type: Number,
    default: 0
  },
  unit: {
    type: String, // e.g., "kg", "pieces"
    default: "pieces"
  },
  // New: Eco/Pricing Details
  ecoPointsEligibility: {
    type: String, // "Yes" or "No" (or Boolean if preferred, keeping String based on prompt)
    default: "No"
  },
  ecoCertification: {
    type: String,
    enum: ["Recycled", "Organic", "Eco-Friendly", "None"],
    default: "None"
  },
  seller_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      rating: { type: Number, required: true },
      comment: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  rating: {
    type: Number,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
productSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;




