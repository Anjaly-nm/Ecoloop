import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ShoppingBag, Recycle, User, LogOut, Menu, X, BookOpen, Leaf,
  TrendingUp, Calendar, Bell, Settings, HelpCircle, ChevronRight, Sparkles,
  Star, Award, Activity, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("Eco-Warrior");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/user/me`,
          { headers: { token } }
        );
        const userRole = res.data.user?.role?.toLowerCase();
        if (userRole === "delivery-boy") {
          navigate("/delivery-dashboard");
          return;
        }
        setUsername(res.data.user?.name || "Eco Citizen");
      } catch (err) {
        console.error("Error fetching user:", err);
        localStorage.removeItem("token");
      }
    };

    const fetchNotifications = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/notifications`,
          { headers: { token } }
        );
        if (response.data.success) {
          setUnreadCount(response.data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchUser();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const navItems = [
    { name: "Marketplace", path: "/market-shop", icon: ShoppingBag, color: "text-emerald-500" },
    { name: "Submissions", path: "/wastes", icon: Recycle, color: "text-teal-500" },
    { name: "My Profile", path: "/profile", icon: User, color: "text-sky-500" },
    { name: "Resources", path: "/learn", icon: BookOpen, color: "text-amber-500" },
    { name: "Dashboard Settings", path: "/settings", icon: Settings, color: "text-slate-500" },
  ];

  const cards = [
    {
      name: "Sustainable Market",
      path: "/market-shop",
      icon: ShoppingBag,
      description: "Exchange points for verified eco-friendly products.",
      stats: "New Arrivals",
      gradient: "from-emerald-600 to-teal-600",
      shadow: "shadow-emerald-200"
    },
    {
      name: "Waste Management",
      path: "/wastes",
      icon: Recycle,
      description: "Submit materials and track your environmental footprint.",
      stats: "Active Tasks",
      gradient: "from-teal-600 to-cyan-600",
      shadow: "shadow-teal-200"
    },
    {
      name: "Event Cleaning",
      path: "/cleaning-service",
      icon: Sparkles,
      description: "Directly book hassle-free cleaning for your weddings or home parties.",
      stats: "New Service",
      gradient: "from-indigo-600 to-purple-600",
      shadow: "shadow-indigo-200"
    },
    {
      name: "Learning Center",
      path: "/UserLearningVideos",
      icon: BookOpen,
      description: "Expert-led guides on circular economy and living.",
      stats: "8+ Courses",
      gradient: "from-amber-600 to-orange-600",
      shadow: "shadow-amber-200"
    },
    {
      name: "Eco Events",
      path: "/events",
      icon: Calendar,
      description: "Join community workshops and green initiatives.",
      stats: "Upcoming",
      gradient: "from-sky-600 to-blue-600",
      shadow: "shadow-sky-200"
    }
  ];

  const stats = [
    { name: "Waste Diverted", value: "24.5", unit: "kg", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Impact Score", value: "880", unit: "pts", icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
    { name: "Global Rank", value: "#142", unit: "", icon: Award, color: "text-teal-600", bg: "bg-teal-50" },
    { name: "Trees Saved", value: "4", unit: "trees", icon: Leaf, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Nav Section */}
      <nav className={`fixed top-0 inset-x-0 z-[100] transition-all duration-500 ${scrolled ? 'py-3 bg-white/80 backdrop-blur-xl shadow-lg border-b border-emerald-50' : 'py-6 bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
              <Leaf className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-emerald-950 tracking-tighter uppercase">EcoLoop</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            {navItems.slice(0, 4).map((item, i) => (
              <motion.button
                key={item.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate(item.path)}
                className="text-sm font-black uppercase tracking-widest text-emerald-950/40 hover:text-emerald-600 transition-colors"
              >
                {item.name}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/notifications')}
              className="hidden sm:flex relative p-2.5 text-emerald-950/40 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-emerald-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-900 shadow-xl shadow-emerald-950/20 transition-all active:scale-95"
            >
              <LogOut size={14} />
              Log Out
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2.5 bg-white rounded-2xl border border-emerald-50 text-emerald-950"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-[90] bg-white md:hidden p-8 pt-32"
          >
            <div className="flex flex-col gap-6">
              {navItems.map((item, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                  className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-50 text-left border border-emerald-100"
                >
                  <div className={`p-3 rounded-2xl bg-white shadow-sm ${item.color}`}>
                    <item.icon size={24} />
                  </div>
                  <span className="font-black text-emerald-950 text-lg">{item.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Hero section */}
        <div className="relative mb-8 overflow-hidden rounded-[2rem] bg-emerald-950 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-emerald-400 to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-400/10 border border-emerald-400/20 rounded-full text-emerald-400 text-[8px] font-black uppercase tracking-[0.2em] mb-3">
              <Globe size={10} />
              Earth Advocate Active
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white mb-3 leading-[1.1] tracking-tighter">
              Welcome back,<br />
              <span className="text-emerald-400">{username}</span>
            </h1>
            <p className="text-emerald-200/60 text-sm font-medium mb-6 max-w-lg leading-relaxed">
              Your sustainable choices are creating a ripple effect. Track your impact, join initiatives, and earn rewards for every green act.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/wastes')}
                className="px-5 py-2.5 bg-emerald-500 text-emerald-950 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                Start Submission
              </button>
              <button
                onClick={() => navigate('/market-shop')}
                className="px-5 py-2.5 bg-white/5 text-white border border-white/10 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
              >
                Visit Shop
              </button>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-white rounded-[2rem] border border-emerald-50 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all group"
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <stat.icon size={22} />
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-black text-emerald-950 tracking-tighter">{stat.value}</span>
                <span className="text-[10px] font-black text-emerald-950/30 uppercase tracking-widest pb-2">{stat.unit}</span>
              </div>
              <p className="text-[10px] font-black text-emerald-950/40 uppercase tracking-[0.1em]">{stat.name}</p>
            </motion.div>
          ))}
        </div>

        {/* Services Section */}
        <div className="mb-20">
          <div className="flex items-end justify-between mb-8 px-2">
            <div>
              <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Sustainable Ecosystem</p>
              <h2 className="text-3xl font-black text-emerald-950 tracking-tighter">Your Pathways</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                onClick={() => navigate(card.path)}
                className="group cursor-pointer bg-white p-8 rounded-[2.5rem] border border-emerald-50 shadow-sm flex flex-col items-start text-left h-full transition-all"
              >
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} text-white shadow-xl ${card.shadow} mb-8 group-hover:scale-110 transition-transform`}>
                  <card.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-emerald-950 mb-3 tracking-tight group-hover:text-emerald-600 transition-colors">
                  {card.name}
                </h3>
                <p className="text-sm font-medium text-emerald-950/50 leading-relaxed mb-8 flex-grow">
                  {card.description}
                </p>
                <div className="w-full flex items-center justify-between pt-6 border-t border-emerald-50">
                  <span className="text-[10px] font-black text-emerald-950/30 uppercase tracking-widest">{card.stats}</span>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Secondary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-10 bg-white rounded-[3rem] border border-emerald-50 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-black text-emerald-950 tracking-tighter">Community Impact</h2>
                <p className="text-sm font-medium text-emerald-950/40">Latest local sustainable efforts</p>
              </div>
              <button
                onClick={() => navigate('/events')}
                className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"
              >
                View full radar
              </button>
            </div>

            <div className="space-y-6">
              {[
                { title: "Neighborhood Cleanup", date: "Oct 12", type: "Cleanup", color: "bg-blue-50 text-blue-600" },
                { title: "Recycling Workshop", date: "Oct 15", type: "Education", color: "bg-amber-50 text-amber-600" },
                { title: "Tree Planting Drive", date: "Oct 20", type: "Environment", color: "bg-emerald-50 text-emerald-600" }
              ].map((event, i) => (
                <div key={i} className="flex items-center justify-between p-5 rounded-3xl border border-emerald-50 hover:bg-[#FDFDFD] transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex flex-col items-center justify-center font-black">
                      <span className="text-[8px] text-emerald-600/40 uppercase tracking-tighter">Oct</span>
                      <span className="text-sm text-emerald-950 leading-none">{12 + i}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-950 text-sm group-hover:text-emerald-600 transition-colors">{event.title}</h4>
                      <p className="text-[10px] font-black text-emerald-950/30 uppercase tracking-widest mt-1">Lakeside Drive • 10:00 AM</p>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${event.color}`}>
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="p-8 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[3rem] text-white shadow-2xl shadow-emerald-200">
              <h3 className="text-2xl font-black mb-4 tracking-tighter leading-tight">Apply to the<br />EcoLoop Team</h3>
              <p className="text-emerald-100/60 text-sm font-medium mb-8 leading-relaxed">
                Join as a Professional Seller, Dedicated Collector, or Logistics Partner.
              </p>
              <button
                onClick={() => navigate('/application-options')}
                className="w-full py-4 bg-white text-emerald-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
              >
                Start Application
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="p-8 bg-[#1A1A1A] rounded-[3rem] text-white flex flex-col items-center text-center">
              <HelpCircle className="text-emerald-500 mb-6" size={40} />
              <h3 className="text-xl font-black mb-2 tracking-tighter">Need Guidance?</h3>
              <p className="text-white/40 text-sm font-medium mb-8">
                Our support team is here to help you navigate your sustainability journey.
              </p>
              <button className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                Visit Help Center
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-20 bg-white border-t border-emerald-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Leaf className="text-emerald-600 w-8 h-8" />
            <span className="text-2xl font-black text-emerald-950 tracking-tighter uppercase">EcoLoop</span>
          </div>
          <div className="flex flex-wrap justify-center gap-12 mb-12">
            {['Impact', 'Privacy', 'Compliance', 'Guidelines'].map(item => (
              <button key={item} className="text-[10px] font-black uppercase tracking-widest text-emerald-950/40 hover:text-emerald-600 transition-colors">
                {item}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-black text-emerald-950/20 uppercase tracking-[0.2em]">
            © 2024 EcoLoop Ecosystem • Cultivating a greener future
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
