const mongoose = require('mongoose');
const Message = require('./models/user/message');
const User = require('./models/user/users');
const Order = require('./models/user/order');

mongoose.connect('mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function run() {
    try {
        const msgs = await Message.find().sort({ _id: -1 }).limit(5);
        console.log(`Found ${msgs.length} messages.`);
        for (let m of msgs) {
            console.log(`Msg: ${m.text} | OrderID: ${m.orderId}`);
            if (m.orderId) {
                const o = await Order.findById(m.orderId);
                console.log(`  -> Order Found: ${!!o}`);
                if (o) console.log(`  -> Order Status: ${o.status}`);
            }

            const s = await User.findById(m.sender);
            const r = await User.findById(m.recipient);
            console.log(`  -> Sender: ${s?.name}, Recipient: ${r?.name}`);
        }
    } catch (e) { console.log(e); }
    mongoose.disconnect();
}
run();
