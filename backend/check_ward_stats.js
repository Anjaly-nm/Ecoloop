const mongoose = require('mongoose');
const WasteSubmission = require('./models/user/wasteSubmissions');
const User = require('./models/user/users');

async function check() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);

        const subs = await WasteSubmission.find().populate('user_id');
        const wardStats = {};

        subs.forEach(s => {
            const ward = s.user_id?.wardNumber || 'Unknown';
            if (!wardStats[ward]) wardStats[ward] = { total: 0, assigned: 0, unassigned: 0 };
            wardStats[ward].total++;
            if (s.collector_id) wardStats[ward].assigned++;
            else wardStats[ward].unassigned++;
        });

        console.log('Submission Stats by Ward:');
        console.log(JSON.stringify(wardStats, null, 2));

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
