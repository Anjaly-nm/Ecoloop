const mongoose = require('mongoose');
const WasteSubmission = require('./models/user/wasteSubmissions');
const User = require('./models/user/users');
const CollectorAssignment = require('./models/admin/collectorAssignment');

async function fix() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);

        console.log('🔗 Fixing unassigned submissions...');
        const unassigned = await WasteSubmission.find({ collector_id: null });
        console.log(`Found ${unassigned.length} unassigned tasks.`);

        let fixedCount = 0;
        for (const sub of unassigned) {
            const user = await User.findById(sub.user_id);
            if (user && user.wardNumber) {
                const ward = String(user.wardNumber).trim();
                const assignment = await CollectorAssignment.findOne({ wardNumber: ward });
                if (assignment) {
                    await WasteSubmission.findByIdAndUpdate(sub._id, {
                        collector_id: assignment.collectorId,
                        status: 'approved',
                        pendingReason: 'Auto-assigned via fix script'
                    });
                    fixedCount++;
                }
            }
        }

        console.log(`✅ successfully assigned ${fixedCount} submissions to their ward collectors.`);
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
fix();
