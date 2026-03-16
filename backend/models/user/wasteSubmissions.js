const mongoose = require("mongoose");

const wasteSubmissionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

    // Set default to null to require explicit assignment (no auto-assignment)
    collector_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    scheduled_date: { type: Date, required: true },

    // 🚩 NEW FIELDS for immediate pickup identification and weight
    is_immediate: { type: Boolean, default: false },
    weight: { type: Number },

    // STATUS: Added 'new' to enum, default is overridden below
    status: {
        type: String,
        enum: ["new", "pending", "collected", "approved", "rejected", "unhandled", "in-progress"],
        default: "approved"
    },
    pendingReason: { type: String, default: "" },
    // 📍 LOCATION & SCHEDULING
    pickupDate: { type: Date },
    latitude: { type: Number },
    longitude: { type: Number }
}, { timestamps: true });


module.exports = mongoose.model("WasteSubmission", wasteSubmissionSchema);