const mongoose = require('mongoose');
const fs = require('fs');
const User = require('./models/user/users');
const Category = require('./models/admin/category'); // Registered here
const CollectorAssignment = require('./models/admin/collectorAssignment');
const WasteSubmission = require('./models/user/wasteSubmissions');

const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
    await mongoose.connect(MONGODB_URI);
    const akshaya = await User.findOne({ name: /Akshaya/i });
    if (!akshaya) {
        fs.writeFileSync('akshaya_find.txt', 'NOT FOUND');
        process.exit(0);
    }

    // Find submissions assigned to her
    const assigned = await WasteSubmission.find({ collector_id: akshaya._id }).populate("category_id");

    // Find her ward assignments
    const wards = await CollectorAssignment.find({ collectorId: akshaya._id });

    const result = {
        user: akshaya,
        wards: wards,
        assignedSubmissions: assigned
    };

    fs.writeFileSync('akshaya_find.txt', JSON.stringify(result, null, 2));
    process.exit(0);
}
run();
