const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CleaningRequest = require('../models/user/cleaningRequest');
const { isCollector } = require('../middlewares/middleware');

// Multer Setup
let uploadDir = path.join(__dirname, '..', 'uploads', 'cleaning');

// On Vercel, use /tmp for temporary file storage
if (process.env.VERCEL) {
    uploadDir = path.join('/tmp', 'uploads', 'cleaning');
}

try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (err) {
    console.warn('⚠️ Warning: Could not create upload directory:', uploadDir, err.message);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `cleaning-${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage });

// Create a new cleaning service request
router.post('/', upload.array('images', 5), async (req, res) => {
    try {
        const { user_id, eventType, scheduled_date, time, location, wasteTypes, additionalNotes, priority } = req.body;

        if (!user_id || !eventType || !scheduled_date || !time || !location) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const imagePaths = req.files ? req.files.map(file => `uploads/cleaning/${file.filename}`) : [];

        const newRequest = new CleaningRequest({
            user_id,
            eventType,
            scheduled_date,
            time,
            location,
            wasteTypes: Array.isArray(wasteTypes) ? wasteTypes : (wasteTypes ? [wasteTypes] : []),
            additionalNotes,
            priority: priority || 'Medium',
            images: imagePaths
        });

        await newRequest.save();

        // Also notify admins
        try {
            const User = require('../models/user/users');
            const Notification = require('../models/user/notification');
            const admins = await User.find({ role: 'admin' });
            for (let admin of admins) {
                const notif = new Notification({
                    userId: admin._id,
                    type: 'new_cleaning_request',
                    title: 'New Event Cleaning Request',
                    message: `A new ${eventType || 'Event'} cleaning request has been submitted for ${new Date(scheduled_date).toLocaleDateString()}.`,
                    actionUrl: '/admin/cleaning-requests',
                    userModel: 'User'
                });
                await notif.save();
            }
        } catch (notifErr) {
            console.error("Error creating admin notification:", notifErr);
        }

        res.status(201).json({ message: "Cleaning service request submitted successfully!", data: newRequest });
    } catch (error) {
        console.error("Error creating cleaning service request:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// Get all requests for Admin
router.get('/', async (req, res) => {
    try {
        const requests = await CleaningRequest.find()
            .populate('user_id', 'name phone email')
            .populate('team', 'name phone')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        console.error("Error fetching cleaning service requests:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get requests by a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const requests = await CleaningRequest.find({ user_id: userId })
            .populate('team', 'name phone')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        console.error("Error fetching user cleaning service requests:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get all requests assigned to logged-in collector
router.get('/collector', isCollector, async (req, res) => {
    try {
        const collectorId = req.user._id;
        const requests = await CleaningRequest.find({ team: collectorId })
            .populate('user_id', 'name phone email address')
            .populate('team', 'name phone')
            .sort({ scheduled_date: 1 });

        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        console.error("Error fetching collector cleaning requests:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Assign a team of collectors by Admin
router.put('/:id/assign', async (req, res) => {
    try {
        const { id } = req.params;
        const { team } = req.body;

        if (!team || !Array.isArray(team) || team.length === 0) {
            return res.status(400).json({ message: "Team is required" });
        }

        const updatedRequest = await CleaningRequest.findByIdAndUpdate(
            id,
            { team, status: "assigned" },
            { new: true }
        ).populate('user_id', 'name phone email').populate('team', 'name phone');

        if (!updatedRequest) {
            return res.status(404).json({ message: "Request not found" });
        }

        try {
            const Notification = require('../models/user/notification');
            for (let collectorId of team) {
                const newNotification = new Notification({
                    userId: collectorId,
                    type: 'cleaning_assignment',
                    title: 'New Cleaning Event Assignment',
                    message: `You have been assigned to an event cleaning request (${updatedRequest.eventType}) on ${new Date(updatedRequest.scheduled_date).toLocaleDateString()}.`,
                    actionUrl: '/collector',
                    userModel: 'User'
                });
                await newNotification.save();
            }
        } catch (notifErr) {
            console.error("Error sending notification:", notifErr);
        }

        res.status(200).json({ message: "Team assigned successfully", data: updatedRequest });
    } catch (error) {
        console.error("Error assigning team:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Mark a cleaning request as completed
router.put('/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const request = await CleaningRequest.findById(id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        request.status = "completed";
        await request.save();

        res.status(200).json({ message: "Cleaning request marked as completed", data: request });
    } catch (error) {
        console.error("Error completing cleaning request:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
