const mongoose = require('mongoose');
const Message = require('./models/user/message');
const User = require('./models/user/users'); // Assuming path
const Order = require('./models/user/order'); // Assuming path

// Connect to DB
mongoose.connect('mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function debugMessages() {
    try {
        console.log('--- Debugging Messages ---');

        // 1. Fetch all messages
        const messages = await Message.find({}).sort({ createdAt: -1 }).limit(10);
        console.log(`Found ${messages.length} recent messages.`);

        for (const msg of messages) {
            console.log(`\nMsg ID: ${msg._id}`);
            console.log(`  Text: ${msg.text}`);
            console.log(`  Sender: ${msg.sender}`);
            console.log(`  Recipient: ${msg.recipient}`);
            console.log(`  OrderId: ${msg.orderId}`);

            // Check if Order exists
            if (msg.orderId) {
                const order = await Order.findById(msg.orderId);
                console.log(`  -> Order Exists? ${!!order}`);
                if (order) console.log(`     Order ID: ${order._id}`);
            } else {
                console.log('  -> OrderId is missing/null in the document');
            }

            // Check Sender
            const sender = await User.findById(msg.sender);
            console.log(`  -> Sender: ${sender ? sender.name : 'Not Found'} (${sender ? sender.role : 'N/A'})`);

            // Check Recipient
            const recipient = await User.findById(msg.recipient);
            console.log(`  -> Recipient: ${recipient ? recipient.name : 'Not Found'} (${recipient ? recipient.role : 'N/A'})`);
        }

    } catch (err) {
        console.error('Debug Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

debugMessages();
