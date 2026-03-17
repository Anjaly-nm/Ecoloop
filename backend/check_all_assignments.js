const mongoose = require('mongoose');
const CollectorAssignment = require('./models/admin/collectorAssignment');
const User = require('./models/user/users');

async function check() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);

        const assignments = await CollectorAssignment.find().populate('collectorId');
        console.log('--- Current Ward Assignments ---');
        assignments.forEach(a => {
            console.log(`Ward: ${a.wardNumber}, Collector: ${a.collectorId?.name || 'Unknown'} (ID: ${a.collectorId?._id})`);
        });

        const allCollectors = await User.find({ role: /collector/i });
        console.log('\n--- All Collectors ---');
        allCollectors.forEach(c => {
            console.log(`Name: ${c.name}, ID: ${c._id}`);
        });

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
