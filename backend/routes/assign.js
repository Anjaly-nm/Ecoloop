const express = require("express");
const router = express.Router();
const CollectorAssignment = require("../models/admin/collectorAssignment");
const User = require("../models/user/users");
const WasteSubmission = require("../models/user/wasteSubmissions"); // Assuming this model exists and is imported
const DeliveryBoyAssignment = require("../models/admin/deliveryBoyAssignment"); // Import new model
const { isAdmin } = require("../middlewares/middleware");

// ✅ Admin: assign collector to ward (Standard/Scheduled Assignment)
router.post("/assign", isAdmin, async (req, res) => {
    try {
        const { wardNumber, collectorId } = req.body;

        if (!wardNumber || !collectorId) {
            return res.status(400).json({ message: "Ward Number and Collector must be provided." });
        }

        // 1. Validate collector
        const collector = await User.findById(collectorId);
        if (!collector || collector.role.toLowerCase() !== "collector") {
            return res.status(400).json({ message: "❌ Invalid collector ID or role" });
        }

        const targetWardString = String(wardNumber).trim();

        // 2. Handle the current assignment (local overwrite/create)
        // Only one collector per ward.
        const newAssignment = await CollectorAssignment.findOneAndUpdate(
            { wardNumber: targetWardString },
            { collectorId },
            { new: true, upsert: true }
        );

        res.status(200).json({
            message: `✅ Collector assigned successfully to Ward ${targetWardString}`,
            assignment: newAssignment,
        });

    } catch (error) {
        console.error("Error assigning collector:", error);
        res.status(500).json({ message: "❌ Error assigning collector", error: error.message });
    }
});

// ----------------------------------------------------------------------

// ⭐ NEW ROUTE: Admin: Manually assign collector to an existing WasteSubmission (Immediate Pickup)
router.put("/assign-to-submission/:id", isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Destructure collectorId and status (which should be "approved" from the frontend)
        const { collectorId, status } = req.body;

        if (!collectorId) {
            return res.status(400).json({ message: "Collector ID must be provided." });
        }

        // 1. Validate collector
        const collector = await User.findById(collectorId);
        if (!collector || collector.role.toLowerCase() !== "collector") {
            return res.status(400).json({ message: "❌ Invalid collector ID or role" });
        }

        // 2. Define the updates. The manual assignment moves it from "pending" to "approved."
        const updateFields = {
            collector_id: collectorId,
            status: status || "approved" // Use 'approved' as the default active status
        };

        // 3. Find and update the specific WasteSubmission document
        const updatedSubmission = await WasteSubmission.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, select: "collector_id status" }
        );

        if (!updatedSubmission) {
            return res.status(404).json({ message: "Waste submission not found." });
        }

        res.status(200).json({
            message: `✅ Collector manually assigned and submission status updated to '${updatedSubmission.status}'.`,
            submission: updatedSubmission,
        });

    } catch (error) {
        console.error("Error manually assigning collector to submission:", error);
        res.status(500).json({ message: "❌ Failed to assign collector to submission", error: error.message });
    }
});

// ----------------------------------------------------------------------

// ⭐ EXISTING ROUTE: Admin: delete a collector assignment by ward
router.post("/unassign", isAdmin, async (req, res) => {
    try {
        const { wardNumber } = req.body;

        if (!wardNumber) {
            return res.status(400).json({ message: "Ward Number must be provided for unassignment." });
        }

        const targetWardString = String(wardNumber).trim();

        // Find and delete the specific assignment
        const result = await CollectorAssignment.deleteOne({
            wardNumber: targetWardString
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Assignment not found." });
        }

        res.status(200).json({
            message: "🗑️ Assignment successfully deleted.",
        });

    } catch (error) {
        console.error("Error deleting assignment:", error);
        res.status(500).json({ message: "❌ Failed to delete assignment", error: error.message });
    }
});

// ✅ Admin: Get all collector assignments
router.get("/collector-assignments", isAdmin, async (req, res) => {
    try {
        const assignments = await CollectorAssignment.find().populate("collectorId", "name email");
        res.status(200).json({
            success: true,
            assignments
        });
    } catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).json({ message: "❌ Failed to fetch assignments", error: error.message });
    }
});

// ----------------------------------------------------------------------
// ⭐ DELIVERY BOY ASSIGNMENT LOGIC
// ----------------------------------------------------------------------

// Assign Delivery Boy to a Ward
router.post("/assign-delivery-boy", isAdmin, async (req, res) => {
    try {
        const { wardNumber, deliveryBoyId } = req.body;

        if (!wardNumber || !deliveryBoyId) {
            return res.status(400).json({ message: "Ward Number and Delivery Boy ID must be provided." });
        }

        const boy = await User.findById(deliveryBoyId);
        if (!boy || boy.role !== "delivery-boy") {
            return res.status(400).json({ message: "Invalid Delivery Boy ID or Role" });
        }

        // Upsert: Assign boy to ward (overwriting previous assignment for this ward if exists)
        const assignment = await DeliveryBoyAssignment.findOneAndUpdate(
            { wardNumber: String(wardNumber) },
            { deliveryBoyId },
            { new: true, upsert: true }
        );

        res.status(200).json({
            message: `✅ Delivery boy assigned to Ward ${wardNumber}`,
            assignment
        });

    } catch (error) {
        console.error("Error assigning delivery boy:", error);
        res.status(500).json({ message: "Failed to assign delivery boy", error: error.message });
    }
});

// Get all Delivery Boy assignments
router.get("/delivery-boy-assignments", isAdmin, async (req, res) => {
    try {
        const assignments = await DeliveryBoyAssignment.find().populate("deliveryBoyId", "name email phone");
        res.status(200).json(assignments);
    } catch (error) {
        console.error("Error fetching delivery boy assignments:", error);
        res.status(500).json({ message: "Failed to fetch assignments", error: error.message });
    }
});

// ⭐ NEW ROUTE: Get My Ward Assignment (For Delivery Boy)
const { authenticateToken } = require("../middlewares/middleware");
router.get("/my-ward-assignment", authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const assignment = await DeliveryBoyAssignment.findOne({ deliveryBoyId: userId });

        if (!assignment) {
            return res.status(200).json({ wardNumber: null, message: "No ward assigned" });
        }

        res.status(200).json(assignment);
    } catch (error) {
        console.error("Error fetching my ward assignment:", error);
        res.status(500).json({ message: "Failed to fetch assignment", error: error.message });
    }
});

module.exports = router;