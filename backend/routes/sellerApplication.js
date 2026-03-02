const express = require("express");
const router = express.Router();
const SellerApplication = require("../models/user/sellerApplications");
const User = require("../models/user/users");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const gmailConfig = require("../utils/config/config.gmail.env");
require('dotenv').config();

// Helper function to validate Aadhar number format (mock validation)
const validateAadhar = (aadharNumber) => {
  // Basic Aadhar format validation (12 digits)
  const aadharRegex = /^\d{12}$/;
  return aadharRegex.test(aadharNumber);
};

// Helper function to validate License number format (mock validation)
const validateLicense = (licenseNumber) => {
  // Basic license validation (at least 5 characters)
  return licenseNumber && licenseNumber.length >= 5;
};

// Helper function to generate random password
const generateRandomPassword = (length = 10) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

// Helper function to generate username
const generateUsername = async (orgName) => {
  // Create username from organization name
  const cleanName = orgName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  const baseUsername = `${cleanName}${randomNumber}`;
  
  // Check if username already exists, if so, generate a new one
  let username = baseUsername;
  let counter = 1;
  
  while (await User.exists({ username: username })) {
    username = `${cleanName}${randomNumber}${counter}`;
    counter++;
  }
  
  return username;
};

// Configure nodemailer transporter with Gmail OAuth2
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: gmailConfig.emailId,
    clientId: gmailConfig.ClientID,
    clientSecret: gmailConfig.Client_secret,
    refreshToken: gmailConfig.refresh_token
  }
});

// Apply as seller
router.post("/apply-seller", async (req, res) => {
  try {
    const {
      organizationName,
      organizationType,
      registrationNumber,
      yearOfEstablishment,
      website,
      contactPerson,
      email,
      phone,
      address,
      wasteTypesProcessed,
      processingCapacity,
      wasteCollectionService,
      fertilizerProducts,
      aadharNumber, // ✅ Changed from gstNumber to aadharNumber
      licenseNumber,
      governmentIdType
    } = req.body;

    // Auto-verify government IDs
    let verificationStatus = "Pending";
    let verificationDetails = "";
    
    if (governmentIdType === "Aadhar" && aadharNumber) { // ✅ Changed from GST to Aadhar
      if (validateAadhar(aadharNumber)) { // ✅ Changed from validateGST to validateAadhar
        verificationStatus = "Verified";
        verificationDetails = "Aadhar number format verified"; // ✅ Updated message
      } else {
        verificationStatus = "Rejected";
        verificationDetails = "Invalid Aadhar number format"; // ✅ Updated message
      }
    } else if (governmentIdType === "License" && licenseNumber) {
      if (validateLicense(licenseNumber)) {
        verificationStatus = "Verified";
        verificationDetails = "License number format verified";
      } else {
        verificationStatus = "Rejected";
        verificationDetails = "Invalid License number format";
      }
    }

    const newApp = new SellerApplication({
      organizationName,
      organizationType,
      registrationNumber,
      yearOfEstablishment,
      website,
      contactPerson,
      email,
      phone,
      address,
      wasteTypesProcessed,
      processingCapacity,
      wasteCollectionService,
      fertilizerProducts,
      aadharNumber, // ✅ Changed from gstNumber to aadharNumber
      licenseNumber,
      governmentIdType,
      verificationStatus,
      verificationDetails
    });

    await newApp.save();

    res.status(200).json({ 
      message: "Seller application submitted successfully!", 
      verificationStatus,
      verificationDetails
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error submitting application", error: err.message });
  }
});

// View all seller applications (for admin)
router.get("/view-seller-applications", async (req, res) => {
  try {
    const applications = await SellerApplication.find().sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching applications", error: err.message });
  }
});

// View specific seller application (for admin)
router.get("/view-seller-application/:id", async (req, res) => {
  try {
    const application = await SellerApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.status(200).json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching application", error: err.message });
  }
});

// Approve seller application
router.post("/approve-seller/:id", async (req, res) => {
  try {
    const application = await SellerApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email: application.email });
    if (existingUser) {
      return res.status(400).json({ 
        message: "A user with this email already exists. Please use a different email or contact support.",
        error: "Email already exists"
      });
    }

    // Generate credentials
    const username = await generateUsername(application.organizationName);
    const password = generateRandomPassword();
    
    // Hash the password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Update application
    application.status = "Approved";
    application.generatedUsername = username;
    application.generatedPassword = password;
    application.adminRemarks = req.body.adminRemarks || "Application approved";
    
    await application.save();

    // Create seller user account with hashed password
    const newUser = new User({
      name: application.contactPerson,
      username: username,
      email: application.email,
      password: hashedPassword, // Store hashed password
      phone: application.phone,
      address: application.address,
      role: "seller"
    });

    await newUser.save();

    // Send email with credentials
    const mailOptions = {
      from: gmailConfig.emailId,
      to: application.email,
      subject: 'Ecoloop Seller Account Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Congratulations! Your Seller Application Has Been Approved</h2>
          <p>Hello ${application.contactPerson},</p>
          <p>We're pleased to inform you that your seller application for <strong>${application.organizationName}</strong> has been approved.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Login Credentials:</h3>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          
          <p>You can now log in to your seller dashboard using the credentials above.</p>
          <p><a href="http://localhost:3000/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Login Page</a></p>
          
          <p>For security reasons, we recommend changing your password after your first login.</p>
          
          <hr style="margin: 30px 0;">
          <p style="font-size: 14px; color: #666;">
            Best regards,<br>
            The Ecoloop Team
          </p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Seller account credentials sent to: ${application.email}`);

    res.status(200).json({ 
      message: "Seller application approved successfully! Login credentials have been sent to the seller's email.",
      username: username,
      password: password
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error approving application", error: err.message });
  }
});

// Reject seller application
router.post("/reject-seller/:id", async (req, res) => {
  try {
    const application = await SellerApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = "Rejected";
    application.adminRemarks = req.body.adminRemarks || "Application rejected";
    
    await application.save();

    res.status(200).json({ message: "Seller application rejected successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error rejecting application", error: err.message });
  }
});

module.exports = router;