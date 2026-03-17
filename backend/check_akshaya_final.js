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

        const assignments = await CollectorAssignment.find({ collectorId: akshaya._id });
        const wards = assignments.map(a => String(a.wardNumber));

        const usersInWards = await User.find({ wardNumber: { $in: wards } });
        const userIds = usersInWards.map(u => u._id);

        const unassigned = await WasteSubmission.countDocuments({
            user_id: { $in: userIds },
            collector_id: null
        });

        const assignedToOthers = await WasteSubmission.countDocuments({
            user_id: { $in: userIds },
            collector_id: { $exists: true, $ne: null, $ne: akshaya._id }
        });

        const assignedToAkshaya = await WasteSubmission.countDocuments({ collector_id: akshaya._id });

        const akshayaTasks = await WasteSubmission.find({ collector_id: akshaya._id });
        const stats = akshayaTasks.reduce((acc, s) => {
            acc[s.status] = (acc[s.status] || 0) + 1;
            return acc;
        }, {});

        console.log(`AKSHAYA_ID: ${akshaya._id}`);
        console.log(`WARDS: ${wards.join(',')}`);
        console.log(`UNASSIGNED_COUNT: ${unassigned}`);
        console.log(`OTHER_COLLECTOR_COUNT: ${assignedToOthers}`);
        console.log(`AKSHAYA_ASSIGNED_COUNT: ${assignedToAkshaya}`);
        console.log(`AKSHAYA_STATS: ${JSON.stringify(stats)}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
