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

module.exports = router;
