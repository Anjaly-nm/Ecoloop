const mongoose = require('mongoose');
const WasteSubmission = require('./models/user/wasteSubmissions');
const User = require('./models/user/users');
const CollectorAssignment = require('./models/admin/collectorAssignment');

async function fix() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);

        console.log('🔗 Detailed FIX process starting...');
        const unassigned = await WasteSubmission.find({ collector_id: null });
        console.log(`Found ${unassigned.length} unassigned tasks.`);

        let fixedCount = 0;
        for (const sub of unassigned) {
            const user = await User.findById(sub.user_id);
            if (!user) {
                console.log(`- Task ${sub._id}: User not found (uid: ${sub.user_id})`);
                continue;
            }
            if (!user.wardNumber) {
                console.log(`- Task ${sub._id}: User ${user.name} has no wardNumber`);
                continue;
            }

            const ward = String(user.wardNumber).trim();
            const assignment = await CollectorAssignment.findOne({ wardNumber: ward });
            if (assignment) {
                console.log(`- Task ${sub._id}: Assigning to Ward ${ward} collector (${assignment.collectorId})`);
                await WasteSubmission.findByIdAndUpdate(sub._id, {
                    collector_id: assignment.collectorId,
                    status: 'approved',
                    pendingReason: 'Manual fix script run'
                });
                fixedCount++;
            } else {
                console.log(`- Task ${sub._id}: No collector assigned to Ward ${ward}`);
            }
        }

        console.log(`\n✅ Summary: Fixed ${fixedCount} tasks.`);
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
fix();
