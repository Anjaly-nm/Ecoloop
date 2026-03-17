const mongoose = require('mongoose');
const WasteSubmission = require('./models/user/wasteSubmissions');
const User = require('./models/user/users');
mongoose.connect('mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(async () => {
    const users = await User.find({ wardNumber: '9' });
    const uids = users.map(u => u._id);
    const subs = await WasteSubmission.find({ user_id: { $in: uids }, collector_id: null });
    console.log('UNASSIGNED_TOTAL_WARD9: ' + subs.length);
    sub_immed = subs.filter(s => s.is_immediate);
    console.log('UNASSIGNED_IMMEDIATE_WARD9: ' + sub_immed.length);
    process.exit(0);
});
