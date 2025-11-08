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
        enum: ["new", "pending", "collected", "approved", "rejected", "unhandled"], 
        default: "approved" 
    },
    pendingReason: { type: String, default: "" } 
}, { timestamps: true });

// 🚀 PRE-SAVE HOOK: Overrides default status/collector for immediate pickups.
wasteSubmissionSchema.pre('save', function (next) {
    // Check if the submission is new AND classified as an immediate pickup (via weight or flag)
    if (this.isNew) {
        if (this.is_immediate === true || (this.weight && this.weight > 0)) {
            // If it's an immediate/urgent pickup, set status to 'new' (or 'pending') 
            // to require admin handling and prevent auto-assignment.
            this.status = "pending"; 
            this.collector_id = null; // Ensure no collector is assigned automatically
        } else if (!this.status || this.status === 'approved') {
            // For standard scheduled pickups, keep the default 'approved' status (if applicable).
            this.status = "approved";
        }
    }
    next();
});

module.exports = mongoose.model("WasteSubmission", wasteSubmissionSchema);