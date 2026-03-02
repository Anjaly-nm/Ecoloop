const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['workshop', 'seminar', 'cleaning-drive', 'awareness-campaign', 'recycling-event', 'other']
    },
    organizer: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'completed', 'cancelled']
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

eventSchema.pre('save', function(next) {
    this.updatedAt = Date.now;
    next();
});

module.exports = mongoose.model('Event', eventSchema);