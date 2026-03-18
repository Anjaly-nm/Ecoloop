const express = require('express');
const router = express.Router();
const CleaningRequest = require('../models/user/cleaningRequest');
const { isCollector } = require('../middlewares/middleware'); // Need middleware

// Create a new cleaning service request
router.post('/', async (req, res) => {
    try {
        const { user_id, eventType, scheduled_date, time, location, wasteTypes, additionalNotes } = req.body;

        if (!user_id || !eventType || !scheduled_date || !time || !location) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newRequest = new CleaningRequest({
            user_id,
            eventType,
            scheduled_date,
            time,
            location,
            wasteTypes: wasteTypes || [],
            additionalNotes
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
            console.error("Error creating admin notification for new cleaning request:", notifErr);
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
        // Populating user and team details if referenced
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
        // Find requests where the collectorId is in the team array
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
            return res.status(400).json({ message: "Team is required and must correctly contain assigned collector IDs" });
        }

        const updatedRequest = await CleaningRequest.findByIdAndUpdate(
            id,
            { team, status: "assigned" },
            { new: true }
        ).populate('user_id', 'name phone email').populate('team', 'name phone fcmToken');

        if (!updatedRequest) {
            return res.status(404).json({ message: "Request not found" });
        }

        // Try importing Notification from models
        try {
            const Notification = require('../models/user/notification');
            
            // Send in-app notification to all assigned team members
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
router.put('/:id/complete', isCollector, async (req, res) => {
    try {
        const { id } = req.params;
        const collectorId = req.user._id;

        // Verify that the logged-in collector is part of the assigned team
        const request = await CleaningRequest.findOne({ _id: id, team: collectorId });

        if (!request) {
            return res.status(404).json({ message: "Request not found or you are not assigned to it" });
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
