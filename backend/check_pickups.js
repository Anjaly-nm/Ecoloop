const mongoose = require('mongoose');
const WasteSubmission = require('./models/user/wasteSubmissions');

async function check() {
    try {
        const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(MONGODB_URI);
        const collectorId = '68fb46a8895ba2c1a2de9938';

        const pickups = await WasteSubmission.find({ collector_id: collectorId });
        console.log(`Found ${pickups.length} pickups for collector ${collectorId}`);
        pickups.forEach(p => console.log(`- ID: ${p._id}, Status: ${p.status}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
