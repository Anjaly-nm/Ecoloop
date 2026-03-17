const mongoose = require('mongoose');
const WasteSubmission = require('./backend/models/user/wasteSubmissions');
const User = require('./backend/models/user/users');
const CollectorAssignment = require('./backend/models/admin/collectorAssignment');

async function debug() {
    try {
        await mongoose.connect('mongodb://localhost:27017/ecoloop'); // Adjust URI if needed
        console.log('Connected to DB');

        const lastSubmission = await WasteSubmission.findOne().sort({ createdAt: -1 }).populate('user_id');
        if (!lastSubmission) {
            console.log('No submissions found');
            process.exit(0);
        }

        console.log('--- Last Submission Details ---');
        console.log('ID:', lastSubmission._id);
        console.log('Status:', lastSubmission.status);
        console.log('Pending Reason:', lastSubmission.pendingReason);
        console.log('User Ward:', lastSubmission.user_id?.wardNumber);
        console.log('Collector ID:', lastSubmission.collector_id);
        console.log('Is Immediate:', lastSubmission.is_immediate);

        if (lastSubmission.user_id?.wardNumber) {
            const assignment = await CollectorAssignment.findOne({
                wardNumber: String(lastSubmission.user_id.wardNumber).trim()
            });
            console.log('--- Collector Assignment for Ward ---');
            if (assignment) {
                console.log('Found Assignment:', assignment);

                // Check collector workload
                const activeTasks = await WasteSubmission.find({
                    collector_id: assignment.collectorId,
                    status: { $in: ["approved", "in-progress"] }
                });
                console.log('Active Tasks Count for this Collector:', activeTasks.length);

                activeTasks.forEach((t, i) => {
                    console.log(`Task ${i + 1} status: ${t.status}`);
                });

            } else {
                console.log('No collector assignment found for ward:', lastSubmission.user_id.wardNumber);
                const allAssignments = await CollectorAssignment.find();
                console.log('All available ward assignments:', allAssignments.map(a => a.wardNumber));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
