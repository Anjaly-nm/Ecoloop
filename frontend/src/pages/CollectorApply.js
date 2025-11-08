import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // 1. IMPORT useNavigate

// Helper component for contact details/placeholders
const ContactInfoItem = ({ icon, text }) => (
  <div className="flex items-start space-x-3 text-sm text-gray-600">
    <span className="text-xl text-teal-600 flex-shrink-0">{icon}</span>
    <p>{text}</p>
  </div>
);

// Updated Illustration component with context-specific info
const Illustration = () => (
  <div className="flex flex-col items-center space-y-4 pt-8 md:pt-0">
    {/* Placeholder for the central illustration */}
    <div className="w-40 h-40 bg-teal-100 rounded-full flex items-center justify-center">
      <span className="text-5xl">📄🚛</span> {/* Emoji placeholder */}
    </div>
    
    <div className="space-y-4 w-full">
      
      {/* 1. Application Process Details */}
      <div className="pt-4 space-y-2">
        <h4 className="text-sm font-bold text-gray-700">APPLICATION PROCESS</h4>
        <ContactInfoItem icon="📞" text="Phone interview and document verification will be required." />
        <ContactInfoItem icon="📧" text="Admin review takes 3-5 business days upon submission." />
      </div>

      {/* 2. Ward Area Requirements (Specific to Waste Management) */}
      <div className="pt-4 space-y-2">
        <h4 className="text-sm font-bold text-gray-700">SERVICE REQUIREMENTS</h4>
        <ContactInfoItem icon="🗺️" text="Must specify the primary area (Ward) of operation in the Address field." />
        <ContactInfoItem icon="♻️" text="Commitment to eco-friendly collection standards." />
      </div>
    </div>
  </div>
);

const CollectorApplicationForm = () => {
  // 2. INITIALIZE useNavigate
  const navigate = useNavigate(); 
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:4321/api/user/apply-collector",
        formData
      );
      // NOTE: Using window.alert/console.error is permissible for success/error feedback 
      // within the submission context, but the 'Home' navigation needs the hook.
      alert(res.data.message); 
      setFormData({ name: "", email: "", phone: "", address: "" });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error submitting application");
    }
  };
  
  // 3. UPDATED navigation function
  const handleHomeClick = () => {
      navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10 flex flex-col items-center">
      
      {/* Top Header / Branding Section (GREEN/TEAL) */}
      <div className="absolute top-0 w-full h-40 bg-gradient-to-r from-teal-600 to-green-600 shadow-lg">
        <div className="max-w-6xl mx-auto p-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-wider">
            ECO COLLECTOR REGISTRATION
          </h1>
          
          {/* Menu and Home Button - NOW ONLY HOME BUTTON REMAINS */}
          <nav className="flex items-center space-x-6 text-white text-sm">
            {/* REQUIRED HOME BUTTON with navigate() call */}
            <button 
                onClick={handleHomeClick}
                className="px-4 py-2 bg-white text-teal-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition"
            >
                🏡 Home
            </button>
          </nav>
        </div>
      </div>
      
      {/* Main Card Container (The central white box) */}
      <div className="relative z-10 w-full max-w-4xl mt-24 bg-white rounded-xl shadow-2xl p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Side: Form Section */}
          <div className="md:border-r md:pr-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Apply to Collect
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Please provide your details to submit your application.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Input: Full Name */}
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150"
                required
              />
              
              {/* Input: Email */}
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150"
                required
              />

              {/* Input: Phone Number */}
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150"
                required
              />

              {/* Input: Address */}
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your address / primary service Ward (e.g., Ward 5)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150"
                required
              />

              {/* Submit Button (Primary Green/Teal) */}
              <button
                type="submit"
                className="w-full bg-teal-600 text-white font-semibold py-3 mt-4 rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 transition duration-300 transform hover:scale-[1.005]"
              >
                Submit Application
              </button>
            </form>
          </div>

          {/* Right Side: Illustration & Info */}
          <div className="relative flex flex-col justify-between">
            
            {/* The Illustration component now holds the area-specific details */}
            <Illustration />

            <p className="text-xs text-gray-400 mt-6 md:mt-0">
                All applications are subject to mandatory background checks and regional approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectorApplicationForm;
