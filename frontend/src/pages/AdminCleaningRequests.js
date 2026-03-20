import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Sparkles, ArrowLeft, Calendar, Clock, MapPin, User, 
  CheckCircle, RefreshCcw, Flame, Users, FileText, 
  ChevronRight, MoreVertical, Phone, AlertCircle
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminCleaningRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeams, setSelectedTeams] = useState({}); // { requestId: [collectorId1, collectorId2] }

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4321";

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/cleaning-requests`);
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching requests", error);
      toast.error("Failed to load cleaning requests");
    }
  };

  const fetchCollectors = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/user/viewusers`);
      if (res.data) {
        const users = Array.isArray(res.data) ? res.data : (res.data.users || []);
        const c = users.filter(u => u.role?.toLowerCase() === 'collector');
        setCollectors(c);
      }
    } catch (error) {
      console.error("Error fetching collectors", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchRequests(), fetchCollectors()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const toggleTeamMember = (requestId, collectorId) => {
    setSelectedTeams(prev => {
      const team = prev[requestId] || [];
      if (team.includes(collectorId)) {
        return { ...prev, [requestId]: team.filter(id => id !== collectorId) };
      } else {
        return { ...prev, [requestId]: [...team, collectorId] };
      }
    });
  };

  const handleAssignTeam = async (requestId) => {
    const team = selectedTeams[requestId] || [];
    if (team.length === 0) {
      toast.warning("Select at least one collector.");
      return;
    }
    
    try {
      await axios.put(`${API_BASE}/api/cleaning-requests/${requestId}/assign`, { team });
      toast.success("Team assigned successfully!");
      setSelectedTeams(prev => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      fetchRequests();
    } catch (error) {
      console.error("Error assigning team", error);
      toast.error("Failed to assign team");
    }
  };

  const handleComplete = async (requestId) => {
    try {
      await axios.put(`${API_BASE}/api/cleaning-requests/${requestId}/complete`);
      toast.success("Assignment closed successfully!");
      fetchRequests();
    } catch (error) {
      console.error("Error completing request", error);
      toast.error("Failed to complete request");
    }
  };

  const handleReassign = (requestId) => {
    // We just need to change the status back to pending locally to show the selection UI
    setRequests(prev => prev.map(r => r._id === requestId ? { ...r, status: 'pending' } : r));
    toast.info("Select new squad members", { icon: "🔄" });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusStep = (status) => {
    const steps = ["pending", "assigned", "completed"];
    const index = steps.indexOf(status?.toLowerCase());
    return index !== -1 ? index : 0;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-900 pb-20">
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar />
      
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-emerald-50 px-8 py-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/adminpage')}
            className="p-2.5 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all border border-emerald-100 shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tighter uppercase block leading-none">Cleaning Control</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Event Sanitation Service</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => { setIsLoading(true); fetchRequests(); setIsLoading(false); }} 
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
        >
          <RefreshCcw size={14} /> Refresh Data
        </button>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 pt-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Syncing Intelligence...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-emerald-50 shadow-xl shadow-emerald-500/5 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-emerald-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">System is Clean</h3>
            <p className="text-slate-400 font-medium text-sm mt-3 px-10">No active cleaning requests found in the ecosystem. All sectors are currently maintained.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {requests.map((req) => {
              const currentStep = getStatusStep(req.status);
              const progress = ((currentStep + 1) / 3) * 100;
              
              return (
                <div key={req._id} className="bg-white rounded-[2.5rem] border border-emerald-50 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 transition-all flex flex-col overflow-hidden group">
                  {/* Card Header & Priority */}
                  <div className="p-6 pb-0 flex justify-between items-start relative">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                          {req.eventType}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1 ${getPriorityColor(req.priority || 'Medium')}`}>
                          <Flame size={10} /> {req.priority || 'Normal'}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                        <User size={18} className="text-emerald-500" /> {req.user_id?.name || "Member"}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border-2 shadow-sm ${
                        req.status === 'completed' ? 'bg-emerald-600 text-white border-emerald-600' : 
                        req.status === 'assigned' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {req.status}
                      </span>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2">ID: ...{req._id.slice(-6)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="px-6 py-6">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-slate-400 mb-2">
                       <span className={currentStep >= 0 ? "text-emerald-600" : ""}>Requested</span>
                       <span className={currentStep >= 1 ? "text-emerald-600" : ""}>Assigned</span>
                       <span className={currentStep >= 2 ? "text-emerald-600" : ""}>Finalized</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${req.status === 'completed' ? 'bg-emerald-600' : 'bg-emerald-400'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Core Details */}
                  <div className="px-6 space-y-4 flex-grow">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-all">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Calendar size={10} className="text-emerald-500" /> Event Date
                        </p>
                        <p className="text-xs font-bold text-slate-700">{new Date(req.scheduled_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-all">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Clock size={10} className="text-emerald-500" /> Arrival
                        </p>
                        <p className="text-xs font-bold text-slate-700">{req.time}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:border-emerald-100 transition-all">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <MapPin size={10} className="text-emerald-500" /> Deployment Base
                      </p>
                      <p className="text-[11px] font-bold text-slate-700 leading-tight line-clamp-2">{req.location}</p>
                    </div>

                    {/* Waste Breakdown */}
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Material Composition</p>
                      <div className="flex flex-wrap gap-1.5">
                        {req.wasteTypes?.length > 0 ? req.wasteTypes.map((wt, i) => (
                          <span key={i} className="px-2.5 py-1 bg-white text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider border border-emerald-50 shadow-sm">
                            {wt}
                          </span>
                        )) : <span className="text-[10px] text-slate-300 italic">No breakdown provided</span>}
                      </div>
                    </div>

                    {/* Description Section */}
                    {req.additionalNotes && (
                      <div className="bg-emerald-50/30 p-4 rounded-2xl border border-dashed border-emerald-100">
                        <p className="text-[9px] font-black text-emerald-900/40 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <FileText size={10} /> Inspector Notes
                        </p>
                        <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic line-clamp-3">
                          "{req.additionalNotes}"
                        </p>
                      </div>
                    )}

                    {/* Image Preview (If any) */}
                    {req.images?.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                         {req.images.map((img, i) => (
                           <img key={i} src={`${API_BASE}/${img}`} alt="Waste" className="w-16 h-16 rounded-xl object-cover border border-slate-100 hover:scale-110 transition-transform cursor-pointer" />
                         ))}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Action Section */}
                  <div className="p-6 mt-4 bg-slate-50/50 border-t border-slate-100">
                    {req.status === 'pending' ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                             <Users size={12} className="text-emerald-500" /> Collector Squad
                          </p>
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            {collectors.length} Available
                          </span>
                        </div>
                        
                        <div className="max-h-[140px] overflow-y-auto border border-slate-100 rounded-2xl bg-white/80 p-2 space-y-1 custom-scrollbar">
                          {collectors.map(c => {
                            const isSelected = (selectedTeams[req._id] || []).includes(c._id);
                            return (
                              <div 
                                key={c._id} 
                                onClick={() => toggleTeamMember(req._id, c._id)}
                                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? 'bg-emerald-50 border-emerald-500/30 shadow-sm' : 'hover:bg-slate-50 border-transparent shadow-none'}`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {c.name?.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <p className={`text-xs font-black ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>{c.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 mt-0.5 tracking-tight flex items-center gap-1">
                                    <Phone size={8} className="text-emerald-500" /> {c.phone}
                                  </p>
                                </div>
                                {isSelected && <CheckCircle size={14} className="text-emerald-600" />}
                              </div>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => handleAssignTeam(req._id)}
                          disabled={(selectedTeams[req._id] || []).length === 0}
                          className="w-full py-4 bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-emerald-700/20 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
                        >
                          Confirm Team ({(selectedTeams[req._id] || []).length} Workers)
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                 <Users size={16} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-900 uppercase leading-none">Deployed Team</p>
                                 <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">{req.team?.length || 0} Special Agents</p>
                              </div>
                           </div>
                           <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                              <MoreVertical size={18} />
                           </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {(req.team || []).map(member => (
                            <div key={member._id} className="flex items-center justify-between p-3 bg-white/80 rounded-2xl border border-emerald-50/50 hover:border-emerald-200 transition-all">
                               <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-black text-[10px]">
                                     {member.name?.charAt(0)}
                                  </div>
                                  <span className="text-xs font-black text-slate-700">{member.name}</span>
                               </div>
                               <button className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 border border-emerald-100 shadow-sm">
                                  <Phone size={10} /> Call
                               </button>
                            </div>
                          ))}
                        </div>

                        {req.status !== 'completed' && (
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <button 
                              onClick={() => handleReassign(req._id)}
                              className="py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:border-emerald-600 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"
                            >
                               Reassign Squad
                            </button>
                            <button 
                              onClick={() => handleComplete(req._id)}
                              className="py-3 bg-emerald-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-200"
                            >
                               Close Ticket
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <style jsx="true">{`
        .track-step-active { color: #059669; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
};

export default AdminCleaningRequests;
