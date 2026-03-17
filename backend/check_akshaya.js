const mongoose = require('mongoose');
const User = require('./models/user/users');
const WasteSubmission = require('./models/user/wasteSubmissions');
const CollectorAssignment = require('./models/admin/collectorAssignment');

async function check() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);

        const akshaya = await User.findOne({ name: /aksh/i });
        if (!akshaya) {
            console.log('Collector Akshaya not found');
            process.exit(0);
        }

        console.log('Collector Details:', JSON.stringify(akshaya, null, 2));

        const assignments = await CollectorAssignment.find({ collectorId: akshaya._id });
        console.log('Ward Assignments:', JSON.stringify(assignments, null, 2));

        const directSubmissions = await WasteSubmission.find({ collector_id: akshaya._id });
        console.log('Direct Submissions count:', directSubmissions.length);
        console.log('Direct Submissions statuses:', directSubmissions.map(s => s.status));

        const autoSubmissionsInWard = [];
        for (const assign of assignments) {
            // Check if there are unassigned submissions in the ward (though they should be auto-assigned now)
            // Or maybe they are assigned but not showing.
            const wardSubs = await WasteSubmission.find({ collector_id: akshaya._id });
            // Wait, I already checked directSubmissions.
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
