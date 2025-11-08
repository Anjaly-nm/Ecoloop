const express = require("express");
const router = express.Router();
const WasteSubmission = require("../models/user/wasteSubmissions");

// Update submission status
router.put("/updatestatus/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending","approved","rejected"].includes(status)) {
      return res.status(400).json({ message: "❌ Invalid status" });
    }

    const submission = await WasteSubmission.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ message: "❌ Submission not found" });
    }

    res.status(200).json({
      message: "✅ Status updated",
      submission
    });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ message: "❌ Failed to update status", error: err.message });
  }
});

module.exports = router;
