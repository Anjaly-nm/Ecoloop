const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Message = require('../models/user/message');
const User = require('../models/user/users');
const Order = require('../models/user/order');

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

// POST /api/messages/send
router.post('/send', verifyToken, async (req, res) => {
    try {
        const { recipientId, orderId, text } = req.body;

        if (!recipientId || !text) {
            return res.status(400).json({ message: 'Recipient and text are required' });
        }

        const newMessage = new Message({
            sender: req.userId,
            recipient: recipientId,
            orderId: orderId || null,
            text: text
        });

        const savedMessage = await newMessage.save();

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: savedMessage
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
});

// GET /api/messages/history/:orderId
router.get('/history/:orderId', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;

        const messages = await Message.find({
            orderId: orderId,
            $or: [
                { sender: req.userId },
                { recipient: req.userId }
            ]
        })
            .sort({ createdAt: 1 }) // Oldest first
            .populate('sender', 'name role')
            .populate('recipient', 'name role');

        res.status(200).json({
            success: true,
            messages: messages
        });
    } catch (error) {
        console.error('Error fetching message history:', error);
        res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
    }
});

// GET /api/messages/conversations
router.get('/conversations', verifyToken, async (req, res) => {
    try {
        // Find all messages where user is sender or recipient
        const messages = await Message.find({
            $or: [
                { sender: req.userId },
                { recipient: req.userId }
            ]
        })
            .sort({ createdAt: -1 })
            .populate('sender', 'name role profilePicture')
            .populate('recipient', 'name role profilePicture')
            .populate('orderId', 'items status');

        // Group by Order ID (primary grouping)
        const conversationsMap = {};

        console.log(`[Conversations] Found ${messages.length} messages for user ${req.userId}`);

        messages.forEach(msg => {
            // Safety checks
            if (!msg.orderId) {
                // console.log(`Skipping msg ${msg._id}: No Order ID (populated is null)`);
                return;
            }
            if (!msg.sender || !msg.recipient) {
                // console.log(`Skipping msg ${msg._id}: Sender or Recipient missing`);
                return;
            }

            const orderId = msg.orderId._id.toString();

            if (!conversationsMap[orderId]) {
                // Determine the "other user"
                const isSender = msg.sender._id.toString() === req.userId;
                const otherUser = isSender ? msg.recipient : msg.sender;

                conversationsMap[orderId] = {
                    order: msg.orderId,
                    otherUser: otherUser,
                    lastMessage: msg,
                    unreadCount: 0
                };
            }

            // Count unread (where current user is recipient and not read)
            if (msg.recipient._id.toString() === req.userId && !msg.read) {
                conversationsMap[orderId].unreadCount++;
            }
        });

        const conversationList = Object.values(conversationsMap);
        console.log(`[Conversations] Returning ${conversationList.length} conversations`);

        res.status(200).json({
            success: true,
            conversations: conversationList
        });

    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Failed to fetch conversations', error: error.message });
    }
});

// GET /api/messages/admin
// Fetch the details of the admin user to start a chat
router.get('/admin', verifyToken, async (req, res) => {
    try {
        const admin = await User.findOne({ role: 'Admin' }).select('name email phone profilePicture role');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.status(200).json({
            success: true,
            admin: admin
        });
    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).json({ message: 'Failed to fetch admin', error: error.message });
    }
});

// GET /api/messages/history/direct/:userId
// Fetch chat history with a specific user (e.g., Admin) without an Order ID
router.get('/history/direct/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params; // The other person (e.g., Admin)

        const messages = await Message.find({
            orderId: null, // Only fetch direct messages (no order linked)
            $or: [
                { sender: req.userId, recipient: userId },
                { sender: userId, recipient: req.userId }
            ]
        })
            .sort({ createdAt: 1 }) // Oldest first
            .populate('sender', 'name role')
            .populate('recipient', 'name role');

        res.status(200).json({
            success: true,
            messages: messages
        });
    } catch (error) {
        console.error('Error fetching direct message history:', error);
        res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
    }
});

module.exports = router;
