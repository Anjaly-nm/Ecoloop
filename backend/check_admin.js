const mongoose = require('mongoose');
const User = require('./models/user/users');
require('dotenv').config();

const mongoURI = "mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

console.log("STARTING CHECK");

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("Connected to MongoDB. Querying users...");
        try {
            const admins = await User.find({ role: 'Admin' });
            console.log(`Found ${admins.length} admins.`);
            admins.forEach(admin => {
                console.log(`ADMIN FOUND: Name: ${admin.name}, Email: ${admin.email}, Role: ${admin.role}, ID: ${admin._id}`);
            });

            if (admins.length === 0) {
                console.log("No users found with role 'Admin'. Listing all users and their roles:");
                const allUsers = await User.find({}, 'name email role');
                console.log(`Total users found: ${allUsers.length}`);
                allUsers.forEach(u => console.log(`USER: ${u.name} | Role: ${u.role} | Email: ${u.email}`));
            }
        } catch (e) {
            console.error("ERROR QUERYING:", e);
        } finally {
            console.log("Disconnecting...");
            mongoose.disconnect();
            console.log("ENDING CHECK");
        }
    })
    .catch(err => console.error("Could not connect", err));
