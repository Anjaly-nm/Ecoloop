import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Category from "./Category";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar
} from "recharts";
import { useNavigate } from "react-router-dom";
import { FaBolt, FaHome, FaUsers, FaTruck, FaBoxOpen, FaClipboardList, FaCalendarAlt, FaTools, FaRecycle, FaHistory, FaChartLine, FaEnvelope } from 'react-icons/fa'; // Added more icons for aesthetics

// --- CONSTANTS ---
const COLORS = ["#059669", "#1d4ed8", "#f59e0b", "#9333ea", "#ef4444", "#0d9488", "#fb923c"]; // More vibrant and diverse colors
const ASSIGNMENTS_STORAGE_KEY = "wardCategoryAssignments";

// 🧠 CLASSIFICATION FUNCTION (MATCHES BACKEND LOGIC)
function classifyUserActivity(user) {
    const daysSinceLastSubmission = user.lastSubmissionDate
        ? Math.floor((Date.now() - new Date(user.lastSubmissionDate).getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;

    if (user.submissionCount > 4 && daysSinceLastSubmission < 7) {
        return "Active";
    } else if (user.submissionCount > 2 && daysSinceLastSubmission < 15) {
        return "Moderate";
    } else {
        return "Inactive";
    }
}

// 🟢 HELPER FUNCTION: To correctly process the new backend data structure.
const transformPredictionDataForChart = (predictions) => {
    // 1. Group predictions by Ward Number and aggregate all categories present in the last month
    const predictionsByWard = predictions.reduce((acc, p) => {
        const wardKey = `Ward ${p.wardNumber}`;
        if (!acc[wardKey]) {
            acc[wardKey] = { ward: wardKey };
        }

        if (p.categoriesInLastMonth && p.categoriesInLastMonth.length > 0) {
            p.categoriesInLastMonth.forEach(cat => {
                acc[wardKey][cat.name] = (acc[wardKey][cat.name] || 0) + cat.count;
            });
        }
        return acc;
    }, {});

    // 2. Collect all unique categories across all aggregated data
    const allCategoryNames = new Set(predictions.flatMap(p =>
        p.categoriesInLastMonth ? p.categoriesInLastMonth.map(c => c.name) : []
    ));
    const uniqueCategories = Array.from(allCategoryNames).sort();

    // 3. Convert the map values to a sorted array format for Recharts
    const chartData = Object.values(predictionsByWard)
        .map(item => {
            uniqueCategories.forEach(cat => {
                if (item[cat] === undefined) {
                    item[cat] = 0;
                }
            });
            return item;
        })
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

    const [collectorApplies, setCollectorApplies] = useState([]);

    // --- Prediction States ---
    const [wastePredictions, setWastePredictions] = useState({
        month: "",
        predictions: []
    });
    const [isPredicting, setIsPredicting] = useState(false);
    // -----------------------------

    const [wardCategoryAssignments, setWardCategoryAssignments] = useState({});

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
        const API_BASE = window.location.hostname === 'localhost' ? "http://localhost:4321/api" : "/api";
        console.log("🔄 Synchronizing Admin Data...");

        // Helper to fetch data safely
        const safeFetch = async (url, setter, extractor) => {
            try {
                const res = await axios.get(url, authHeaders);
                setter(extractor ? extractor(res.data) : res.data);
            } catch (err) {
                console.warn(`⚠️ Failed to fetch from ${url}:`, err.message);
            }
        };

        try {
            const resUsers = await axios.get(`${API_BASE}/user/viewusers`, authHeaders);
            const rawData = resUsers.data.data || resUsers.data || [];
            const classified = rawData.map(u => ({
                ...u,
                activityStatus: u.role?.toLowerCase() === 'user' ? classifyUserActivity(u) : 'N/A'
            }));
            setUsers(classified.filter(u => u.role?.toLowerCase() === "user"));
            setCollectors(classified.filter(u => u.role?.toLowerCase() === "collector"));
        } catch (err) { console.error("❌ Users Fetch Error:", err.message); }

        // 2. Fetch Assignments (Source of Truth)
        try {
            const res = await axios.get(`${API_BASE}/user/collector-assignments`, authHeaders);
            const list = res.data.assignments || [];
            const map = {};
            list.forEach(a => {
                if (a.wardNumber && a.collectorId) {
                    map[String(a.wardNumber).trim()] = a.collectorId._id || a.collectorId;
                }
            });
            setWardCategoryAssignments(map);
            console.log("✅ Assignments Sync:", Object.keys(map).length, "wards");
        } catch (err) { console.error("❌ Assignments Fetch Error:", err.message); }

        // 3. Fetch Other Data independently
        await safeFetch(`${API_BASE}/user/view-applications`, setCollectorApplies, d => d);

        await safeFetch(`${API_BASE}/category/categories`, setCategories, d => (d.categories || d || []));

        try {
            const resSubs = await axios.get(`${API_BASE}/user/viewsubmissions`, authHeaders);
            const subs = (resSubs.data.submissions || resSubs.data || []).map(s => ({ ...s, pendingReason: s.pendingReason || '' }));
            setWasteSubmissions(subs);

            // Sync manual lookup for immediate pickups
            const initialManualIds = {};
            subs.filter(s => s.weight && !s.collector_id).forEach(s => { initialManualIds[s._id] = ""; });
            setManualCollectorId(initialManualIds);
        } catch (err) { console.error("❌ Submissions Fetch Error:", err.message); }

    }, [getAuthHeaders]);

    // 🟢 UPDATED: This function is now set up to handle the new backend response structure.
    const fetchWastePredictions = useCallback(async () => {
        setIsPredicting(true);
        setWastePredictions({ month: "", predictions: [] });
        const authHeaders = getAuthHeaders();
        const API_BASE = window.location.hostname === 'localhost' ? "http://localhost:4321/api" : "/api";

        const predictionUrl = `${API_BASE}/user/predict-next-month`;

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

    // Handled by fetchData from DB

    const updateWasteSubmissionStatus = async (id, newStatus) => {
        try {
            const API_BASE = window.location.hostname === 'localhost' ? "http://localhost:4321/api" : "/api";
            const res = await axios.put(
                `${API_BASE}/user/updatestatus/${id}`,
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

        const collectorObj = collectors.find(c => String(c._id) === String(collectorId));
        const collectorName = collectorObj?.name || "a collector";

        if (!window.confirm(`Are you sure you want to assign ${collectorName} to this urgent pickup?`)) {
            return;
        }

        try {
            const API_BASE = window.location.hostname === 'localhost' ? "http://localhost:4321/api" : "/api";
            // Call the new backend route, passing the collectorId AND setting the status to 'approved'
            await axios.put(
                `${API_BASE}/user/assign-to-submission/${submissionId}`,
                { collectorId, status: "approved" },
                getAuthHeaders()
            );

            // Update the local state to reflect the assignment and the 'approved' status
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
            const API_BASE = window.location.hostname === 'localhost' ? "http://localhost:4321/api" : "/api";
            // 1. Send approval request to backend
            await axios.post(
                `${API_BASE}/user/approve-collector/${appId}`,
                // Sending the required data, although the backend mostly relies on the ID
                { name: application.name, email: application.email, phone: application.phone, address: application.address },
                getAuthHeaders()
            );

            // 🟢 FRONTEND FIX: Immediately remove the item from the pending list in the local state.
            setCollectorApplies(prev => prev.filter(app => app._id !== appId));

            // 2. Re-fetch all data (CRITICAL: to get the new collector in the 'collectors' list)
            await fetchData();

            alert(`✅ Collector ${application.name} approved. The new collector is now visible in the Collectors tab.`);
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
            const API_BASE = window.location.hostname === 'localhost' ? "http://localhost:4321/api" : "/api";
            await axios.post(
                `${API_BASE}/user/reject-collector/${appId}`,
                { adminRemarks: "Application rejected by admin" },
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

            alert(`✅ Successfully approved ${successfulUpdates.length} waste submissions. They are now visible in the Submissions tab.`);
            // Automatically switch to the Submissions tab after approval
            setActiveTab("submissions");

        } catch (err) {
            alert("Failed to process bulk approval.");
        }
    };

    const newAppliesCount = collectorApplies.filter(a => a.status?.toLowerCase() === 'pending').length;

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

    const deleteAssignment = async (ward, collectorName) => {
        if (!window.confirm(`Are you sure you want to remove ${collectorName} from Ward ${ward}?`)) {
            return;
        }

        try {
            const API_BASE = window.location.hostname === 'localhost' ? "http://localhost:4321/api" : "/api";
            const res = await axios.post(
                `${API_BASE}/user/unassign`,
                { wardNumber: ward },
                getAuthHeaders()
            );

            // Re-fetch data from backend to ensure state is perfectly in sync
            await fetchData();
            alert(res.data.message || `✅ Collector removed from Ward ${ward}.`);

        } catch (err) {
            console.error("Unassign Error:", err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || err.message;
            alert(`❌ Failed to remove assignment: ${errorMsg}`);
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
    Object.entries(wardCategoryAssignments).forEach(([ward, collector_id]) => {
        // Robust ID comparison
        const collectorObj = collectors.find(c => String(c._id) === String(collector_id));

        if (ward) {
            currentAssignmentsMap[ward] = {
                ward,
                collectorId: collector_id,
                collectorName: collectorObj ? collectorObj.name : "Unknown Collector",
                activeSubmissionsCount: 0,
            };
        }
    });

    wasteSubmissions
        .filter(s => s.status?.toLowerCase() !== "collected")
        .forEach(s => {
            const ward = String(s.user_id?.wardNumber);
            if (currentAssignmentsMap[ward]) {
                currentAssignmentsMap[ward].activeSubmissionsCount++;
            }
        });

    const currentAssignmentsList = Object.values(currentAssignmentsMap).sort((a, b) => {
        const wardA = parseInt(a.ward) || 0;
        const wardB = parseInt(b.ward) || 0;
        return wardA - wardB;
    });
    // --- END CORE LOGIC ---

    // 🟢 UPDATED: Get the chart data and unique categories needed for the Bar chart
    const { chartData, uniqueCategories } = transformPredictionDataForChart(wastePredictions.predictions);

    const isDark = theme === "dark";
    // Tweak to primary color palette
    const bgMain = isDark ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-800";
    const sidebarBg = isDark ? "bg-gray-800" : "bg-white";
    const buttonBase = isDark ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300";
    const primaryColor = "text-indigo-600";
    const primaryBg = "bg-indigo-600";
    const hoverPrimaryBg = "hover:bg-indigo-700";

    // Helper to format the tab title for the Navbar
    const formatTabTitle = (tab) => {
        return tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([a-z])([A-Z])/g, '$1 $2');
    };

    // Helper to get color/class for activity status
    const getActivityStatusClass = (status) => {
        switch (status) {
            case "Active": return "bg-green-500 text-white font-bold";
            case "Moderate": return "bg-yellow-500 text-gray-900 font-bold";
            case "Inactive": return "bg-red-500 text-white font-bold";
            default: return "bg-gray-500 text-white";
        }
    };

    // Sidebar navigation map with icons
    const navItems = [
        { key: "dashboard", label: "Dashboard", icon: FaHome, iconColor: "text-indigo-400" },
        { key: "users", label: "Users", icon: FaUsers, iconColor: "text-blue-400" },
        { key: "collectors", label: "Collectors", icon: FaTruck, iconColor: "text-purple-400" },
        {
            key: "immediatePickups",
            label: "Immediate Pickups",
            icon: FaBolt,
            iconColor: "text-red-500",
            alertCount: immediatePickupCount
        },
        {
            key: "submissions",
            label: "Waste Submissions",
            icon: FaBoxOpen,
            iconColor: "text-green-500",
            alertCount: newWasteSubmissionsCount
        },
        { key: "categories", label: "Categories", icon: FaClipboardList, iconColor: "text-teal-400" },
        { key: "schedules", label: "Schedules", icon: FaCalendarAlt, iconColor: "text-orange-400" },
        { key: "Assign collector", label: "Assign Collector", icon: FaTools, iconColor: "text-indigo-400" },
        { key: "Collected waste", label: "Collected Waste", icon: FaRecycle, iconColor: "text-green-500" },
        { key: "Pending submissions", label: "Pending Submissions", icon: FaHistory, iconColor: "text-yellow-400" },
        { key: "wastePrediction", label: "Waste Prediction", icon: FaChartLine, iconColor: "text-blue-500" },
        {
            key: "collectorApplications",
            label: "Collector Applications",
            icon: FaEnvelope,
            iconColor: "text-pink-500",
            alertCount: newAppliesCount
        }
    ];

    return (
        <div className={`flex h-screen font-sans ${bgMain}`}>
            {/* Sidebar (Enhanced design) */}
            <aside className={`w-72 p-5 flex flex-col ${sidebarBg} shadow-2xl z-20 flex-shrink-0`}>
                <h2 className="text-3xl font-extrabold mb-6 flex items-center gap-2">
                    <span className={primaryColor}>ECO</span><span className="text-xl">Admin</span>
                </h2>

                {/* Theme Toggle Button */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className={`mb-4 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${isDark ? "bg-gray-700 text-yellow-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                    {theme === "light" ? "🌙" : "☀️"}
                </button>

                <button
                    onClick={() => navigate("/Adminpage")}
                    className={`w-full text-left px-3 py-2 mb-4 rounded-xl font-medium transition-transform transform hover:scale-[1.02] ${buttonBase} flex items-center gap-3`}
                >
                    <FaHome className="text-lg text-red-500" />
                    🏡
                </button>

                {/* ** APPROVE WASTE SUBMISSIONS BUTTON (Vibrant Green) ** */}
                {newWasteSubmissionsCount > 0 && (
                    <button
                        onClick={approveAllNewWasteSubmissions}
                        className="w-full text-left px-4 py-3 mb-4 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-all duration-300 shadow-lg shadow-green-500/50 flex items-center justify-center transform hover:scale-[1.02]"
                    >
                        <span className="mr-2">✅ Bulk Approve</span>
                        <span className="bg-white text-green-700 rounded-full w-7 h-7 flex items-center justify-center text-xs font-extrabold border-2 border-green-600">
                            {newWasteSubmissionsCount}
                        </span>
                    </button>
                )}
                {/* ** END APPROVE WASTE SUBMISSIONS BUTTON ** */}

                {/* Navigation Menu (Enhanced active state) */}
                <nav className="space-y-1 flex-grow overflow-y-auto pb-4">
                    {navItems.map(item => (
                        <button
                            key={item.key}
                            onClick={() => setActiveTab(item.key)}
                            className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-between gap-2 ${activeTab === item.key
                                ? `bg-indigo-100 ${primaryColor} font-bold shadow-sm ${isDark ? "bg-indigo-900/50" : ""}`
                                : isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            <span className="flex items-center gap-3">
                                <item.icon className={`text-lg ${item.iconColor}`} />
                                {item.label}
                            </span>
                            {item.alertCount > 0 && (
                                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${item.key === 'immediatePickups' ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white'}`}>
                                    {item.alertCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area (Scrollable) */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* ** TOP NAVBAR/HEADER (Refined) ** */}
                <header className={`flex justify-between items-center px-8 py-5 shadow-lg sticky top-0 z-10 ${sidebarBg} border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                    <h1 className="text-3xl font-extrabold">
                        {formatTabTitle(activeTab)}
                    </h1>

                    <div className="flex items-center gap-4">
                        {/* ✅ NEW: Immediate Pickup Alert in Navbar */}
                        {immediatePickupCount > 0 && (
                            <button
                                onClick={() => setActiveTab("immediatePickups")}
                                className="flex items-center gap-2 p-2 rounded-xl bg-red-600 text-white font-bold animate-pulse shadow-xl shadow-red-500/50 hover:bg-red-700 transition-colors transform hover:scale-105"
                            >
                                <FaBolt className="text-xl" />
                                <span>{immediatePickupCount} URGENT PICKUP{immediatePickupCount > 1 ? 'S' : ''}</span>
                            </button>
                        )}
                        {/* END NEW ALERT */}

                        {/* Notification Icon and Counter */}
                        <button
                            onClick={() => setActiveTab("collectorApplications")} // Directs to the new applies tab
                            className={`relative p-3 rounded-full transition-colors ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                        >
                            <span className="text-2xl text-pink-500">
                                <FaEnvelope />
                            </span>
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
                <main className="flex-1 p-8 overflow-y-auto">

                    {/* Dashboard (Enhanced Cards) */}
                    {activeTab === "dashboard" && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className={`p-6 rounded-2xl shadow-xl transition-transform transform hover:scale-105 border-b-4 border-blue-500 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                    <h3 className="text-lg font-semibold text-gray-500 flex items-center gap-2"><FaUsers className="text-blue-500" /> Total Users</h3>
                                    <p className="text-4xl font-extrabold text-blue-500 mt-2">{users.length}</p>
                                </div>
                                <div className={`p-6 rounded-2xl shadow-xl transition-transform transform hover:scale-105 border-b-4 border-purple-500 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                    <h3 className="text-lg font-semibold text-gray-500 flex items-center gap-2"><FaTruck className="text-purple-500" /> Active Collectors</h3>
                                    <p className="text-4xl font-extrabold text-purple-500 mt-2">{collectors.length}</p>
                                </div>
                                <div className={`p-6 rounded-2xl shadow-xl transition-transform transform hover:scale-105 border-b-4 border-green-500 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                    <h3 className="text-lg font-semibold text-gray-500 flex items-center gap-2"><FaBoxOpen className="text-green-500" /> Active Submissions</h3>
                                    <p className="text-4xl font-extrabold text-green-500 mt-2">{activeSubmissions.length}</p>
                                </div>
                                <div className={`p-6 rounded-2xl shadow-xl transition-transform transform hover:scale-105 border-b-4 border-teal-500 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                    <h3 className="text-lg font-semibold text-gray-500 flex items-center gap-2"><FaClipboardList className="text-teal-500" /> Categories</h3>
                                    <p className="text-4xl font-extrabold text-teal-500 mt-2">{categories.length}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                    <h3 className="mb-4 text-xl font-bold border-b pb-2">Submissions Over Months</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#555" : "#e0e0e0"} />
                                            <XAxis dataKey="name" stroke={isDark ? "#ccc" : "#888"} />
                                            <YAxis stroke={isDark ? "#ccc" : "#888"} />
                                            <Tooltip contentStyle={{ backgroundColor: isDark ? '#374151' : '#fff', border: '1px solid #4f46e5' }} />
                                            <Line type="monotone" dataKey="submissions" stroke="#059669" strokeWidth={3} dot={{ stroke: '#059669', strokeWidth: 2, r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                    <h3 className="mb-4 text-xl font-bold border-b pb-2">Submissions by Category</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100} // Increased size
                                                dataKey="value"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ padding: '10px' }} />
                                            <Tooltip contentStyle={{ backgroundColor: isDark ? '#374151' : '#fff', border: '1px solid #4f46e5' }} formatter={(value) => `${value} submissions`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Users - Enhanced Table */}
                    {activeTab === "users" && (
                        <div>
                            <div className={`overflow-hidden rounded-xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={isDark ? "bg-gray-700" : "bg-indigo-50"}>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Ward / House</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Submissions</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Activity Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {users.map(u => (
                                            <tr key={u._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-indigo-50/50"}>
                                                <td className="px-6 py-3 font-medium">{u.name}</td>
                                                <td className="px-6 py-3 text-sm">{u.email}</td>
                                                <td className="px-6 py-3 text-sm">{`${u.wardNumber || "-"} / ${u.houseNumber || "-"}`}</td>
                                                <td className="px-6 py-3 font-mono text-sm text-center">{u.submissionCount || 0}</td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-3 inline-flex text-xs leading-5 rounded-full shadow-sm ${getActivityStatusClass(u.activityStatus)}`}>
                                                        {u.activityStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Collectors - Enhanced Table */}
                    {activeTab === "collectors" && (
                        <div>
                            <div className={`overflow-hidden rounded-xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={isDark ? "bg-gray-700" : "bg-purple-50"}>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Phone</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {collectors.length > 0 ? (
                                            collectors.map(c => (
                                                <tr key={c._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-purple-50/50"}>
                                                    <td className="px-6 py-3 font-medium">{c.name}</td>
                                                    <td className="px-6 py-3 text-sm">{c.email}</td>
                                                    <td className="px-6 py-3 text-sm">{c.phone || "-"}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="text-center px-6 py-4 text-lg text-gray-500 font-medium">
                                                    No collectors registered yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ** Immediate Pickups ** */}
                    {activeTab === "immediatePickups" && (
                        <div>
                            <h2 className="text-2xl font-extrabold mb-4 text-red-600 flex items-center gap-2"><FaBolt /> Urgent Immediate Pickups ({immediatePickupCount})</h2>
                            <p className={`mb-6 p-4 rounded-lg border-l-4 border-red-500 shadow-md ${isDark ? "bg-gray-800" : "bg-red-50 text-red-800"}`}>
                                These pickups require **immediate manual assignment** to a collector. Once assigned, they move to the **Schedules** tab.
                            </p>
                            <div className={`overflow-x-auto rounded-xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={isDark ? "bg-gray-700" : "bg-red-100"}>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">User / Location</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Est. Weight (kg)</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Requested Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider w-64">Action: Assign Collector</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {immediatePickups.length > 0 ? (
                                            immediatePickups.map(s => (
                                                <tr key={s._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-red-50/50"}>
                                                    <td className="px-6 py-3 font-medium text-sm">{`${s.user_id?.name || "-"} (W:${s.user_id?.wardNumber || "-"} H:${s.user_id?.houseNumber || "-"})`}</td>
                                                    <td className="px-6 py-3">{s.category}</td>
                                                    <td className="px-6 py-3 font-extrabold text-red-500">{s.weight || "N/A"}</td>
                                                    <td className="px-6 py-3 text-xs">{new Date(s.scheduled_date).toLocaleString()}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900 shadow-sm`}>
                                                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)} (Unassigned)
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 flex gap-2 items-center">
                                                        <select
                                                            value={manualCollectorId[s._id] || ""}
                                                            onChange={(e) => setManualCollectorId(prev => ({ ...prev, [s._id]: e.target.value }))}
                                                            className={`px-3 py-1.5 border rounded-lg text-sm flex-grow shadow-inner ${isDark ? "bg-gray-700 text-white border-gray-600" : "bg-gray-50 border-gray-300"}`}
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
                                                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-md ${manualCollectorId[s._id] ? `${primaryBg} text-white ${hoverPrimaryBg}` : "bg-gray-400 text-gray-700 cursor-not-allowed"
                                                                }`}
                                                        >
                                                            Assign
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center px-6 py-4 text-lg text-gray-500 font-medium">
                                                    🎉 All immediate pickup requests are currently handled!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {/* ** END Immediate Pickups ** */}

                    {/* Collector Applications (VIEW APPLYS) */}
                    {activeTab === "collectorApplications" && (
                        <div>
                            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2"><FaEnvelope className="text-pink-500" /> Pending Collector Applications</h2>
                            <div className={`overflow-hidden rounded-xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={isDark ? "bg-gray-700" : "bg-pink-100"}>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Name / Contact</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Address</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Applied Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {collectorApplies.filter(c => c.status?.toLowerCase() === 'pending').length > 0 ? (
                                            collectorApplies.filter(c => c.status?.toLowerCase() === 'pending').map(c => (
                                                <tr key={c._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-pink-50/50"}>
                                                    <td className="px-6 py-3">
                                                        <p className="font-medium">{c.name || "-"}</p>
                                                        <p className="text-xs text-gray-500">{c.email || "-"}</p>
                                                        <p className="text-xs text-gray-500">{c.phone || "-"}</p>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm">{c.address || "-"}</td>
                                                    <td className="px-6 py-3 text-sm text-pink-500 font-semibold">{new Date(c.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-sm ${c.status?.toLowerCase() === 'pending' ? 'bg-yellow-400 text-yellow-900 animate-pulse' :
                                                            c.status?.toLowerCase() === 'approved' ? 'bg-green-500 text-white' :
                                                                'bg-red-500 text-white'
                                                            }`}>
                                                            {c.status || "Pending"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 flex gap-3">
                                                        {c.status?.toLowerCase() === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => approveCollectorApply(c._id, c)}
                                                                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-md"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => rejectCollectorApply(c._id)}
                                                                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-md"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center px-6 py-4 text-lg text-gray-500 font-medium">
                                                    No new collector applications at this time.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Waste Submissions (New Applies Page) - Enhanced Table */}
                    {activeTab === "submissions" && (
                        <div>
                            <div className={`overflow-hidden rounded-xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={isDark ? "bg-gray-700" : "bg-green-100"}>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Location</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {wasteSubmissions
                                            .filter(s => s.status?.toLowerCase() !== "collected" && s.status?.toLowerCase() !== "pending")
                                            .map(s => (
                                                <tr key={s._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-green-50/50"}>
                                                    <td className="px-6 py-3 font-medium">{s.user_id?.name || "-"}</td>
                                                    <td className="px-6 py-3">{s.category}</td>
                                                    <td className="px-6 py-3 text-sm">{`W: ${s.user_id?.wardNumber || "-"} / H: ${s.user_id?.houseNumber || "-"}`}</td>
                                                    <td className="px-6 py-3 text-sm">{new Date(s.scheduled_date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(s.status?.toLowerCase() === 'new' || s.status?.toLowerCase() === 'unhandled') ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                                                            }`}>
                                                            {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Categories */}
                    {activeTab === "categories" && (
                        <div className={`p-6 rounded-2xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                            <Category />
                        </div>
                    )}

                    {/* Schedules Tab (Enhanced Card View) */}
                    {activeTab === "schedules" && (
                        <div>
                            <h3 className="text-2xl font-extrabold mb-6 flex items-center gap-2"><FaCalendarAlt className="text-orange-500" /> Active Collection Schedules</h3>

                            <div className="flex flex-wrap gap-4 mb-6">
                                {/* Category filter */}
                                <div>
                                    <label className="block font-semibold mb-1">Filter by Category:</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className={`px-4 py-2 border rounded-lg shadow-sm ${isDark ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"}`}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map((c) => (
                                            <option key={c._id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Collector filter */}
                                <div>
                                    <label className="block font-semibold mb-1">Filter by Collector:</label>
                                    <select
                                        value={assignedCollectorFilter}
                                        onChange={(e) => setAssignedCollectorFilter(e.target.value)}
                                        className={`px-4 py-2 border rounded-lg shadow-sm ${isDark ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300"}`}
                                    >
                                        <option value="">All Collectors</option>
                                        {collectors.map((c) => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Assigned Schedules Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {wasteSubmissions
                                    .filter(
                                        (s) =>
                                            s.collector_id &&
                                            s.status?.toLowerCase() !== "collected" &&
                                            (!selectedCategory || s.category === selectedCategory) &&
                                            (!assignedCollectorFilter || s.collector_id._id === assignedCollectorFilter)
                                    )
                                    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date)) // Sort by date
                                    .map((s) => (
                                        <div key={s._id} className={`p-5 rounded-xl shadow-lg border-t-4 border-blue-500 ${isDark ? "bg-gray-700" : "bg-white"} transition-transform hover:scale-[1.02]`}>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className={`px-3 py-1 text-sm font-bold rounded-full text-white ${s.weight ? 'bg-red-500' : 'bg-green-500'} shadow-sm`}>
                                                    {s.category}
                                                </span>
                                                <span className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                                    {new Date(s.scheduled_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="font-extrabold text-lg truncate mb-1">{s.user_id?.name || "Anonymous User"}</p>
                                            <p className="text-sm text-gray-500 mb-2">Ward **{s.user_id?.wardNumber || "-"}** / House **{s.user_id?.houseNumber || "-"}**</p>
                                            <p className="text-md font-semibold text-indigo-500">
                                                <FaTruck className="inline mr-2" /> {s.collector_id?.name || "Unassigned"}
                                            </p>
                                            {s.weight && (
                                                <p className="text-sm text-red-500 font-bold mt-1">
                                                    <FaBolt className="inline mr-1" /> Urgent Pickup: {s.weight} kg
                                                </p>
                                            )}
                                        </div>
                                    ))}
                            </div>

                            {wasteSubmissions.filter(s => s.collector_id && s.status?.toLowerCase() !== "collected").length === 0 && (
                                <div className={`p-6 border-l-4 border-yellow-500 mt-6 rounded-lg ${isDark ? "bg-gray-800 text-gray-400" : "bg-yellow-50 text-yellow-700"} shadow-md`}>
                                    <p className="font-medium">No active schedules found matching the current filters.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Assign Collector Tab (Enhanced UI) */}
                    {activeTab === "Assign collector" && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-extrabold flex items-center gap-2"><FaTools className="text-indigo-500" /> Assign Collector to Zone</h2>
                                <button
                                    onClick={fetchData}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-all ${isDark ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"}`}
                                >
                                    🔄 Refresh Data
                                </button>
                            </div>

                            {/* ASSIGNMENT FORM */}
                            <div className={`p-8 rounded-2xl shadow-xl mb-8 border-t-4 border-indigo-500 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <h3 className="text-xl font-bold mb-4 border-b pb-2">Create New Zone Assignment</h3>
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();

                                        const collectorObj = collectors.find(c => String(c._id) === String(collectorId));

                                        if (!wardNumber || !collectorObj) {
                                            alert("Please select a valid Ward Number and Collector.");
                                            return;
                                        }

                                        const targetWardString = String(wardNumber);
                                        const currentCollectorId = wardCategoryAssignments[targetWardString];

                                        // 1. --- Overwrite Confirmation Logic ---
                                        if (currentCollectorId && currentCollectorId !== collectorId) {
                                            const currentCollector = collectors.find(c => String(c._id) === String(currentCollectorId));
                                            const confirmOverwrite = window.confirm(
                                                `⚠️ WARNING: Ward ${targetWardString} is currently assigned to ${currentCollector.name}. Do you want to OVERWRITE this assignment?`
                                            );
                                            if (!confirmOverwrite) return;
                                        }

                                        try {
                                            const API_BASE = window.location.hostname === 'localhost' ? "http://localhost:4321/api" : "/api";
                                            console.log(`📤 Assigning ${collectorObj.name} to Ward ${targetWardString}...`);
                                            // 2. Send assignment to backend
                                            await axios.post(
                                                `${API_BASE}/user/assign`,
                                                { wardNumber: targetWardString, collectorId },
                                                getAuthHeaders()
                                            );

                                            // 3. Re-fetch all data to ensure perfect sync
                                            await fetchData();

                                            alert(`✅ ${collectorObj.name} successfully assigned to Ward ${targetWardString}.`);

                                            // Clear form
                                            setWardNumber("");
                                            setCollectorId("");

                                        } catch (err) {
                                            console.error("❌ Assignment POST Error:", err.response?.data || err.message);
                                            alert(err.response?.data?.message || "❌ Failed to assign collector");
                                        }
                                    }}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="mb-2">
                                            <label className="block font-semibold mb-2">Ward Number</label>
                                            <input
                                                type="number"
                                                value={wardNumber}
                                                onChange={(e) => setWardNumber(e.target.value)}
                                                className={`w-full px-4 py-2 border rounded-lg shadow-inner ${isDark ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"}`}
                                                required
                                                min="1"
                                            />
                                        </div>

                                        <div className="mb-2">
                                            <label className="block font-semibold mb-2">Collector</label>
                                            <select
                                                value={collectorId}
                                                onChange={(e) => setCollectorId(e.target.value)}
                                                className={`w-full px-4 py-2 border rounded-lg shadow-inner ${isDark ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"}`}
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
                                        className={`px-6 py-2 rounded-lg font-bold text-lg text-white ${primaryBg} ${hoverPrimaryBg} transition-colors shadow-md shadow-indigo-500/50 transform hover:scale-[1.01]`}
                                    >
                                        Confirm Assignment
                                    </button>
                                </form>
                            </div>

                            <hr className={`my-8 ${isDark ? "border-gray-700" : "border-gray-300"}`} />

                            {/* CURRENT ASSIGNMENTS LIST */}
                            <h2 className="text-2xl font-extrabold mb-4">Current Collector Assignments</h2>
                            <div className={`overflow-x-auto rounded-xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={isDark ? "bg-gray-700" : "bg-indigo-100"}>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Ward Number</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Assigned Collector</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Active Submissions</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentAssignmentsList.map((assignment, index) => (
                                            <tr key={assignment.ward} className={isDark ? "hover:bg-gray-700" : "hover:bg-indigo-50/50"}>
                                                <td className="px-6 py-3 font-semibold">{assignment.ward}</td>
                                                <td className="px-6 py-3 font-bold text-indigo-500">{assignment.collectorName}</td>
                                                <td className="px-6 py-3 text-center font-medium">{assignment.activeSubmissionsCount}</td>
                                                <td className="px-6 py-3">
                                                    <button
                                                        onClick={() => deleteAssignment(
                                                            assignment.ward,
                                                            assignment.collectorName
                                                        )}
                                                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-md"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {currentAssignmentsList.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="text-center px-6 py-4 text-lg text-gray-500 font-medium">
                                                    No active Ward assignments found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    )}

                    {/* Waste Prediction (Stacked Bar Chart Enhanced) */}
                    {activeTab === "wastePrediction" && (
                        <div>
                            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2"><FaChartLine className="text-blue-500" /> Ward Collection Forecast</h2>

                            <div className={`mb-6 p-4 rounded-xl shadow-md border-l-4 border-blue-500 ${isDark ? "bg-gray-800" : "bg-blue-50"}`}>
                                <p className={`font-semibold text-lg ${isDark ? "text-gray-300" : "text-blue-800"}`}>
                                    Forecast for **{wastePredictions.month || 'Next Month'}** is based on submissions from the past 3 months.
                                </p>
                            </div>


                            <button
                                onClick={fetchWastePredictions}
                                disabled={isPredicting}
                                className={`px-6 py-2 mb-8 rounded-lg font-bold text-lg transition-colors shadow-lg ${isPredicting ? "bg-gray-500 text-white cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
                                    } transform hover:scale-[1.01]`}
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
                                    {/* Stacked Bar Chart */}
                                    <div className={`p-6 rounded-2xl shadow-xl mb-8 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                        <h3 className="text-xl font-bold mb-4 border-b pb-2">Predicted Monthly Collection Frequency by Ward & Category</h3>
                                        <ResponsiveContainer width="100%" height={350}>
                                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#555" : "#e0e0e0"} />
                                                <XAxis
                                                    dataKey="ward"
                                                    stroke={isDark ? "#ccc" : "#888"}
                                                    angle={-15}
                                                    textAnchor="end"
                                                    height={60}
                                                />
                                                <YAxis
                                                    stroke={isDark ? "#ccc" : "#888"}
                                                    label={{ value: 'Total Submissions', angle: -90, position: 'insideLeft', fill: isDark ? "#ccc" : "#888" }}
                                                    tickFormatter={(value) => Math.round(value)}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: isDark ? '#374151' : '#fff', border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`, color: isDark ? '#fff' : '#000' }}
                                                    formatter={(value, name) => [`${Math.round(value)} submissions`, name]}
                                                />
                                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                {/* Map Bars for each unique category found in the data */}
                                                {uniqueCategories.map((category, index) => (
                                                    <Bar
                                                        key={category}
                                                        dataKey={category}
                                                        stackId="a"
                                                        fill={COLORS[index % COLORS.length]}
                                                        name={category}
                                                        radius={[4, 4, 0, 0]} // Rounded tops
                                                    />
                                                ))}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    {/* PREDICTION TABLE */}
                                    <div className={`overflow-x-auto rounded-xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className={isDark ? "bg-gray-700" : "bg-blue-100"}>
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Ward Number</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Predicted Top Category</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Expected Frequency (Next Month)</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Total Submissions (3 Months)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {wastePredictions.predictions.map((p, index) => (
                                                    <tr
                                                        key={p.wardNumber}
                                                        className={isDark ? "hover:bg-gray-700" : "hover:bg-blue-50/50"}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-500">{`Ward ${p.wardNumber}`}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">{p.expectedCategory || 'N/A'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-md font-extrabold text-purple-600">{Math.round(p.expectedFrequency) || 0}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{p.totalWardSubmissions || 0}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : !isPredicting && (
                                <div className={`p-6 border-l-4 border-yellow-500 ${isDark ? "bg-gray-800 text-gray-400" : "bg-yellow-50 text-yellow-700"} rounded-lg shadow-md`}>
                                    <p className="font-medium">No monthly prediction data available.</p>
                                    <p className="text-sm">Click the **Run** button above to generate the forecast and view the chart.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Collected Waste (Shows ONLY collected items) */}
                    {activeTab === "Collected waste" && (
                        <div>
                            <div className={`overflow-x-auto rounded-xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                                    <thead className={isDark ? "bg-gray-700" : "bg-teal-100"}>
                                        <tr>
                                            <th className="px-6 py-3 text-left w-1/6 text-xs font-bold uppercase tracking-wider">User Name</th>
                                            <th className="px-6 py-3 text-left w-1/12 text-xs font-bold uppercase tracking-wider">Ward / House</th>
                                            <th className="px-6 py-3 text-left w-1/6 text-xs font-bold uppercase tracking-wider">Collector</th>
                                            <th className="px-6 py-3 text-left w-1/6 text-xs font-bold uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left w-1/12 text-xs font-bold uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3 text-left w-1/6 text-xs font-bold uppercase tracking-wider">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {wasteSubmissions
                                            .filter(s => s.status?.toLowerCase() === "collected")
                                            .map(s => (
                                                <tr key={s._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-teal-50/50"}>
                                                    <td className="px-6 py-3 font-medium">{s.user_id?.name || "-"}</td>
                                                    <td className="px-6 py-3 text-sm">{`W: ${s.user_id?.wardNumber || "-"} / H: ${s.user_id?.houseNumber || "-"}`}</td>
                                                    <td className="px-6 py-3 text-indigo-500">{s.collector_id?.name || "-"}</td>
                                                    <td className="px-6 py-3">{s.category}</td>
                                                    <td className="px-6 py-3 font-bold text-teal-500">{s.quantity || "-"}</td>
                                                    <td className="px-6 py-3 text-sm">{new Date(s.scheduled_date).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        {wasteSubmissions.filter(s => s.status?.toLowerCase() === "collected").length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="text-center px-6 py-4 text-lg text-gray-500 font-medium">
                                                    No collected waste submissions yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pending Submissions Tab (Enhanced Table) */}
                    {activeTab === "Pending submissions" && (
                        <div>
                            <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2"><FaHistory className="text-yellow-500" /> Pending Submissions (Collector Deferred)</h2>
                            <div className={`overflow-x-auto rounded-xl shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}>
                                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                                    <thead className={isDark ? "bg-gray-700" : "bg-yellow-100"}>
                                        <tr>
                                            <th className="px-6 py-3 text-left w-1/6 text-xs font-bold uppercase tracking-wider">User / Location</th>
                                            <th className="px-6 py-3 text-left w-1/6 text-xs font-bold uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left w-1/6 text-xs font-bold uppercase tracking-wider">Collector</th>
                                            <th className="px-6 py-3 text-left w-1/6 text-xs font-bold uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left w-1/4 text-xs font-bold uppercase tracking-wider">Pending Reason</th>
                                            <th className="px-6 py-3 text-left w-1/12 text-xs font-bold uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {wasteSubmissions
                                            .filter(s => s.status?.toLowerCase() === "pending")
                                            .map(s => (
                                                <tr key={s._id} className={isDark ? "hover:bg-gray-700" : "hover:bg-yellow-50/50"}>
                                                    <td className="px-6 py-3 font-medium text-sm">{`${s.user_id?.name || "-"} (W:${s.user_id?.wardNumber || "-"})`}</td>
                                                    <td className="px-6 py-3">{s.category}</td>
                                                    <td className="px-6 py-3 text-indigo-500">{s.collector_id?.name || "-"}</td>
                                                    <td className="px-6 py-3 text-sm">{new Date(s.scheduled_date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-3 text-red-500 font-semibold truncate" title={s.pendingReason || "No reason provided"}>{s.pendingReason || "No reason provided"}</td>
                                                    <td className="px-6 py-3">
                                                        <button
                                                            onClick={() => updateWasteSubmissionStatus(s._id, "approved")}
                                                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-md"
                                                        >
                                                            Re-Approve
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        {wasteSubmissions.filter(s => s.status?.toLowerCase() === "pending").length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="text-center px-6 py-4 text-lg text-gray-500 font-medium">
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