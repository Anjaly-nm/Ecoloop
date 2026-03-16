const express = require("express");
const router = express.Router();
// Assuming these paths are correct for your file structure
const WasteSubmission = require("../models/user/wasteSubmissions");
const User = require("../models/user/users");
const CollectorAssignment = require("../models/admin/collectorAssignment");
const { sendTextEmail } = require("../control/emailhelp");
const category = require("../models/admin/category");

// 📌 Add new waste submission (Standard or Immediate Pickup)
router.post("/add", async (req, res) => {
    try {
        const { user_id, category, category_id, scheduled_date, weight, is_immediate } = req.body;

        const isFastPickup = is_immediate === true;

        if (!user_id) return res.status(400).json({ message: "❌ user_id is missing" });
        if (!category_id) return res.status(400).json({ message: "❌ category_id is required" });
        if (!scheduled_date) return res.status(400).json({ message: "❌ scheduled_date is missing" });

        if (isFastPickup) {
            if (!weight) return res.status(400).json({ message: "❌ Weight is required for immediate pickup" });
        }

        const user = await User.findById(user_id);
        if (!user) return res.status(404).json({ message: "❌ User not found" });
        if (!user.wardNumber) return res.status(400).json({ message: "❌ User has no wardNumber assigned" });

        let collectorId = null;
        let finalStatus = "pending";
        let reason = "";

        // --- IMPROVED ASSIGNMENT LOGIC ---

        if (!isFastPickup) {
            // 1. Find the collector assigned to this ward
            const assignment = await CollectorAssignment.findOne({
                wardNumber: user.wardNumber.trim()
            });

            if (assignment) {
                const assignedCollectorId = assignment.collectorId;

                // 2. Check active tasks (status: approved or in-progress)
                const activeTasks = await WasteSubmission.find({
                    collector_id: assignedCollectorId,
                    status: { $in: ["approved", "in-progress"] }
                }).populate("user_id", "wardNumber");

                const activeCount = activeTasks.length;
                const targetWard = String(user.wardNumber).trim();

                // 3. Find tasks in OTHER wards
                const otherWardTasks = activeTasks.filter(task =>
                    task.user_id && String(task.user_id.wardNumber).trim() !== targetWard
                );

                // LOGIC: 
                // If there are tasks in OTHER wards, enforce a limit (e.g., 3).
                // If ALL tasks are in the SAME ward, we don't block assignment based on count.
                if (otherWardTasks.length > 0 && activeCount >= 3) {
                    reason = `Collector workload limit reached (max 3 across different wards). Currently in Ward ${otherWardTasks[0].user_id.wardNumber}.`;
                } else {
                    // All checks pass: Auto-assign
                    collectorId = assignedCollectorId;
                    finalStatus = "approved";
                }
            } else {
                reason = "No collector assigned to this ward.";
            }
        } else {
            reason = "Immediate pickup requires manual admin assignment.";
        }

        // ✅ Create and Save new waste submission 
        const newSubmission = new WasteSubmission({
            user_id,
            category: category || null,
            category_id: category_id || null,
            collector_id: collectorId,
            scheduled_date: scheduled_date,
            is_immediate: isFastPickup,
            weight: isFastPickup ? parseFloat(weight) : undefined,
            status: finalStatus,
            pendingReason: reason
        });

        await newSubmission.save();

        res.status(201).json({
            message: `✅ Waste submission stored. Status: ${finalStatus.toUpperCase()}. ${reason ? '(' + reason + ')' : ''}`,
            data: newSubmission,
        });

        // ✅ Send confirmation email ASYNCHRONOUSLY 
        if (user.email) {
            (async () => {
                const subject = isFastPickup ? `⚡ Urgent Pickup Requested (${finalStatus})` : `🌿 Waste Pickup ${finalStatus === 'approved' ? 'Approved' : 'Pending'} (${finalStatus})`;
                const body = `Hi ${user.name || "there"},\n\nYour waste submission for ${category || "selected category"} has been recorded.\n
                Status: **${finalStatus.toUpperCase()}**.\n
                ${reason ? `Note: ${reason}\n` : ''}
                ${isFastPickup ? `Weight: ${weight} kg.` : `Scheduled Date: ${new Date(scheduled_date).toDateString()}.`}`;

                try {
                    await sendTextEmail(user.email, subject, body);
                } catch (emailErr) {
                    console.error("📧 Email failed:", emailErr.message);
                }
            })();
        }

    } catch (error) {
        console.error("🔥 Error storing waste submission:", error);
        res.status(500).json({ message: "❌ Error storing waste submission", error: error.message });
    }
});

// 📌 Get submissions for a specific user (Unchanged)
router.get("/mysubmissions/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        if (!user_id) return res.status(400).json({ message: "❌ user_id is required" });

        const submissions = await WasteSubmission.find({ user_id })
            .populate("user_id", "name email wardNumber houseNumber")
            .populate("category_id", "name");

        res.json({ submissions });
    } catch (error) {
        console.error("🔥 Error fetching user submissions:", error);
        res.status(500).json({ message: "❌ Error fetching submissions", error: error.message });
    }
});

// 📌 Delete submission (Unchanged)
router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await WasteSubmission.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: "❌ Submission not found" });
        }

        res.status(200).json({ message: "✅ Submission deleted successfully" });
    } catch (error) {
        console.error("🔥 Error deleting submission:", error);
        res.status(500).json({ message: "❌ Error deleting submission", error: error.message });
    }
});


module.exports = router;