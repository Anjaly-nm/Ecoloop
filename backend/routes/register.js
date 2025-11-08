const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user/users');
const emailhelp = require('../control/emailhelp');
const multer = require('multer'); 
const fs = require('fs'); 

// ----------------------------------------------------
// 1. MULTER CONFIGURATION FOR FILE UPLOAD
// ----------------------------------------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

const upload = multer({ storage: storage });
// ----------------------------------------------------

// Utility function to clean up uploaded file
const cleanupFile = (path) => {
    if (path && fs.existsSync(path)) {
        try {
            fs.unlinkSync(path);
            console.log(`Cleaned up file: ${path}`);
        } catch (error) {
            console.error(`Error cleaning up file ${path}:`, error);
        }
    }
};

// Register route - ALL USERS DEFAULT TO 'user' ROLE
router.post('/register', upload.single('profilePicture'), async (req, res) => {
    const profilePicturePath = req.file ? req.file.path : null; 

    try {
        // Extract fields from req.body. Note: 'role' is not extracted from body.
        const { 
            name, 
            email, 
            password, 
            phone, 
            address, 
            houseNumber, // Now mandatory
            wardNumber,  // Now mandatory
            username 
        } = req.body; 

        // 1️⃣ Required fields check (includes username, houseNumber, and wardNumber)
        if (!name || !email || !password || !phone || !address || !username || !houseNumber || !wardNumber) { 
            cleanupFile(profilePicturePath); 
            return res.status(400).json({ 
                message: 'All required fields (name, email, password, phone, address, username, house number, ward) are missing' 
            });
        }

        // 5️⃣ Check if user already exists (by email OR username)
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            cleanupFile(profilePicturePath); 
            const field = existingUser.email === email ? 'email' : 'username';
            return res.status(409).json({ message: `User with this ${field} already exists` });
        }

        // 6️⃣ Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🔹 HARDCODE ROLE HANDLING: Set the role to 'user'
        const finalRole = 'user'; 

        // 7️⃣ Create and save user
        const newUser = new User({
            name,
            email,
            username,
            password: hashedPassword,
            phone,
            address,
            role: finalRole, // Hardcoded 'user'
            houseNumber: houseNumber, // Always included
            wardNumber: wardNumber,   // Always included
            profilePicture: profilePicturePath 
        });

        await newUser.save();

        // 8️⃣ Send welcome email
        await emailhelp.sendTextEmail(
            email,
            'Welcome to Ecoloop',
            `Hello ${name},\n\nYour account has been created successfully! Your username is: ${username}\n\nThank you.`
        );

        res.status(201).json({
            message: `${finalRole} registered successfully`,
            userId: newUser._id,
            username: newUser.username,
            profilePicture: newUser.profilePicture 
        });

    } catch (err) {
        console.error(err);
        cleanupFile(profilePicturePath); 
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;