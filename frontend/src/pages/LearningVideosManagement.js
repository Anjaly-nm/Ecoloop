import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Video,
  BookOpen,
  ExternalLink,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Clock,
  Youtube
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- DATA ---
const initialVideos = [
  {
    id: 1,
    title: "How to Sort Waste at Home",
    url: "https://www.youtube.com/watch?v=123abc456",
    category: "Beginner",
    description: "Learn the basics of segregating dry and wet waste efficiently.",
    createdAt: "2024-03-01T10:00:00Z"
  },
  {
    id: 2,
    title: "The Science of Composting",
    url: "https://www.youtube.com/watch?v=789def012",
    category: "Advanced",
    description: "Dive deep into the chemical process that turns scraps into soil.",
    createdAt: "2024-03-02T14:30:00Z"
  },
  {
    id: 3,
    title: "Upcycling Plastic Bottles",
    url: "https://www.youtube.com/watch?v=345ghi678",
    category: "DIY Projects",
    description: "Creative ways to turn waste plastic into useful household items.",
    createdAt: "2024-03-03T09:15:00Z"
  },
];

const LearningVideosManagement = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [videos, setVideos] = useState(() => {
    const savedVideos = localStorage.getItem("videos");
    return savedVideos ? JSON.parse(savedVideos) : initialVideos;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState("link"); // "link" or "file"
  const [selectedFile, setSelectedFile] = useState(null);
  const [newVideo, setNewVideo] = useState({ title: "", url: "", category: "", description: "" });
  const [editingVideo, setEditingVideo] = useState(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem("videos", JSON.stringify(videos));
  }, [videos]);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVideo(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVideo = (e) => {
    e.preventDefault();
    const hasSource = uploadType === "link" ? newVideo.url : selectedFile;

    if (newVideo.title && hasSource) {
      const sourceUrl = uploadType === "link" ? newVideo.url : URL.createObjectURL(selectedFile);

      if (editingVideo) {
        setVideos(prev => prev.map(v => v.id === editingVideo.id ? {
          ...newVideo,
          url: sourceUrl,
          id: editingVideo.id,
          createdAt: editingVideo.createdAt
        } : v));
        toast.success("Lesson updated successfully!");
      } else {
        const videoToAdd = {
          ...newVideo,
          url: sourceUrl,
          id: Date.now(),
          createdAt: new Date().toISOString()
        };
        setVideos(prev => [videoToAdd, ...prev]);
        toast.success("New lesson published!");
      }
      setIsAddModalOpen(false);
      setEditingVideo(null);
      setSelectedFile(null);
      setNewVideo({ title: "", url: "", category: "", description: "" });
    } else {
      toast.error(`Please provide a title and a ${uploadType === 'link' ? 'valid URL' : 'video file'}.`);
    }
  };

  const handleDeleteVideo = (id) => {
    if (window.confirm("Are you sure you want to remove this educational content?")) {
      setVideos(prev => prev.filter(video => video.id !== id));
      toast.info("Lesson removed from registry.");
    }
  };

  const openEditModal = (video) => {
    setEditingVideo(video);
    setNewVideo({
      title: video.title,
      url: video.url,
      category: video.category,
      description: video.description
    });
    setIsAddModalOpen(true);
  };

  const filteredVideos = useMemo(() => {
    return videos.filter(v =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [videos, searchTerm]);

  const getYoutubeThumbnail = (url) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 p-8">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar theme="colored" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <button
              onClick={() => navigate("/adminpage")}
              className="flex items-center gap-2 text-slate-400 hover:text-purple-600 font-bold text-xs uppercase tracking-widest transition-colors mb-4 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Core
            </button>
            <h2 className="text-4xl font-black text-slate-900 tracking-tightest leading-tight flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                <Video className="text-purple-600" size={32} />
              </div>
              Education Hub
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group flex-grow md:flex-grow-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-6 py-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 w-full md:w-80 shadow-sm transition-all font-medium text-sm"
              />
            </div>
            <button
              onClick={() => {
                setEditingVideo(null);
                setNewVideo({ title: "", url: "", category: "", description: "" });
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3.5 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-95 whitespace-nowrap"
            >
              <Plus size={18} />
              Publish Lesson
            </button>
          </div>
        </div>

        {/* Lessons List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lesson Detail</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Access</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence mode="popLayout">
                  {filteredVideos.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan="4" className="px-8 py-20 text-center">
                        <Video className="text-slate-200 w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No educational content detected</p>
                      </td>
                    </motion.tr>
                  ) : (
                    filteredVideos.map((video, idx) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={video.id}
                        className="hover:bg-slate-50/50 group transition-all duration-300"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className="relative flex-shrink-0">
                              {getYoutubeThumbnail(video.url) ? (
                                <img
                                  src={getYoutubeThumbnail(video.url)}
                                  alt={video.title}
                                  className="w-24 h-16 rounded-xl object-cover shadow-sm ring-2 ring-white group-hover:ring-purple-100 transition-all"
                                />
                              ) : (
                                <div className="w-24 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                                  <Video size={24} />
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="p-1.5 bg-white/90 rounded-full text-purple-600 shadow-md">
                                  <Play size={14} fill="currentColor" />
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 leading-tight mb-1">{video.title}</p>
                              <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-xs">{video.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 bg-emerald-50 text-emerald-700">
                            <Layers size={12} />
                            {video.category || 'General'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-xs group/link"
                          >
                            <Youtube size={14} className="text-rose-500" />
                            Stream Link
                            <ExternalLink size={12} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                          </a>
                          <div className="flex items-center gap-1.5 mt-1.5 text-slate-400 text-[10px] font-medium">
                            <Clock size={10} />
                            {new Date(video.createdAt || Date.now()).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(video)}
                              className="p-2.5 text-slate-400 hover:text-purple-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(video.id)}
                              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-rose-100"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-8 pb-0 flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {editingVideo ? "Update Intelligence" : "Publish New Content"}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Lesson Registry Configuration
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddVideo} className="p-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lesson Title</label>
                  <input
                    type="text"
                    name="title"
                    value={newVideo.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Composting Basics"
                    className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all font-bold text-sm placeholder:text-slate-400 placeholder:font-medium"
                    required
                  />
                </div>

                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-200 w-fit mx-auto">
                    <button
                      type="button"
                      onClick={() => setUploadType("link")}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadType === "link" ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      External Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadType("file")}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${uploadType === "file" ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      Local Upload
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadType === "link" ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Source URL</label>
                        <input
                          type="url"
                          name="url"
                          value={newVideo.url}
                          onChange={handleInputChange}
                          placeholder="YouTube Link"
                          className="w-full px-5 py-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all font-bold text-sm placeholder:text-slate-400 placeholder:font-medium"
                          required={uploadType === "link"}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Video</label>
                        <div className="relative group">
                          <input
                            type="file"
                            accept="video/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setSelectedFile(file);
                                toast.success(`Video Ready: ${file.name}`);
                              }
                            }}
                          />
                          <div className={`w-full px-5 py-3.5 bg-white rounded-2xl border ${selectedFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'} flex items-center justify-between font-bold text-sm transition-all`}>
                            <span className={selectedFile ? 'text-emerald-700' : 'text-slate-400'}>
                              {selectedFile ? selectedFile.name : 'Choose file...'}
                            </span>
                            <Plus size={16} className={selectedFile ? 'text-emerald-600' : 'text-purple-600'} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category tag</label>
                      <input
                        type="text"
                        name="category"
                        value={newVideo.category}
                        onChange={handleInputChange}
                        placeholder="e.g., Advanced"
                        className="w-full px-5 py-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all font-bold text-sm placeholder:text-slate-400 placeholder:font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Intel Summary</label>
                  <textarea
                    name="description"
                    value={newVideo.description}
                    onChange={handleInputChange}
                    placeholder="Describe the educational value..."
                    rows="3"
                    className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all font-bold text-sm placeholder:text-slate-400 placeholder:font-medium resize-none"
                    required
                  ></textarea>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all transition-colors active:scale-[0.98]"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-[0.98]"
                  >
                    {editingVideo ? "Confirm Integration" : "Deploy Content"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearningVideosManagement;
