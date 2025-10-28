import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaSignOutAlt,
  FaSun,
  FaMoon,
  FaUserCircle,
  FaCheckCircle,
  FaBolt, // Icon for 'Immediate' / Fast Pickup
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CollectorDashboardModern = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  // Default to false (Light Mode) for a more beautiful light theme presentation
  const [darkMode, setDarkMode] = useState(false); 
  const [filter, setFilter] = useState("all");

  const USER_API = "http://localhost:4321/api/collector/";
  const COLLECTOR_API = "http://localhost:4321/api/collector";

  // Initialize theme
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    // 🔑 FORCED LIGHT MODE: Explicitly set 'light' if no theme is stored or if it was light
    if (!theme || theme === "light") {
      localStorage.setItem("theme", "light");
      setDarkMode(false);
      document.documentElement.classList.remove("dark"); // Ensure no dark class is present
    } else {
      setDarkMode(theme === "dark");
    }
  }, []);

  // Apply dark mode to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Theme toggle
  const toggleTheme = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("theme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  // Check logged-in collector
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role.toLowerCase() !== "collector") {
      navigate("/");
    } else {
      setUser(storedUser);
    }
  }, [navigate]);

  // Fetch pickups
  useEffect(() => {
    const fetchPickups = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(USER_API, { headers: { token } });
        const formatted = res.data.pickups.map((p) => ({
          ...p,
          categoryName: p.category_id?.name || "Unknown",
          pendingReason: p.pendingReason || "",
          reasonSaved: false, // Local flag for UI feedback
        }));
        setPickups(formatted);
      } catch (err) {
        console.error("Error fetching pickups:", err);
        toast.error("Failed to fetch pickups");
      } finally {
        setLoading(false);
      }
    };
    fetchPickups();
  }, []);

  // Update pickup status (API call)
  const updateStatus = async (id, status, reason = "") => {
    try {
      const token = localStorage.getItem("token");

      const reasonToSend = status === "pending" ? reason : "";

      await axios.put(
        `${COLLECTOR_API}/${id}`,
        { status, pendingReason: reasonToSend },
        { headers: { token } }
      );

      setPickups((prev) =>
        prev.map((p) =>
          p._id === id
            ? {
                ...p,
                status,
                pendingReason: reasonToSend,
                reasonSaved: status === "pending" && reason.trim() !== "",
              }
            : p
        )
      );

      if (status === "pending") {
        toast.success("✅ Status changed to pending. Reason saved.");
      } else {
        if (status === "collected") {
          setPickups((prev) =>
            prev.map((p) => (p._id === id ? { ...p, pendingReason: "" } : p))
          );
        }
        toast.success(`✅ Status changed to "${status}"`);
      }
    } catch (err) {
      console.error("Error updating pickup status:", err);
      toast.error("❌ Failed to update status");
    }
  };

  // Local state change for reason input
  const handleReasonChange = (id, reason) => {
    setPickups((prev) =>
      prev.map((p) =>
        p._id === id ? { ...p, pendingReason: reason, reasonSaved: false } : p
      )
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // --------------------------------------------------------------------------
  // Count and Filter Logic (Kept the same logic as the previous corrected version)
  // --------------------------------------------------------------------------
  
  // 1. Immediate Pickups: Uncollected items that have weight
  const immediatePickups = pickups.filter(
    (p) => p.weight && p.status !== "collected" && p.status !== "pending"
  );
  const immediateCount = immediatePickups.length;

  // 2. Standard Approved Count: Approved items WITHOUT weight
  const standardApprovedCount = pickups.filter(
    (p) => p.status === "approved" && !p.weight
  ).length;

  // 3. New Pickups Card Total: The sum of standard approved AND fast pickups
  const newPickupsTotalCount = standardApprovedCount + immediateCount;

  // 4. Other counts remain the same
  const collectedCount = pickups.filter((p) => p.status === "collected").length;
  const pendingCount = pickups.filter((p) => p.status === "pending").length;

  const filteredPickups =
    filter === "all"
      ? pickups
      : filter === "immediate"
      ? immediatePickups
      : pickups.filter((p) => p.status === filter);
  // --------------------------------------------------------------------------


  if (loading)
    return (
      <p className="text-center text-gray-600 dark:text-gray-300 p-6">
        Loading dashboard...
      </p>
    );

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Container: Soft gray background for light mode */}
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors">
        
        {/* Sidebar: Clean white background and shadow */}
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-xl p-6 flex flex-col justify-between border-r border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-3xl font-extrabold mb-10 text-green-600">EcoLoop</h2>
            <nav>
              <ul className="space-y-3">
                {/* Profile Link */}
                <li
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-600 dark:text-gray-300"
                >
                  <FaUserCircle className="text-xl" /> Profile
                </li>

                {/* Dashboard */}
                <li
                  onClick={() => setFilter("all")}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    filter === "all"
                      ? "bg-green-50 text-green-700 font-bold dark:bg-green-900/50 dark:text-green-300"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                    <span className="w-5"></span> Dashboard
                </li>

                {/* IMMEDIATE Pickup Link (Fast Pickup) */}
                {immediateCount > 0 && (
                  <li
                    onClick={() => setFilter("immediate")}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      filter === "immediate"
                        ? "bg-red-600 text-white font-bold border-red-700 shadow-lg shadow-red-500/30"
                        : "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-800 dark:text-white dark:hover:bg-red-700 border-red-300 dark:border-red-900"
                    }`}
                  >
                    <FaBolt className={`text-xl ${filter !== 'immediate' ? 'animate-pulse' : ''}`} /> **Fast Pickup** ({immediateCount})
                  </li>
                )}

                {/* Collected Waste Link */}
                <li
                  onClick={() => setFilter("collected")}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    filter === "collected"
                      ? "bg-green-50 text-green-700 font-bold dark:bg-green-900/50 dark:text-green-300"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <FaCheckCircle className="text-xl text-green-500" /> Collected Waste ({collectedCount})
                </li>

                {/* Logout */}
                <li
                  onClick={handleLogout}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-gray-700 cursor-pointer text-red-500 dark:text-red-400 mt-6"
                >
                  <FaSignOutAlt className="text-xl" /> Logout
                </li>
              </ul>
            </nav>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 mt-8 px-4 py-2 w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg shadow-inner hover:shadow-md transition"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-10">
          
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Collector Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome, {user?.name}. Here is your task overview.</p>
          </header>

          {/* Cards (Sleeker design with shadows and clear colors) */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Total Pickups Card */}
            <div
              onClick={() => setFilter("all")}
              className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center shadow-lg hover:shadow-xl transition cursor-pointer"
            >
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pickups</p>
              <h3 className="text-3xl font-extrabold text-green-600 mt-1">{pickups.length}</h3>
            </div>

            {/* New Pickups Card (Purple/Indigo for Action Items) */}
            <div
              onClick={() => setFilter("approved")}
              className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center shadow-lg hover:shadow-xl transition cursor-pointer"
            >
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">New Pickups</p>
              <h3 className="text-3xl font-extrabold text-indigo-600 mt-1">{newPickupsTotalCount}</h3>
            </div>

            {/* Collected Card (Blue for Success/Completion) */}
            <div
              onClick={() => setFilter("collected")}
              className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center shadow-lg hover:shadow-xl transition cursor-pointer"
            >
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Collected</p>
              <h3 className="text-3xl font-extrabold text-blue-600 mt-1">{collectedCount}</h3>
            </div>

            {/* Pending Card (Orange for Warning/Hold) */}
            <div
              onClick={() => setFilter("pending")}
              className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center shadow-lg hover:shadow-xl transition cursor-pointer"
            >
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
              <h3 className="text-3xl font-extrabold text-orange-600 mt-1">{pendingCount}</h3>
            </div>
          </div>

          {/* Active filter label */}
          <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
            {filter === "immediate" ? "Fast Pickups" : filter.charAt(0).toUpperCase() + filter.slice(1)} Pickup List
          </h2>

          {/* Pickup Table */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            {filteredPickups.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 p-8">
                No pickups found for the current filter.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      <th className="p-4 text-left">User</th>
                      <th className="p-4 text-left">Ward no</th>
                      <th className="p-4 text-left">House No</th>
                      <th className="p-4 text-left">Category</th>
                      <th className="p-4 text-left">Date</th>
                      <th className="p-4 text-left">Weight</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Reason</th>
                      <th className="p-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {filteredPickups.map((pickup) => {
                      // Define the Fast Pickup condition
                      const isFastPickup = !!pickup.weight && pickup.status !== "collected" && pickup.status !== "pending";
                      
                      return (
                        <tr
                          key={pickup._id}
                          // Highlight fast/immediate rows with a very subtle background color
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ${
                            isFastPickup ? 'bg-red-50/50 dark:bg-red-900/10 border-l-4 border-red-500' : ''
                          }`}
                        >
                          {/* User cell with red light indicator */}
                          <td className="p-4 flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                            {isFastPickup && (
                              <FaBolt className="text-red-500 animate-pulse text-sm" title="Fast Pickup" />
                            )}
                            <span>{pickup.user_id?.name || "N/A"}</span>
                          </td>
                          
                          <td className="p-4 text-sm">{pickup.user_id?.wardNumber || "N/A"}</td>
                          <td className="p-4 text-sm">{pickup.user_id?.houseNumber || "N/A"}</td>
                          <td className="p-4 text-sm">{pickup.categoryName}</td>
                          
                          <td className="p-4 text-sm">
                            {new Date(pickup.scheduled_date).toLocaleDateString()}
                          </td>

                          {/* Weight column (emphasized for fast pickups) */}
                          <td className="p-4 font-semibold">
                            {pickup.weight ? (
                              <span className="text-red-600 dark:text-red-400">
                                {pickup.weight} kg (Est)
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          
                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                pickup.status === "collected"
                                  ? "bg-green-100 text-green-700 dark:bg-green-600 dark:text-white"
                                  : isFastPickup
                                  ? "bg-red-100 text-red-700 dark:bg-red-700 dark:text-white" // Light red for Fast Pickups
                                  : pickup.status === "approved" 
                                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-white"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500 dark:text-black"
                              }`}
                            >
                              {pickup.status}
                            </span>
                          </td>

                          {/* REASON COLUMN LOGIC */}
                          <td className="p-4">
                            {(pickup.status === "pending" ||
                              pickup.status === "approved" ||
                              isFastPickup) ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  className="px-2 py-1 w-32 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                  placeholder="Enter reason"
                                  value={pickup.pendingReason}
                                  onChange={(e) =>
                                    handleReasonChange(
                                      pickup._id,
                                      e.target.value
                                    )
                                  }
                                />
                                {pickup.reasonSaved &&
                                  pickup.status === "pending" && (
                                    <span className="text-green-500">✔</span>
                                  )}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">
                                {pickup.pendingReason || '-'}
                              </span>
                            )}
                          </td>

                          {/* ACTIONS COLUMN LOGIC */}
                          <td className="p-4 flex gap-2">
                            {pickup.status !== "collected" && (
                              <button
                                className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition"
                                onClick={() =>
                                  updateStatus(pickup._id, "collected")
                                }
                              >
                                Collected
                              </button>
                            )}

                            {pickup.status !== "collected" && (
                              <button
                                className={`px-3 py-1 rounded-md text-white text-sm font-semibold shadow-md disabled:opacity-50 transition ${
                                  pickup.status === "approved" || isFastPickup
                                    ? "bg-orange-500 hover:bg-orange-600"
                                    : "bg-yellow-600 hover:bg-yellow-700"
                                }`}
                                onClick={() => {
                                  if (pickup.status === "approved" || isFastPickup) {
                                    setPickups((prev) =>
                                      prev.map((p) =>
                                        p._id === pickup._id
                                          ? { ...p, status: "pending", reasonSaved: false }
                                          : p
                                      )
                                    );
                                  }
                                  updateStatus(
                                    pickup._id,
                                    "pending",
                                    pickup.pendingReason
                                  );
                                }}
                                disabled={
                                  pickup.status === "pending" &&
                                  pickup.pendingReason.trim() === ""
                                }
                              >
                                {pickup.status === "approved" || isFastPickup
                                  ? "Set Pending"
                                  : "Save Pending"}
                              </button>
                            )}

                            {pickup.status === "collected" && (
                              <span className="text-gray-500 dark:text-gray-400 text-sm p-1">
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default CollectorDashboardModern;