// routes/usermanagement.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user/users'); 
const { isAdmin } = require('../middlewares/middleware'); 

router.get('/all', isAdmin, async (req, res) => {
    try {
        // Fetch all users, excluding sensitive fields
        const users = await User.find().select('-password -__v');

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            message: 'Server error while fetching users', 
            detail: error.message 
        });
    }
});

// -----------------------------------------------------------------
// 3. GET /api/user/sellers → Get all sellers (Requires Admin)
// -----------------------------------------------------------------
router.get('/sellers', isAdmin, async (req, res) => {
    try {
        // Fetch all users with role 'seller', excluding sensitive fields
        const sellers = await User.find({ role: 'seller' }).select('-password -__v');

        res.status(200).json(sellers);
    } catch (error) {
        console.error('Error fetching sellers:', error);
        res.status(500).json({ 
            message: 'Server error while fetching sellers', 
            detail: error.message 
        });
    }
});

// -----------------------------------------------------------------
// 4. GET /api/user/delivery-boys → Get all delivery boys (Requires Admin)
// -----------------------------------------------------------------
router.get('/delivery-boys', isAdmin, async (req, res) => {
    try {
        // Fetch all users with role 'delivery-boy', excluding sensitive fields
        const deliveryBoys = await User.find({ role: 'delivery-boy' }).select('-password -__v');

        res.status(200).json(deliveryBoys);
    } catch (error) {
        console.error('Error fetching delivery boys:', error);
        res.status(500).json({ 
            message: 'Server error while fetching delivery boys', 
            detail: error.message 
        });
    }
});


// -----------------------------------------------------------------
// 2. DELETE /api/user/:id → Delete a user by ID (Requires Admin)
// -----------------------------------------------------------------
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        if (req.user._id.toString() === id) {
            return res.status(400).json({ message: 'Admins cannot delete their own account.' });
        }

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({
            message: 'User deleted successfully.',
            deletedUser,
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error', detail: error.message });
    }
});

module.exports = router;