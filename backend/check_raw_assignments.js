const mongoose = require('mongoose');
const CollectorAssignment = require('./models/admin/collectorAssignment');

async function check() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);

        const assignments = await CollectorAssignment.find().lean();
        console.log(JSON.stringify(assignments, null, 2));

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
