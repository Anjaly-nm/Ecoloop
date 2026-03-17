const mongoose = require('mongoose');
const User = require('./models/user/users');

async function check() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        const collectors = await User.find({ role: /collector/i });
        console.log(`Found ${collectors.length} collectors:`);
        collectors.forEach(c => {
            console.log(`- ID: ${c._id}, Name: ${c.name}, Role: ${c.role}`);
        });
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
