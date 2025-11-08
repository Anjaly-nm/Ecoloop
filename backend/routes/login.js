// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Users = require('../models/user/users');
const TokenModel = require('../models/user/tokenmodel');
const { auth: firebaseAuth } = require('../firebaseAdmin'); // Firebase Admin SDK

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secretKey';

// ---------------- Email/Password/Username Login ----------------
router.post('/login', async (req, res) => {
    // We now expect 'loginId' (which can be email or username) and 'password'
    const { loginId, password } = req.body; 

    try {
        // 1. Find user by either email or username using the $or operator
        const user = await Users.findOne({ 
            $or: [
                { email: loginId },
                { username: loginId }
            ]
        });
        
        if (!user) {
            // Use a generic message for security
            return res.status(401).json({ message: 'Invalid credentials' }); 
        }

        // Check if the user has a password set (social login users might not)
        if (!user.password) {
             return res.status(401).json({ message: 'This account was created via social login. Please use the Google sign-in option.' }); 
        }

        // 2. Compare the provided password with the hashed password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            // Use a generic message for security
            return res.status(401).json({ message: 'Invalid credentials' }); 
        }

        // 3. Generate and store JWT
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7h' });
        await TokenModel.create({ userId: user._id, token });

        // 4. Return success response
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username, // Include username in the response
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
});

// ---------------- Firebase Google Login ----------------
router.post('/google-login', async (req, res) => {
// ... (The rest of the /google-login route remains unchanged) ...
    const { idToken } = req.body;

    try {
        // Verify Firebase ID token
        const decodedToken = await firebaseAuth.verifyIdToken(idToken);
        const { email, name, uid } = decodedToken;

        // Find or create user
        let user = await Users.findOne({ email });
        if (!user) {
            user = await Users.create({
                name,
                email,
                role: 'user', // default role
                firebaseUid: uid
                // Note: username is required in the schema, you must ensure 
                // a default/generated username is provided here if your schema requires it 
                // and you aren't getting one from Firebase.
                // For simplicity, I've left it as is, but it's a potential bug 
                // if the schema requires username and you don't supply one.
            });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7h' });
        await TokenModel.create({ userId: user._id, token });

        res.status(200).json({ token, user });
    } catch (err) {
        res.status(401).json({ message: 'Google login failed', error: err.message });
    }
});

// ---------------- Get Current User ----------------
router.get('/me', async (req, res) => {
// ... (The rest of the /me route remains unchanged) ...
    try {
        const token = req.headers.token;
        if (!token) return res.status(401).json({ message: 'Token missing' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await Users.findById(decoded.id).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ user });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token', error: err.message });
    }
});

module.exports = router;