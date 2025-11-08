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
        // 🔑 FIX: Removed 'status' from destructuring. Rely on 'is_immediate' flag.
        const { user_id, category, category_id, scheduled_date, weight, is_immediate } = req.body;

        // Determine if it's an immediate pickup request using the new flag
        const isFastPickup = is_immediate === true; 
        
        // ✅ Validate input
        if (!user_id) return res.status(400).json({ message: "❌ user_id is missing" });
        if (!category_id) return res.status(400).json({ message: "❌ category_id is required" });
        
        // Ensure all submissions have a timestamp (scheduled_date).
        if (!scheduled_date) return res.status(400).json({ message: "❌ scheduled_date is missing. All pickups must have a scheduled time." });

        // IMMEDIATE PICKUP VALIDATION (Weight is required)
        if (isFastPickup) {
            if (!weight) return res.status(400).json({ message: "❌ Estimated weight is required for immediate pickup" });
            if (isNaN(parseFloat(weight)) || parseFloat(weight) <= 0) return res.status(400).json({ message: "❌ Weight must be a positive number" });
        }

        // ✅ Find user 
        const user = await User.findById(user_id);
        if (!user) return res.status(404).json({ message: "❌ User not found" });
        if (!user.wardNumber) return res.status(400).json({ message: "❌ User has no wardNumber assigned" });

        // --- Collector Assignment Logic: ONLY FOR STANDARD PICKUPS ---

        let collectorId = null;

        if (!isFastPickup) {
            // STANDARD PICKUP LOGIC: Must assign a collector based on category and ward
            const assignment = await CollectorAssignment.findOne({
                wardNumber: user.wardNumber.trim(),
                categoryId: category_id,
            });

            if (!assignment) {
                return res.status(400).json({
                    message: "❌ No collector assigned for this ward & category. Standard pickup failed.",
                });
            }
            collectorId = assignment.collectorId;
            
        } 
        
        // 💡 NOTE: If isFastPickup is true, collectorId remains 'null', 
        // which is correct for manual admin assignment. The Mongoose hook 
        // ensures the status is set to 'pending'.

        // ✅ Create and Save new waste submission 
        const newSubmission = new WasteSubmission({
            user_id,
            category: category || null,
            category_id: category_id || null,
            // collectorId is null for immediate and set for standard
            collector_id: collectorId, 
            scheduled_date: scheduled_date, 
            
            // 🔑 CRITICAL: Pass the flag and weight exactly as needed by the schema/hook
            is_immediate: isFastPickup,
            weight: isFastPickup ? parseFloat(weight) : undefined, 
            
            // 💡 FIX: Removed the manual 'status: "approved"' line. 
            // The Mongoose pre('save') hook now handles setting the status 
            // to 'pending' for immediate and 'approved' for standard.
        });

        await newSubmission.save();
        
        // Final Status check for response message (gets status after hook runs)
        // Must reload the document or access the saved value, but newSubmission.status should be correct after .save()
        const finalStatus = newSubmission.status;

        // 🔑 Send the successful response immediately.
        res.status(201).json({
            message: `✅ Waste submission stored successfully. Type: ${isFastPickup ? 'IMMEDIATE' : 'STANDARD'}. Status: ${finalStatus.toUpperCase()}.`,
            data: newSubmission,
        });

        // ✅ Send confirmation email ASYNCHRONOUSLY 
        if (user.email) {
            (async () => {
                const subject = isFastPickup ? `⚡ Urgent Pickup Requested (${finalStatus})` : `🌿 Standard Pickup Scheduled (${finalStatus})`;
                const body = `Hi ${user.name || "there"},\n\nYour waste submission for ${category || "selected category"} has been recorded.\n
                Status: **${finalStatus.toUpperCase()}**.\n
                ${isFastPickup ? `Weight: ${weight} kg. This request is now PENDING administrative review.` : `Scheduled Date: ${new Date(scheduled_date).toDateString()}.`}`;

                try {
                    await sendTextEmail(
                        user.email,
                        subject,
                        body
                    );
                } catch (emailErr) {
                    console.error("📧 ASYNC Email failed (Client was already notified):", emailErr.message);
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