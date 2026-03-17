const mongoose = require('mongoose');
const WasteSubmission = require('./models/user/wasteSubmissions');
const User = require('./models/user/users');

async function check() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        const collectorId = '68cbdb7dc8d2a4a8153a95b2'; // jismi

        const pickups = await WasteSubmission.find({ collector_id: collectorId });
        console.log(`Found ${pickups.length} pickups for jismi`);
        pickups.forEach(p => {
            console.log(`- ID: ${p._id}, Status: ${p.status}, Date: ${p.scheduled_date}`);
        });

        const unassigned = await WasteSubmission.find({ collector_id: null });
        console.log(`\nUnassigned tasks: ${unassigned.length}`);
        for (const u of unassigned) {
            const user = await User.findById(u.user_id);
            console.log(`- ID: ${u._id}, UserID: ${u.user_id}, Ward: ${user?.wardNumber}`);
        }

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
