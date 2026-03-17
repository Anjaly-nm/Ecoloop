const mongoose = require('mongoose');

const GasDataSchema = new mongoose.Schema({
    binId: {
        type: String,
        required: true
    },
    gasLevel: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Normal', 'Moderate', 'High'],
        default: 'Normal'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GasData', GasDataSchema);
