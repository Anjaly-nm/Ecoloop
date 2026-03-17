const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/user/users');

async function check() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        const collectorId = '68fb46a8895ba2c1a2de9938';
        const user = await User.findById(collectorId);
        if (!user) {
            console.log('Collector not found');
            process.exit(0);
        }
        console.log('Collector:', user.name, 'Role:', user.role);

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretKey');
        console.log('Generated Token:', token);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
