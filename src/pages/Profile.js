import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Phone, MapPin, Home, Leaf, Mail, Edit2, Map, Save, X, CheckCircle, AlertCircle } from "lucide-react";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [preview, setPreview] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: null, text: null });
  const [isSaving, setIsSaving] = useState(false); // New state to prevent multiple saves
  const navigate = useNavigate();

  const primaryAccent = "text-blue-600";
  const secondaryAccent = "bg-pink-500";
  const secondaryAccentHover = "hover:bg-pink-600";
  const cardBg = "bg-white";
  const inputBg = "bg-blue-50";
  const textDark = "text-gray-800";
  const background = "bg-gray-100";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("Authentication token missing. Redirecting to login.");
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
        console.error("❌ Failed to load profile:", err);
        setStatusMessage({ type: 'error', text: 'Failed to load profile. Please login again.' });
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
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  if (!profile)
    return (
      <div className={`min-h-screen ${background} flex items-center justify-center`}>
        <p className="text-center text-xl font-medium text-blue-600 animate-pulse p-10 rounded-xl shadow-lg bg-white">
          🎨 Loading profile data...
        </p>
      </div>
    );

  // ==========================
  // HANDLERS
  // ==========================
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, profilePicture: file });
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (isSaving) return; // Prevent double-click/double-submit
    setIsSaving(true);

    try {
      const form = new FormData();

      for (let key in formData) {
        // Logically updated: Only append profilePicture if it's a new File object.
        // If it's the original string, we skip it so the server doesn't get a file upload request with stale data.
        if (key === "profilePicture" && formData[key] instanceof File) {
          form.append(key, formData[key]);
        } else if (key !== "profilePicture") {
           // For non-file fields, append the value or an empty string for safety
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
      setStatusMessage({ type: 'success', text: '✅ Profile updated successfully!' });
    } catch (err) {
      console.error("Error updating profile:", err);
      // Clear the preview on error in case the file upload failed
      setPreview(null);
      // Revert formData to the original profile state on major error
      setFormData(profile); 
      setStatusMessage({ type: 'error', text: '❌ Failed to update profile. Check console for details.' });
    } finally {
      setIsSaving(false);
    }
  };

  const DetailRow = ({ Icon, label, name, value, editable }) => (
    <div className="flex items-start text-gray-700">
      <Icon className={`h-5 w-5 mr-4 ${primaryAccent} flex-shrink-0 mt-1`} />
      <div className="w-full">
        <p className="font-semibold text-xs uppercase tracking-wider text-gray-500">{label}</p>
        {editable ? (
          <input
            name={name}
            value={formData[name] || ""}
            onChange={handleChange}
            className={`${inputBg} border border-blue-200 rounded-lg ${textDark} w-full p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150`}
          />
        ) : (
          <p className="text-md font-medium">{value || "N/A"}</p>
        )}
      </div>
    </div>
  );

  const Notification = ({ type, text }) => {
    if (!text) return null;
    const baseClasses = "fixed top-5 left-1/2 transform -translate-x-1/2 p-4 rounded-xl shadow-2xl z-50 flex items-center space-x-3 transition-all duration-300";
    const successClasses = "bg-green-500 text-white";
    const errorClasses = "bg-red-500 text-white";
    const Icon = type === 'success' ? CheckCircle : AlertCircle;
    return (
      <div className={`${baseClasses} ${type === 'success' ? successClasses : errorClasses}`}>
        <Icon className="h-6 w-6"/>
        <span className="font-semibold">{text}</span>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${background} p-4 sm:p-8 flex flex-col items-center`}>
      <Notification type={statusMessage.type} text={statusMessage.text} />

      <div className="w-full max-w-4xl flex justify-between items-center mb-10 pt-4">
        <h2 className={`text-4xl font-black ${textDark} tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-pink-600`}>
          MY PROFILE
        </h2>

        <div className="flex space-x-3">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving} // Disable button while saving
                className={`flex items-center space-x-2 px-4 py-2 bg-green-500 text-sm font-semibold text-white rounded-xl hover:bg-green-600 transition duration-200 shadow-lg shadow-green-500/30 disabled:bg-green-300`}
              >
                <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={() => { setEditMode(false); setPreview(null); setFormData(profile); }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-400 text-sm font-semibold text-white rounded-xl hover:bg-gray-500 transition duration-200 shadow-md"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-sm font-semibold text-white rounded-xl hover:bg-blue-600 transition duration-200 shadow-lg shadow-blue-300/50"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className={`px-4 py-2 ${secondaryAccent} text-white text-sm font-bold rounded-xl shadow-xl shadow-pink-300/70 hover:scale-[1.03] transition duration-200`}
              >
                Dashboard
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`w-full max-w-4xl ${cardBg} border border-gray-200 rounded-3xl shadow-2xl shadow-gray-300/50 overflow-hidden`}>
        <div className="p-8 border-b border-gray-200 flex flex-col md:flex-row items-center gap-8">
          <div className="relative flex-shrink-0">
            <img
              src={
                preview ||
                (profile.profilePicture
                  ? profile.profilePicture.startsWith("http")
                    ? profile.profilePicture
                    : `${process.env.REACT_APP_API_URL}/${profile.profilePicture}`
                  : profile.photo) ||
                "https://via.placeholder.com/150/f3f4f6/3b82f6?text=U"
              }
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-xl shadow-blue-200 transform hover:scale-[1.05] transition duration-300"
            />
            {editMode && (
              <label className={`absolute bottom-0 right-0 ${secondaryAccent} text-white p-2 rounded-full cursor-pointer ${secondaryAccentHover} transition duration-150 border-2 border-white`}>
                <Edit2 size={16} />
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="text-center md:text-left">
            {editMode ? (
              <input
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className={`${inputBg} border border-blue-300 rounded-lg ${textDark} text-3xl p-2 w-full font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150`}
              />
            ) : (
              <h3 className={`text-5xl font-extrabold ${textDark} tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-pink-600`}>
                {profile.name}
              </h3>
            )}
            <p className={`text-lg font-medium ${primaryAccent} mt-1`}>
              <Mail className="inline h-5 w-5 mr-2" />
              {profile.email || "N/A"}
            </p>
            <p className="text-xs text-gray-500 mt-2 italic">
              Member since:{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="md:ml-auto flex flex-col items-center">
            <div className="bg-green-100 border border-green-400 p-5 rounded-2xl text-center shadow-lg shadow-green-200 transform hover:scale-105 transition duration-300">
              <Leaf className={`h-9 w-9 mx-auto mb-2 text-green-600 animate-bounce`} /> 
              <p className="text-sm font-bold uppercase tracking-wider text-gray-600">EcoPoints</p>
              <p className="text-4xl font-black text-green-700 tracking-widest mt-1">
                {profile.ecoPoints || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 p-8">
          <div className="space-y-6">
            <h4 className={`text-xl font-bold ${textDark} border-b-2 border-blue-500/50 pb-2 mb-3 tracking-wide uppercase`}>
              Contact & Location
            </h4>
            <DetailRow Icon={Phone} label="Phone Number" name="phone" value={profile.phone} editable={editMode} />
            <DetailRow Icon={Mail} label="Email Address (Non-Editable)" name="email" value={profile.email} editable={false} />
            <DetailRow Icon={MapPin} label="City / Town" name="place" value={profile.place} editable={editMode} />
          </div>

          <div className="space-y-6">
            <h4 className={`text-xl font-bold ${textDark} border-b-2 border-pink-500/50 pb-2 mb-3 tracking-wide uppercase`}>
              Detailed Address
            </h4>
            <DetailRow Icon={Map} label="Ward / Zone Number" name="wardNumber" value={profile.wardNumber} editable={editMode} />
            <DetailRow Icon={Home} label="House / Building Number" name="houseNumber" value={profile.houseNumber} editable={editMode} />
            <DetailRow Icon={Home} label="Street / Area Address" name="address" value={profile.address} editable={editMode} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;