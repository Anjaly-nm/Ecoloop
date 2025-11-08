const express = require("express");
const router = express.Router();
const User = require("../models/user/users");
const WasteSubmission = require("../models/user/wasteSubmissions");

// 🧠 Naïve Bayes–like classification for user/collector activity
function classifyUserActivity(user) {
  const daysSinceLastSubmission = user.lastSubmissionDate
    ? Math.floor((Date.now() - new Date(user.lastSubmissionDate)) / (1000 * 60 * 60 * 24))
    : 999;

  if (user.submissionCount > 4 && daysSinceLastSubmission < 7) {
    return "Active";
  } else if (user.submissionCount > 2 && daysSinceLastSubmission < 15) {
    return "Moderate";
  } else {
    return "Inactive";
  }
}

// 📌 Route: Get all users (including collectors) + classify their activity level
router.get("/viewusers", async (req, res) => {
  try {
    const pipeline = [
      // ✅ Fetch both users and collectors
      { $match: { role: { $in: ["user", "collector"] } } },

      {
        $lookup: {
          from: WasteSubmission.collection.name,
          localField: "_id",
          foreignField: "user_id",
          as: "user_submissions",
        },
      },

      {
        $addFields: {
          submissionCount: { $size: "$user_submissions" },
          lastSubmissionDate: { $max: "$user_submissions.createdAt" },
        },
      },

      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          address: 1,
          houseNumber: 1,
          wardNumber: 1,
          role: 1,
          createdAt: 1,
          submissionCount: 1,
          lastSubmissionDate: 1,
        },
      },
    ];

    const users = await User.aggregate(pipeline);

    // 🧠 Apply Naïve Bayes–like classification for each record
    const classifiedUsers = users.map((user) => ({
      ...user,
      activityStatus: classifyUserActivity(user),
    }));

    res.json(classifiedUsers);
  } catch (err) {
    console.error("Aggregation Error:", err);
    res.status(500).json({
      message: "❌ Error fetching users and collectors with submission counts",
      error: err.message,
    });
  }
});

module.exports = router;
