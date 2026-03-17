const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Already imported

const User = require("../models/user/users");

// Ensure uploads folder exists
// In serverless environments like Vercel, use /tmp (writable) instead of the read-only code directory
const isServerless = !!process.env.VERCEL;
const uploadDir = isServerless
  ? "/tmp/uploads/profiles"
  : path.join(__dirname, "..", "uploads", "profiles");

if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.warn("⚠️ Could not create upload directory:", uploadDir, err.message);
  }
}

// Multer setup (Keeping your original config for brevity)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|webp/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (extname && mimetype) cb(null, true);
        else cb(new Error("Only images (jpeg, jpg, png, webp) are allowed!"));
    },
});

// Get user profile (No change needed here)
router.get("/profile/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("-password");
        if (!user) return res.status(404).json({ message: "❌ User not found" });
        res.status(200).json({ message: "✅ Profile fetched successfully", user });
    } catch (err) {
        console.error("Error fetching profile:", err);
        res.status(500).json({ message: "❌ Failed to fetch profile", error: err.message });
    }
});

// Update profile - ENHANCED with OLD FILE DELETION
router.put("/profile/:id", upload.single("profilePicture"), async (req, res) => {
    const { id } = req.params;
    let oldProfilePicturePath = null;
    let newProfilePicturePath = null;
    
    try {
        // 1. FIND CURRENT USER and store old path (if a new file was uploaded)
        if (req.file) {
            const user = await User.findById(id);
            if (user && user.profilePicture) {
                oldProfilePicturePath = user.profilePicture;
            }
        }

        const updates = { ...req.body };
        if (updates.password) delete updates.password;

        // 2. Set new path if a file was uploaded
        if (req.file) {
            newProfilePicturePath = path.join(uploadDir, req.file.filename);
            
            // ✅ Fix: Save relative path structure that aligns with index.js static folder
            updates.profilePicture = `uploads/profiles/${req.file.filename}`;
        }

        // 3. Update user in the database
        const updatedUser = await User.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
            select: "-password",
        });

        if (!updatedUser) {
            // If user not found, delete the newly uploaded file to prevent orphans
            if (req.file) fs.unlinkSync(newProfilePicturePath); 
            return res.status(404).json({ message: "❌ User not found" });
        }

        // 4. Successful update: Delete the OLD file
        if (oldProfilePicturePath) {
            // Need absolute path to old file for fs.unlink
            const absoluteOldPath = path.isAbsolute(oldProfilePicturePath) 
                 ? oldProfilePicturePath 
                 : path.join(__dirname, "..", oldProfilePicturePath);

            if (fs.existsSync(absoluteOldPath)) {
                fs.unlink(absoluteOldPath, (err) => {
                    if (err) console.error("Error deleting old file:", err);
                    else console.log(`🗑️ Old file deleted: ${absoluteOldPath}`);
                });
            }
        }

        res.status(200).json({ message: "✅ Profile updated successfully", user: updatedUser });

    } catch (err) {
        console.error("Error updating profile:", err);

        // On error, clean up the NEW file uploaded by Multer
        if (req.file && newProfilePicturePath && fs.existsSync(newProfilePicturePath)) {
            fs.unlink(newProfilePicturePath, (cleanupErr) => {
                if (cleanupErr) console.error("Error during cleanup:", cleanupErr);
            });
        }
        
        res.status(500).json({ message: "❌ Failed to update profile", error: err.message });
    }
});

// Change Password
router.post("/change-password/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "❌ Both current and new passwords are required" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "❌ User not found" });
        }

        // Check if current password matches
        if (user.password) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "❌ Incorrect current password" });
            }
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "✅ Password changed successfully" });
    } catch (err) {
        console.error("Error changing password:", err);
        res.status(500).json({ message: "❌ Failed to change password", error: err.message });
    }
});

// Update FCM Token for Push Notifications
router.post("/fcm-token/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({ message: "❌ FCM token is required" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "❌ User not found" });
        }

        user.fcmToken = fcmToken;
        await user.save();

        res.status(200).json({ message: "✅ FCM token updated successfully" });
    } catch (err) {
        console.error("Error updating FCM token:", err);
        res.status(500).json({ message: "❌ Failed to update FCM token", error: err.message });
    }
});

module.exports = router;