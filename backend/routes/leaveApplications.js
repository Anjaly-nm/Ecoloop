const express = require('express');
const router = express.Router();
const LeaveApplication = require('../models/user/leaveApplications');
const User = require('../models/user/users');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'leave-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Files must be PDF, DOC, DOCX, JPG, or PNG'));
    }
  }
});

// Apply for leave
router.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const { startDate, endDate, leaveType, reason, userId } = req.body;

    // Validate required fields
    if (!startDate || !endDate || !reason || !userId) {
      return res.status(400).json({ 
        message: 'Missing required fields: startDate, endDate, reason, userId' 
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({ 
        message: 'End date must be after start date' 
      });
    }

    // Find user to get their details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Create leave application
    const leaveApplication = new LeaveApplication({
      userId: user._id,
      employeeId: user._id.toString(), // Using MongoDB ID as employee ID
      employeeName: user.name || user.username || `User ${user._id}`,
      startDate: start,
      endDate: end,
      leaveType: leaveType || 'Personal',
      reason,
      attachment: req.file ? req.file.filename : null
    });

    await leaveApplication.save();

    res.status(201).json({ 
      message: 'Leave application submitted successfully!',
      application: leaveApplication 
    });
  } catch (error) {
    console.error('Error submitting leave application:', error);
    res.status(500).json({ 
      message: 'Error submitting leave application',
      error: error.message 
    });
  }
});

// Get all leave applications (for admin)
router.get('/', async (req, res) => {
  try {
    const applications = await LeaveApplication.find()
      .populate('userId', 'name email')
      .sort({ appliedDate: -1 });

    res.status(200).json({ 
      applications 
    });
  } catch (error) {
    console.error('Error fetching leave applications:', error);
    res.status(500).json({ 
      message: 'Error fetching leave applications',
      error: error.message 
    });
  }
});

// Get leave applications for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const applications = await LeaveApplication.find({ userId })
      .sort({ appliedDate: -1 });

    res.status(200).json({ 
      applications 
    });
  } catch (error) {
    console.error('Error fetching user leave applications:', error);
    res.status(500).json({ 
      message: 'Error fetching leave applications',
      error: error.message 
    });
  }
});

// Update leave application status (for admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be pending, approved, or rejected' 
      });
    }

    const updatedApplication = await LeaveApplication.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedApplication) {
      return res.status(404).json({ 
        message: 'Leave application not found' 
      });
    }

    res.status(200).json({ 
      message: `Leave application ${status} successfully`,
      application: updatedApplication 
    });
  } catch (error) {
    console.error('Error updating leave application status:', error);
    res.status(500).json({ 
      message: 'Error updating leave application status',
      error: error.message 
    });
  }
});

module.exports = router;