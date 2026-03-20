const express = require('express');
const router = express.Router();
const RecyclingData = require('../models/user/recyclingData');
const { isSeller, isAdmin } = require('../middlewares/middleware');

// GET all recycling data (Admin)
router.get('/all', isAdmin, async (req, res) => {
    try {
        const data = await RecyclingData.find().populate('sellerId', 'name organization shopName businessName').sort({ createdAt: -1 });
        res.json({ success: true, data });
    } catch (error) {
        console.error("GET /all recycling error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET recycling data for a specific seller (Admin)
router.get('/seller/:sellerId', isAdmin, async (req, res) => {
    try {
        const data = await RecyclingData.find({ sellerId: req.params.sellerId }).sort({ createdAt: -1 });
        res.json({ success: true, data });
    } catch (error) {
        console.error("GET /seller/:sellerId recycling error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET all recycling data for the logged-in seller
router.get('/my-data', isSeller, async (req, res) => {
    try {
        const data = await RecyclingData.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, data });
    } catch (error) {
        console.error("GET /my-data error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST new recycling data
router.post('/add', isSeller, async (req, res) => {
    try {
        const {
            month,
            totalWasteCollected,
            wasteBreakdown,
            recycledProducts
        } = req.body;

        const newData = new RecyclingData({
            sellerId: req.user._id,
            month,
            totalWasteCollected,
            wasteBreakdown,
            recycledProducts
        });

        await newData.save();
        res.status(201).json({ success: true, message: 'Recycling data added successfully', data: newData });
    } catch (error) {
        console.error("POST /add recycling error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT update existing recycling data
router.put('/update/:id', isSeller, async (req, res) => {
    try {
        const {
            month,
            totalWasteCollected,
            wasteBreakdown,
            recycledProducts
        } = req.body;

        const updatedData = await RecyclingData.findOneAndUpdate(
            { _id: req.params.id, sellerId: req.user._id },
            {
                month,
                totalWasteCollected,
                wasteBreakdown,
                recycledProducts,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!updatedData) {
            return res.status(404).json({ success: false, message: 'Data not found or unauthorized' });
        }

        res.json({ success: true, message: 'Recycling data updated successfully', data: updatedData });
    } catch (error) {
        console.error("PUT /update/:id recycling error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// DELETE recycling data
router.delete('/delete/:id', isSeller, async (req, res) => {
    try {
        const deletedData = await RecyclingData.findOneAndDelete({ _id: req.params.id, sellerId: req.user._id });
        if (!deletedData) {
            return res.status(404).json({ success: false, message: 'Data not found or unauthorized' });
        }
        res.json({ success: true, message: 'Recycling data deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
