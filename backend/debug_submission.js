const mongoose = require('mongoose');
const WasteSubmission = require('./models/user/wasteSubmissions');
const User = require('./models/user/users');
const CollectorAssignment = require('./models/admin/collectorAssignment');

async function debug() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
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
            const wardToSearch = String(lastSubmission.user_id.wardNumber).trim();
            const assignment = await CollectorAssignment.findOne({
                wardNumber: wardToSearch
            });
            console.log('--- Collector Assignment for Ward:', wardToSearch, '---');
            if (assignment) {
                console.log('Found Assignment for collectorId:', assignment.collectorId);

                // Check collector workload
                const activeTasks = await WasteSubmission.find({
                    collector_id: assignment.collectorId,
                    status: { $in: ["approved", "in-progress"] }
                });
                console.log('Active Tasks Count for this Collector:', activeTasks.length);

                for (const t of activeTasks) {
                    const fullTask = await WasteSubmission.findById(t._id).populate('user_id');
                    const taskWard = fullTask.user_id?.wardNumber || "Unknown";
                    console.log(`- Task ID: ${t._id}, status: ${t.status}, Ward: ${taskWard}`);
                }

            } else {
                console.log('No collector assignment found for ward:', wardToSearch);
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
