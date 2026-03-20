const mongoose = require("mongoose");

const cleaningRequestSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventType: { type: String, required: true }, // e.g., Wedding, Party, Gathering
    scheduled_date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    wasteTypes: [{ type: String }],
    status: {
        type: String,
        enum: ["pending", "assigned", "completed", "rejected"],
        default: "pending"
    },
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Changed from single collector_id
    additionalNotes: { type: String, default: "" },
    priority: { 
        type: String, 
        enum: ["Low", "Medium", "High"], 
        default: "Medium" 
    },
    images: [{ type: String }] // Array of image URLs
}, { timestamps: true });

module.exports = mongoose.model("CleaningRequest", cleaningRequestSchema);
