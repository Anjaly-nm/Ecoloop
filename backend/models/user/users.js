const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, trim: true }, // ⬅️ ADDED USERNAME FIELD
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Make password optional for Google login
    phone: { type: String, required: true },
    address: { type: String, required: true },
    role: { type: String, enum: ['user', 'Admin', 'collector', 'seller', 'delivery-boy'], default: 'user' }, // ✅ Added 'seller' and 'delivery-boy' roles
    houseNumber: { type: String }, // optional
    wardNumber: { type: String },    // optional
    profilePicture: { type: String }, // new field for uploaded image
    ecoPoints: { type: Number, default: 0 }, // new field
    firebaseUid: { type: String }, // Firebase UID for Google login users
    fcmToken: { type: String }, // NEW FIELD: Store device token for Firebase Push Notifications
    baseSalary: { type: Number, default: 20000 }, // Default base salary for delivery boys
    perDeliveryIncentive: { type: Number, default: 50 } // Default incentive per delivery
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);