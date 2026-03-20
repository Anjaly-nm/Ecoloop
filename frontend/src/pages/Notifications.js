import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, ArrowLeft, CheckCircle, Trash2, Clock, 
  Info, AlertTriangle, Sparkles, Filter, MoreHorizontal 
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4321";

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { token }
      });
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      toast.error("Failed to sync notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE}/api/notifications/${id}/read`, {}, {
        headers: { token }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE}/api/notifications/read-all`, {}, {
        headers: { token }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All messages marked as read");
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  const getIcon = (type) => {
    switch (type) {
      case 'cleaning_assignment': return <Sparkles size={18} className="text-emerald-500" />;
      case 'new_cleaning_request': return <Info size={18} className="text-blue-500" />;
      case 'alert': return <AlertTriangle size={18} className="text-rose-500" />;
      default: return <Bell size={18} className="text-indigo-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800 pb-20">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar />
      
      {/* Header */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-emerald-50 px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2.5 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all border border-emerald-100 shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
              <Bell className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tighter uppercase block leading-none">Intelligence Center</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Real-time system updates</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={markAllAsRead}
             className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
           >
             <CheckCircle size={14} /> Clear All
           </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-12">
        {/* Controls */}
        <div className="mb-10 flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-emerald-50">
           <div className="flex gap-2">
              <button 
                onClick={() => setFilter("all")}
                className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === "all" ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                All Feed
              </button>
              <button 
                onClick={() => setFilter("unread")}
                className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === "unread" ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                Unread
              </button>
           </div>
           <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-2xl text-slate-400">
              <Filter size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Sorting Active</span>
           </div>
        </div>

        {/* Notif List */}
        <div className="space-y-4">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-3xl border border-slate-50 animate-pulse"></div>
            ))
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-emerald-50 shadow-sm">
               <Bell size={48} className="text-emerald-100 mx-auto mb-4" />
               <h3 className="text-xl font-black text-slate-900 tracking-tight">Quiet Reception</h3>
               <p className="text-slate-400 font-medium text-sm mt-2">No notifications found in this segment.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notif) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={notif._id}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                  className={`relative p-6 rounded-[2.2rem] border transition-all cursor-pointer group ${
                    notif.isRead 
                      ? 'bg-white border-slate-100 shadow-sm' 
                      : 'bg-white border-emerald-500/20 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500/5'
                  }`}
                >
                  {!notif.isRead && (
                    <span className="absolute top-6 left-6 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-emerald-50 shadow-sm"></span>
                  )}
                  
                  <div className="flex gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      notif.isRead ? 'bg-slate-50 text-slate-400' : 'bg-emerald-50 text-emerald-600 shadow-inner'
                    }`}>
                      {getIcon(notif.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-black uppercase tracking-tight ${notif.isRead ? 'text-slate-500' : 'text-slate-900'}`}>
                          {notif.title}
                        </h4>
                        <div className="flex flex-col items-end">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Clock size={10} /> {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                           </span>
                           <span className="text-[8px] font-medium text-slate-300 uppercase tracking-tighter mt-0.5">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                      </div>
                      <p className={`text-xs leading-relaxed font-medium mt-2 ${notif.isRead ? 'text-slate-400' : 'text-slate-600'}`}>
                        {notif.message}
                      </p>
                      
                      {notif.actionUrl && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(notif.actionUrl); }}
                          className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
                        >
                          Trace Resource Link
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                       <button className="p-2 text-slate-200 hover:text-emerald-600 transition-colors">
                          <MoreHorizontal size={16} />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
