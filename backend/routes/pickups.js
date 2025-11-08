const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Pickup = require("../models/user/wasteSubmissions");
const { isCollector } = require("../middlewares/middleware");

// GET: pickups assigned to logged-in collector
router.get("/", isCollector, async (req, res) => {
  try {
    const collectorId = req.user._id;

    if (!collectorId) {
      return res.status(401).json({ message: "Unauthorized: collector ID missing" });
    }

    const pickups = await Pickup.find({
      collector_id: new mongoose.Types.ObjectId(collectorId),
    })
      .populate("user_id", "name email wardNumber houseNumber")
      .populate("category_id", "name")
      .lean();

    res.status(200).json({ success: true, pickups });
  } catch (err) {
    console.error("Error fetching pickups:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT: update status (pending / collected)
router.put("/:id", isCollector, async (req, res) => {
  try {
    const collectorId = req.user._id;
    const pickupId = req.params.id;
    const { status, pendingReason } = req.body; // Added pendingReason

    if (!["pending", "collected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const pickup = await Pickup.findOne({
      _id: new mongoose.Types.ObjectId(pickupId),
      collector_id: new mongoose.Types.ObjectId(collectorId),
    });

    if (!pickup) {
      return res.status(404).json({ message: "Pickup not found or not assigned to you" });
    }

    pickup.status = status;

    if (status === "pending") {
      pickup.pendingReason = pendingReason || "No reason provided"; // Store reason
    } else {
      pickup.pendingReason = ""; // Clear reason if not pending
    }

    await pickup.save();

    res.status(200).json({ message: `Pickup marked as ${status}`, pickup });
  } catch (err) {
    console.error("Error updating pickup status:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
