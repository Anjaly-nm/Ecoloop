import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Category from "./Category";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar
} from "recharts";
import { useNavigate } from "react-router-dom";
import { FaBolt } from 'react-icons/fa'; // Import FaBolt for the immediate pickup icon


const COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#f59e0b", "#ef4444"];
const ASSIGNMENTS_STORAGE_KEY = "wardCategoryAssignments";

// 🟢 UPDATED HELPER FUNCTION: To correctly process the new backend data structure.
const transformPredictionDataForChart = (predictions) => {
    // 1. Group predictions by Ward Number and aggregate all categories present in the last month
    const predictionsByWard = predictions.reduce((acc, p) => {
        const wardKey = `Ward ${p.wardNumber}`;
        if (!acc[wardKey]) {
            acc[wardKey] = { ward: wardKey };
        }

        // ⭐ NEW LOGIC: Use the categoriesInLastMonth array to build the stacked bar data.
        if (p.categoriesInLastMonth && p.categoriesInLastMonth.length > 0) {
            p.categoriesInLastMonth.forEach(cat => {
                // Aggregate counts for ALL categories present in the lookback period for this ward
                acc[wardKey][cat.name] = (acc[wardKey][cat.name] || 0) + cat.count;
            });
        }
        // If categoriesInLastMonth is empty, the item might be skipped or need special handling
        // but for now, we rely on the backend sending the detailed breakdown.

        return acc;
    }, {});

    // 2. Collect all unique categories across all aggregated data
    // This correctly gets all categories mentioned in the detailed breakdown.
    const allCategoryNames = new Set(predictions.flatMap(p =>
        p.categoriesInLastMonth ? p.categoriesInLastMonth.map(c => c.name) : []
    ));
    const uniqueCategories = Array.from(allCategoryNames).sort();

    // 3. Convert the map values to a sorted array format for Recharts
    const chartData = Object.values(predictionsByWard)
        // Ensure all categories are present with a 0 value if missing, for consistent chart stack colors
        .map(item => {
            uniqueCategories.forEach(cat => {
                if (item[cat] === undefined) {
                    item[cat] = 0;
                }
            });
            return item;
        })
        // Sort by ward number for logical chart order
        .sort((a, b) => {
            const wardA = parseInt(a.ward.replace('Ward ', ''));
            const wardB = parseInt(b.ward.replace('Ward ', ''));
            return wardA - wardB;
        });

    return { chartData, uniqueCategories };
};


const WasteManagement = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [theme, setTheme] = useState("light");
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [collectors, setCollectors] = useState([]);
    const [wasteSubmissions, setWasteSubmissions] = useState([]);
    const [categories, setCategories] = useState([]);

    const [collectorApplies, setCollectorApplies] = useState([]); // Array of pending applications

    // --- Prediction States ---
    const [wastePredictions, setWastePredictions] = useState({
        month: "",
        predictions: []
    });
    const [isPredicting, setIsPredicting] = useState(false);
    // -----------------------------

    const [wardCategoryAssignments, setWardCategoryAssignments] = useState(() => {
        try {
            const storedAssignments = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
            return storedAssignments ? JSON.parse(storedAssignments) : {};
        } catch (error) {
            console.error("Error reading assignments from localStorage:", error);
            return {};
        }
    });

    const [wardNumber, setWardNumber] = useState("");
    const [collectorId, setCollectorId] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [assignedCollectorFilter, setAssignedCollectorFilter] = useState("");

    // ⭐ NEW STATE: for the manual collector assignment in the Immediate Pickups table
    const [manualCollectorId, setManualCollectorId] = useState({});

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem("token");
        return { headers: { token } };
    }, []);

    const fetchData = useCallback(async () => {
        const authHeaders = getAuthHeaders();

        try {
            const resUsers = await axios.get("http://localhost:4321/api/user/viewusers", authHeaders);
            const allUsers = resUsers.data.data || resUsers.data || [];

            const fetchedUsers = allUsers.filter(u => u.role?.toLowerCase() === "user");
            const fetchedCollectors = allUsers.filter(u => u.role?.toLowerCase() === "collector");

            setUsers(fetchedUsers);
            setCollectors(fetchedCollectors);

            // Fetching ONLY Pending Applications (Backend fix is crucial here)
            const resApplies = await axios.get("http://localhost:4321/api/user/collector-applications", authHeaders);
            const fetchedApplies = resApplies.data.applications || [];
            setCollectorApplies(fetchedApplies); // This list should now only contain 'Pending' apps

            const resCats = await axios.get("http://localhost:4321/api/category/categories", authHeaders);
            // Map categories to a consistent name for UI and filtering
            const mappedCategories = (resCats.data.categories || resCats.data || []).map(c => {
                let name = c.name;
                return { ...c, name };
            });
            setCategories(mappedCategories);

            const resSubs = await axios.get("http://localhost:4321/api/user/viewsubmissions", authHeaders);
            const fetchedWasteSubmissions = (resSubs.data.submissions || resSubs.data || []).map(s => ({
                ...s,
                pendingReason: s.pendingReason || ''
            }));
            setWasteSubmissions(fetchedWasteSubmissions);
            
            // ⭐ Initialize manualCollectorId state
            const initialManualIds = {};
            fetchedWasteSubmissions.filter(s => s.weight).forEach(s => {
                // Pre-select the currently assigned collector, if one exists
                initialManualIds[s._id] = s.collector_id?._id || "";
            });
            setManualCollectorId(initialManualIds);
            

        } catch (err) {
            console.error("Error fetching data:", err.response?.data || err.message);
        }
    }, [getAuthHeaders]);

    // 🟢 UPDATED: This function is now set up to handle the new backend response structure.
    const fetchWastePredictions = useCallback(async () => {
        setIsPredicting(true);
        setWastePredictions({ month: "", predictions: [] });
        const authHeaders = getAuthHeaders();

        const predictionUrl = `http://localhost:4321/api/user/predict-next-month`;

        try {
            const res = await axios.get(predictionUrl, authHeaders);

            const fetchedData = res.data || { month: "N/A", predictions: [] };
            
            const sortedPredictions = (fetchedData.predictions || []).sort((a, b) => {
                const numA = parseInt(a.wardNumber) || 0;
                const numB = parseInt(b.wardNumber) || 0;
                return numA - numB;
            }).map(p => ({
                ...p,
                ward: `Ward ${p.wardNumber}`
            }));

            setWastePredictions({
                month: fetchedData.month || "Next Month",
                predictions: sortedPredictions
            });

            alert(`✅ Successfully fetched waste prediction for the month of ${fetchedData.month || 'Next Month'} for ${sortedPredictions.length} wards.`);

        } catch (err) {
            console.error("Error fetching waste predictions:", err.response?.data || err.message);
            alert(`❌ Failed to fetch waste predictions. Error: ${err.response?.data?.message || err.response?.data?.error || 'Check server status.'}`);
        } finally {
            setIsPredicting(false);
        }
    }, [getAuthHeaders]);


    // Effect to run on mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Effect to save assignments to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(wardCategoryAssignments));
        } catch (error) {
            console.error("Error writing assignments to localStorage:", error);
        }
    }, [wardCategoryAssignments]);

    
    const updateWasteSubmissionStatus = async (id, newStatus) => {
        try {
            const res = await axios.put(
                `http://localhost:4321/api/user/updatestatus/${id}`,
                { status: newStatus },
                getAuthHeaders()
            );
            // Update the waste submission state
            setWasteSubmissions(prev =>
                prev.map(s => s._id === id ? { ...s, status: res.data.submission?.status || newStatus } : s)
            );
        } catch (err) {
            console.error(err);
            alert("Failed to update waste submission status");
        }
    };
    
    // ⭐ MODIFIED FUNCTION: Assigns a collector to a specific submission and switches tab
    const assignCollectorToSubmission = async (submissionId, collectorId) => {
        if (!collectorId) {
            alert("Please select a collector.");
            return;
        }

        const collectorName = collectors.find(c => c._id === collectorId)?.name || "a collector";

        if (!window.confirm(`Are you sure you want to assign ${collectorName} to this urgent pickup?`)) {
            return;
        }

        try {
            // Call the new backend route, passing the collectorId AND setting the status to 'approved'
            await axios.put(
                `http://localhost:4321/api/user/assign-to-submission/${submissionId}`,
                { collectorId, status: "approved" }, 
                getAuthHeaders()
            );

            // Update the local state to reflect the assignment and the 'approved' status
            // NOTE: This state update triggers the filter (!s.collector_id) in immediatePickups, making the item disappear immediately.
            setWasteSubmissions(prev =>
                prev.map(s => 
                    s._id === submissionId 
                        ? { 
                            ...s, 
                            collector_id: { _id: collectorId, name: collectorName }, 
                            status: "approved" 
                          }
                        : s
                )
            );

            alert(`✅ Collector ${collectorName} successfully assigned to submission ID ${submissionId}.`);
            
            // ⭐ CRITICAL CHANGE: Switch to the schedules tab after successful assignment
            setActiveTab("schedules");
            
        } catch (err) {
            console.error("Error manually assigning collector to submission:", err.response?.data || err.message);
            alert(`❌ Failed to assign collector: ${err.response?.data?.message || 'Check network or backend assignment logic.'}`);
        }
    };


    const approveCollectorApply = async (appId) => {
        const application = collectorApplies.find(c => c._id === appId);
        if (!application || !window.confirm(`Are you sure you want to approve ${application.name} as a collector?`)) return;

        try {
            // 1. Send approval request to backend
            // The backend handles user creation and updating the application status to 'Approved'
            await axios.post(
                `http://localhost:4321/api/user/approve-application/${appId}`,
                // Sending the required data, although the backend mostly relies on the ID
                { name: application.name, email: application.email, phone: application.phone, address: application.address },
                getAuthHeaders()
            );

            // 🟢 FRONTEND FIX: Immediately remove the item from the pending list in the local state.
            // This prevents the application from reappearing due to slow network/fetch.
            setCollectorApplies(prev => prev.filter(app => app._id !== appId));
            
            // 2. Re-fetch all data (CRITICAL: to get the new collector in the 'collectors' list)
            await fetchData(); 

            alert(`✅ Collector ${application.name} approved.`);
            // Switch to the 'Collectors' tab to show the new collector immediately
            setActiveTab("collectors");
            
        } catch (err) {
            console.error(err.response?.data || err.message);
            alert(`Failed to approve collector apply: ${err.response?.data?.message || 'Check network and backend implementation.'}`);
        }
    };

    const rejectCollectorApply = async (appId) => {
        if (!window.confirm("Are you sure you want to reject this collector application? This will delete the application record.")) return;

        try {
            await axios.delete(
                `http://localhost:4321/api/user/reject-application/${appId}`,
                getAuthHeaders()
            );

            // Update local state immediately after successful rejection
            setCollectorApplies(prev => prev.filter(app => app._id !== appId));

            await fetchData();

            alert(`❌ Collector application rejected and removed.`);
        } catch (err) {
            console.error(err.response?.data || err.message);
            alert(`Failed to reject collector apply: ${err.response?.data?.message || 'Check network and backend implementation.'}`);
        }
    };

    const approveAllNewWasteSubmissions = async () => {
        const newSubmissionIds = wasteSubmissions
            .filter(s => s.status?.toLowerCase() === "new" || s.status?.toLowerCase() === "unhandled")
            .map(s => s._id);

        if (newSubmissionIds.length === 0) {
            alert("No new waste submissions to approve.");
            return;
        }

        if (!window.confirm(`Are you sure you want to approve all ${newSubmissionIds.length} new waste submissions?`)) {
            return;
        }

        try {
            const successfulUpdates = [];
            for (const id of newSubmissionIds) {
                try {
                    await axios.put(
                        `http://localhost:4321/api/user/updatestatus/${id}`,
                        { status: "approved" },
                        getAuthHeaders()
                    );
                    successfulUpdates.push(id);
                } catch (err) {
                    console.error(`Failed to update status for ${id}:`, err);
                }
            }

            // Update the state once after all network calls
            setWasteSubmissions(prev =>
                prev.map(s => successfulUpdates.includes(s._id) ? { ...s, status: "approved" } : s)
            );

            alert(`✅ Successfully approved ${successfulUpdates.length} waste submissions.`);
            // Automatically switch to the Submissions tab after approval
            setActiveTab("submissions");

        } catch (err) {
            alert("Failed to process bulk approval.");
        }
    };

    const newAppliesCount = collectorApplies.length;

    const newWasteSubmissionsCount = wasteSubmissions.filter(s =>
        s.status?.toLowerCase() === "new" || s.status?.toLowerCase() === "unhandled"
    ).length;
    
    // ⭐ MODIFIED FILTER: This filter ensures that assigned pickups (which now have collector_id)
    // are automatically hidden from the "Urgent Pickups" queue.
    const immediatePickups = wasteSubmissions.filter(s =>
        // 1. Is an urgent pickup (has weight/is_immediate flag)
        s.weight && 
        // 2. Is not yet collected or rejected
        s.status?.toLowerCase() !== "collected" && s.status?.toLowerCase() !== "rejected" &&
        // 3. CRITICAL: Has NOT been assigned a collector yet
        !s.collector_id
    );
    const immediatePickupCount = immediatePickups.length;
    // END MODIFIED FILTER

    const deleteAssignment = async (ward, categoryId, collectorName) => {
        if (!window.confirm(`Are you sure you want to remove the assignment of ${collectorName} from Ward ${ward} for this category? This action cannot be undone.`)) {
            return;
        }

        const assignmentKey = `${String(ward)}-${categoryId}`;
        let successfullyDeletedOnBackend = false;

        try {
            await axios.post(
                "http://localhost:4321/api/user/unassign",
                { wardNumber: ward, categoryId },
                getAuthHeaders()
            );
            successfullyDeletedOnBackend = true;

        } catch (err) {
            const status = err.response?.status;

            if (status === 404 || status === 400) {
                console.warn(`[Unassign Info] Server responded with status ${status}. Assuming assignment is already cleared from DB.`);
                successfullyDeletedOnBackend = true;
            } else {
                console.error(err.response?.data || err);
                alert(err.response?.data?.message || "❌ A critical error occurred. Failed to contact server.");
                return;
            }
        }

        if (successfullyDeletedOnBackend) {
            setWardCategoryAssignments(prev => {
                const newAssignments = { ...prev };
                delete newAssignments[assignmentKey];
                return newAssignments;
            });

            alert(`✅ Assignment for Ward ${ward} / ${categories.find(c => c._id === categoryId)?.name || 'Category'} successfully removed from the system.`);
        }
    };

    // Filter submissions here to use in the Dashboard charts/stats
    const activeSubmissions = wasteSubmissions.filter(s => s.status?.toLowerCase() !== "collected");

    const monthlyData = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, i) => ({
        name: month,
        submissions: activeSubmissions.filter(s => new Date(s.scheduled_date).getMonth() === i).length,
    }));

    // 🍕 OPTIMIZATION: Use the fetched categories dynamically for the Pie Chart
    const categoryData = categories.map(catObj => {
        const catName = catObj.name;
        
        let filteredCount = activeSubmissions.filter(s =>
            s.category?.toLowerCase() === catName.toLowerCase() // Simple exact match for consistency
        ).length;
        
        return {
            name: catName,
            value: filteredCount,
        };
    }).filter(c => c.value > 0); // Filter out categories with 0 submissions
    
    // --- CORE LOGIC: Generate Current Collector Assignments List ---
    const currentAssignmentsMap = {};
    Object.entries(wardCategoryAssignments).forEach(([key, collector_id]) => {
        const [ward, categoryId] = key.split('-');
        const collectorObj = collectors.find(c => c._id === collector_id);
        const categoryObj = categories.find(c => c._id === categoryId);

        if (ward && categoryObj && collectorObj) {
            currentAssignmentsMap[key] = {
                ward,
                categoryId: categoryObj._id,
                collectorId: collector_id,
                category: categoryObj.name,
                collectorName: collectorObj.name,
                activeSubmissionsCount: 0,
            };
        }
    });

    wasteSubmissions
        .filter(s => s.status?.toLowerCase() !== "collected")
        .forEach(s => {
            const ward = String(s.user_id?.wardNumber);
            // Must find the category by name and then map to ID
            const category = categories.find(c => c.name === s.category);
            const categoryId = category?._id;
            const key = `${ward}-${categoryId}`;

            if (currentAssignmentsMap[key]) {
                currentAssignmentsMap[key].activeSubmissionsCount++;
            }
        });

    const currentAssignmentsList = Object.values(currentAssignmentsMap).sort((a, b) =>
        a.ward.localeCompare(b.ward) || a.category.localeCompare(b.category)
    );
    // --- END CORE LOGIC ---

    // 🟢 UPDATED: Get the chart data and unique categories needed for the Bar chart
    const { chartData, uniqueCategories } = transformPredictionDataForChart(wastePredictions.predictions);

    const isDark = theme === "dark";
    const bgMain = isDark ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-800";
    const sidebarBg = isDark ? "bg-gray-800" : "bg-white";
    const buttonBase = isDark ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300";

    // Helper to format the tab title for the Navbar
    const formatTabTitle = (tab) => {
        return tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([a-z])([A-Z])/g, '$1 $2');
    };

    return (
        <div className={`flex h-screen font-sans ${bgMain}`}>
            {/* Sidebar (Fixed width) */}
            <aside className={`w-72 p-5 flex flex-col ${sidebarBg} shadow-md flex-shrink-0`}>
                <h2 className="text-2xl font-bold mb-6">{isDark ? "🌙 Waste Management" : "🌿 Waste Management"}</h2>

                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className={`mb-4 w-10 h-10 flex items-center justify-center rounded-full ${isDark ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
                >
                    {theme === "light" ? "🌙" : "☀️"}
                </button>

                <button
                    onClick={() => navigate("/Adminpage")}
                    className={`w-full text-left px-3 py-2 mb-3 rounded-lg font-medium ${buttonBase}`}
                >
                    🏡 Home
                </button>

                {/* ** APPROVE WASTE SUBMISSIONS BUTTON (Sidebar) ** */}
                {newWasteSubmissionsCount > 0 && (
                    <button
                        onClick={approveAllNewWasteSubmissions}
                        className="w-full text-left px-3 py-2 mb-3 rounded-lg font-medium bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center"
                    >
                        <span className="mr-2">✅ Approve Waste Applies</span>
                        <span className="bg-white text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {newWasteSubmissionsCount}
                        </span>
                    </button>
                )}
                {/* ** END APPROVE WASTE SUBMISSIONS BUTTON ** */}

                {/* Navigation Menu */}
                <nav className="space-y-3 flex-grow overflow-y-auto pb-4">
                    {[
                        "dashboard",
                        "users",
                        "collectors",
                        "immediatePickups", // ✅ NEW TAB KEY
                        "submissions", // Waste Submissions
                        "categories",
                        "schedules",
                        "Assign collector",
                        "Collected waste",
                        "Pending submissions",
                        "wastePrediction",
                        "collectorApplications"
                    ].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === tab
                                    ? isDark ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"
                                    : isDark ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            {tab === "dashboard" && "✨Dashboard"}
                            {tab === "users" && "👥 Users"}
                            {tab === "collectors" && "🚛 Collectors"}
                            {/* ✅ NEW Sidebar Button for Immediate Pickups */}
                            {tab === "immediatePickups" && (
                                <span className="flex justify-between items-center">
                                    <span>⚡ Immediate Pickups</span>
                                    {immediatePickupCount > 0 && (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-red-600 text-white" : "bg-red-500 text-white"} animate-pulse`}>
                                            {immediatePickupCount} Urgent
                                        </span>
                                    )}
                                </span>
                            )}
                            {tab === "submissions" && (
                                <span className="flex justify-between items-center">
                                    <span>📦 Waste Submissions</span>
                                    {/* Small indicator on the submissions tab */}
                                    {newWasteSubmissionsCount > 0 && (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-red-600 text-white" : "bg-red-500 text-white"}`}>
                                            {newWasteSubmissionsCount} New
                                        </span>
                                    )}
                                </span>
                            )}
                            {tab === "categories" && "📂 Categories"}
                            {tab === "schedules" && "📅 Schedules"}
                            {tab === "Assign collector" && "🔧 Assign collector"}
                            {tab === "Collected waste" && "♻ Collected waste"}
                            {tab === "Pending submissions" && "⏳ Pending Submissions"}
                            {tab === "wastePrediction" && "📈 Waste Prediction "}
                            {tab === "collectorApplications" && (
                                <span className="flex justify-between items-center">
                                    <span>📩 Collector Applications</span>
                                    {newAppliesCount > 0 && (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-orange-600 text-white" : "bg-orange-500 text-white"}`}>
                                            {newAppliesCount}
                                        </span>
                                    )}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area (Scrollable) */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* ** TOP NAVBAR/HEADER (Sticky) ** */}
                <header className={`flex justify-between items-center px-6 py-4 shadow-md sticky top-0 z-10 ${sidebarBg}`}>
                    <h1 className="text-2xl font-semibold">
                        {formatTabTitle(activeTab)}
                    </h1>

                    <div className="flex items-center gap-4">
                        {/* ✅ NEW: Immediate Pickup Alert in Navbar */}
                        {immediatePickupCount > 0 && (
                            <button
                                onClick={() => setActiveTab("immediatePickups")}
                                className="flex items-center gap-2 p-2 rounded-lg bg-red-500 text-white font-bold animate-pulse shadow-lg hover:bg-red-600 transition-colors"
                            >
                                <FaBolt className="text-xl"/>
                                <span>{immediatePickupCount} URGENT PICKUP{immediatePickupCount > 1 ? 'S' : ''}</span>
                            </button>
                        )}
                        {/* END NEW ALERT */}

                        {/* Notification Icon and Counter */}
                        <button
                            onClick={() => setActiveTab("collectorApplications")} // Directs to the new applies tab
                            className="relative p-2 rounded-full transition-colors hover:opacity-80"
                        >
                            <span className="text-2xl">{isDark ? "🔔" : "🛎️"}</span>
                            {newAppliesCount > 0 && (
                                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                                    {newAppliesCount}
                                </span>
                            )}
                        </button>
                    </div>
                </header>
                {/* ** END TOP NAVBAR ** */}

                {/* Main Content Body (Scrolls below the Navbar) */}
                <main className="flex-1 p-6 overflow-y-auto">

                    {/* Dashboard */}
                    {activeTab === "dashboard" && (
                        <>
                            <div className="grid grid-cols-4 gap-6 mb-6">
                                <div className={`p-4 rounded-xl shadow text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                    <h3 className="text-gray-500">Users</h3>
                                    <p className="text-2xl font-bold text-blue-500">{users.length}</p>
                                </div>
                                <div className={`p-4 rounded-xl shadow text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                    <h3 className="text-gray-500">Collectors</h3>
                                    <p className="text-2xl font-bold text-purple-500">{collectors.length}</p>
                                </div>
                                <div className={`p-4 rounded-xl shadow text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                    <h3 className="text-gray-500">Active Submissions</h3>
                                    <p className="text-2xl font-bold text-green-500">{activeSubmissions.length}</p>
                                </div>
                                <div className={`p-4 rounded-xl shadow text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                    <h3 className="text-gray-500">Categories</h3>
                                    <p className="text-2xl font-bold text-teal-500">{categories.length}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div className={`p-4 rounded-xl shadow ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                    <h3 className="mb-2 font-semibold">Submissions Over Months</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <LineChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#555" : "#e0e0e0"} />
                                            <XAxis dataKey="name" stroke={isDark ? "#ccc" : "#888"} />
                                            <YAxis stroke={isDark ? "#ccc" : "#888"} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="submissions" stroke="#34d399" strokeWidth={3} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className={`p-4 rounded-xl shadow ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                    <h3 className="mb-2 font-semibold">Submissions by Category</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                dataKey="value"
                                                label
                                            >
                                                {/* Uses dynamic categoryData and colors */}
                                                {categoryData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Users */}
                    {activeTab === "users" && (
                        <div>
                            <div className={`overflow-x-auto rounded shadow ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={isDark ? "bg-gray-700" : "bg-blue-100"}>
                                        <tr>
                                            <th className="px-4 py-2 text-left">Name</th>
                                            <th className="px-4 py-2 text-left">Email</th>
                                            <th className="px-4 py-2 text-left">Phone</th>
                                            <th className="px-4 py-2 text-left">Address</th>
                                            <th className="px-4 py-2 text-left">Ward Number</th>
                                            <th className="px-4 py-2 text-left">House Number</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                                                <td className="px-4 py-2">{u.name}</td>
                                                <td className="px-4 py-2">{u.email}</td>
                                                <td className="px-4 py-2">{u.phone || "-"}</td>
                                                <td className="px-4 py-2">{u.address || "-"}</td>
                                                <td className="px-4 py-2">{u.wardNumber || "-"}</td>
                                                <td className="px-4 py-2">{u.houseNumber || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Collectors */}
                    {activeTab === "collectors" && (
                        <div>
                            <div className={`overflow-x-auto rounded shadow ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={isDark ? "bg-gray-700" : "bg-purple-100"}>
                                        <tr>
                                            <th className="px-4 py-2 text-left">Name</th>
                                            <th className="px-4 py-2 text-left">Email</th>
                                            <th className="px-4 py-2 text-left">Phone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {collectors.map(c => (
                                            <tr key={c._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                                                <td className="px-4 py-2">{c.name}</td>
                                                <td className="px-4 py-2">{c.email}</td>
                                                <td className="px-4 py-2">{c.phone || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {/* ** UPDATED TAB: Immediate Pickups ** */}
                    {activeTab === "immediatePickups" && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4 text-red-600">⚡ Urgent Immediate Pickups ({immediatePickupCount})</h2>
                            <p className={`mb-4 p-3 rounded-lg border-l-4 border-red-500 ${isDark ? "bg-gray-800" : "bg-red-50 text-red-800"}`}>
                                These are time-sensitive user requests where a collector needs prompt attention. Use the action column to manually assign/re-assign a collector.
                            </p>
                            <div className={`overflow-x-auto rounded shadow ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={isDark ? "bg-gray-700" : "bg-red-100"}>
                                        <tr>
                                            <th className="px-4 py-2 text-left">User</th>
                                            <th className="px-4 py-2 text-left">Category</th>
                                            <th className="px-4 py-2 text-left">Ward / House</th>
                                            <th className="px-4 py-2 text-left">Est. Weight (kg)</th>
                                            <th className="px-4 py-2 text-left">Requested Time</th>
                                            <th className="px-4 py-2 text-left">Status</th>
                                            <th className="px-4 py-2 text-left w-64">Action: Assign Collector</th> {/* Increased width for dropdown + button */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Filter logic here ensures only unassigned items are shown */}
                                        {immediatePickups.length > 0 ? (
                                            immediatePickups.map(s => (
                                                <tr key={s._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-red-50"}>
                                                    <td className="px-4 py-2">{s.user_id?.name || "-"}</td>
                                                    <td className="px-4 py-2">{s.category}</td>
                                                    <td className="px-4 py-2">{`${s.user_id?.wardNumber || "-"} / ${s.user_id?.houseNumber || "-"}`}</td>
                                                    <td className="px-4 py-2 font-bold text-red-500">{s.weight || "N/A"}</td>
                                                    <td className="px-4 py-2 text-sm">{new Date(s.scheduled_date).toLocaleString()}</td>
                                                    <td className="px-4 py-2">
                                                        {/* Status should reflect its unassigned state, which is now 'pending' or 'new' */}
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700`}>
                                                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)} (Unassigned)
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 flex gap-2 items-center">
                                                        <select
                                                            value={manualCollectorId[s._id] || ""}
                                                            onChange={(e) => setManualCollectorId(prev => ({ ...prev, [s._id]: e.target.value }))}
                                                            className={`px-2 py-1 border rounded text-sm flex-grow ${isDark ? "bg-gray-700 text-white border-gray-600" : "bg-white"}`}
                                                        >
                                                            <option value="">Select Collector</option>
                                                            {collectors.map((col) => (
                                                                <option key={col._id} value={col._id}>
                                                                    {col.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => assignCollectorToSubmission(s._id, manualCollectorId[s._id])}
                                                            disabled={!manualCollectorId[s._id]}
                                                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                                                manualCollectorId[s._id] ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-400 text-gray-700 cursor-not-allowed"
                                                            }`}
                                                        >
                                                            Assign
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center px-4 py-4 text-gray-500">
                                                    No immediate pickup requests currently pending assignment. Great work!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {/* ** END UPDATED TAB ** */}

                    {/* Collector Applications (VIEW APPLYS) */}
                    {activeTab === "collectorApplications" && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">📩 New Collector Applications (View Applies)</h2>
                            <div className={`overflow-x-auto rounded shadow ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={isDark ? "bg-gray-700" : "bg-orange-100"}>
                                        <tr>
                                            <th className="px-4 py-2 text-left">Name</th>
                                            <th className="px-4 py-2 text-left">Email</th>
                                            <th className="px-4 py-2 text-left">Phone</th>
                                            <th className="px-4 py-2 text-left">Address</th>
                                            <th className="px-4 py-2 text-left">Applied Date</th>
                                            <th className="px-4 py-2 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {collectorApplies.length > 0 ? (
                                            collectorApplies.map(c => (
                                                <tr key={c._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                                                    <td className="px-4 py-2">{c.name || "-"}</td>
                                                    <td className="px-4 py-2">{c.email || "-"}</td>
                                                    <td className="px-4 py-2">{c.phone || "-"}</td>
                                                    <td className="px-4 py-2">{c.address || "-"}</td>
                                                    <td className="px-4 py-2 text-orange-500 font-semibold">{new Date(c.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-4 py-2 flex gap-2">
                                                        <button
                                                            onClick={() => approveCollectorApply(c._id, c)}
                                                            className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => rejectCollectorApply(c._id)}
                                                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                                        >
                                                            Reject
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center px-4 py-4 text-gray-500">
                                                    No new collector applications at this time.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Waste Submissions (New Applies Page) */}
                    {activeTab === "submissions" && (
                        <div>
                            <div className={`overflow-x-auto rounded shadow ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={isDark ? "bg-gray-700" : "bg-green-100"}>
                                        <tr>
                                            <th className="px-4 py-2 text-left">User</th>
                                            <th className="px-4 py-2 text-left">Category</th>
                                            <th className="px-4 py-2 text-left">Ward Number</th>
                                            <th className="px-4 py-2 text-left">House Number</th>
                                            <th className="px-4 py-2 text-left">Date</th>
                                            <th className="px-4 py-2 text-left">Status</th>
                                            <th className="px-4 py-2 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {wasteSubmissions
                                            // Filter: Only waste submissions NOT collected, and often not approved/pending for 'New'
                                            .filter(s => s.status?.toLowerCase() !== "collected" && s.status?.toLowerCase() !== "pending")
                                            .map(s => (
                                                <tr key={s._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                                                    <td className="px-4 py-2">{s.user_id?.name || "-"}</td>
                                                    <td className="px-4 py-2">{s.category}</td>
                                                    <td className="px-4 py-2">{s.user_id?.wardNumber || "-"}</td>
                                                    <td className="px-4 py-2">{s.user_id?.houseNumber || "-"}</td>
                                                    <td className="px-4 py-2">{new Date(s.scheduled_date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-2">{s.status}</td>
                                                    <td className="px-4 py-2 flex gap-2">
                                                        {/* Actions for New Waste Submissions (e.g., approve/reject unhandled) */}
                                                        {s.status?.toLowerCase() === "new" || s.status?.toLowerCase() === "unhandled" ? (
                                                            <>
                                                                <button
                                                                    onClick={() => updateWasteSubmissionStatus(s._id, "approved")}
                                                                    className="px-2 py-1 bg-green-500 text-white rounded"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => updateWasteSubmissionStatus(s._id, "rejected")}
                                                                    className="px-2 py-1 bg-red-500 text-white rounded"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        ) : <span className="text-gray-500">—</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "categories" && (
                        <div>
                            <Category />
                        </div>
                    )}

                    {/* Schedules Tab (Filtered to hide 'collected' status) */}
                    {activeTab === "schedules" && (
                        <div>
                            <h3 className="text-2xl font-bold mb-4">📅 Active Collection Schedules</h3>

                            {/* Category filter */}
                            <div className="mb-4">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className={`px-3 py-2 border rounded ${isDark ? "bg-gray-700 text-white border-gray-600" : ""}`}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((c) => (
                                        <option key={c._id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Collector filter */}
                            <div className="mb-4 flex items-center gap-3">
                                <label className="font-semibold">Filter by Collector:</label>
                                <select
                                    value={assignedCollectorFilter}
                                    onChange={(e) => setAssignedCollectorFilter(e.target.value)}
                                    className={`px-3 py-2 border rounded ${isDark ? "bg-gray-700 text-white border-gray-600" : ""}`}
                                >
                                    <option value="">All Collectors</option>
                                    {collectors.map((c) => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Assigned Schedules */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {wasteSubmissions
                                    .filter(
                                        (s) =>
                                            s.collector_id &&
                                            s.status?.toLowerCase() !== "collected" &&
                                            (!selectedCategory || s.category === selectedCategory) &&
                                            (!assignedCollectorFilter || s.collector_id._id === assignedCollectorFilter)
                                    )
                                    .map((s) => (
                                        <div key={s._id} className={`p-3 rounded shadow ${isDark ? "bg-gray-700" : "bg-white"}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{s.category}</span>
                                                <span className="text-gray-500">{new Date(s.scheduled_date).toLocaleDateString()}</span>
                                            </div>
                                            <p><strong>User:</strong> {s.user_id?.name || "-"}</p>
                                            <p><strong>Ward Number:</strong> {s.user_id?.wardNumber || "-"}</p>
                                            <p><strong>House Number:</strong> {s.user_id?.houseNumber || "-"}</p>
                                            <p><strong>Collector:</strong> {s.collector_id?.name || "-"}</p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Assign Collector Tab */}
                    {activeTab === "Assign collector" && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">🔧 Assign Collector</h2>

                            {/* ASSIGNMENT FORM */}
                            <div className={`p-6 rounded shadow mb-8 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <h3 className="text-xl font-semibold mb-3">New Assignment</h3>
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();

                                        const categoryObj = categories.find(c => c._id === selectedCategory);
                                        const collectorObj = collectors.find(c => c._id === collectorId);

                                        if (!wardNumber || !categoryObj || !collectorObj) {
                                            alert("Please select a valid Ward Number, Category, and Collector.");
                                            return;
                                        }

                                        const targetWardString = String(wardNumber);
                                        const assignmentKey = `${targetWardString}-${selectedCategory}`;

                                        const currentCollectorId = wardCategoryAssignments[assignmentKey];

                                        // 1. --- Overwrite Confirmation Logic ---
                                        if (currentCollectorId && currentCollectorId !== collectorId) {
                                            const currentCollector = collectors.find(c => c._id === currentCollectorId);
                                            const confirmOverwrite = window.confirm(
                                                `⚠️ WARNING: Ward ${targetWardString} for ${categoryObj.name} is currently assigned to ${currentCollector.name}. Do you want to OVERWRITE this assignment?`
                                            );
                                            if (!confirmOverwrite) return;
                                        } else if (currentCollectorId === collectorId) {
                                            const existingGlobalAssignment = Object.keys(wardCategoryAssignments).find(key => {
                                                const [ward, catId] = key.split('-');
                                                return String(ward) === targetWardString &&
                                                    wardCategoryAssignments[key] === collectorId &&
                                                    catId !== selectedCategory;
                                                });

                                            if (!existingGlobalAssignment) {
                                                alert(`Collector ${collectorObj.name} is already assigned to Ward ${targetWardString} for ${categoryObj.name}. No change was made.`);
                                                return;
                                            }
                                        }
                                        // -----------------------------------------------------------------

                                        try {
                                            // 2. Send assignment to backend (backend handles cleanup)
                                            await axios.post(
                                                "http://localhost:4321/api/user/assign",
                                                { wardNumber, categoryId: selectedCategory, collectorId },
                                                getAuthHeaders()
                                            );

                                            // 3. --- Frontend State Update Logic to Mirror Backend Action (NEW RULE) ---
                                            setWardCategoryAssignments(prev => {
                                                let newAssignments = { ...prev };

                                                const keysToRemove = Object.keys(newAssignments).filter(key => {
                                                    const [ward, catId] = key.split('-');
                                                    return String(ward) === targetWardString &&
                                                        newAssignments[key] === collectorId &&
                                                        catId !== selectedCategory;
                                                    });

                                                keysToRemove.forEach(key => {
                                                    delete newAssignments[key];
                                                });

                                                newAssignments[assignmentKey] = collectorId;

                                                return newAssignments;
                                            });
                                            // --- END Frontend State Update Logic ---

                                            alert(`✅ ${collectorObj.name} successfully assigned to Ward ${targetWardString} for ${categoryObj.name}. The collector's previous category assignment in this ward, if any, was removed.`);

                                            // Clear form
                                            setWardNumber("");
                                            setCollectorId("");
                                            setSelectedCategory("");

                                        } catch (err) {
                                            console.error(err.response?.data || err);
                                            alert(err.response?.data?.message || "❌ Failed to assign collector");
                                        }
                                    }}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="mb-4">
                                            <label className="block font-semibold mb-1">Ward Number</label>
                                            <input
                                                type="text"
                                                value={wardNumber}
                                                onChange={(e) => setWardNumber(e.target.value)}
                                                className={`w-full px-3 py-2 border rounded ${isDark ? "bg-gray-700 text-white border-gray-600" : ""}`}
                                                required
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block font-semibold mb-1">Category</label>
                                            <select
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                                className={`w-full px-3 py-2 border rounded ${isDark ? "bg-gray-700 text-white border-gray-600" : ""}`}
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map((c) => (
                                                    <option key={c._id} value={c._id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block font-semibold mb-1">Collector</label>
                                            <select
                                                value={collectorId}
                                                onChange={(e) => setCollectorId(e.target.value)}
                                                className={`w-full px-3 py-2 border rounded ${isDark ? "bg-gray-700 text-white border-gray-600" : ""}`}
                                                required
                                            >
                                                <option value="">Select Collector</option>
                                                {collectors.map((col) => (
                                                    <option key={col._id} value={col._id}>
                                                        {col.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className={`px-4 py-2 rounded ${isDark ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-400 text-white hover:bg-blue-500"}`}
                                    >
                                        Assign Collector
                                    </button>
                                </form>
                            </div>

                            <hr className={`my-6 ${isDark ? "border-gray-700" : "border-gray-300"}`} />

                            {/* CURRENT ASSIGNMENTS LIST */}
                            <h2 className="text-2xl font-bold mb-4">Current Collector Assignments</h2>
                            <div className={`overflow-x-auto rounded shadow ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={isDark ? "bg-gray-700" : "bg-blue-100"}>
                                        <tr>
                                            <th className="px-4 py-2 text-left w-1/5">Ward Number</th>
                                            <th className="px-4 py-2 text-left w-1/5">Category</th>
                                            <th className="px-4 py-2 text-left w-2/5">Assigned Collector</th>
                                            <th className="px-4 py-2 text-left w-1/6">Active Submissions</th>
                                            <th className="px-4 py-2 text-left w-1/6">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentAssignmentsList.map((assignment, index) => (
                                            <tr key={`${assignment.ward}-${assignment.category}`} className={index % 2 === 0 ? (isDark ? "bg-gray-800" : "bg-white") : (isDark ? "bg-gray-700" : "bg-gray-50")}>
                                                <td className="px-4 py-2 font-semibold">{assignment.ward}</td>
                                                <td className="px-4 py-2">{assignment.category}</td>
                                                <td className="px-4 py-2 text-blue-500">{assignment.collectorName}</td>
                                                <td className="px-4 py-2">{assignment.activeSubmissionsCount}</td>
                                                <td className="px-4 py-2">
                                                    <button
                                                        onClick={() => deleteAssignment(
                                                            assignment.ward,
                                                            assignment.categoryId,
                                                            assignment.collectorName
                                                        )}
                                                        className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {currentAssignmentsList.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center px-4 py-4 text-gray-500">
                                                    No active Ward/Category assignments found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    )}

                    {/* UPDATED TAB: Waste Prediction (Next Month) */}
                    {activeTab === "wastePrediction" && (
                        <div>
                            <h2 className="text-3xl font-bold mb-6 text-blue-500">📈 Ward Collection Forecast</h2>
                            
                            <div className="mb-6">
                                <p className={`font-semibold text-lg p-3 rounded-lg ${isDark ? "bg-gray-700" : "bg-blue-50"}`}>
                                    Forecast is based on submissions from the past 3 months to predict the **{wastePredictions.month || 'Next Month'}** collection need.
                                </p>
                            </div>


                            <button
                                onClick={fetchWastePredictions}
                                disabled={isPredicting}
                                className={`px-5 py-2 mb-6 rounded-lg font-bold transition-colors shadow-lg ${
                                    isPredicting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                            >
                                {isPredicting ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg>
                                        Predicting...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        Run Next Month's Ward Collection Prediction
                                    </span>
                                )}
                            </button>


                            {wastePredictions.predictions.length > 0 ? (
                                <>
                                    {/* NEW CHART SECTION: Stacked Bar Chart for Ward/Category Frequency */}
                                    <h3 className="text-xl font-semibold mb-4">Predicted Monthly Collection Frequency by Ward & Category</h3>
                                    <div className={`p-4 rounded-xl shadow mb-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#555" : "#e0e0e0"} />
                                                <XAxis 
                                                    dataKey="ward" 
                                                    stroke={isDark ? "#ccc" : "#888"} 
                                                    angle={-15} 
                                                    textAnchor="end" 
                                                    height={50}
                                                />
                                                <YAxis 
                                                    stroke={isDark ? "#ccc" : "#888"} 
                                                    label={{ value: 'Total Submissions (Last 3 Months)', angle: -90, position: 'insideLeft', fill: isDark ? "#ccc" : "#888" }}
                                                    tickFormatter={(value) => Math.round(value)}
                                                />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: isDark ? '#374151' : '#fff', border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`, color: isDark ? '#fff' : '#000' }}
                                                    formatter={(value, name) => [`${Math.round(value)} submissions`, name]}
                                                />
                                                <Legend />
                                                {/* Map Bars for each unique category found in the data */}
                                                {uniqueCategories.map((category, index) => (
                                                    <Bar 
                                                        key={category}
                                                        dataKey={category} 
                                                        stackId="a" 
                                                        fill={COLORS[index % COLORS.length]} 
                                                        name={category}
                                                    />
                                                ))}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* END CHART SECTION */}
                                    
                                    {/* PREDICTION TABLE */}
                                    <div className={`overflow-x-auto rounded-xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className={isDark ? "bg-gray-700" : "bg-blue-100"}>
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Ward Number</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Predicted Top Category</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Expected Frequency (Based on Last 3 Months)</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Total Submissions (3 Months)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {wastePredictions.predictions.map((p, index) => (
                                                    <tr
                                                        key={p.wardNumber}
                                                        className={index % 2 === 0 ? (isDark ? "bg-gray-800" : "bg-white") : (isDark ? "bg-gray-700" : "bg-gray-50")}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-400">{`Ward ${p.wardNumber}`}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-green-500">{p.expectedCategory || 'N/A'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-500">{p.expectedFrequency || 'N/A'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{p.totalWardSubmissions || 0}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : !isPredicting && (
                                <div className={`p-6 border-l-4 border-yellow-500 ${isDark ? "bg-gray-800 text-gray-400" : "bg-yellow-50 text-yellow-700"} rounded-lg`}>
                                    <p className="font-medium">No monthly prediction data available.</p>
                                    <p className="text-sm">Click the button above to generate the forecast and view the chart.</p>
                                </div>
                            )}
                        </div>
                    )}
                    {/* END UPDATED TAB: Waste Prediction */}

                    {/* Collected Waste (Shows ONLY collected items) */}
                    {activeTab === "Collected waste" && (
                        <div>
                            <div className={`overflow-x-auto rounded shadow ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                                    <thead className={isDark ? "bg-gray-700" : "bg-teal-100"}>
                                        <tr>
                                            <th className="px-4 py-2 text-left w-1/6">User Name</th>
                                            <th className="px-4 py-2 text-left w-1/12">Ward Number</th>
                                            <th className="px-4 py-2 text-left w-1/12">House Number</th>
                                            <th className="px-4 py-2 text-left w-1/6">Collector</th>
                                            <th className="px-4 py-2 text-left w-1/6">Category</th>
                                            <th className="px-4 py-2 text-left w-1/12">Quantity</th>
                                            <th className="px-4 py-2 text-left w-1/6">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {wasteSubmissions
                                            // Filter: Only include waste submissions with 'collected' status
                                            .filter(s => s.status?.toLowerCase() === "collected")
                                            .map(s => (
                                                <tr key={s._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                                                    <td className="px-4 py-2">{s.user_id?.name || "-"}</td>
                                                    <td className="px-4 py-2">{s.user_id?.wardNumber || "-"}</td>
                                                    <td className="px-4 py-2">{s.user_id?.houseNumber || "-"}</td>
                                                    <td className="px-4 py-2">{s.collector_id?.name || "-"}</td>
                                                    <td className="px-4 py-2">{s.category}</td>
                                                    <td className="px-4 py-2">{s.quantity || "-"}</td>
                                                    <td className="px-4 py-2">{new Date(s.scheduled_date).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        {wasteSubmissions.filter(s => s.status?.toLowerCase() === "collected").length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="text-center px-4 py-2 text-gray-500">
                                                    No collected waste submissions yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pending Submissions Tab */}
                    {activeTab === "Pending submissions" && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">⏳ Pending Submissions (Collector Deferred)</h2>
                            <div className={`overflow-x-auto rounded shadow ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                                    <thead className={isDark ? "bg-gray-700" : "bg-yellow-100"}>
                                        <tr>
                                            <th className="px-4 py-2 text-left w-1/6">User Name</th>
                                            <th className="px-4 py-2 text-left w-1/12">Ward</th>
                                            <th className="px-4 py-2 text-left w-1/6">Category</th>
                                            <th className="px-4 py-2 text-left w-1/6">Assigned Collector</th>
                                            <th className="px-4 py-2 text-left w-1/6">Date</th>
                                            <th className="px-4 py-2 text-left w-1/4">Pending Reason</th>
                                            <th className="px-4 py-2 text-left w-1/12">Action</th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        {wasteSubmissions
                                            // Filter: Only show waste submissions with 'pending' status
                                            .filter(s => s.status?.toLowerCase() === "pending")
                                            .map(s => (
                                                <tr key={s._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                                                    <td className="px-4 py-2">{s.user_id?.name || "-"}</td>
                                                    <td className="px-4 py-2">{s.user_id?.wardNumber || "-"}</td>
                                                    <td className="px-4 py-2">{s.category}</td>
                                                    <td className="px-4 py-2">{s.collector_id?.name || "-"}</td>
                                                    <td className="px-4 py-2">{new Date(s.scheduled_date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-2 text-red-500 font-semibold">{s.pendingReason || "No reason provided"}</td>
                                                    <td className="px-4 py-2">
                                                        <button
                                                            onClick={() => updateWasteSubmissionStatus(s._id, "approved")}
                                                            className="px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                                                        >
                                                            Re-Approve
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        {wasteSubmissions.filter(s => s.status?.toLowerCase() === "pending").length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="text-center px-4 py-2 text-gray-500">
                                                    No submissions are currently pending.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

export default WasteManagement;