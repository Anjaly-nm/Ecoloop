const mongoose = require('mongoose');
const fs = require('fs');
const User = require('./models/user/users');
const WasteSubmission = require('./models/user/wasteSubmissions');
const CollectorAssignment = require('./models/admin/collectorAssignment');

const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
    await mongoose.connect(MONGODB_URI);
    const akshaya = await User.findOne({ name: /Akshaya/i });

    const assignments = await CollectorAssignment.find({ collectorId: akshaya._id });
    const assignedWards = assignments.map(a => a.wardNumber);

    console.log('Akshaya assigned wards:', assignedWards);

    // Find submissions in these wards that are NOT assigned to her ID
    const submissionsInWards = await WasteSubmission.find({
        collector_id: { $ne: akshaya._id },
        status: { $nin: ['collected', 'rejected'] }
    }).populate('user_id');

    const relevantSubmissions = submissionsInWards.filter(s =>
        s.user_id && assignedWards.includes(String(s.user_id.wardNumber).trim())
    );

    console.log(`Found ${relevantSubmissions.length} unassigned/differently-assigned submissions in her wards.`);

    if (relevantSubmissions.length > 0) {
        fs.writeFileSync('unassigned_for_akshaya.txt', JSON.stringify(relevantSubmissions, null, 2));
    } else {
        fs.writeFileSync('unassigned_for_akshaya.txt', 'NONE FOUND');
    }

    process.exit(0);
}
run();
