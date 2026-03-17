const mongoose = require('mongoose');
const CollectorAssignment = require('./models/admin/collectorAssignment');

async function check() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        const allAssignments = await CollectorAssignment.find();
        console.log(`Found ${allAssignments.length} collector assignments:`);
        allAssignments.forEach(a => {
            console.log(`- Ward: ${a.wardNumber}, CollectorId: ${a.collectorId}`);
        });
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
