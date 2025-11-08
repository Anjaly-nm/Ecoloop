const express = require('express');
const router = express.Router();
const User = require('../models/user/users'); // Your Mongoose User Model
const bcryptjs = require('bcryptjs'); // For password hashing
const twilio = require('twilio'); // Example SMS library
const rateLimit = require('express-rate-limit'); // For security

// --- CONFIGURATION PLACEHOLDERS ---
// Load these from your environment variables
const SMS_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'AC_xxxxxxxxxxxxxxxxxxx';
const SMS_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token';
const SMS_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+15005550006'; // Your Twilio service phone number

const smsClient = twilio(SMS_ACCOUNT_SID, SMS_AUTH_TOKEN);
const OTP_EXPIRY_MINUTES = 5;

// Helper to generate a 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// --- RATE LIMITING MIDDLEWARE ---
// Limit each IP to 5 OTP requests per 15 minutes to prevent spamming/abuse
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { message: "Too many password reset requests from this IP, please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

// ====================================================
// 📌 ENDPOINT 1: Initiate Reset (Generate & Send OTP)
// ====================================================
// POST /api/auth/reset/send-otp
router.post("/reset/send-otp", otpLimiter, async (req, res) => {
    try {
        const { phone } = req.body; // Using 'phone' to match your schema field
        if (!phone) {
            return res.status(400).json({ message: "Phone number is required." });
        }

        // 1. Find User by Phone Number
        const user = await User.findOne({ phone });

        // Security Note: Use a generic message to prevent account enumeration.
        if (!user) {
            console.log(`Attempted OTP request for non-existent number: ${phone}`);
            // Still return 200 OK with the generic success message
            return res.status(200).json({ message: "If an account exists, an SMS has been sent." });
        }

        // 2. Generate OTP and Expiry Time
        const otp = generateOTP();
        const expiryDate = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // 3. Store OTP and Expiry directly on the User document
        // This relies on your Mongoose schema having resetOtp and resetOtpExpires fields
        user.resetOtp = otp;
        user.resetOtpExpires = expiryDate;
        await user.save();

        // 4. Send the OTP via SMS Gateway
        await smsClient.messages.create({
            body: `Your password reset code is: ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
            to: phone,
            from: SMS_PHONE_NUMBER
        });

        // 5. Respond to Client
        res.status(200).json({
            message: "If an account exists, an SMS has been sent.", // Keep the response generic
            otp_sent: true
        });

    } catch (error) {
        console.error("🔥 Error initiating password reset:", error);
        res.status(500).json({ message: "Server error during OTP request." });
    }
});

// ===========================================================
// 📌 ENDPOINT 2: Complete Reset (Verify OTP & Change Password)
// ===========================================================
// POST /api/auth/reset/verify-and-change
router.post("/reset/verify-and-change", async (req, res) => {
    try {
        const { phone, otp, newPassword } = req.body;

        if (!phone || !otp || !newPassword) {
            return res.status(400).json({ message: "Missing required fields." });
        }
        
        // --- Password Complexity Check (RECOMMENDED) ---
        if (newPassword.length < 8) {
            return res.status(400).json({ message: "New password must be at least 8 characters long." });
        }
        // ----------------------------------------------

        // 1. Find User, explicitly selecting the temporary fields and password
        const user = await User.findOne({ phone })
            .select('+password +resetOtp +resetOtpExpires'); 
        
        // Generic failure message for security
        if (!user || user.resetOtp !== otp) {
            // Note: We don't want to clear the OTP here, as an attacker might use 
            // an invalid code to clear a valid one. We only clear on success or expiry.
            return res.status(400).json({ message: "Invalid code or user not found." });
        }

        if (user.resetOtpExpires < Date.now()) {
            // 2a. Invalidate the token after failure (Manual Cleanup)
            user.resetOtp = null;
            user.resetOtpExpires = null;
            await user.save({ validateBeforeSave: false }); // Skip validation for cleanup
            return res.status(400).json({ message: "Expired code. Please request a new one." });
        }
        
        // 3. Update Password and Clear Temporary Fields
        // NOTE: We rely on a Mongoose pre-save hook to hash 'user.password'.
        user.password = newPassword; 
        user.resetOtp = null; // Clear OTP (CRITICAL for security)
        user.resetOtpExpires = null; // Clear expiry

        await user.save(); // The pre-save hook handles hashing

        // 4. Respond to Client
        res.status(200).json({ message: "✅ Password successfully reset. You can now log in." });

    } catch (error) {
        console.error("🔥 Error completing password reset:", error);
        res.status(500).json({ message: "Server error during password update." });
    }
});

module.exports = router;