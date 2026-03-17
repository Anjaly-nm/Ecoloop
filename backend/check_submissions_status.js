const mongoose = require('mongoose');
const WasteSubmission = require('./models/user/wasteSubmissions');

async function check() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);

        const count = await WasteSubmission.countDocuments();
        console.log(`Total Submissions: ${count}`);

        const unassigned = await WasteSubmission.countDocuments({ collector_id: null });
        console.log(`Unassigned: ${unassigned}`);

        const assigned = await WasteSubmission.find({ collector_id: { $ne: null } }).select('collector_id status');
        console.log(`Assigned entries: ${assigned.length}`);

        // Count by collector_id
        const collectorCounts = {};
        assigned.forEach(a => {
            const cid = a.collector_id;
            collectorCounts[cid] = (collectorCounts[cid] || 0) + 1;
        });

        console.log('Collector counts (assigned id: count):');
        console.log(JSON.stringify(collectorCounts, null, 2));

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
