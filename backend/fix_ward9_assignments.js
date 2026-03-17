const mongoose = require('mongoose');
const WasteSubmission = require('./models/user/wasteSubmissions');
const User = require('./models/user/users');
const CollectorAssignment = require('./models/admin/collectorAssignment');

const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function fix() {
    await mongoose.connect(MONGODB_URI);

    // 1. Get current Ward 9 collector
    const assignment = await CollectorAssignment.findOne({ wardNumber: '9' });
    if (!assignment) {
        console.log('No collector assigned to Ward 9');
        process.exit(1);
    }

    const akshayaId = assignment.collectorId;
    console.log('Current Ward 9 Collector ID:', akshayaId);

    // 2. Find all active submissions in Ward 9
    const submissions = await WasteSubmission.find({
        status: { $nin: ['collected', 'rejected'] }
    }).populate('user_id');

    const ward9Active = submissions.filter(s =>
        s.user_id && String(s.user_id.wardNumber).trim() === '9'
    );

    console.log(`Found ${ward9Active.length} active submissions in Ward 9.`);

    for (const s of ward9Active) {
        if (!s.collector_id || s.collector_id.toString() !== akshayaId.toString()) {
            console.log(`Re-assigning submission ${s._id} from ${s.collector_id || 'nobody'} to Akshaya (${akshayaId})`);
            s.collector_id = akshayaId;
            s.status = 'approved'; // Ensure it's active
            await s.save();
        }
    }

    console.log('Fix complete.');
    process.exit(0);
}
fix();
