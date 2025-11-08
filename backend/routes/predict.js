const express = require("express");
const router = express.Router();
const WasteSubmission = require("../models/user/wasteSubmissions");
const User = require("../models/user/users");
const KNN = require("ml-knn"); // KNN is kept but repurposed or deprecated

// Utility: get month name and year
function getMonthYear(date) {
    const options = { month: "long", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
}

// Utility: Calculate the start date for the past 3 months of training data
function getThreeMonthsAgo(date) {
    const threeMonthsAgo = new Date(date.getFullYear(), date.getMonth() - 3, 1);
    return threeMonthsAgo;
}

// ----------------------------------------------------------------
// Route: GET /api/user/predict-next-month (REVISED FOR NUMERIC FREQUENCY)
// ----------------------------------------------------------------
router.get("/predict-next-month", async (req, res) => {
    try {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const lookbackDate = getThreeMonthsAgo(today);
        const monthName = getMonthYear(nextMonth);
        
        // 🚨 CRITICAL CHANGE: We remove the getFrequencyText utility function
        // as we will now send a numerical average.

        // 1️⃣ Get all past submissions from the last 3 months
        const submissions = await WasteSubmission.find({
            // Filter submissions starting from 3 months ago up to the end of the current month
            scheduled_date: { $gte: lookbackDate, $lt: nextMonth }, 
        }).populate("user_id", "wardNumber");

        if (!submissions.length) {
            return res.status(404).json({ 
                month: monthName, 
                predictions: [], 
                message: "No recent data available for prediction." 
            });
        }

        // 2️⃣ Aggregate data by Ward and Category
        const wardCategoryAggregates = {};

        submissions.forEach((s) => {
            const ward = s.user_id?.wardNumber;
            const category = s.category || "Mixed";
            
            if (!ward) return;

            if (!wardCategoryAggregates[ward]) {
                wardCategoryAggregates[ward] = {};
            }
            
            // Count total submissions for this Category in this Ward
            wardCategoryAggregates[ward][category] = (wardCategoryAggregates[ward][category] || 0) + 1;
        });

        // 3️⃣ Process Aggregates into Predictions
        const predictions = [];
        const lookbackMonths = 3; // Defined here for clarity

        for (const ward in wardCategoryAggregates) {
            const categoriesInWard = wardCategoryAggregates[ward];
            let totalWardCount = 0;
            let topCategory = null;
            let maxCount = 0; // The count for the top category

            // Prepare categories for the final output and find the top one
            const categoriesInLastMonth = Object.entries(categoriesInWard).map(([categoryName, count]) => {
                totalWardCount += count;
                if (count > maxCount) {
                    maxCount = count;
                    topCategory = categoryName;
                }
                return {
                    name: categoryName,
                    count: count,
                };
            });
            
            // 💡 FIX: Calculate the average monthly frequency (a numerical value)
            const averageMonthlyFrequency = maxCount / lookbackMonths;

            predictions.push({
                wardNumber: parseInt(ward),
                // Expected category is the one with the highest count
                expectedCategory: topCategory || "Mixed", 
                
                // ⭐ UPDATED FIELD: Now contains a numerical average (e.g., 0.666 or 4.0)
                expectedFrequency: averageMonthlyFrequency, 
                
                // CRITICAL: Send the detailed category counts for the frontend chart (Stacked Bar)
                categoriesInLastMonth: categoriesInLastMonth, 
                
                // The total count is the total number of submissions in the ward over the period
                totalWardSubmissions: totalWardCount, 
            });
        }

        // 4️⃣ Sort predictions by ward number
        predictions.sort((a, b) => a.wardNumber - b.wardNumber);

        res.json({ month: monthName, predictions });
        
    } catch (err) {
        console.error("Prediction error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;