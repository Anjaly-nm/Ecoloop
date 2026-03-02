const mongoose = require('mongoose');
const User = require('../models/user/users');
const SellerApplication = require('../models/user/sellerApplications');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb+srv://anjalinm03:anjaly2003@cluster0.pjjiizq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
});

// Add this to resolve the deprecation warning
mongoose.set('strictQuery', false);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Find all users and group by email to identify duplicates
    const users = await User.aggregate([
      {
        $group: {
          _id: '$email',
          count: { $sum: 1 },
          userIds: { $push: '$_id' },
          usernames: { $push: '$username' },
          roles: { $push: '$role' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`Found ${users.length} email addresses with duplicates:`);

    for (const userGroup of users) {
      console.log(`\nEmail: ${userGroup._id}`);
      console.log(`Count: ${userGroup.count}`);
      console.log(`User IDs: ${userGroup.userIds.join(', ')}`);
      console.log(`Usernames: ${userGroup.usernames.join(', ')}`);
      console.log(`Roles: ${userGroup.roles.join(', ')}`);

      // For each duplicate, we'll keep the first one and remove the rest
      // But first, let's check if any of these users have seller applications
      for (let i = 1; i < userGroup.userIds.length; i++) {
        const userId = userGroup.userIds[i];
        const user = await User.findById(userId);
        
        // Find any seller applications associated with this user's email
        const applications = await SellerApplication.find({ email: userGroup._id });
        console.log(`Applications found for this email: ${applications.length}`);
        
        if (applications.length > 0) {
          console.log(`  Updating ${applications.length} applications to reference existing user`);
          // Update applications to reference the first user (which we'll keep)
          const firstUserId = userGroup.userIds[0];
          for (const app of applications) {
            // We don't need to update the application since it references email, not user ID
            console.log(`  Application ${app._id} already linked to email ${userGroup._id}`);
          }
        }
        
        // Remove the duplicate user
        console.log(`  Removing duplicate user: ${userId}`);
        await User.findByIdAndDelete(userId);
      }
      
      console.log(`  Kept user: ${userGroup.userIds[0]}`);
    }

    // Also check for applications with emails that don't have corresponding users
    const applications = await SellerApplication.find({});
    console.log(`\nChecking ${applications.length} applications for missing users...`);

    for (const app of applications) {
      const userExists = await User.exists({ email: app.email });
      if (!userExists && app.status === 'Approved') {
        console.log(`\nFound approved application without corresponding user:`);
        console.log(`  Application ID: ${app._id}`);
        console.log(`  Email: ${app.email}`);
        console.log(`  Organization: ${app.organizationName}`);
        console.log(`  This application was approved but no user was created. You may want to re-approve it.`);
      }
    }

    console.log('\nCleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
});