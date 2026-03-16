const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
    // MongoDB automatically adds the unique _id field

    title: {
        type: String,
        required: [true, 'A video title is required.'],
        trim: true,
        maxlength: 150
    },
    description: {
        type: String,
        required: [true, 'A description is required.'],
        trim: true
    },
    url: {
        type: String,
        required: [true, 'A video URL is required.'],
        trim: true
    },
    category: {
        type: String,
        default: 'General',
        trim: true
    },
    is_published: {
        type: Boolean,
        default: true
    },
    order_index: {
        type: Number,
        default: 0
    },
    date_added: {
        type: Date,
        default: Date.now
    }
}, {
    // Adds createdAt and updatedAt timestamps automatically
    timestamps: true
});

module.exports = mongoose.model('Video', VideoSchema);