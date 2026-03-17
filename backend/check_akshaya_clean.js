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
        console.log('Assignments Ward(s):', assignments.map(a => a.wardNumber));

        const subs = await WasteSubmission.find({ collector_id: akshaya._id }).lean();
        console.log('Total submissions assigned to Akshaya:', subs.length);

        const statusCounts = {};
        subs.forEach(s => {
            statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
        });
        console.log('Status breakdown:', statusCounts);

        if (subs.length > 0) {
            console.log('Sample submission:', JSON.stringify(subs[0], null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
