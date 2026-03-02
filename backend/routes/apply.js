const express = require("express");
const router = express.Router();
const CollectorApplications = require("../models/collector/collectorApplications");
const DeliveryBoyApplication = require("../models/user/deliveryBoyApplications");

// Apply as collector
router.post("/apply-collector", async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const newApp = new CollectorApplications({ name, email, phone, address });
    await newApp.save();

    res.status(200).json({ message: "Application submitted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error submitting application", error: err.message });
  }
});

// Apply as delivery boy
router.post("/apply-delivery-boy", async (req, res) => {
  try {
    const { name, email, phone, address, vehicleType, experience } = req.body;

    const newApp = new DeliveryBoyApplication({ 
      name, 
      email, 
      phone, 
      address, 
      vehicleType, 
      experience 
    });
    await newApp.save();

    res.status(200).json({ message: "Delivery boy application submitted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error submitting delivery boy application", error: err.message });
  }
});

// ✅ View all collector applications
router.get("/view-applications", async (req, res) => {
  try {
    const applications = await CollectorApplications.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching applications", error: err.message });
  }
});

// ✅ View all delivery boy applications
router.get("/view-delivery-applications", async (req, res) => {
  try {
    const applications = await DeliveryBoyApplication.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching delivery boy applications", error: err.message });
  }
});

module.exports = router;