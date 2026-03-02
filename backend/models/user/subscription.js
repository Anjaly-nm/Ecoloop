const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  plan_type: { 
    type: String, 
    enum: ["pay_now", "3_months", "6_months", "1_year"], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  razorpay_order_id: { 
    type: String, 
    required: true 
  },
  razorpay_payment_id: { 
    type: String, 
    default: null 
  },
  razorpay_signature: { 
    type: String, 
    default: null 
  },
  status: { 
    type: String, 
    enum: ["pending", "completed", "failed"], 
    default: "pending" 
  },
  start_date: { 
    type: Date, 
    default: Date.now 
  },
  end_date: { 
    type: Date 
  },
  is_active: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Calculate end_date based on plan_type
subscriptionSchema.pre("save", function (next) {
  if (this.isNew && this.status === "completed") {
    const startDate = new Date();
    let endDate = new Date();
    
    switch (this.plan_type) {
      case "pay_now":
        endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      case "3_months":
        endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
        break;
      case "6_months":
        endDate = new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days
        break;
      case "1_year":
        endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 days
        break;
      default:
        endDate = startDate;
    }
    
    this.end_date = endDate;
    this.is_active = true;
  }
  next();
});

module.exports = mongoose.model("Subscription", subscriptionSchema);







