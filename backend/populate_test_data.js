const mongoose = require('mongoose');
const User = require('./models/user/users');
const Order = require('./models/user/order');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecoloop')
  .then(async () => {
    console.log('Connected to MongoDB');

    try {
      // Create delivery boys
      const passwordHash = await bcrypt.hash('password123', 10);
      
      const deliveryBoy1 = await User.create({
        name: 'John Delivery',
        username: 'johndelivery',
        email: 'john@delivery.com',
        password: passwordHash,
        phone: '1234567890',
        address: '123 Delivery St',
        role: 'delivery-boy',
        wardNumber: 'Ward 1'
      });

      const deliveryBoy2 = await User.create({
        name: 'Jane Delivery',
        username: 'janedelivery',
        email: 'jane@delivery.com',
        password: passwordHash,
        phone: '0987654321',
        address: '456 Delivery Ave',
        role: 'delivery-boy',
        wardNumber: 'Ward 2'
      });

      console.log('Created delivery boys:', deliveryBoy1.name, deliveryBoy2.name);

      // Create a regular user for orders
      const regularUser = await User.create({
        name: 'Test User',
        username: 'testuser',
        email: 'test@user.com',
        password: passwordHash,
        phone: '1112223333',
        address: '789 Test Rd',
        role: 'user',
        wardNumber: 'Ward 3'
      });

      // Create a test order
      const order = await Order.create({
        userId: regularUser._id,
        items: [{
          productId: null,
          name: 'Test Product',
          price: 100,
          quantity: 1,
          image: 'test.jpg'
        }],
        totalAmount: 100,
        shippingAddress: {
          phone: '1234567890',
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        },
        status: 'pending',
        deliveryStatus: 'pending'
      });

      console.log('Created test order:', order._id);

      // Create another order with 'ready' status
      const order2 = await Order.create({
        userId: regularUser._id,
        items: [{
          productId: null,
          name: 'Another Product',
          price: 200,
          quantity: 2,
          image: 'another.jpg'
        }],
        totalAmount: 400,
        shippingAddress: {
          phone: '1234567890',
          address: '456 Another St',
          city: 'Another City',
          state: 'Another State',
          pincode: '654321'
        },
        status: 'ready',
        deliveryStatus: 'pending'
      });

      console.log('Created second test order:', order2._id);

      console.log('Test data created successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Error creating test data:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });