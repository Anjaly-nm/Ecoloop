const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user/users');
const CollectorApplications = require('../models/collector/collectorapplications'); 
const emailhelp = require('../control/emailhelp');

// --- Helper Functions ---
const generateUsername = async (email) => {
    let base = email.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '');
    let finalUsername = base;
    let counter = 0;
    while (await User.findOne({ username: finalUsername })) {
        counter++;
        finalUsername = `${base}${counter}`;
    }
    return finalUsername;
};

const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
};

// ----------------------------------------------------
// 1. APPROVE COLLECTOR APPLICATION ROUTE
// ----------------------------------------------------
router.post('/approve-application/:applicationId', async (req, res) => {
    const applicationId = req.params.applicationId;
    let newUser = null; // Variable to hold the user object for potential cleanup

    try {
        // 1. Retrieve the pending application
        const application = await CollectorApplications.findById(applicationId); 

        if (!application) return res.status(404).json({ message: 'Collector application not found' });
        
        // Check if application is already approved
        if (application.status?.toLowerCase() === 'approved') {
             return res.status(400).json({ message: 'Application is already approved' });
        }
        
        // 2. Check if a user with this email already exists
        const existingUser = await User.findOne({ email: application.email });
        if (existingUser) {
            return res.status(409).json({ message: 'A User account already exists with this email address. Manual action required.' });
        }

        // 3. Generate credentials
        const newUsername = await generateUsername(application.email);
        const rawPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        
        // 4. Create the new User document
        newUser = new User({
            name: application.name, email: application.email, phone: application.phone, address: application.address,
            // Assuming houseNumber/wardNumber are available on the application object
            houseNumber: application.houseNumber, wardNumber: application.wardNumber,
            role: 'collector', 
            username: newUsername, 
            password: hashedPassword, 
        });

        // Save the new user first
        await newUser.save(); 

        // 5. ⭐ ATOMIC UPDATE: Update the application's status to "Approved"
        // This is where the status change is guaranteed.
        const updatedApplication = await CollectorApplications.findByIdAndUpdate(
            applicationId,
            { status: 'Approved' },
            { new: true, runValidators: true } // Return the updated document & run schema validators
        );
        
        // 🚨 CRITICAL CHECK: Verify the status update succeeded
        if (!updatedApplication) {
            // Log this severe error for manual review and delete the created user
            console.error(`ERROR: Status update failed for application ${applicationId} after user creation. Deleting new user.`);
            await newUser.deleteOne(); // Rollback the user creation
            return res.status(500).json({ message: 'Internal error: Failed to update application status. User creation rolled back.' });
        }

        // 6. Send success email with credentials
        await emailhelp.sendTextEmail(
            newUser.email, 'Congratulations! Your Collector Application is Approved',
            `Hello ${newUser.name},\n\nYour application has been approved!
            Username: ${newUsername}\nTemporary Password: ${rawPassword}\n\n
            Please log in and change your password immediately.`
        );

        // 7. Send the final response (returning the new status is key for frontend)
        res.status(200).json({ 
            message: 'Collector user created and application approved.',
            userId: newUser._id, 
            username: newUsername,
            application: updatedApplication, // ⭐ Return the fully updated object
        });

    } catch (err) {
        console.error(err);
        
        // Check if the error occurred during user creation (Step 4)
        if (newUser && err.name === 'MongoServerError' && err.code === 11000) {
            // Duplicate key error on User (rare if generateUsername is good, but possible)
            return res.status(409).json({ message: 'Duplicate user creation error. Try again.', details: err.message });
        } else if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed during process.', details: err.errors });
        }
        
        res.status(500).json({ message: 'Server error during approval process' });
    }
});

// ----------------------------------------------------
// 2. GET PENDING COLLECTOR APPLICATIONS ROUTE
// ----------------------------------------------------
router.get('/collector-applications', async (req, res) => {
    try {
        // Ensure this endpoint is where the frontend gets its list.
        // It correctly filters by the 'status' field.
        const pendingApplications = await CollectorApplications.find({ status: 'Pending' }) 
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: pendingApplications.length,
            applications: pendingApplications
        });

    } catch (err) {
        console.error("Error fetching collector applications:", err);
        res.status(500).json({ message: 'Failed to retrieve applications', error: err.message });
    }
});

// ... (other routes)

module.exports = router;