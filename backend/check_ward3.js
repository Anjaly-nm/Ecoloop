const mongoose = require('mongoose');
const WasteSubmission = require('./models/user/wasteSubmissions');

async function check() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);

        const ward3Subs = await WasteSubmission.find().populate('user_id');
        console.log('Ward 3 Submissions check:');
        ward3Subs.filter(s => s.user_id?.wardNumber == '3').forEach(s => {
            console.log(`- ID: ${s._id}, CollectorID: ${s.collector_id}, Status: ${s.status}`);
        });

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
