import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSignOutAlt,
  FaSun,
  FaMoon,
  FaUserCircle,
  FaCheckCircle,
  FaBolt,
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaWeightHanging,
  FaHome,
  FaMapMarkerAlt,
  FaTruck,
  FaClock,
  FaChartBar,
  FaWallet,
  FaBell,
  FaMap,
  FaCalendarDay,
  FaCalendarWeek,
  FaHistory,
  FaRecycle,
  FaFileAlt,
  FaLeaf,
  FaTools,
  FaPlug,
  FaBalanceScale,
  FaBox,
  FaStar
} from "react-icons/fa";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CollectorDashboardModern = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, schedule, analytics, earnings, notifications
  const [scheduleFilter, setScheduleFilter] = useState("all"); // all, today, tomorrow, weekly

  // New States
  const [analytics, setAnalytics] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [cleaningEvents, setCleaningEvents] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [selectedPickupForMap, setSelectedPickupForMap] = useState(null);
  const [gasWarning, setGasWarning] = useState(null);

  const API_BASE = window.location.hostname === 'localhost'
    ? "http://localhost:4321/api"
    : "/api"; // In production it often proxies or serves on same port

  const PICKUPS_API = `${API_BASE}/collector/`;
  const DASHBOARD_API = `${API_BASE}/collector-dashboard`;

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (!theme || theme === "light") {
      localStorage.setItem("theme", "light");
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    } else {
      setDarkMode(theme === "dark");
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("theme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role.toLowerCase() !== "collector") {
      navigate("/");
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  const [updatingId, setUpdatingId] = useState(null);
  const [localReasons, setLocalReasons] = useState({});

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    console.log("🔗 Fetching Dashboard Data Parallel...");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("❌ No token found, redirecting...");
        navigate("/login");
        return;
      }
      const headers = { token };

      // Use Promise.allSettled to ensure failure of one doesn't block others
      const [pickupsRes, analyticsRes, earningsRes, notifRes, cleaningRes] = await Promise.allSettled([
        axios.get(`${PICKUPS_API}?filter=${scheduleFilter}`, { headers }),
        axios.get(`${DASHBOARD_API}/analytics`, { headers }),
        axios.get(`${DASHBOARD_API}/earnings`, { headers }),
        axios.get(`${DASHBOARD_API}/notifications`, { headers }),
        axios.get(`${API_BASE}/cleaning-requests/collector`, { headers }) // We'll need to create this endpoint
      ]);

      if (pickupsRes.status === "fulfilled") {
        setPickups(pickupsRes.value.data.pickups || []);
      } else {
        console.error("❌ Pickups Fetch Failed:", pickupsRes.reason);
      }

      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value.data);
      } else {
        console.error("❌ Analytics Fetch Failed:", analyticsRes.reason);
      }

      if (earningsRes.status === "fulfilled") {
        setEarnings(earningsRes.value.data.earnings);
      } else {
        console.error("❌ Earnings Fetch Failed:", earningsRes.reason);
      }

      if (notifRes.status === "fulfilled") {
        setNotifications(notifRes.value.data.notifications || []);
      } else {
        console.warn("⚠️ Notifications Fetch Failed (Soft Failure):", notifRes.reason);
      }

      if (cleaningRes.status === "fulfilled") {
        setCleaningEvents(cleaningRes.value.data.data || []);
      } else {
        console.warn("⚠️ Cleaning Events Fetch Failed:", cleaningRes.reason);
      }

      // Fetch Gas Data for Safety
      try {
        const gasRes = await axios.get(`${API_BASE}/iot/latest-readings`);
        if (gasRes.data.success && gasRes.data.latest) {
          if (gasRes.data.latest.status !== 'Normal') {
            setGasWarning(gasRes.data.latest);
          } else {
            setGasWarning(null);
          }
        }
      } catch (gasErr) {
        console.error("⚠️ Gas Data Sync Failed:", gasErr);
      }

    } catch (err) {
      console.error("❌ Critical Sync Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [scheduleFilter]);

  const getCategoryStyle = (name) => {
    const cat = name?.toLowerCase() || "";
    if (cat.includes("plastic")) return { bg: "bg-sky-100", text: "text-sky-700", icon: <FaRecycle size={10} /> };
    if (cat.includes("paper")) return { bg: "bg-amber-100", text: "text-amber-700", icon: <FaFileAlt size={10} /> };
    if (cat.includes("organic") || cat.includes("food")) return { bg: "bg-emerald-100", text: "text-emerald-700", icon: <FaLeaf size={10} /> };
    if (cat.includes("metal")) return { bg: "bg-slate-100", text: "text-slate-700", icon: <FaTools size={10} /> };
    if (cat.includes("electronic") || cat.includes("ewaste")) return { bg: "bg-rose-100", text: "text-rose-700", icon: <FaPlug size={10} /> };
    return { bg: "bg-slate-100", text: "text-slate-600", icon: <FaBox size={10} /> };
  };

  const updateStatus = async (id, status) => {
    console.log(`🚀 Updating Pickup ${id} to ${status}...`);
    setUpdatingId(id);
    const reason = localReasons[id] || "";

    // Optimistic Update
    setPickups(prev => prev.map(p => p._id === id ? { ...p, status, pendingReason: status === "pending" ? reason : "" } : p));

    try {
      const token = localStorage.getItem("token");
      const url = `${API_BASE}/collector/${id}`;
      console.log(`📡 Sending PUT to ${url}`);

      const res = await axios.put(
        url,
        { status, pendingReason: status === "pending" ? reason : "" },
        { headers: { token } }
      );

      console.log("✅ Update Success:", res.data);
      toast.success(`Marked as ${status}`);
      await fetchData(true); // Silent refresh
    } catch (err) {
      console.error("❌ Update failed:", err.response?.data || err.message);
      fetchData(true); // Rollback
      if (err.response?.status === 401) navigate("/login");
      toast.error(`Error: ${err.response?.data?.message || "Internal server error"}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        </div>
      </div>
    );

  const COLORS = ['#10b981', '#6366f1', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar />

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <FaTruck />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">EcoLoop</h2>
            </div>

            <nav className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Main Menu</p>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => setActiveTab("dashboard")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "dashboard"
                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <FaHome /> Dashboard
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("schedule")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "schedule"
                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <FaCalendarDay /> Schedule
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("collected")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "collected"
                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <FaCheckCircle className={activeTab === "collected" ? "text-emerald-500" : ""} /> Collected Waste
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("pending_tasks")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "pending_tasks"
                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <FaClock className={activeTab === "pending_tasks" ? "text-amber-500" : ""} /> Pending/Hold
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("cleaning_events")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "cleaning_events"
                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <FaStar className={activeTab === "cleaning_events" ? "text-purple-500" : ""} /> Event Cleaning
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("analytics")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "analytics"
                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <FaChartBar /> Performance
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab("earnings")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "earnings"
                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <FaWallet /> Earnings
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Center</p>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === "notifications"
                    ? "bg-emerald-50 text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <FaBell /> <span>Notifications</span>
                  </div>
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                  )}
                </button>
              </div>
            </nav>
          </div>

          <div className="mt-auto p-8 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all mb-4"
            >
              <FaSignOutAlt /> Sign Out
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all"
            >
              {darkMode ? <><FaSun className="text-amber-500" /> Day View</> : <><FaMoon className="text-indigo-500" /> Night View</>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="p-10 max-w-7xl mx-auto pb-24">

            {/* Top Bar */}
            <div className="flex justify-between items-end mb-8">
              <div>
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-600 mb-3 transition-colors group"
                >
                  <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                  <span>Back</span>
                </button>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View
                </h1>
                <p className="text-xs text-slate-500 font-medium">Hello, {user?.name} • Your EcoLoop Collector Portal</p>
              </div>
              <div 
                className="bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-all"
                onClick={() => navigate('/profile')}
              >
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xs font-bold">
                  {user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{user?.name}</p>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Collector ID: ...{(user?.id || user?._id)?.slice(-4)}</p>
                </div>
              </div>
            </div>

            {/* Gas Safety Warning */}
            {gasWarning && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-8 p-6 rounded-[2.5rem] border shadow-xl flex flex-col md:flex-row items-center gap-6 animate-pulse ${gasWarning.status === 'High' ? 'bg-rose-600 text-white border-rose-400' : 'bg-amber-100 text-amber-900 border-amber-200'}`}
              >
                <div className={`p-4 rounded-3xl ${gasWarning.status === 'High' ? 'bg-white/20' : 'bg-amber-200'} flex items-center justify-center`}>
                  <FaBolt className={gasWarning.status === 'High' ? 'text-white' : 'text-amber-700'} size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${gasWarning.status === 'High' ? 'bg-white text-rose-600' : 'bg-amber-700 text-white'}`}>
                      {gasWarning.status} Risk Level
                    </span>
                    <h3 className="text-lg font-black uppercase tracking-tight">Harmful Gas Detection Alert</h3>
                  </div>
                  <p className="text-sm font-bold leading-relaxed">
                    Harmful gases may be present inside the bin ({gasWarning.binId} - {gasWarning.gasLevel} PPM). 
                    Sanitation workers should avoid cleaning the bin until proper ventilation or waste collection is performed. 
                    Worker safety is a priority, and immediate action is recommended.
                  </p>
                </div>
                {gasWarning.status === 'High' && (
                  <div className="hidden md:block w-px h-16 bg-white/20"></div>
                )}
                <button 
                  onClick={() => navigate('/admin/smart-bin-monitor')}
                  className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${gasWarning.status === 'High' ? 'bg-white text-rose-600 hover:bg-rose-50' : 'bg-amber-700 text-white hover:bg-amber-800'}`}
                >
                  Inspect Bin
                </button>
              </motion.div>
            )}

            {/* TASK VIEWS (Dashboard, Collected, Pending) */}
            {(activeTab === "dashboard" || activeTab === "collected" || activeTab === "pending_tasks") && (
              <>
                {activeTab === "dashboard" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: "My Works", value: analytics?.analytics?.total || 0, color: "emerald", icon: FaTruck },
                      { label: "Completion", value: `${analytics?.analytics?.completionRate || 0}%`, color: "indigo", icon: FaCheckCircle },
                      { label: "Monthly", value: analytics?.analytics?.monthly || 0, color: "sky", icon: FaHistory },
                      { label: "Efficiency", value: analytics?.analytics?.efficiencyScore || 0, color: "amber", icon: FaBolt }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm transition-all group">
                        <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 mb-3`}>
                          <stat.icon size={18} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-6 flex justify-between items-center px-2">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                    {activeTab === "collected" ? "Collection History" : activeTab === "pending_tasks" ? "Held Submissions" : "Recent Task Queue"}
                  </h2>
                  {activeTab === "dashboard" && (
                    <button onClick={() => setActiveTab("schedule")} className="text-xs font-bold text-emerald-600 hover:underline">View Full Schedule</button>
                  )}
                </div>

                <div className="bg-white rounded-[1.5rem] shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-50">
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Target</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pickups.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <FaTruck className="text-slate-200 text-3xl" />
                              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active pickups found at the moment</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        (activeTab === "collected"
                          ? pickups.filter(p => p.status === "collected")
                          : activeTab === "pending_tasks"
                            ? pickups.filter(p => p.status === "pending")
                            : pickups.filter(p => p.status !== "collected")
                        ).map((pickup) => (
                          <tr key={pickup._id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-6 py-5">
                              <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                {pickup.user_id?.name || "User"}
                                {pickup.is_immediate && (
                                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                                )}
                              </p>
                              <div className={`mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit ${getCategoryStyle(pickup.category_id?.name).bg} ${getCategoryStyle(pickup.category_id?.name).text} border border-white`}>
                                {getCategoryStyle(pickup.category_id?.name).icon}
                                <span className="text-[9px] font-black uppercase tracking-wider">{pickup.category_id?.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-xs font-bold text-slate-700 tracking-tight">Ward {pickup.user_id?.wardNumber}</p>
                              <p className="text-[10px] text-slate-400">Unit {pickup.user_id?.houseNumber}</p>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${pickup.status === "collected" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                                }`}>
                                {pickup.status}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex flex-col items-end gap-2">
                                {pickup.status !== "collected" ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="Note..."
                                      className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] w-24 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                      value={localReasons[pickup._id] || ""}
                                      onChange={(e) => setLocalReasons({ ...localReasons, [pickup._id]: e.target.value })}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateStatus(pickup._id, "collected")}
                                      disabled={updatingId === pickup._id}
                                      className={`px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all active:scale-95 ${updatingId === pickup._id ? 'opacity-50' : ''}`}
                                    >
                                      {updatingId === pickup._id ? "Wait..." : "Done"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateStatus(pickup._id, "pending")}
                                      disabled={updatingId === pickup._id}
                                      className={`px-3 py-2 bg-white border border-slate-200 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all ${updatingId === pickup._id ? 'opacity-50' : ''}`}
                                    >
                                      Hold
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                    <FaCheckCircle className="text-xs" /> Finished
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => { setSelectedPickupForMap(pickup); setShowMap(true); }}
                                  className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-all"
                                >
                                  <FaMap size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* EVENT CLEANING TAB */}
            {activeTab === "cleaning_events" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                    My Assigned Cleaning Events
                  </h2>
                </div>
                {cleaningEvents.length === 0 ? (
                  <div className="bg-white p-20 rounded-[2rem] border border-dashed border-slate-200 text-center">
                    <FaStar className="mx-auto text-slate-200 text-4xl mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Events Assigned to Your Team</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cleaningEvents.map((req) => (
                      <div key={req._id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-100">
                            {req.eventType}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border hover:scale-105 transition-transform cursor-default ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                            {req.status}
                          </span>
                        </div>

                        <div className="space-y-3 mb-6 flex-grow">
                          <div className="flex items-center text-sm font-bold text-slate-700">
                            <FaUserCircle size={16} className="text-slate-400 mr-3" />
                            {req.user_id ? req.user_id.name : "Unknown User"}
                          </div>
                          <div className="flex items-center text-sm font-medium text-slate-500">
                            <FaCalendarAlt size={16} className="text-slate-400 mr-3" />
                            {new Date(req.scheduled_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-sm font-medium text-slate-500">
                            <FaClock size={16} className="text-slate-400 mr-3" />
                            {req.time}
                          </div>
                          <div className="flex items-start text-sm font-medium text-slate-500">
                            <FaMapMarkerAlt size={16} className="text-slate-400 mr-3 mt-0.5" />
                            <span className="line-clamp-2">{req.location}</span>
                          </div>
                        </div>

                        {req.status !== 'completed' && (
                          <div className="pt-6 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem("token");
                                  await axios.put(`${API_BASE}/cleaning-requests/${req._id}/complete`, {}, { headers: { token } });
                                  toast.success("Event marked as completed");
                                  fetchData(true);
                                } catch (error) {
                                  toast.error("Failed to update status");
                                  console.error(error);
                                }
                              }}
                              className="w-full py-3 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-500 transition-all active:scale-95 shadow-md shadow-purple-500/20"
                            >
                              Mark as Completed
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SCHEDULE TAB */}
            {activeTab === "schedule" && (
              <div className="space-y-6">
                <div className="flex gap-2 p-1 bg-slate-100 w-fit rounded-xl">
                  {["all", "today", "tomorrow", "weekly"].map(f => (
                    <button
                      key={f}
                      onClick={() => setScheduleFilter(f)}
                      className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${scheduleFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {pickups.filter(p => p.status !== "collected").length === 0 ? (
                      <div className="bg-white p-20 rounded-[2rem] border border-dashed border-slate-200 text-center">
                        <FaCalendarAlt className="mx-auto text-slate-200 text-4xl mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Scheduled Tasks for this period</p>
                      </div>
                    ) : (
                      pickups.filter(p => p.status !== "collected").map(pickup => (
                        <div key={pickup._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-all">
                          <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                              <FaCalendarAlt />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                {pickup.user_id?.name}
                                {pickup.is_immediate && (
                                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[8px] rounded-md animate-pulse">URGENT</span>
                                )}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${getCategoryStyle(pickup.category_id?.name).bg} ${getCategoryStyle(pickup.category_id?.name).text}`}>
                                  {getCategoryStyle(pickup.category_id?.name).icon}
                                  <span className="text-[9px] font-black uppercase text-inherit">{pickup.category_id?.name}</span>
                                </div>
                                {pickup.weight && (
                                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                                    <FaBalanceScale size={10} /> {pickup.weight} KG
                                  </div>
                                )}
                                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                  <FaClock /> {new Date(pickup.scheduled_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Location</p>
                              <p className="text-xs font-bold text-slate-700">Ward {pickup.user_id?.wardNumber}, Unit {pickup.user_id?.houseNumber}</p>
                            </div>
                            <button
                              onClick={() => { setSelectedPickupForMap(pickup); setShowMap(true); }}
                              className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              <FaMap size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(pickup._id, "collected")}
                              disabled={updatingId === pickup._id}
                              className={`px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95 ${updatingId === pickup._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {updatingId === pickup._id ? "Wait..." : "Done"}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm h-fit">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Schedule Insights</h3>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Area Tasks</p>
                        <p className="text-xl font-black text-emerald-600">{pickups.length}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Immediate Priority</p>
                        <p className="text-xl font-black text-rose-500">{pickups.filter(p => p.is_immediate).length}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-50 text-[10px] text-slate-400 font-medium leading-relaxed italic">
                        The schedule is synchronized with Admin planning. All tasks are assigned based on your ward coverage.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Waste Breakdown (Analytics)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.breakdown || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {(analytics?.breakdown || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {(analytics?.breakdown || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">{item._id}: <span className="text-slate-900">{item.count}</span></p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">On-Time Performance</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Mon', completion: 85 },
                        { name: 'Tue', completion: 92 },
                        { name: 'Wed', completion: 78 },
                        { name: 'Thu', completion: 95 },
                        { name: 'Fri', completion: 88 },
                        { name: 'Sat', completion: 90 },
                        { name: 'Sun', completion: 80 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="completion" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-center text-slate-400 mt-4 uppercase font-bold tracking-widest">Self-Assessed Weekly Completion Rate (%)</p>
                </div>
              </div>
            )}

            {/* EARNINGS TAB */}
            {activeTab === "earnings" && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-emerald-600 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200 mb-8 relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Total Monthly Earnings</p>
                    <h2 className="text-6xl font-black mb-10">₹{earnings?.totalEarnings || "0"}</h2>
                    <div className="grid grid-cols-3 gap-10">
                      <div>
                        <p className="text-[10px] uppercase font-black opacity-60 mb-1">Base Salary</p>
                        <p className="text-lg font-bold">₹{earnings?.baseSalary || "0"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black opacity-60 mb-1">Incentives</p>
                        <p className="text-lg font-bold">₹{earnings?.incentiveEarned || "0"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black opacity-60 mb-1">Collections</p>
                        <p className="text-lg font-bold">{earnings?.completedCollections || "0"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full"></div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Bonus Eligibility Track</h3>
                  <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden mb-4">
                    <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (earnings?.completedCollections / 50) * 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                    <span>Progress: {earnings?.completedCollections} / 50 Collections</span>
                    <span className={earnings?.bonusEligible ? "text-emerald-500" : ""}>
                      {earnings?.bonusEligible ? "Bonus Unlocked!" : "Unlock Bonus at 50"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <div className="max-w-3xl mx-auto space-y-4">
                {notifications.length === 0 ? (
                  <div className="bg-white p-20 rounded-[2rem] text-center">
                    <FaBell className="mx-auto text-slate-100 text-6xl mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Inbox is empty</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif._id} className={`p-6 rounded-2xl border ${notif.isRead ? 'bg-white border-slate-100' : 'bg-emerald-50/30 border-emerald-100'} transition-all`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{notif.title}</h4>
                        <span className="text-[9px] font-bold text-slate-400">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MAP MODAL */}
      {showMap && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Pickup Location</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedPickupForMap?.user_id?.name}'s Home</p>
              </div>
              <button onClick={() => setShowMap(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all font-bold">×</button>
            </div>
            <div className="flex-1 z-10">
              <MapContainer center={[selectedPickupForMap?.latitude || 10.0, selectedPickupForMap?.longitude || 76.0]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[selectedPickupForMap?.latitude || 10.0, selectedPickupForMap?.longitude || 76.0]}>
                  <Popup>
                    <div className="p-2 text-center">
                      <p className="font-bold text-slate-900">{selectedPickupForMap?.user_id?.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{selectedPickupForMap?.user_id?.address}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center px-8">
              <p className="text-xs font-black uppercase tracking-widest">Optimized Route Active</p>
              <button className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-xl">Navigate Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorDashboardModern;
