const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Subscription = require('../models/user/subscription');
const { isAdmin } = require('../middlewares/middleware');
const Users = require('../models/user/users');

const JWT_SECRET = process.env.JWT_SECRET || 'secretKey';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxxxxxx', // Replace with your Razorpay Key ID
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_secret_key' // Replace with your Razorpay Key Secret
});

// Plan pricing configuration
const PLAN_PRICES = {
  pay_now: 299,      // ₹299 for one-time payment
  '3_months': 799,   // ₹799 for 3 months
  '6_months': 1499,   // ₹1499 for 6 months
  '1_year': 2499     // ₹2499 for 1 year
};

// Middleware to verify token and extract user_id
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

// Create Razorpay order
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const { plan_type } = req.body;
    const user_id = req.userId; // Get from verified token

    if (!plan_type) {
      return res.status(400).json({ message: 'plan_type is required' });
    }

    if (!PLAN_PRICES[plan_type]) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }

    const amount = PLAN_PRICES[plan_type] * 100; // Convert to paise (Razorpay uses smallest currency unit)

    // Verify user exists
    const user = await Users.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create Razorpay order
    // Razorpay receipt must be <= 40 chars. Keep it short.
    const receipt = `sub_${Date.now()}`; // e.g., "sub_1733812756123"

    const options = {
      amount: amount,
      currency: 'INR',
      receipt,
      notes: {
        user_id: user_id.toString(),
        plan_type: plan_type,
        user_name: user.name,
        user_email: user.email
      }
    };

    const order = await razorpay.orders.create(options);

    // Create subscription record with pending status
    const subscription = await Subscription.create({
      user_id: user_id,
      plan_type: plan_type,
      amount: PLAN_PRICES[plan_type],
      razorpay_order_id: order.id,
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: amount,
      currency: 'INR',
      subscription_id: subscription._id,
      key_id: razorpay.key_id
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create order', 
      error: error.message 
    });
  }
});

// Verify payment and update subscription
router.post('/verify-payment', verifyToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, subscription_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification data is missing' });
    }

    // Verify the payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', razorpay.key_secret)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed - Invalid signature' 
      });
    }

    const user_id = req.userId; // Get from verified token

    // Find subscription by ID or fallback to order_id if ID not provided
    let subscription = null;
    if (subscription_id) {
      subscription = await Subscription.findById(subscription_id);
    }
    if (!subscription && razorpay_order_id) {
      subscription = await Subscription.findOne({ razorpay_order_id });
    }
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found for this payment' });
    }

    // Security check: Ensure subscription belongs to the authenticated user
    if (subscription.user_id.toString() !== user_id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this subscription' });
    }

    // Update subscription with payment details
    subscription.razorpay_payment_id = razorpay_payment_id;
    subscription.razorpay_signature = razorpay_signature;
    subscription.status = 'completed';
    
    // Calculate end_date based on plan_type
    const startDate = new Date();
    let endDate = new Date();
    
    switch (subscription.plan_type) {
      case "pay_now":
        endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      case "3_months":
        endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
        break;
      case "6_months":
        endDate = new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days
        break;
      case "1_year":
        endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 days
        break;
    }
    
    subscription.end_date = endDate;
    subscription.is_active = true;
    subscription.start_date = startDate;
    
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      subscription: {
        id: subscription._id,
        plan_type: subscription.plan_type,
        status: subscription.status,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        is_active: subscription.is_active
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed', 
      error: error.message 
    });
  }
});

// Get user's active subscription
router.get('/user', verifyToken, async (req, res) => {
  try {
    const user_id = req.userId; // Get from verified token
    
    const subscription = await Subscription.findOne({
      user_id: user_id,
      is_active: true,
      end_date: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(200).json({ 
        has_active_subscription: false,
        message: 'No active subscription found' 
      });
    }

    res.status(200).json({
      has_active_subscription: true,
      subscription: subscription
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subscription', 
      error: error.message 
    });
  }
});

// Admin: list all subscriptions with user details
router.get('/all', isAdmin, async (req, res) => {
  try {
    const subs = await Subscription.find({})
      .sort({ createdAt: -1 })
      .populate('user_id', 'name email phone address role');

    res.status(200).json({
      success: true,
      subscriptions: subs
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
});

module.exports = router;

