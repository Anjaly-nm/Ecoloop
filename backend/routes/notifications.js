const express = require('express');
const router = express.Router();
const Notification = require('../models/user/notification');
const { authenticateToken } = require('../middlewares/middleware');

// GET: Get all notifications for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20);
        
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.status(200).json({ 
            success: true, 
            notifications,
            unreadCount 
        });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT: Mark a notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: "Notification not found" });
        res.status(200).json({ success: true, notification });
    } catch (err) {
        console.error("Error marking notification as read:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT: Mark all as read
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true }
        );
        res.status(200).json({ success: true, message: "All marked as read" });
    } catch (err) {
        console.error("Error marking all as read:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
