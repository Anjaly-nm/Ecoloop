const mongoose = require('mongoose');
const User = require('./models/user/users');

mongoose.connect('mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log("Connected to DB");
    const admins = await User.find({ role: { $in: ['Admin', 'admin'] } });
    console.log("Admins found:", admins.length);
    admins.forEach(a => {
        console.log(`Admin ${a.name} (${a.email}): fcmToken='${a.fcmToken}'`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
