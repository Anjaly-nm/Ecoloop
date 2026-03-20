const mongoose = require('mongoose');

const recyclingDataSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    month: {
        type: String,
        required: true
    },
    totalWasteCollected: {
        type: Number,
        required: true,
        default: 0
    },
    wasteBreakdown: [
        {
            wasteType: { type: String, required: true },
            quantity: { type: Number, default: 0 }
        }
    ],
    recycledProducts: [
        {
            itemName: { type: String, required: true },
            quantity: { type: Number, default: 0 }
        }
    ],
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
recyclingDataSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('RecyclingData', recyclingDataSchema);
