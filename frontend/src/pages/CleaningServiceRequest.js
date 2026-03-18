import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Leaf, ArrowLeft, Calendar, Clock, MapPin, CheckCircle, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

const CleaningServiceRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    eventType: 'Party',
    scheduled_date: '',
    time: '',
    location: '',
    additionalNotes: ''
  });
  const [wasteTypes, setWasteTypes] = useState({
    Food: false,
    Plastic: false,
    Paper: false,
    Glass: false,
    Other: false
  });
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const eventTypes = ['Wedding', 'Party', 'Gathering', 'Corporate', 'Other'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleWasteTypeChange = (type) => {
    setWasteTypes({ ...wasteTypes, [type]: !wasteTypes[type] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage({ type: '', text: '' });

    const selectedWasteTypes = Object.keys(wasteTypes).filter(key => wasteTypes[key]);

    try {
      const token = localStorage.getItem('token');
      // Fetch user to get ID
      const userRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/me`, {
        headers: { token }
      });
      const userId = userRes.data.user._id;

      const payload = {
        ...formData,
        user_id: userId,
        wasteTypes: selectedWasteTypes
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/api/cleaning-requests`, payload, {
        headers: { token }
      });

      setStatusMessage({ type: 'success', text: 'Cleaning service requested successfully! An admin will review and assign a collector.' });
      setFormData({
        eventType: 'Party',
        scheduled_date: '',
        time: '',
        location: '',
        additionalNotes: ''
      });
      setWasteTypes({ Food: false, Plastic: false, Paper: false, Glass: false, Other: false });

    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to submit request. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-20">
      <nav className="fixed top-0 inset-x-0 z-[100] py-4 bg-white/80 backdrop-blur-xl shadow-sm border-b border-emerald-50">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-emerald-600 rounded-lg shadow-sm">
                <Leaf className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black text-emerald-950 tracking-tighter uppercase">EcoLoop</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 border border-emerald-50 shadow-sm"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-black text-emerald-950 tracking-tight mb-2">Book Event Cleaning</h1>
            <p className="text-emerald-950/50 text-sm font-medium">
              Schedule a hassle-free cleanup for your weddings, parties, or home gatherings.
            </p>
          </div>

          {statusMessage.text && (
            <div className={`p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3 ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {statusMessage.type === 'success' && <CheckCircle size={20} />}
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-emerald-950/60 uppercase tracking-widest">Event Type</label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-emerald-100 text-emerald-950 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-emerald-950/60 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} /> Date
                </label>
                <input
                  type="date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border border-emerald-100 text-emerald-950 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-emerald-950/60 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} /> Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border border-emerald-100 text-emerald-950 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-emerald-950/60 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} /> Location / Address
              </label>
              <textarea
                name="location"
                value={formData.location}
                onChange={handleChange}
                rows="2"
                className="w-full bg-[#F8FAFC] border border-emerald-100 text-emerald-950 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                placeholder="Enter complete address for the event"
                required
              ></textarea>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-emerald-950/60 uppercase tracking-widest">Expected Waste Types</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.keys(wasteTypes).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleWasteTypeChange(type)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${wasteTypes[type] ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-emerald-100 text-emerald-950/60 hover:border-emerald-300'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-emerald-950/60 uppercase tracking-widest">Additional Notes</label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                rows="2"
                className="w-full bg-[#F8FAFC] border border-emerald-100 text-emerald-950 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                placeholder="Any special instructions or details about the event size"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20 mt-8"
            >
              {isLoading ? 'Submitting...' : 'Submit Cleaning Request'}
              {!isLoading && <Navigation size={18} />}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default CleaningServiceRequest;
