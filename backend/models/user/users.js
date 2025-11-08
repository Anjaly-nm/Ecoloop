const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, trim: true }, // ⬅️ ADDED USERNAME FIELD
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Make password optional for Google login
    phone: { type: String, required: true },
    address: { type: String, required: true },
    role: { type: String, enum: ['user', 'Admin', 'collector'], default: 'user' },
    houseNumber: { type: String }, // optional
    wardNumber: { type: String },    // optional
    profilePicture: { type: String }, // new field for uploaded image
    ecoPoints: { type: Number, default: 0 }, // new field
    firebaseUid: { type: String } // Firebase UID for Google login users
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);