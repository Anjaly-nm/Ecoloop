const mongoose = require('mongoose');
const User = require('./models/user/users');
const CollectorAssignment = require('./models/admin/collectorAssignment');

async function test() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);

        const count = await CollectorAssignment.countDocuments();
        console.log('Total assignments in DB:', count);

        const assignments = await CollectorAssignment.find().populate('collectorId', 'name');
        console.log('Assignments:', JSON.stringify(assignments, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
