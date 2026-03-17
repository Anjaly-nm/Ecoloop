const mongoose = require('mongoose');
const fs = require('fs');
const User = require('./models/user/users');
const CollectorAssignment = require('./models/admin/collectorAssignment');
const WasteSubmission = require('./models/user/wasteSubmissions');

const MONGODB_URI = 'mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function debugAkshaya() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        await mongoose.connect(MONGODB_URI);
        log('Connected to DB');

        // 1. Find Akshaya
        const akshaya = await User.findOne({ name: /Akshaya/i });
        if (!akshaya) {
            log('Collector Akshaya not found by name.');
            const allCollectors = await User.find({ role: 'collector' });
            log('All collectors: ' + JSON.stringify(allCollectors.map(c => ({ name: c.name, id: c._id })), null, 2));
            fs.writeFileSync('debug_output.txt', output);
            return;
        }

        log(`Found Collector: ${akshaya.name} (ID: ${akshaya._id})`);

        // 2. Find her Ward Assignments
        const assignments = await CollectorAssignment.find({ collectorId: akshaya._id });
        const assignedWards = assignments.map(a => a.wardNumber);
        log(`Assigned Wards: ${assignedWards.join(', ')}`);

        // 3. Find Waste Submissions assigned to her specifically
        const directPickups = await WasteSubmission.find({ collector_id: akshaya._id });
        log(`Directly assigned pickups (collector_id matches): ${directPickups.length}`);
        if (directPickups.length > 0) {
            log('Sample direct pickup states: ' + JSON.stringify(directPickups.slice(0, 3).map(p => ({ id: p._id, status: p.status, date: p.createdAt })), null, 2));
        }

        // 4. Find Waste Submissions in her wards that are NOT assigned to her (or anyone)
        const submissionsInWards = await WasteSubmission.find({
            wardNumber: { $in: assignedWards },
            status: { $ne: 'collected' }
        });
        log(`Submissions in her wards (any status except collected): ${submissionsInWards.length}`);

        const unassignedInWards = submissionsInWards.filter(s => !s.collector_id);
        log(`Unassigned submissions in her wards: ${unassignedInWards.length}`);

        const assignedToOthersInWards = submissionsInWards.filter(s => s.collector_id && s.collector_id.toString() !== akshaya._id.toString());
        log(`Submissions in her wards assigned to SOMEONE ELSE: ${assignedToOthersInWards.length}`);
        if (assignedToOthersInWards.length > 0) {
            const otherIds = [...new Set(assignedToOthersInWards.map(s => s.collector_id.toString()))];
            log(`Other Collectors responsible: ${otherIds.join(', ')}`);

            const otherCollectors = await User.find({ _id: { $in: otherIds } });
            log(`Other Collector names: ${otherCollectors.map(c => c.name).join(', ')}`);
        }

        fs.writeFileSync('debug_output.txt', output);
        process.exit(0);
    } catch (err) {
        console.error(err);
        fs.writeFileSync('debug_output.txt', output + '\nERROR: ' + err.message);
        process.exit(1);
    }
}

debugAkshaya();
