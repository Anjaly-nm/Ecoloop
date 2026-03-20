import React, { useState, useEffect, useCallback } from "react";
// Removed FaCheckCircle to fix the ESLint warning
import { FaUserCircle, FaTrashAlt, FaLeaf, FaChartLine, FaSignOutAlt, FaTasks, FaEnvelope, FaCalendarAlt, FaSyncAlt, FaTruckLoading, FaExclamationTriangle, FaListOl, FaBoxOpen, FaHistory } from "react-icons/fa";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
// recharts import removed as it was unused
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import moment from "moment";

// --- Custom Components & Utilities for Design (Unchanged) ---

const SidebarItem = ({ activeTab, tabKey, icon, label, onClick }) => (
    <button
        onClick={() => onClick(tabKey)}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all duration-300 group w-full ${activeTab === tabKey
            ? "bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-200 translate-x-1"
            : "text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
            }`}
    >
        <span className={`text-xl transition-colors duration-300 ${activeTab === tabKey ? "text-white" : "text-emerald-500 group-hover:text-emerald-600"}`}>
            {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
    </button>
);

const StatCard = ({ title, value, icon, gradient }) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-gradient-to-br ${gradient} text-white`}>
        <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-4">
                <span className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shadow-inner">
                    {icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">{title}</span>
            </div>
            <div>
                <p className="text-3xl font-black mb-1">{value}</p>
                <div className="h-1 w-8 bg-white/30 rounded-full" />
            </div>
        </div>
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-110" />
    </div>
);


const Dashboard = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [username, setUsername] = useState("User");
    const [userId, setUserId] = useState("");
    const [categories, setCategories] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState("home");

    // 🔑 UPDATED STATE: Includes estimated_weight
    const [formData, setFormData] = useState({
        category: "",
        category_id: "",
        estimated_weight: "",
        scheduled_date: new Date().toISOString()
    });

    const [ecoPoints, setEcoPoints] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Utility Functions (Omitted for brevity) ---

    const getStatusStyle = (status) => {
        switch (status) {
            case "collected":
                return "text-green-800 bg-green-100";
            case "pending":
            case "approved":
            case "new": // Added 'new' for completeness in case you use it
                return "text-yellow-800 bg-yellow-100";
            case "rejected":
                return "text-red-800 bg-red-100";
            case "unhandled":
                return "text-gray-800 bg-gray-300";
            default:
                return "text-gray-800 bg-gray-100";
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    // --- Data Fetching Functions (Omitted for brevity) ---

    const fetchSubmissions = useCallback(async () => {
        if (!userId || !token) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/mysubmissions/${userId}`, { headers: { token } });
            const fetchedSubmissions = res.data.submissions || [];
            setSubmissions(fetchedSubmissions);
            const points = fetchedSubmissions.filter(s => s.status === "collected").length * 10;
            setEcoPoints(points);
        } catch (err) {
            console.error("Failed to fetch submissions:", err);
        } finally {
            setIsLoading(false);
        }
    }, [userId, token]);

    const fetchOrders = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/orders/my-orders`, { headers: { token } });
            setOrders(res.data.orders || []);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!token) return;
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/me`, { headers: { token } });
                setUsername(res.data.user?.name || "User");
                setUserId(res.data.user?._id);
            } catch {
                localStorage.removeItem("token");
                navigate("/login");
            }
        };
        fetchUser();
    }, [token, navigate]);

    useEffect(() => {
        if (!token) return;
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/category/categories`, { headers: { token } });
                setCategories(res.data);
            } catch (err) { console.error(err); }
        };
        fetchCategories();
    }, [token]);

    useEffect(() => {
        if (userId) {
            fetchSubmissions();
            fetchOrders();
        }
    }, [userId, fetchSubmissions, fetchOrders]);

    const handleRefresh = () => {
        fetchSubmissions();
        fetchOrders();
    };

    // --- Form Handling (Standard Submission) ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.category_id) return alert("Please select a category.");

        setIsSubmitting(true);
        const submissionDate = new Date().toISOString();

        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/user/add`, {
                user_id: userId,
                category: formData.category,
                category_id: formData.category_id,
                scheduled_date: submissionDate,
                // 🔑 is_immediate defaults to false (or is omitted) and weight is omitted
                // This triggers the default 'approved' status logic in the Mongoose hook.
            }, { headers: { token } });

            alert("✅ Pickup requested successfully! Check 'View Submissions' for status.");
            // Reset only form fields
            setFormData(prev => ({ ...prev, category: "", category_id: "", estimated_weight: "" }));
            setActiveTab("view");
            fetchSubmissions();
        } catch (err) {
            console.error(err);
            alert(`❌ Failed to request pickup: ${err.response?.data?.message || 'Server error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this submission?")) return;
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/user/delete/${id}`, { headers: { token } });
            alert("✅ Deleted successfully!");
            fetchSubmissions();
        } catch (err) { console.error(err); alert("❌ Failed to delete."); }
    };

    // --- Immediate Pickup Logic (UPDATED to send is_immediate and weight) ---
    const handleImmediatePickup = async () => {
        if (!formData.category_id) return alert("Please select a category for immediate pickup.");

        const weight = parseFloat(formData.estimated_weight);
        if (!weight || weight <= 0) return alert("Please enter a valid estimated weight (in kg).");

        setIsSubmitting(true);
        const submissionDate = new Date().toISOString();

        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/user/add`, {
                user_id: userId,
                category: formData.category,
                category_id: formData.category_id,
                scheduled_date: submissionDate,
                is_immediate: true, // 🔑 CRITICAL: Triggers the 'pending' status in Mongoose hook
                weight: weight,  // 🔑 CRITICAL: Required by the Express router and Mongoose schema
            }, { headers: { token } });

            alert("🎉 Immediate Pickup request sent! Status is PENDING for review.");
            // Reset only form fields
            setFormData(prev => ({ ...prev, category: "", category_id: "", estimated_weight: "" }));
            setActiveTab("view");
            fetchSubmissions();
        } catch (err) {
            console.error(err);
            alert(`❌ Failed to submit immediate pickup request: ${err.response?.data?.message || 'Server error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Chart Data Preparation (Omitted for brevity) ---

    // --- KPI Cards Data (Omitted for brevity) ---
    const completedSubmissions = submissions.filter(s => s.status === "collected").length;
    const totalSubmissions = submissions.length;
    const completionPercentage = totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 0;

    // --- Render Functions for Tabs (Omitted for brevity) ---

    const RenderHomeDashboard = () => {
        // Calculate Eco Impact based on number of collected submissions
        const totalCollectedSubmissions = submissions.filter(s => s.status === "collected").length;

        const co2Saved = (totalCollectedSubmissions * 5.0).toFixed(1); // Estimated 5kg CO2 saved per submission
        const treesSaved = (totalCollectedSubmissions * 0.12).toFixed(2); // Estimated 0.12 tree equivalent per submission

        const recentActivity = [...submissions]
            .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
            .slice(0, 4);

        const upcomingPickups = submissions
            .filter(s => (s.status === "pending" || s.status === "approved" || s.status === "new"))
            .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
            .slice(0, 3);

        return (
            <div className="space-y-10 animate-fadeIn">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Submissions"
                        value={totalSubmissions}
                        icon={<FaBoxOpen className="text-xl" />}
                        gradient="from-emerald-500 to-emerald-700"
                    />
                    <StatCard
                        title="Completed"
                        value={completedSubmissions}
                        icon={<FaTasks className="text-xl" />}
                        gradient="from-teal-500 to-emerald-600"
                    />
                    <div className="relative overflow-hidden rounded-2xl p-6 shadow-lg bg-white border border-gray-100 flex items-center justify-between hover:shadow-xl transition-all duration-300">
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Completion Rate</h3>
                            <p className="text-3xl font-black text-emerald-600">{completionPercentage}%</p>
                        </div>
                        <div className="w-16 h-16 transform hover:scale-110 transition-transform duration-300">
                            <CircularProgressbar
                                value={completionPercentage}
                                text={`${completionPercentage}%`}
                                styles={buildStyles({
                                    pathColor: "#10b981",
                                    textColor: "#064e3b",
                                    trailColor: "#ecfdf5",
                                    strokeLinecap: "round",
                                    textSize: '28px',
                                })}
                            />
                        </div>
                    </div>
                    <StatCard
                        title="EcoPoints Balance"
                        value={ecoPoints}
                        icon={<FaLeaf className="text-xl" />}
                        gradient="from-lime-500 to-emerald-500"
                    />
                </div>

                {/* Eco Impact Summary */}
                <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-forest-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl transition-all duration-700 group-hover:scale-110" />
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                            <span className="p-2 bg-emerald-700/50 rounded-lg"><FaChartLine /></span>
                            Your Eco Impact Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-all">
                                <p className="text-emerald-300 text-xs font-bold uppercase mb-2">Total Submissions</p>
                                <p className="text-4xl font-black">{totalCollectedSubmissions} <span className="text-xl font-normal opacity-70">Submits</span></p>
                                <div className="mt-4 flex items-center text-emerald-400 text-sm gap-1">
                                    <FaTrashAlt /> Helping the planet
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-all">
                                <p className="text-emerald-300 text-xs font-bold uppercase mb-2">CO2 Emissions Saved</p>
                                <p className="text-4xl font-black">{co2Saved} <span className="text-xl font-normal opacity-70">kg</span></p>
                                <div className="mt-4 flex items-center text-emerald-400 text-sm gap-1">
                                    <FaLeaf /> Net positive change
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-all">
                                <p className="text-emerald-300 text-xs font-bold uppercase mb-2">Forest Equivalent</p>
                                <p className="text-4xl font-black">{treesSaved} <span className="text-xl font-normal opacity-70">trees</span></p>
                                <div className="mt-4 flex items-center text-emerald-400 text-sm gap-1">
                                    <FaUserCircle /> Sustainability hero
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent & Upcoming */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Upcoming Pickups */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 transition-all hover:shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                                    <span className="p-2 bg-amber-100 text-amber-600 rounded-lg"><FaTruckLoading /></span>
                                    Upcoming Pickups
                                </h3>
                                <button onClick={() => setActiveTab("submit")} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest">+ Schedule New</button>
                            </div>
                            <div className="space-y-4">
                                {upcomingPickups.length > 0 ? upcomingPickups.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 hover:border-emerald-200 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white p-3 rounded-xl shadow-sm text-center min-w-16">
                                                <p className="text-[10px] uppercase font-bold text-gray-400">{moment(s.scheduled_date).format('MMM')}</p>
                                                <p className="text-xl font-black text-emerald-600">{moment(s.scheduled_date).format('DD')}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{s.category}</p>
                                                <p className="text-xs text-gray-500">{moment(s.scheduled_date).format('h:mm A')}</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-white text-emerald-700 text-[10px] font-black uppercase rounded-full shadow-sm">
                                            {s.status}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="text-center py-10">
                                        <p className="text-gray-400 italic">No upcoming pickups scheduled.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 transition-all hover:shadow-2xl">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><FaHistory /></span>
                                Recent Activity
                            </h3>
                            <div className="space-y-3">
                                {recentActivity.length > 0 ? recentActivity.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${s.status === 'collected' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                <FaTasks />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{s.category} Submission</p>
                                                <p className="text-[10px] text-gray-400 font-medium uppercase">{moment(s.scheduled_date).fromNow()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${s.status === 'collected' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                                                {s.status}
                                            </p>
                                        </div>
                                    </div>
                                )) : <p className="text-gray-400 italic text-center py-4">No recent activity.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Calendar Section */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><FaCalendarAlt /></span>
                                Schedule
                            </h3>
                            <div className="dashboard-calendar">
                                <Calendar
                                    className="w-full border-none text-gray-700 font-sans"
                                    tileClassName={({ date }) => {
                                        const isScheduled = submissions.some(s => new Date(s.scheduled_date).toDateString() === date.toDateString());
                                        const isCollected = submissions.some(s => s.status === 'collected' && new Date(s.scheduled_date).toDateString() === date.toDateString());

                                        if (isCollected) return "collected-date";
                                        if (isScheduled) return "scheduled-date";
                                        return null;
                                    }}
                                />
                            </div>
                            <div className="mt-6 flex justify-around text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Collected</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Scheduled</span>
                            </div>
                        </div>

                        {/* Quick Action */}
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <h4 className="font-black text-lg mb-2">Need Immediate Help?</h4>
                                <p className="text-indigo-100 text-xs mb-6 leading-relaxed">Request an emergency pickup for overflowing bins or large debris.</p>
                                <button
                                    onClick={() => setActiveTab("immediate")}
                                    className="w-full py-3 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all transform hover:scale-[1.02]"
                                >
                                    Express Pickup
                                </button>
                            </div>
                            <FaExclamationTriangle className="absolute -right-4 -bottom-4 text-7xl text-white/10 rotate-12 transition-transform duration-500 group-hover:rotate-0" />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const RenderImmediatePickup = () => {
        return (
            <div className="bg-white rounded-xl p-8 shadow-2xl border-t-4 border-rose-600 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center border-b pb-2">
                    <FaExclamationTriangle className="text-rose-600 inline mr-2" /> Express Waste Collection
                </h3>

                <div className="bg-rose-50 border-l-4 border-rose-400 p-4 mb-6 rounded-lg shadow-sm">
                    <h4 className="font-bold text-rose-800 flex items-center mb-2">
                        <FaListOl className="mr-2" /> Follow these steps for Immediate Pickup:
                    </h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        <li>**Select** the correct waste category below.</li>
                        <li>**Estimate** the weight accurately (required by the system).</li>
                        <li>**Ensure** the waste is bagged, tied, and ready for street-side collection.</li>
                        <li>**Place** the waste at the designated spot *before* clicking the button.</li>
                        <li>**Wait** for a confirmation notification and status update in "View Submissions."</li>
                    </ul>
                </div>

                <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); handleImmediatePickup(); }}>
                    <div className="flex flex-col">
                        <label htmlFor="category_id_immediate" className="text-sm font-medium text-gray-700 mb-1 text-left">Waste Category</label>
                        <select
                            name="category_id_immediate"
                            id="category_id_immediate"
                            value={formData.category_id}
                            onChange={(e) => {
                                const cat = categories.find(c => c._id === e.target.value);
                                setFormData(prev => ({ ...prev, category: cat?.name || "", category_id: e.target.value }));
                            }}
                            required
                            disabled={isSubmitting}
                            className="p-3 border border-rose-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 transition duration-150 text-gray-800"
                        >
                            <option value="">-- Select Waste Type --</option>
                            {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                        </select>
                    </div>

                    {/* 🔑 NEW: Weight Input Field */}
                    <div className="flex flex-col">
                        <label htmlFor="estimated_weight" className="text-sm font-medium text-gray-700 mb-1 text-left">Estimated Weight (kg)</label>
                        <input
                            type="number"
                            id="estimated_weight"
                            value={formData.estimated_weight}
                            onChange={(e) => setFormData(prev => ({ ...prev, estimated_weight: e.target.value }))}
                            placeholder="Enter weight in kilograms (e.g., 5.0)"
                            required
                            min="0.1"
                            step="0.1"
                            disabled={isSubmitting}
                            className="p-3 border border-rose-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 transition duration-150 text-gray-800"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !formData.category_id || !formData.estimated_weight}
                        className={`text-white p-4 rounded-xl font-bold text-lg transition duration-200 shadow-lg 
                      ${isSubmitting || !formData.category_id || !formData.estimated_weight ? 'bg-rose-400 cursor-not-allowed flex items-center justify-center' : 'bg-rose-600 hover:bg-rose-700 hover:shadow-xl'}`}
                    >
                        {isSubmitting ? (
                            <>
                                <FaSyncAlt className="animate-spin mr-3" />
                                Dispatching Collector...
                            </>
                        ) : (
                            <><FaTruckLoading className="mr-3" /> Request Immediate Pickup Now</>
                        )}
                    </button>
                </form>
            </div>
        );
    };

    // --- Main Render (Omitted for brevity) ---
    return (
        <div className="flex h-screen bg-gray-50 font-sans antialiased text-gray-900">
            <style>{`
                .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                .dashboard-calendar .react-calendar {
                    border: none;
                    width: 100%;
                }
                .dashboard-calendar .react-calendar__tile {
                    padding: 12px 6px;
                    font-size: 0.8rem;
                    border-radius: 12px;
                }
                .dashboard-calendar .scheduled-date {
                    background: #fbbf24 !important;
                    color: white !important;
                    font-weight: 800;
                    box-shadow: 0 4px 6px -1px rgba(251, 191, 36, 0.4);
                }
                .dashboard-calendar .collected-date {
                    background: #10b981 !important;
                    color: white !important;
                    font-weight: 800;
                    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);
                }
            `}</style>

            <aside className="w-72 bg-white border-r border-gray-100 shadow-xl flex flex-col p-6 z-20">
                <div className="flex items-center gap-3 mb-12 px-2">
                    <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200">
                        <FaLeaf className="text-white text-2xl" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter text-emerald-900">
                        EcoLoop
                    </h1>
                </div>

                <nav className="flex flex-col gap-3 flex-grow">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 px-4">Menu</p>
                    <SidebarItem tabKey="home" icon={<FaChartLine />} label="Dashboard" activeTab={activeTab} onClick={setActiveTab} />
                    <SidebarItem tabKey="submit" icon={<FaTasks />} label="Schedule Pickup" activeTab={activeTab} onClick={setActiveTab} />
                    <SidebarItem tabKey="immediate" icon={<FaTruckLoading />} label="Express Pickup" activeTab={activeTab} onClick={setActiveTab} />
                    <SidebarItem tabKey="view" icon={<FaTrashAlt />} label="All Submissions" activeTab={activeTab} onClick={setActiveTab} />

                    <div className="my-6 border-t border-gray-50" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 px-4">Account</p>
                    <SidebarItem tabKey="ecopoints" icon={<FaLeaf />} label="Rewards Program" activeTab={activeTab} onClick={setActiveTab} />
                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 px-4 py-4 mt-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all duration-300 transform active:scale-95"
                >
                    <FaSignOutAlt className="text-lg" />
                    <span>Logout System</span>
                </button>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="flex justify-between items-end mb-12 animate-fadeIn">
                    <div>
                        <p className="text-emerald-600 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Dashboard
                        </p>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Eco-friendly Morning, {username}.</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all
                            ${isLoading ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-md active:scale-95'}`}
                        >
                            <FaSyncAlt className={isLoading ? "animate-spin" : ""} />
                            {isLoading ? 'Syncing...' : 'Sync Data'}
                        </button>
                        <div className="relative p-3 bg-white rounded-2xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all">
                            <FaEnvelope className="text-emerald-600 text-xl" />
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-4 border-white rounded-full"></span>
                        </div>
                    </div>
                </header>

                {activeTab === "home" && <RenderHomeDashboard />}

                {/* Render Immediate Pickup with Weight Input */}
                {activeTab === "immediate" && <RenderImmediatePickup />}

                {/* Render Standard Pickup */}
                {activeTab === "submit" && (
                    <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100 max-w-xl">
                        <h3 className="text-xl font-semibold text-gray-700 mb-6 border-b pb-2">📦 Request Standard Pickup</h3>
                        <p className="text-sm text-gray-500 mb-5">This will schedule a pickup for the next available collection run, typically within 24 hours.</p>

                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            <div className="flex flex-col">
                                <label htmlFor="category_id" className="text-sm font-medium text-gray-700 mb-1">Waste Category</label>
                                <select
                                    name="category_id"
                                    id="category_id"
                                    value={formData.category_id}
                                    onChange={(e) => {
                                        const cat = categories.find(c => c._id === e.target.value);
                                        setFormData(prev => ({ ...prev, category: cat?.name || "", category_id: e.target.value, scheduled_date: new Date().toISOString() }));
                                    }}
                                    required
                                    disabled={isSubmitting}
                                    className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                >
                                    <option value="">-- Select Waste Type --</option>
                                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`text-white p-3 rounded-lg font-semibold transition duration-200 shadow-md 
                  ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed flex items-center justify-center' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <FaSyncAlt className="animate-spin mr-2" />
                                        Requesting Pickup...
                                    </>
                                ) : (
                                    'Submit Pickup Request'
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* View Tab */}
                {activeTab === "view" && (
                    <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100 overflow-x-auto">
                        <h3 className="text-xl font-semibold text-gray-700 mb-6 border-b pb-2">📄 Your Collection Submissions</h3>
                        {submissions.length ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL No.</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {submissions.map((s, i) => (
                                        <tr key={s._id} className="hover:bg-indigo-50 transition duration-150">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{i + 1}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.category}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{moment(s.scheduled_date).format('MMM DD, YYYY h:mm A')}</td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(s.status)}`}>
                                                    {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:text-red-800 transition duration-150">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="text-gray-500 italic">No submissions yet.</p>}
                    </div>
                )}


                {/* EcoPoints Tab */}
                {activeTab === "ecopoints" && (
                    <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100 text-center max-w-xl mx-auto">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">🌱 Your EcoPoints Status</h3>
                        <div className="flex flex-col items-center gap-4">
                            <FaLeaf className="text-6xl text-green-500" />
                            <p className="text-5xl font-extrabold text-gray-900">{ecoPoints}</p>
                            <p className="text-lg text-gray-600 mt-2">Total EcoPoints earned from **collected** submissions.</p>
                            <button className="text-indigo-600 hover:text-indigo-800 font-medium mt-4 p-2 rounded-lg border border-indigo-100">

                            </button>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default Dashboard;