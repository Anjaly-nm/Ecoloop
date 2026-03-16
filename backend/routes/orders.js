const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { isAdmin } = require('../middlewares/middleware');
const DeliveryBoyAssignment = require('../models/admin/deliveryBoyAssignment'); // Import Assignment Model

const JWT_SECRET = process.env.JWT_SECRET || 'secretKey';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxxxxxx', // Replace with your Razorpay Key ID
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_secret_key' // Replace with your Razorpay Key Secret
});

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

// Create Razorpay order for shop items
router.post('/create-order', verifyToken, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    const user_id = req.userId; // Get from verified token

    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise (Razorpay uses smallest currency unit)
      currency: currency,
      receipt: receipt || `order_${Date.now()}`,
      notes: {
        user_id: user_id.toString(),
        order_type: 'shop_order'
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
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

// Verify payment for shop orders
router.post('/verify-payment', verifyToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

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

    // Payment verified successfully
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully'
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

// Save order to database
const Order = require('../models/user/order');

router.post('/save-order', verifyToken, async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      status,
      deliveryStatus,
      tracking
    } = req.body;

    const newOrder = new Order({
      userId: req.userId,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      status,
      deliveryStatus,
      tracking
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Order saved successfully',
      order: savedOrder
    });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save order',
      error: error.message
    });
  }
});

// Get orders for a specific seller
router.get('/seller', verifyToken, async (req, res) => {
  try {
    console.log('Fetching orders for seller ID:', req.userId);

    // First, get the seller's products
    const products = await require('../models/admin/product').find({
      seller_id: req.userId
    });

    console.log('Found products for seller:', products.length);
    const productIds = products.map(product => product._id);

    console.log('Product IDs to search for in orders:', productIds);

    // Find orders that contain these products
    const orders = await Order.find({
      'items.productId': { $in: productIds }
    })
      .populate('userId', 'name email phone address houseNumber wardNumber')
      .populate('items.productId', 'name image seller_id')
      .populate('deliveryBoyId', 'name phone')
      .sort({ createdAt: -1 });

    console.log('Found orders for seller:', orders.length);
    if (orders.length > 0) {
      console.log('First order ID:', orders[0]._id);
      console.log('First order items:', JSON.stringify(orders[0].items));
    } else {
      console.log('No orders found matching the product IDs.');
    }

    res.status(200).json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get all orders (Admin only)
router.get('/all', isAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email phone')
      .populate('items.productId', 'name image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get pending orders for delivery assignment (Admin only)
router.get('/pending-delivery', isAdmin, async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['pending', 'processing', 'ready', 'confirmed'] },
      $or: [
        { deliveryBoyId: { $exists: false } },
        { deliveryBoyId: null },
        { deliveryBoyId: undefined }
      ]
    })
      .populate('userId', 'name email phone wardNumber')
      .populate('items.productId', 'name image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending orders',
      error: error.message
    });
  }
});

// Assign order to delivery boy
router.post('/assign-delivery-boy/:orderId', isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryBoyId } = req.body;

    // Find the order and update it with the delivery boy assignment
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'assigned',
        deliveryBoyId: deliveryBoyId,
        assignedAt: new Date()
      },
      { new: true } // Return updated document
    ).populate('userId', 'name email phone wardNumber')
      .populate('items.productId', 'name image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order assigned to delivery boy successfully',
      order: order
    });
  } catch (error) {
    console.error('Error assigning order to delivery boy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign order to delivery boy',
      error: error.message
    });
  }
});

// ⭐ NEW ROUTE: Update status (Trigger Automatic Assignment)
router.put('/update-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // 1. Fetch current order to get Ward info
    const order = await Order.findById(orderId).populate('userId', 'wardNumber');
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    let updates = { status, updatedAt: new Date() };

    // Sync with deliveryStatus and handle naming differences
    if (status === 'delivered') {
      updates.deliveryStatus = 'delivered';
    } else if (status === 'in-transit' || status === 'in_transit') {
      updates.deliveryStatus = 'in_transit';
      updates.status = 'shipped'; // Map to a valid main status if possible
    } else if (status === 'pending') {
      updates.deliveryStatus = 'pending';
    }

    let autoMsg = "";

    // 2. ⭐ AUTOMATIC ASSIGNMENT LOGIC
    // If status becomes 'ready' AND it's not already assigned
    if (status === 'ready' && !order.deliveryBoyId) {
      const wardNumber = order.userId?.wardNumber;
      if (wardNumber) {
        // Check if there is a recurring assignment for this ward
        const assignment = await DeliveryBoyAssignment.findOne({ wardNumber: String(wardNumber) });

        if (assignment && assignment.deliveryBoyId) {
          updates.deliveryBoyId = assignment.deliveryBoyId;
          updates.status = 'assigned'; // Auto-move to assigned
          updates.assignedAt = new Date();
          autoMsg = ` (Auto-assigned to Delivery Boy ID: ${assignment.deliveryBoyId})`;
          console.log(`[AUTO-ASSIGN] Order ${orderId} in Ward ${wardNumber} assigned to ${assignment.deliveryBoyId}`);
        }
      }
    }

    // 3. Perform Update
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updates,
      { new: true }
    ).populate('userId', 'name email phone wardNumber')
      .populate('items.productId', 'name image');

    res.status(200).json({
      success: true,
      message: `Order status updated to ${updatedOrder.status}${autoMsg}`,
      order: updatedOrder
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
});

// ⭐ NEW ROUTE: Get My Deliveries (For Delivery Boy)
router.get('/my-deliveries', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ deliveryBoyId: req.userId })
      .populate('userId', 'name email phone wardNumber address') // Populate User (customer) details
      .populate({
        path: 'items.productId',
        select: 'name image seller_id',
        populate: {
          path: 'seller_id',
          select: 'name email phone'
        }
      }) // Populate product details AND seller details
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      deliveries: orders // Using 'deliveries' key to match frontend expectation
    });
  } catch (error) {
    console.error("Error fetching my deliveries:", error);
    res.status(500).json({ message: "Failed to fetch deliveries", error: error.message });
  }
});

// ⭐ NEW ROUTE: Get My Orders (For User)
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .populate('items.productId', 'name image') // Populate product details
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error("Error fetching my orders:", error);
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
});

module.exports = router;