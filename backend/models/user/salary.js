const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
    deliveryBoyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: String, // e.g., "2024-03"
        required: true
    },
    baseSalary: {
        type: Number,
        required: true
    },
    deliveriesCompleted: {
        type: Number,
        required: true
    },
    incentiveEarned: {
        type: Number,
        required: true
    },
    totalEarnings: {
        type: Number,
        required: true
    },
    creditStatus: {
        type: String,
        enum: ["Pending", "Credited"],
        default: "Pending"
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model("Salary", salarySchema);
