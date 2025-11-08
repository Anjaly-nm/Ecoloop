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