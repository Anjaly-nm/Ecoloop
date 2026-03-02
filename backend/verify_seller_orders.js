const mongoose = require('mongoose');
const User = require('./models/user/users');
const Product = require('./models/admin/product');
const Order = require('./models/user/order');
require('dotenv').config();

const verifyData = async () => {
    try {
        await mongoose.connect('mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to DB');

        // 1. Find all sellers
        // Assuming role 'seller' or similar. Let's check distinct roles first if possible, or just look for users who have products.
        // Or just find all users and filter by having products might be safer?
        // Let's rely on 'role' field if it exists, or check 'products' collection 'seller_id' field.

        // Get all unique seller_ids from products
        const sellerIds = await Product.distinct('seller_id');
        console.log(`Found ${sellerIds.length} unique sellers in Products collection.`);

        for (const sellerId of sellerIds) {
            if (!sellerId) {
                console.log('Found products with NULL seller_id!');
                continue;
            }

            const seller = await User.findById(sellerId);
            const sellerName = seller ? seller.name : 'Unknown/Deleted User';
            const sellerEmail = seller ? seller.email : 'N/A';
            console.log(`\n--------------------------------------------------`);
            console.log(`Seller: ${sellerName} (ID: ${sellerId}) - ${sellerEmail}`);

            // 2. Get products validation
            const products = await Product.find({ seller_id: sellerId });
            console.log(`Products owned: ${products.length}`);
            const productIds = products.map(p => p._id);

            if (products.length > 0) {
                // console.log('Sample Product IDs:', productIds.slice(0, 3));
            }

            // 3. Find orders for these products
            const orders = await Order.find({ 'items.productId': { $in: productIds } });
            console.log(`Orders found for this seller's products: ${orders.length}`);

            if (orders.length > 0) {
                console.log('Sample Order IDs:', orders.slice(0, 3).map(o => o._id));
                // Check items in the first order
                const sampleOrder = orders[0];
                const relevantItems = sampleOrder.items.filter(item =>
                    productIds.some(pid => pid.toString() === item.productId?.toString())
                );
                console.log(`Sample Order ${sampleOrder._id} has ${relevantItems.length} items from this seller.`);
            } else {
                // Debug: Check if ANY orders exist at all?
                const allOrders = await Order.countDocuments();
                if (allOrders === 0) {
                    console.log('DEBUG: No orders exist in the entire database!');
                } else {
                    // Maybe products are not matching?
                    console.log('DEBUG: Orders exist in DB but none match these products.');
                }
            }
        }

        // Also check for Products with no seller_id
        const orphanProducts = await Product.countDocuments({ seller_id: null });
        console.log(`\nProducts with NO seller_id: ${orphanProducts}`);

        if (orphanProducts > 0) {
            const orphanProductIds = (await Product.find({ seller_id: null }).limit(100)).map(p => p._id);
            const orphanOrders = await Order.find({ 'items.productId': { $in: orphanProductIds } });
            console.log(`Orders linked to orphan products: ${orphanOrders.length}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
};

verifyData();
