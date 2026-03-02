const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/user/order');
const User = require('../models/user/users');
const Salary = require('../models/user/salary');

const JWT_SECRET = process.env.JWT_SECRET || 'secretKey';

// Middleware to verify token
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

const mongoose = require('mongoose');

// Get salary summary for delivery boy
router.get('/summary', verifyToken, async (req, res) => {
    try {
        const deliveryBoyId = req.userId;
        const user = await User.findById(deliveryBoyId);

        if (!user || user.role !== 'delivery-boy') {
            return res.status(403).json({ message: 'Access denied. Not a delivery boy.' });
        }

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        // Convert to ObjectId for robust querying
        const dbId = new mongoose.Types.ObjectId(deliveryBoyId);

        // Count completed deliveries (All-time for debug, then we can re-add month filter)
        // We check for 'delivered', 'completed', or 'Done' just in case
        const completedDeliveries = await Order.countDocuments({
            deliveryBoyId: { $in: [dbId, deliveryBoyId] }, // Check both ObjectId and String
            $or: [
                { status: { $in: ['delivered', 'completed', 'delivered'] } },
                { deliveryStatus: { $in: ['delivered', 'completed'] } }
            ]
        });

        // Also count total assigned to see if we find any at all
        const totalAssigned = await Order.countDocuments({ deliveryBoyId: { $in: [dbId, deliveryBoyId] } });

        console.log(`[SALARY DEBUG] DB ID: ${deliveryBoyId}`);
        console.log(`[SALARY DEBUG] Total Assigned: ${totalAssigned}`);
        console.log(`[SALARY DEBUG] Completed Found: ${completedDeliveries}`);

        const baseSalary = user.baseSalary || 20000;
        const incentiveRate = user.perDeliveryIncentive || 50;
        const incentiveEarned = completedDeliveries * incentiveRate;
        const totalEarnings = baseSalary + incentiveEarned;

        // Check if there's a salary record for this month
        const monthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        let salaryRecord = await Salary.findOne({ deliveryBoyId: dbId, month: monthStr });

        if (!salaryRecord) {
            salaryRecord = new Salary({
                deliveryBoyId,
                month: monthStr,
                baseSalary,
                deliveriesCompleted: completedDeliveries,
                incentiveEarned,
                totalEarnings,
                creditStatus: 'Pending'
            });
            await salaryRecord.save();
        } else {
            // Update existing record with latest counts
            salaryRecord.deliveriesCompleted = completedDeliveries;
            salaryRecord.incentiveEarned = incentiveEarned;
            salaryRecord.totalEarnings = totalEarnings;
            await salaryRecord.save();
        }

        res.status(200).json({
            success: true,
            data: {
                baseSalary,
                deliveriesCompleted: completedDeliveries,
                incentiveEarned,
                totalEarnings,
                creditStatus: salaryRecord.creditStatus
            }
        });

    } catch (error) {
        console.error('Error fetching salary summary:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
