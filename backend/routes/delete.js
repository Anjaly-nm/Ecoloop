const express = require("express");
const router = express.Router();
const WasteSubmission = require("../models/user/wasteSubmissions");

// Delete a submission
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSubmission = await WasteSubmission.findByIdAndDelete(id);

    if (!deletedSubmission) {
      return res.status(404).json({ message: "❌ Submission not found" });
    }

    res.status(200).json({
      message: "✅ Submission deleted successfully",
      submission: deletedSubmission
    });
  } catch (err) {
    console.error("Error deleting submission:", err);
    res.status(500).json({ message: "❌ Failed to delete submission", error: err.message });
  }
});

// Delete a collector application
router.delete("/collector-application/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const CollApp = require("../models/collector/collectorApplications");

    const deletedApp = await CollApp.findByIdAndDelete(id);

    if (!deletedApp) {
      return res.status(404).json({ message: "❌ Application not found" });
    }

    res.status(200).json({
      message: "✅ Application deleted successfully",
      application: deletedApp
    });
  } catch (err) {
    console.error("Error deleting application:", err);
    res.status(500).json({ message: "❌ Failed to delete application", error: err.message });
  }
});

module.exports = router;
