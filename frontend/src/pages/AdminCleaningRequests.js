import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Sparkles, ArrowLeft, Calendar, Clock, MapPin, User, CheckCircle, RefreshCcw } from "lucide-react";

const AdminCleaningRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeams, setSelectedTeams] = useState({}); // { requestId: [collectorId1, collectorId2] }

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/cleaning-requests`);
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching requests", error);
    }
  };

  const fetchCollectors = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/viewusers`);
      // Filter the users to only get those with role "collector"
      // or we can just fetch from an endpoint. assuming viewusers returns all users.
      if (res.data && Array.isArray(res.data)) {
        const c = res.data.filter(u => u.role === 'collector');
        setCollectors(c);
      } else if (res.data.users) {
        const c = res.data.users.filter(u => u.role === 'collector');
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
      alert("Please select at least one collector to form a team.");
      return;
    }
    
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/cleaning-requests/${requestId}/assign`, {
        team: team
      });
      alert("Team assigned successfully and notifications have been sent!");
      setSelectedTeams(prev => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error("Error assigning team", error);
      alert("Failed to assign team");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-20">
      <nav className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/adminpage')}
            className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all border border-slate-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-xl shadow-lg shadow-purple-200">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">Cleaning Requests</span>
          </div>
        </div>
        <button onClick={fetchRequests} className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl font-bold text-xs uppercase hover:bg-purple-100">
          <RefreshCcw size={14} /> Refresh
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        {isLoading ? (
          <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest">Loading Requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <Sparkles className="mx-auto w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-xl font-black text-slate-900 tracking-tight">No Requests Found</h3>
            <p className="text-slate-500 text-sm mt-2">There are currently no cleaning service requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => (
              <div key={req._id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-100">
                    {req.eventType}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${req.status === 'assigned' || req.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                    {req.status}
                  </span>
                </div>

                <div className="space-y-3 mb-6 flex-grow">
                  <div className="flex items-center text-sm font-bold text-slate-700">
                    <User size={16} className="text-slate-400 mr-3" />
                    {req.user_id ? req.user_id.name : "Unknown User"}
                  </div>
                  <div className="flex items-center text-sm font-medium text-slate-500">
                    <Calendar size={16} className="text-slate-400 mr-3" />
                    {new Date(req.scheduled_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm font-medium text-slate-500">
                    <Clock size={16} className="text-slate-400 mr-3" />
                    {req.time}
                  </div>
                  <div className="flex items-start text-sm font-medium text-slate-500">
                    <MapPin size={16} className="text-slate-400 mr-3 mt-0.5" />
                    <span className="line-clamp-2">{req.location}</span>
                  </div>
                </div>

                {req.wasteTypes && req.wasteTypes.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {req.wasteTypes.map((wt, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        {wt}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100">
                  {req.status === 'pending' ? (
                    <div className="flex flex-col gap-3">
                      <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 mb-1">Build Your Team</p>
                        {collectors.map(c => {
                          const isSelected = (selectedTeams[req._id] || []).includes(c._id);
                          return (
                            <label key={c._id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-purple-100 border border-purple-200' : 'hover:bg-slate-100 border border-transparent'}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleTeamMember(req._id, c._id)}
                                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                              />
                              <div className="flex-1">
                                <p className={`text-xs font-bold ${isSelected ? 'text-purple-900' : 'text-slate-700'}`}>{c.name}</p>
                                <p className={`text-[10px] ${isSelected ? 'text-purple-600/80' : 'text-slate-400'}`}>{c.phone || 'No Phone'}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => handleAssignTeam(req._id)}
                        disabled={(selectedTeams[req._id] || []).length === 0}
                        className="w-full py-3 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-500 transition-all active:scale-95 shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Assign Team ({(selectedTeams[req._id] || []).length})
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={20} />
                      <div className="w-full">
                        <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest mb-2">Assigned Team</p>
                        <div className="space-y-1 w-full">
                          {req.team && req.team.length > 0 ? (
                            req.team.map(member => (
                              <div key={member._id} className="text-sm font-bold text-emerald-900 leading-tight bg-white/60 px-2 py-1.5 rounded-lg border border-emerald-100/50 flex justify-between">
                                <span>{member.name}</span>
                                <span className="opacity-60 text-xs font-medium">{member.phone}</span>
                              </div>
                            ))
                          ) : (
                                <p className="text-sm font-bold text-emerald-900 leading-tight">
                                  {req.collector_id ? req.collector_id.name : "Unknown Collector/Team"}
                                </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCleaningRequests;
