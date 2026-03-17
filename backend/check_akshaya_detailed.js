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

        console.log('--- AKSHAYA INFO ---');
        console.log('ID:', akshaya._id);
        console.log('Name:', akshaya.name);

        const assignments = await CollectorAssignment.find({ collectorId: akshaya._id });
        const wards = assignments.map(a => String(a.wardNumber));
        console.log('Assigned Wards:', wards);

        const usersInWards = await User.find({ wardNumber: { $in: wards } });
        const userIds = usersInWards.map(u => u._id);

        const unassigned = await WasteSubmission.find({
            user_id: { $in: userIds },
            collector_id: null
        }).populate('user_id', 'name wardNumber');

        console.log('--- RESULTS ---');
        console.log(`Unassigned submissions in Ward ${wards.join(', ')}:`, unassigned.length);

        const assignedToOthers = await WasteSubmission.find({
            user_id: { $in: userIds },
            collector_id: { $exists: true, $ne: null, $ne: akshaya._id }
        }).populate('user_id', 'name wardNumber').populate('collector_id', 'name');

        console.log(`Submissions in Ward ${wards.join(', ')} assigned to OTHERS:`, assignedToOthers.length);

        const assignedToAkshaya = await WasteSubmission.find({ collector_id: akshaya._id });
        console.log('Submissions ALREADY assigned to Akshaya:', assignedToAkshaya.length);
        console.log('Statuses of Akshaya tasks:', assignedToAkshaya.map(s => s.status).reduce((acc, s) => {
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {}));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
