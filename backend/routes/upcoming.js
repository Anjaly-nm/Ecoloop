// routes/assignCollector.js
const express = require("express");
const router = express.Router();
const WasteSubmission = require("../models/WasteSubmission");
const User = require("../models/User");

// Get upcoming submissions filtered by category
router.get("/upcoming/:category", async (req, res) => {
  try {
    const { category } = req.params;

    // Today and later
    const today = new Date();

    const submissions = await WasteSubmission.find({
      category: category,
      scheduled_date: { $gte: today },
      collector_id: null, // only unassigned
    }).populate("user_id", "name email");

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Assign collector to a submission
router.post("/assign/:submissionId", async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { collectorId } = req.body;

    const submission = await WasteSubmission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    submission.collector_id = collectorId;
    await submission.save();

    res.json({ message: "Collector assigned successfully", submission });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
