import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Phone, MapPin, Home, Leaf, Mail, Edit2, Map, Save, X,
  CheckCircle, AlertCircle, Camera, ChevronLeft, Calendar,
  ShieldCheck, User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [preview, setPreview] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: null, text: null });
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/me`, {
          headers: { token },
        });
        setProfile(res.data.user);
        setFormData(res.data.user);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setStatusMessage({ type: 'error', text: 'Session expired. Please login again.' });
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: null, text: null });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profilePicture: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const form = new FormData();
      for (let key in formData) {
        if (key === "profilePicture" && formData[key] instanceof File) {
          form.append(key, formData[key]);
        } else if (key !== "profilePicture") {
          form.append(key, formData[key] || "");
        }
      }

      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/user/profile/${formData._id}`,
        form,
        { headers: { "Content-Type": "multipart/form-data", token: localStorage.getItem("token") } }
      );

      setProfile(res.data.user);
      setEditMode(false);
      setPreview(null);
      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error("Error updating profile:", err);
      setPreview(null);
      setFormData(profile);
      setStatusMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const InputField = ({ label, name, value, icon: Icon, type = "text" }) => (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950/40 ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-950/20 group-focus-within:text-emerald-500 transition-colors">
          <Icon size={16} />
        </div>
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={handleChange}
          className="w-full pl-12 pr-6 py-4 bg-emerald-50/50 border border-emerald-100 rounded-[1.25rem] text-emerald-950 placeholder:text-emerald-950/20 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-500 transition-all font-medium"
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      </div>
    </div>
  );

  const StaticField = ({ label, value, icon: Icon }) => (
    <div className="flex items-center gap-5 p-5 bg-white border border-emerald-50 rounded-3xl hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-950/30 mb-1">{label}</p>
        <p className="text-sm font-bold text-emerald-950">{value || "Not provided"}</p>
      </div>
    </div>
  );

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Notification Toast */}
      <AnimatePresence>
        {statusMessage.text && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-8 left-1/2 z-[200] px-6 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${statusMessage.type === 'success'
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-rose-500 text-white border-rose-400'
              }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-black uppercase tracking-widest">{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 group text-emerald-950"
          >
            <div className="p-2 bg-emerald-50 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <ChevronLeft size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Dashboard</span>
          </button>

          <div className="flex gap-3">
            {editMode ? (
              <>
                <button
                  onClick={() => { setEditMode(false); setPreview(null); setFormData(profile); }}
                  className="px-6 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save size={14} className={isSaving ? 'animate-spin' : ''} />
                  {isSaving ? 'Saving' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="px-8 py-2.5 bg-emerald-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-900 transition-all active:scale-95 flex items-center gap-2"
              >
                <Edit2 size={12} />
                Edit Account
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Sidebar: Profile Identity */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="bg-white p-6 rounded-[2rem] border border-emerald-50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-20 bg-emerald-50/50 -z-0" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-4 mt-2">
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl shadow-emerald-500/10 overflow-hidden bg-emerald-100">
                    <img
                      src={preview || (profile.profilePicture ?
                        profile.profilePicture.startsWith("http") ? profile.profilePicture : `${process.env.REACT_APP_API_URL}/${profile.profilePicture}`
                        : profile.photo) || "https://ui-avatars.com/api/?name=" + profile.name + "&background=10b981&color=fff"}
                      alt="Identity"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  {editMode && (
                    <label className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-600 text-white rounded-full border-4 border-white flex items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors shadow-lg">
                      <Camera size={12} />
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>

                <div className="text-center mb-6">
                  <h3 className="text-xl font-black text-emerald-950 tracking-tight uppercase mb-1.5">{profile.name}</h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full">
                    <Mail size={10} className="text-emerald-600" />
                    <span className="text-[8px] font-black uppercase text-emerald-600 tracking-wider font-bold">
                      {profile.email}
                    </span>
                  </div>
                </div>

                <div className="w-full pt-5 border-t border-emerald-50 flex items-center justify-between px-1">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-emerald-950/30 uppercase tracking-[0.2em] mb-0.5">Impact Rank</p>
                    <p className="text-sm font-black text-emerald-950">#142</p>
                  </div>
                  <div className="w-px h-6 bg-emerald-50" />
                  <div className="text-center">
                    <p className="text-[8px] font-black text-emerald-950/30 uppercase tracking-[0.2em] mb-0.5">Status</p>
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      <p className="text-[10px] font-bold text-emerald-950">Verified</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* EcoPoints Premium Card */}
            <div className="bg-emerald-950 p-5 rounded-[1.75rem] text-white shadow-2xl shadow-emerald-950/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <Leaf size={70} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-400/20 flex items-center justify-center text-emerald-400">
                    <Leaf size={12} />
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400">Environmental Credit</p>
                </div>
                <h4 className="text-3xl font-black tracking-tighter mb-0.5">{profile.ecoPoints || 0}</h4>
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-5">Points Balance</p>
                <button
                  onClick={() => navigate('/market-shop')}
                  className="w-full py-2.5 bg-emerald-500 text-emerald-950 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                >
                  Visit Marketplace
                </button>
              </div>
            </div>
          </div>

          {/* Right Section: Detailed Information */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-emerald-50 shadow-sm">
              {editMode ? (
                <div className="space-y-12">
                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                      <h2 className="text-sm font-black text-emerald-950 tracking-[0.2em] uppercase">Security & Personal</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                      <InputField label="Identity Name" name="name" value={formData.name} icon={UserIcon} />
                      <InputField label="Contact Phone" name="phone" value={formData.phone} icon={Phone} />
                      <InputField label="Assigned Place" name="place" value={formData.place} icon={MapPin} />
                      <div className="flex flex-col gap-2 opacity-60">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-950/40 ml-1">Legacy Email (Read-Only)</label>
                        <div className="pl-12 pr-6 py-4 bg-emerald-50/20 border border-emerald-50 rounded-[1.25rem] text-emerald-950/50 font-medium flex items-center relative">
                          <Mail size={16} className="absolute left-4 opacity-50" />
                          {profile.email}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                      <h2 className="text-sm font-black text-emerald-950 tracking-[0.2em] uppercase">Location Assets</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                      <InputField label="Ward/Zone" name="wardNumber" value={formData.wardNumber} icon={Map} />
                      <InputField label="Unit No" name="houseNumber" value={formData.houseNumber} icon={Home} />
                      <div className="md:col-span-1">
                        <InputField label="Street Detail" name="address" value={formData.address} icon={MapPin} />
                      </div>
                    </div>
                  </section>
                </div>
              ) : (
                <div className="space-y-12">
                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                      <h2 className="text-sm font-black text-emerald-950 tracking-[0.2em] uppercase">Account Overview</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <StaticField label="Mobile Connectivity" value={profile.phone} icon={Phone} />
                      <StaticField label="Primary Location" value={profile.place} icon={MapPin} />
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                      <h2 className="text-sm font-black text-emerald-950 tracking-[0.2em] uppercase">Residency Details</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <StaticField label="Ward Number" value={profile.wardNumber} icon={Map} />
                      <StaticField label="Unit Reference" value={profile.houseNumber} icon={Home} />
                      <StaticField label="Detailed Address" value={profile.address} icon={MapPin} />
                    </div>
                  </section>

                  <div className="p-8 bg-emerald-50/30 rounded-[2rem] border border-emerald-50 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-emerald-950/30 tracking-[0.2em] mb-1">Onboarding Metric</p>
                      <p className="text-base font-bold text-emerald-950">
                        Official Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
