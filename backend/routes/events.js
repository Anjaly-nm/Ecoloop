const express = require('express');
const router = express.Router();
const Event = require('../models/admin/event');
const User = require('../models/user/users');
const WasteSubmission = require('../models/user/wasteSubmissions');
const Collector = require('../models/user/users');
const { authenticateToken } = require('../middlewares/middleware');

// Create a new event
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { title, description, date, location, category, organizer } = req.body;
        
        // Validate required fields
        if (!title || !date || !location || !category || !organizer) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: title, date, location, category, and organizer are required' 
            });
        }

        // Validate date format
        const eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid date format' 
            });
        }

        // Create and save the event to the database
        const newEvent = new Event({
            title,
            description: description || '',
            date: eventDate,
            location,
            category,
            organizer,
            status: 'active' // Default status
        });
        
        await newEvent.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Event created successfully', 
            event: newEvent 
        });

    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get all events
router.get('/all', authenticateToken, async (req, res) => {
    try {
        // Fetch all events from the database
        const events = await Event.find({})
            .sort({ date: 1 }) // Sort by date, upcoming first
            .populate('attendees', 'name email'); // Populate attendee information if needed
        
        res.status(200).json({ 
            success: true, 
            events: events 
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get event by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the event by ID
        const event = await Event.findById(id)
            .populate('attendees', 'name email'); // Populate attendee information if needed
            
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        res.status(200).json({ 
            success: true, 
            event: event 
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Update event
router.put('/update/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, date, location, category, organizer, status } = req.body;
        
        // Prepare update object
        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (date) updateData.date = new Date(date);
        if (location) updateData.location = location;
        if (category) updateData.category = category;
        if (organizer) updateData.organizer = organizer;
        if (status) updateData.status = status;
        updateData.updatedAt = new Date();
        
        // Find and update the event
        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            updateData,
            { new: true } // Return updated document
        );
        
        if (!updatedEvent) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Event updated successfully', 
            event: updatedEvent 
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Delete event
router.delete('/delete/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find and delete the event
        const deletedEvent = await Event.findByIdAndDelete(id);
        
        if (!deletedEvent) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Event deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Register user for event
router.post('/register/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id; // User ID from authenticated token

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user is already registered
    if (event.attendees.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already registered for this event' });
    }

    // Add user to event attendees
    event.attendees.push(userId);
    await event.save();

    res.status(200).json({ success: true, message: 'Successfully registered for event' });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ success: false, message: 'Failed to register for event', error: error.message });
  }
});

// Get event participants
router.get('/participants/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate('attendees', 'name email phone');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, participants: event.attendees });
  } catch (error) {
    console.error('Error fetching event participants:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch participants', error: error.message });
  }
});

module.exports = router;