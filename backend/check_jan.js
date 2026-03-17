const mongoose = require('mongoose');
const User = require('./models/user/users');

async function check() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);

        const jan = await User.findById('68d5147d26f80d678eefb683');
        // Wait, the ID in previous output was 68d5147d26f80d678eefb6831? No, 24 chars usually.
        // Let's find by name Jan.
        const janObj = await User.findOne({ name: /jan/i });
        console.log('Jan:', janObj);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
