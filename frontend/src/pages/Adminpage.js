import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Trash2,
  Store,
  LineChart,
  Users,
  Leaf,
  Zap,
  BookOpen,
  ClipboardCheck,
  LogOut,
  Bell,
  Search,
  UserCircle,
  Clock,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  Package,
  Activity,
  Cpu,
  Sparkles
} from "lucide-react";

const AdminPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [gasAlert, setGasAlert] = useState(null);

  React.useEffect(() => {
    const fetchGasAlert = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4321';
        const response = await fetch(`${apiUrl}/api/iot/latest-readings`);
        const data = await response.json();
        if (data.success && data.latest && data.latest.status !== 'Normal') {
          setGasAlert(data.latest);
        } else {
          setGasAlert(null);
        }
      } catch (err) {
        console.error("Failed to fetch gas alert:", err);
      }
    };

    fetchGasAlert();
    const interval = setInterval(fetchGasAlert, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/adminpage" },
    { icon: Trash2, label: "Waste Management", path: "/admin/waste-management" },
    { icon: BookOpen, label: "Learning Videos", path: "/admin/LearningvideosManagement" },
    { icon: Users, label: "Users Management", path: "/admin/UserManage" },
    { icon: Store, label: "Sellers & Shop", path: "/admin/shop-management" },
    { icon: ClipboardCheck, label: "Applications", path: "/admin/applications" },
    { icon: Clock, label: "Leave Requests", path: "/admin/leave-applications" },
    { icon: LineChart, label: "System Reports", path: "/admin/SystemReports" },
    { icon: Activity, label: "Assign Delivery", path: "/admin/assign-delivery-boy" },
    { icon: Cpu, label: "Smart Bin Monitor", path: "/admin/smart-bin-monitor" },
    { icon: Sparkles, label: "Cleaning Requests", path: "/admin/cleaning-requests" },
  ];

  const quickAccess = [
    { icon: Trash2, title: "Waste Control", path: "/admin/waste-management", color: "emerald", desc: "Manage submissions" },
    { icon: Users, title: "Account Control", path: "/admin/UserManage", color: "blue", desc: "Verify members" },
    { icon: BookOpen, title: "Education Hub", path: "/admin/LearningvideosManagement", color: "purple", desc: "Learning content" },
    { icon: Store, title: "Market Hub", path: "/admin/shop-management", color: "amber", desc: "Store & Inventory" },
    { icon: LineChart, title: "Data Reports", path: "/admin/SystemReports", color: "rose", desc: "System analytics" },
    { icon: Leaf, title: "EcoPoints", path: "/admin/Ecopints", color: "green", desc: "Rewards control" },
    { icon: Cpu, title: "Bin Monitor", path: "/admin/smart-bin-monitor", color: "rose", desc: "IoT Gas Sensor" },
    { icon: Package, title: "Eco Products", path: "/products", color: "orange", desc: "Verify listings" },
    { icon: Zap, title: "Efficiency", path: "/adminpage", color: "indigo", desc: "Optimize routes" },
    { icon: Sparkles, title: "Cleaning Jobs", path: "/admin/cleaning-requests", color: "teal", desc: "Assign workers" },
  ];

  const stats = [
    { label: "Active Users", value: "1,284", icon: Users, trend: "+12%" },
    { label: "Total Waste", value: "48.2 Tons", icon: Trash2, trend: "+8%" },
    { label: "Shop Sales", value: "₹2.4L", icon: TrendingUp, trend: "+15%" },
    { label: "EcoPoints", value: "85K", icon: Leaf, trend: "+22%" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased text-slate-900 overflow-hidden">

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-all duration-300 shadow-xl flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-xl shadow-lg shadow-purple-200">
              <Leaf className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase">EcoLoop<span className="text-purple-600">Admin</span></h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto px-4 py-8 scrollbar-hide">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 px-3">Main Control Console</p>
          <nav className="space-y-1.5">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className={`group flex items-center justify-between w-full p-3.5 text-sm font-bold rounded-2xl transition-all duration-200 text-left ${idx === 0
                  ? "bg-purple-50 text-purple-700 shadow-sm shadow-purple-100/50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <div className="flex items-center">
                  <item.icon className={`mr-3.5 transition-colors ${idx === 0 ? "text-purple-600" : "text-slate-400 group-hover:text-slate-600"}`} size={18} />
                  <span>{item.label}</span>
                </div>
                {idx === 0 && <ChevronRight size={14} className="text-purple-400" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full p-3.5 bg-white text-rose-500 font-bold rounded-2xl border border-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-300 group shadow-sm"
          >
            <LogOut size={18} className="transition-transform group-hover:translate-x-0.5" />
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-72 transition-all duration-300">

        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 lg:hidden">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-purple-500/10 focus-within:border-purple-500/50 focus-within:bg-white transition-all">
              <Search className="text-slate-400 mr-2" size={16} />
              <input type="text" placeholder="Search system resources..." className="bg-transparent border-none focus:outline-none text-sm font-bold w-64 placeholder:text-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2.5 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition-all border border-slate-200 group">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
            </button>
            <div className="h-10 w-[1px] bg-slate-200 mx-2"></div>
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-all"
              onClick={() => navigate('/profile')}
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-tight uppercase tracking-tight">Anjaly Admin</p>
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Super Admin</p>
              </div>
              <div className="w-10 h-10 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-200 flex items-center justify-center font-black text-sm">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-8 overflow-y-auto scrollbar-hide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Page Title & Breadcrumbs */}
            <div className="mb-10">
              <h1 className="text-4xl font-black text-slate-900 tracking-tightest leading-tight">Dashboard Overview</h1>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Monitoring the core of EcoLoop intelligence architecture.</p>
            </div>

            {/* Smart Bin Safety Alert */}
            <AnimatePresence>
              {gasAlert && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-10 overflow-hidden"
                >
                  <div className={`p-6 rounded-[2.5rem] border-2 shadow-xl flex flex-col md:flex-row items-center gap-6 ${gasAlert.status === 'High' ? 'bg-rose-600 text-white border-rose-400 shadow-rose-200/50' : 'bg-amber-500 text-white border-amber-300 shadow-amber-200/50'}`}>
                    <div className="p-4 bg-white/20 rounded-3xl flex items-center justify-center shrink-0">
                      <Zap className="text-white" size={32} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/30">
                          Critical Alert: {gasAlert.status} Risk
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest opacity-80">
                          Bin: {gasAlert.binId}
                        </span>
                      </div>
                      <p className="text-sm font-bold leading-relaxed">
                        Harmful gases may be present inside the bin. Sanitation workers should avoid cleaning the bin until proper ventilation or waste collection is performed. Worker safety is a priority, and immediate action is recommended.
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate('/admin/smart-bin-monitor')}
                      className="px-8 py-3.5 bg-white text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 shrink-0 shadow-lg shadow-black/10"
                    >
                      Audit Bin Log
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>



            {/* Quick Access Grid */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tightest">Intelligence Grid</h3>
                <div className="h-[1px] flex-grow bg-slate-100 mx-8"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickAccess.map((card, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -8, scale: 1.02 }}
                    onClick={() => card.path && navigate(card.path)}
                    className="bg-white p-7 rounded-[2.2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-purple-200/30 transition-all cursor-pointer group"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-${card.color === 'emerald' ? 'purple' : card.color}-50 flex items-center justify-center text-${card.color === 'emerald' ? 'purple' : card.color}-600 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                      <card.icon size={28} />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-purple-700 transition-colors">{card.title}</h4>
                      <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform group-hover:text-purple-500" />
                    </div>
                    <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-widest">{card.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
