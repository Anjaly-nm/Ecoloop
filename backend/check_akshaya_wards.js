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

        console.log('Collector:', akshaya.name, akshaya._id);

        const assignments = await CollectorAssignment.find({ collectorId: akshaya._id });
        const wards = assignments.map(a => String(a.wardNumber));
        console.log('Akshaya assigned to wards:', wards);

        // Find users in these wards
        const usersInWards = await User.find({ wardNumber: { $in: wards } }).select('_id name wardNumber');
        const userIds = usersInWards.map(u => u._id);
        console.log(`Found ${userIds.length} users in these wards.`);

        // Find submissions from these users that are NOT assigned to Akshaya
        const otherSubs = await WasteSubmission.find({
            user_id: { $in: userIds },
            collector_id: { $ne: akshaya._id }
        }).populate('user_id', 'name wardNumber');

        console.log(`Found ${otherSubs.length} submissions in Akshaya's wards NOT assigned to her.`);

        otherSubs.forEach(s => {
            console.log(`- Sub ID: ${s._id}, Status: ${s.status}, Current Collector: ${s.collector_id}, User Ward: ${s.user_id?.wardNumber}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
