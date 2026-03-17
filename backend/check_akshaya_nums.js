const mongoose = require('mongoose');
const User = require('./models/user/users');
const WasteSubmission = require('./models/user/wasteSubmissions');
const CollectorAssignment = require('./models/admin/collectorAssignment');

async function check() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);

        const akshaya = await User.findOne({ name: /aksh/i });
        const assignments = await CollectorAssignment.find({ collectorId: akshaya._id });
        const wards = assignments.map(a => String(a.wardNumber));
        const usersInWards = await User.find({ wardNumber: { $in: wards } });
        const userIds = usersInWards.map(u => u._id);

        const unassigned = await WasteSubmission.countDocuments({
            user_id: { $in: userIds },
            collector_id: null
        });

        console.log('UNASSIGNED_TOTAL_IN_WARD_9_IS: ' + unassigned);
        console.log('AKSHAYA_ALREADY_HAS_TASKS_COUNT: ' + (await WasteSubmission.countDocuments({ collector_id: akshaya._id })));

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
