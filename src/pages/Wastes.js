import React, { useState, useEffect, useCallback } from "react";
// Removed FaCheckCircle to fix the ESLint warning
import { FaUserCircle, FaTrashAlt, FaLeaf, FaChartLine, FaSignOutAlt, FaTasks, FaEnvelope, FaCalendarAlt, FaSyncAlt, FaTruckLoading, FaExclamationTriangle, FaListOl } from "react-icons/fa";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import moment from "moment"; 

// --- Custom Components & Utilities for Design (Unchanged) ---

const SidebarItem = ({ activeTab, tabKey, icon, label, onClick }) => (
  <button
    onClick={() => onClick(tabKey)}
    className={`flex items-center gap-3 p-3 rounded-lg text-left transition duration-200 w-full ${
      activeTab === tabKey
        ? "bg-indigo-600 text-white font-semibold shadow-md"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`}
  >
    {icon}
    <span className="text-base">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon, textColor }) => (
  <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 flex items-center justify-between transition duration-300 hover:shadow-lg h-24">
    <div className="flex flex-col">
      <h3 className="text-xs font-medium text-gray-500 uppercase">{title}</h3>
      <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
    </div>
    {icon && React.cloneElement(icon, { className: `${textColor} text-2xl` })}
  </div>
);


const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [username, setUsername] = useState("User");
  const [userId, setUserId] = useState("");
  const [categories, setCategories] = useState([]); 
  const [submissions, setSubmissions] = useState([]);
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
    }
  }, [userId, fetchSubmissions]);

  const handleRefresh = () => {
    fetchSubmissions();
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
  
  const chartData = submissions.filter(s => s.status === "collected").map(s => ({
      date: moment(s.scheduled_date).format('MM/DD'),
      category: s.category 
  }));

  const aggregatedDataMap = chartData.reduce((acc, item) => {
      const dateKey = item.date;
      if (!acc[dateKey]) { acc[dateKey] = { date: dateKey }; categories.forEach(cat => { acc[dateKey][cat.name] = 0; }); }
      if (item.category) { acc[dateKey][item.category] = (acc[dateKey][item.category] || 0) + 1; }
      return acc;
  }, {});

  const aggregatedData = Object.values(aggregatedDataMap)
      .sort((a, b) => moment(a.date, 'MM/DD').valueOf() - moment(b.date, 'MM/DD').valueOf());

  const uniqueCategoryNames = categories.map(c => c.name);

  // --- KPI Cards Data (Omitted for brevity) ---
  const completedSubmissions = submissions.filter(s => s.status === "collected").length;
  const totalSubmissions = submissions.length;
  const completionPercentage = totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 100) : 0;
  
  // --- Render Functions for Tabs (Omitted for brevity) ---
  
  const RenderHomeDashboard = () => {
      const chartColors = ["#4F46E5", "#F59E0B", "#EF4444", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6"]; 
      
      return (
        <div className="space-y-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"> 
            <StatCard 
              title="Total Submissions" 
              value={totalSubmissions} 
              icon={<FaTasks />} 
              textColor="text-indigo-500" 
            />
            
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 flex items-center justify-around h-24">
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-gray-500 uppercase">Submission Completion</h3>
                <p className="text-xl font-extrabold text-gray-900 mt-1">{completedSubmissions} / {totalSubmissions}</p>
              </div>
              <div className="w-12 h-12">
                <CircularProgressbar
                  value={completionPercentage}
                  text={`${completionPercentage}%`}
                  styles={buildStyles({
                    pathColor: "#4F46E5",
                    textColor: "#1F2937",
                    trailColor: "#E5E7EB",
                    strokeLinecap: "round",
                    textSize: '28px',
                  })}
                />
              </div>
            </div>
            
            <StatCard 
              title="EcoPoints Earned" 
              value={ecoPoints} 
              icon={<FaLeaf />} 
              textColor="text-green-500" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                <FaChartLine className="text-indigo-600" /> Waste Type Collection Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={aggregatedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis allowDecimals={false} domain={[0, 'auto']} stroke="#6b7280" /> 
                  <Tooltip 
                    formatter={(value, name) => [`${value} Collections`, name]} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }}/>

                  {uniqueCategoryNames.map((category, index) => {
                    const color = chartColors[index % chartColors.length];
                    
                    return (
                      <React.Fragment key={category}>
                        <defs>
                          <linearGradient id={`color${category.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.4}/> 
                            <stop offset="95%" stopColor={color} stopOpacity={0.0}/> 
                          </linearGradient>
                        </defs>
                        
                        <Area 
                          type="bump" 
                          dataKey={category} 
                          stroke={color} 
                          strokeWidth={2}
                          fill={`url(#color${category.replace(/\s/g, "")})`}
                          fillOpacity={0.8} 
                          name={category} 
                        />
                      </React.Fragment>
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 flex flex-col items-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2"><FaCalendarAlt className="text-indigo-600" /> Key Dates</h3>
              <div className="w-full">
                <Calendar
                  className="w-full border-none shadow-none text-gray-700"
                  tileClassName={({ date }) => {
                    const isScheduled = submissions.some(s => new Date(s.scheduled_date).toDateString() === date.toDateString());
                    if (isScheduled) {
                      return "bg-indigo-500 text-white font-semibold rounded-full !p-2 !m-1"; 
                    }
                    return "";
                  }}
                />
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
    <div className="flex h-screen bg-gray-50 font-sans antialiased">
      <aside className="w-64 bg-gray-800 shadow-2xl flex flex-col p-5">
        <h1 className="text-2xl font-bold text-white mb-10 border-b border-gray-700 pb-4">
          <span className="text-indigo-400">Eco</span>Waste
        </h1>
        <nav className="flex flex-col gap-2 flex-grow">
          <SidebarItem tabKey="home" icon={<FaChartLine />} label="Dashboard Overview" activeTab={activeTab} onClick={setActiveTab} />
          
          <SidebarItem 
            tabKey="submit" 
            icon={<FaTasks />} 
            label="Standard Pickup" 
            activeTab={activeTab} 
            onClick={setActiveTab} 
          />
          
          <SidebarItem 
              tabKey="immediate" 
              icon={<FaTruckLoading />} 
              label="Immediate Pickup" 
              activeTab={activeTab} 
              onClick={setActiveTab} 
          />
          
          <SidebarItem tabKey="view" icon={<FaTrashAlt />} label="View Submissions" activeTab={activeTab} onClick={setActiveTab} />
          <SidebarItem tabKey="ecopoints" icon={<FaLeaf />} label="EcoPoints Rewards" activeTab={activeTab} onClick={setActiveTab} />
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 p-3 mt-4 bg-gray-700 text-gray-300 rounded-lg hover:bg-red-600 hover:text-white transition duration-200"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaUserCircle className="text-indigo-600 text-3xl" />
            <h2 className="text-3xl font-bold text-gray-800">Welcome back, {username}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`flex items-center gap-2 p-2 rounded-lg text-gray-600 border border-gray-200 transition duration-200
                ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-indigo-50 hover:text-indigo-600'}`}
              title="Refresh Data"
            >
              <FaSyncAlt className={isLoading ? "animate-spin" : ""} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <FaEnvelope className="text-gray-600 text-xl hover:text-indigo-600 transition cursor-pointer" /> 
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
                View Rewards Catalog →
              </button>
            </div>
          </div>
        )}
        
      </main>
    </div>
  );
};

export default Dashboard;