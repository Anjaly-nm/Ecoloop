const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Pickup = require('../models/user/wasteSubmissions');
const Notification = require('../models/user/notification');
const User = require('../models/user/users');
const { isCollector } = require('../middlewares/middleware');

// GET: Collector Analytics
router.get('/analytics', isCollector, async (req, res) => {
    try {
        const collectorId = req.user._id;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const stats = await Pickup.aggregate([
            { $match: { collector_id: new mongoose.Types.ObjectId(collectorId) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    collected: { $sum: { $cond: [{ $eq: ["$status", "collected"] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                    monthly: { $sum: { $cond: [{ $gte: ["$createdAt", startOfMonth] }, 1, 0] } }
                }
            }
        ]);

        const result = stats[0] || { total: 0, collected: 0, pending: 0, monthly: 0 };
        const completionRate = result.total > 0 ? (result.collected / result.total) * 100 : 0;

        // Waste breakdown
        const breakdown = await Pickup.aggregate([
            { $match: { collector_id: new mongoose.Types.ObjectId(collectorId), status: "collected" } },
            {
                $lookup: {
                    from: "categories",
                    localField: "category_id",
                    foreignField: "_id",
                    as: "categoryInfo"
                }
            },
            { $unwind: "$categoryInfo" },
            {
                $group: {
                    _id: "$categoryInfo.name",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            analytics: {
                ...result,
                completionRate: completionRate.toFixed(1),
                efficiencyScore: (completionRate * 0.8).toFixed(1), // Mock score
            },
            breakdown
        });
    } catch (err) {
        console.error("Error fetching analytics:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET: Collector Salary Summary
router.get('/earnings', isCollector, async (req, res) => {
    try {
        const collectorId = req.user._id;
        const user = await User.findById(collectorId);

        const completedCount = await Pickup.countDocuments({
            collector_id: collectorId,
            status: "collected"
        });

        const baseSalary = user.baseSalary || 20000;
        const perCollectionRate = user.perDeliveryIncentive || 50;
        const incentiveEarned = completedCount * perCollectionRate;
        const totalEarnings = baseSalary + incentiveEarned;

        res.status(200).json({
            success: true,
            earnings: {
                baseSalary,
                completedCollections: completedCount,
                incentiveEarned,
                totalEarnings,
                bonusEligible: completedCount > 50
            }
        });
    } catch (err) {
        console.error("Error fetching earnings:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET: Notifications
router.get('/notifications', isCollector, async (req, res) => {
    try {
        const collectorId = req.user._id;
        const notifications = await Notification.find({ userId: collectorId })
            .sort({ createdAt: -1 })
            .limit(10);
        res.status(200).json({ success: true, notifications });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
