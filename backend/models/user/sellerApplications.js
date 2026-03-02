const mongoose = require("mongoose");

const sellerApplicationSchema = new mongoose.Schema({
  // Organization details
  organizationName: { type: String, required: true },
  organizationType: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  yearOfEstablishment: { type: Number, required: true },
  website: { type: String },
  
  // Contact details
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  
  // Waste processing details
  wasteTypesProcessed: [{ type: String }],
  processingCapacity: { type: String },
  wasteCollectionService: { type: Boolean, default: false },
  
  // Fertilizer product details
  fertilizerProducts: [{ 
    productName: String,
    description: String,
    certification: String
  }],
  
  // Government ID details
  aadharNumber: { type: String }, // ✅ Changed from gstNumber to aadharNumber
  licenseNumber: { type: String },
  governmentIdType: { type: String, enum: ['Aadhar', 'License'] }, // ✅ Changed from GST to Aadhar
  governmentIdDocument: { type: String }, // Path to uploaded document
  
  // Verification details
  verificationStatus: { 
    type: String, 
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending' 
  },
  verificationDetails: { type: String },
  
  // Admin decision
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending' 
  },
  adminRemarks: { type: String },
  
  // Auto-generated credentials (on approval)
  generatedUsername: { type: String },
  generatedPassword: { type: String },
  
}, { timestamps: true });

module.exports = mongoose.model("SellerApplication", sellerApplicationSchema);