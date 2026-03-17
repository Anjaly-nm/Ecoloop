const mongoose = require('mongoose');
const CollectorAssignment = require('./models/admin/collectorAssignment');
const User = require('./models/user/users');

const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
    await mongoose.connect(MONGODB_URI);
    const assignments = await CollectorAssignment.find({ wardNumber: '9' });
    console.log(`Found ${assignments.length} assignments for Ward 9`);

    for (const a of assignments) {
        const c = await User.findById(a.collectorId);
        console.log(`Collector: ${c ? c.name : 'Unknown'} (ID: ${a.collectorId})`);
    }
    process.exit(0);
}
run();
