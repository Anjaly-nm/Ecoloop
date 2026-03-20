import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Leaf, ArrowLeft, Calendar, Clock, MapPin, 
  CheckCircle, Navigation, Camera, AlertOctagon, 
  X, Image as ImageIcon, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CleaningServiceRequest = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    eventType: 'Party',
    scheduled_date: '',
    timeHour: '09',
    timeMinute: '00',
    timePeriod: 'AM',
    location: '',
    additionalNotes: '',
    priority: 'Medium'
  });
  const [wasteTypes, setWasteTypes] = useState({
    Food: false,
    Plastic: false,
    Paper: false,
    Glass: false,
    Other: false
  });
  const [images, setImages] = useState([]); // Base64 or local blobs for preview
  const [imageFiles, setImageFiles] = useState([]); // Actual files to upload
  const [isLoading, setIsLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const eventTypes = ['Wedding', 'Party', 'Gathering', 'Corporate', 'Other'];
  const priorities = [
    { label: 'Low', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: 'Medium', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { label: 'High', color: 'bg-rose-50 text-rose-600 border-rose-100' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleWasteTypeChange = (type) => {
    setWasteTypes({ ...wasteTypes, [type]: !wasteTypes[type] });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    setImageFiles([...imageFiles, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.scheduled_date) < new Date(today)) {
       toast.error("Cleanup deployment cannot be scheduled for past dates. Please select today or a future date.");
       setIsLoading(false);
       return;
    }

    // Convert custom time to 24h for validation and submission
    let hours = parseInt(formData.timeHour);
    if (formData.timePeriod === 'PM' && hours !== 12) hours += 12;
    if (formData.timePeriod === 'AM' && hours === 12) hours = 0;
    const time24h = `${hours.toString().padStart(2, '0')}:${formData.timeMinute}`;

    // Time validation: max 9:00 PM (21:00)
    if (time24h > "21:00") {
       toast.error("Deployment window closed. Latest available operational slot is 9:00 PM.");
       setIsLoading(false);
       return;
    }

    const selectedWasteTypes = Object.keys(wasteTypes).filter(key => wasteTypes[key]);
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4321';

    try {
      const token = localStorage.getItem('token');
      const userRes = await axios.get(`${API_URL}/api/user/me`, {
        headers: { token }
      });
      const userId = userRes.data.user._id;

      const submitData = new FormData();
      submitData.append('user_id', userId);
      submitData.append('eventType', formData.eventType);
      submitData.append('scheduled_date', formData.scheduled_date);
      submitData.append('time', time24h);
      submitData.append('location', formData.location);
      submitData.append('additionalNotes', formData.additionalNotes);
      submitData.append('priority', formData.priority);
      
      selectedWasteTypes.forEach(type => submitData.append('wasteTypes', type));
      imageFiles.forEach(file => submitData.append('images', file));

      await axios.post(`${API_URL}/api/cleaning-requests`, submitData, {
        headers: { 
          'token': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success("Request sent to EcoLoop Intelligence!");
      
      setFormData({
        eventType: 'Party',
        scheduled_date: '',
        timeHour: '09',
        timeMinute: '00',
        timePeriod: 'AM',
        location: '',
        additionalNotes: '',
        priority: 'Medium'
      });
      setWasteTypes({ Food: false, Plastic: false, Paper: false, Glass: false, Other: false });
      setImages([]);
      setImageFiles([]);

      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (err) {
      console.error(err);
      toast.error("Deployment failed. Check connections.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-20">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      
      <nav className="fixed top-0 inset-x-0 z-[100] py-4 bg-white/80 backdrop-blur-xl shadow-sm border-b border-emerald-50 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-xl shadow-md">
                <Leaf className="text-white w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black text-slate-900 tracking-tighter uppercase block leading-none">EcoLoop</span>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Service Terminal</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-32 grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left Column - Instructions */}
        <div className="lg:col-span-2 space-y-8">
           <div className="relative p-8 bg-emerald-600 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200 overflow-hidden group">
              <Sparkles className="absolute -top-4 -right-4 w-32 h-32 text-white/10 rotate-12 group-hover:scale-125 transition-transform duration-700" />
              <h1 className="text-4xl font-black tracking-tight mb-4 relative z-10">Premium Cleaning Deployment</h1>
              <p className="text-emerald-50 text-sm font-medium leading-relaxed relative z-10 opacity-90">
                Book our specialized squad for high-impact events. We handle everything from material segregation to final sanitation.
              </p>
              <div className="mt-8 flex items-center gap-4 relative z-10">
                 <div className="flex -space-x-3">
                    {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-4 border-emerald-600 bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">{i}</div>)}
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">System Verified</p>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white rounded-3xl border border-emerald-50 shadow-sm">
                 <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle size={20} />
                 </div>
                 <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">Automatic Logistics</h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">Our system assigns the nearest specialized team based on your location and event type.</p>
                 </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white rounded-3xl border border-emerald-50 shadow-sm">
                 <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                    <AlertOctagon size={20} />
                 </div>
                 <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">Priority Response</h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">Select urgent priority for same-day emergency cleanup requests.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column - Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 bg-white rounded-[3rem] p-10 border border-emerald-50 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Event Category</label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border-2 border-slate-50 text-slate-900 text-xs font-black rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                  required
                >
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Urgency Priority</label>
                <div className="flex gap-2">
                   {priorities.map(p => (
                     <button
                       key={p.label}
                       type="button"
                       onClick={() => setFormData({...formData, priority: p.label})}
                       className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-xl border-2 transition-all ${formData.priority === p.label ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}
                     >
                       {p.label}
                     </button>
                   ))}
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Calendar size={12} className="text-emerald-500" /> Target Date
                </label>
                <input
                  type="date"
                  name="scheduled_date"
                  min={today}
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  className="w-full bg-[#F8FAFC] border-2 border-slate-50 text-slate-900 text-xs font-black rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Clock size={12} className="text-emerald-500" /> Operation Time
                </label>
                <div className="flex gap-2">
                  <select
                    name="timeHour"
                    value={formData.timeHour}
                    onChange={handleChange}
                    className="flex-1 bg-[#F8FAFC] border-2 border-slate-50 text-slate-900 text-xs font-black rounded-2xl px-3 py-3.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all appearance-none text-center"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <select
                    name="timeMinute"
                    value={formData.timeMinute}
                    onChange={handleChange}
                    className="flex-1 bg-[#F8FAFC] border-2 border-slate-50 text-slate-900 text-xs font-black rounded-2xl px-3 py-3.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all appearance-none text-center"
                    required
                  >
                    {['00', '15', '30', '45'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    name="timePeriod"
                    value={formData.timePeriod}
                    onChange={handleChange}
                    className="flex-1 bg-emerald-50 border-2 border-emerald-100 text-emerald-700 text-[10px] font-black rounded-2xl px-2 py-3.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all appearance-none text-center cursor-pointer"
                    required
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <MapPin size={12} className="text-emerald-500" /> Base Location
              </label>
              <textarea
                name="location"
                value={formData.location}
                onChange={handleChange}
                rows="2"
                className="w-full bg-[#F8FAFC] border-2 border-slate-50 text-slate-900 text-xs font-medium rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all resize-none"
                placeholder="Full operational area address"
                required
              ></textarea>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detected Waste Composition</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(wasteTypes).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleWasteTypeChange(type)}
                    className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${wasteTypes[type] ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border-slate-50 text-slate-400 hover:border-emerald-100'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                 <Camera size={12} className="text-emerald-500" /> Visual Proofs (Optional)
               </label>
               <div className="grid grid-cols-4 gap-4">
                  <AnimatePresence>
                    {images.map((img, index) => (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        key={index} 
                        className="relative aspect-square rounded-2xl overflow-hidden border-2 border-emerald-50 group"
                      >
                        <img src={img} alt="preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={20} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {images.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 hover:border-emerald-200 hover:text-emerald-500 transition-all bg-slate-50/50"
                    >
                      <ImageIcon size={24} />
                      <span className="text-[8px] font-black uppercase tracking-widest mt-2">{images.length}/5 Only</span>
                    </button>
                  )}
               </div>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleImageChange} 
                 className="hidden" 
                 multiple 
                 accept="image/*" 
               />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Specific Instructions</label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                rows="2"
                className="w-full bg-[#F8FAFC] border-2 border-slate-50 text-slate-900 text-xs font-medium rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all resize-none"
                placeholder="Volume estimations, access codes, or contact persons..."
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-2xl shadow-emerald-500/20 mt-10 group"
            >
              {isLoading ? 'Processing Intelligence...' : 'Deploy Cleaning Squad'}
              {!isLoading && <Navigation size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default CleaningServiceRequest;
