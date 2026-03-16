const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Pickup = require("../models/user/wasteSubmissions");
const { isCollector } = require("../middlewares/middleware");

// GET: pickups assigned to logged-in collector
router.get("/", isCollector, async (req, res) => {
  try {
    const collectorId = req.user._id;
    const { filter } = req.query; // 'all', 'today', 'tomorrow', 'weekly'

    let query = {
      collector_id: new mongoose.Types.ObjectId(collectorId),
    };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (filter === "today") {
      const endOfToday = new Date(startOfToday);
      endOfToday.setHours(23, 59, 59, 999);
      query.scheduled_date = { $gte: startOfToday, $lte: endOfToday };
    } else if (filter === "tomorrow") {
      const startOfTomorrow = new Date(startOfToday);
      startOfTomorrow.setDate(startOfToday.getDate() + 1);
      const endOfTomorrow = new Date(startOfTomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);
      query.scheduled_date = { $gte: startOfTomorrow, $lte: endOfTomorrow };
    } else if (filter === "weekly") {
      const endOfWeekly = new Date(startOfToday);
      endOfWeekly.setDate(startOfToday.getDate() + 7);
      query.scheduled_date = { $gte: startOfToday, $lte: endOfWeekly };
    }

    console.log(`📡 Fetching pickups for collector: ${collectorId} with filter: ${filter}`);

    const pickups = await Pickup.find(query)
      .populate("user_id", "name email wardNumber houseNumber")
      .populate("category_id", "name")
      .sort({ scheduled_date: 1 })
      .lean();

    console.log(`✅ Found ${pickups.length} pickups for ${collectorId}`);
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
