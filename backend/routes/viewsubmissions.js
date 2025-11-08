const express = require("express");
const router = express.Router();
const WasteSubmission = require("../models/user/wasteSubmissions");
const { isAdmin } = require("../middlewares/middleware");

// ✅ Admin: see all submissions with ward & house number
router.get("/viewsubmissions", isAdmin, async (req, res) => {
  try {
    const submissions = await WasteSubmission.find()
      .populate("user_id", "name email wardNumber houseNumber") // fetch wardNumber & houseNumber
      .populate("collector_id", "name email"); // collector details

    res.status(200).json({
      message: "✅ All submissions fetched successfully",
      submissions,
    });
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({
      message: "❌ Error fetching all submissions",
      error: err.message,
    });
  }
});

module.exports = router;
