import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaTrashAlt, FaEdit, FaBookOpen, FaExternalLinkAlt, FaVideo, FaArrowLeft } from "react-icons/fa";

// Dummy data for initial load
const initialVideos = [
  { id: 1, title: "How to Sort Waste at Home", url: "https://www.youtube.com/watch?v=123abc456", category: "Beginner", description: "Learn the basics of segregating dry and wet waste efficiently." },
  { id: 2, title: "The Science of Composting", url: "https://www.youtube.com/watch?v=789def012", category: "Advanced", description: "Dive deep into the chemical process that turns scraps into soil." },
  { id: 3, title: "Upcycling Plastic Bottles", url: "https://www.youtube.com/watch?v=345ghi678", category: "DIY Projects", description: "Creative ways to turn waste plastic into useful household items." },
];

const LearningVideosManagement = () => {
  const navigate = useNavigate();

  // Load from localStorage or fallback to initialVideos
  const [videos, setVideos] = useState(() => {
    const savedVideos = localStorage.getItem("videos");
    return savedVideos ? JSON.parse(savedVideos) : initialVideos;
  });

  const [newVideo, setNewVideo] = useState({ title: "", url: "", category: "", description: "" });

  // Persist videos to localStorage whenever videos change
  useEffect(() => {
    localStorage.setItem("videos", JSON.stringify(videos));
  }, [videos]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVideo(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVideo = (e) => {
    e.preventDefault();
    if (newVideo.title && newVideo.url) {
      const videoToAdd = { ...newVideo, id: Date.now() };
      setVideos(prev => [videoToAdd, ...prev]);
      setNewVideo({ title: "", url: "", category: "", description: "" });
    } else {
      alert("Please enter a title and a valid URL.");
    }
  };

  const handleDeleteVideo = (id) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      setVideos(prev => prev.filter(video => video.id !== id));
    }
  };

  return (
    <div className="flex-1 p-10 overflow-y-auto bg-gray-50 min-h-screen">

      {/* HEADER with BACK BUTTON */}
      <header className="bg-white rounded-lg p-6 shadow-xl mb-10 border-t-4 border-purple-600">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition duration-200 shadow-md"
              title="Go Back to Dashboard"
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <FaBookOpen className="mr-3 text-purple-600 text-3xl" />
            Learning Videos Management
          </h2>
          <span className="text-sm font-semibold text-purple-600 border border-purple-200 bg-purple-50 px-4 py-2 rounded-full">
            Content Manager
          </span>
        </div>
      </header>

      {/* FORM SECTION */}
      <div className="bg-white rounded-xl p-8 shadow-2xl mb-10 border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center border-b pb-4">
          <FaPlus className="mr-3 text-emerald-500 text-xl" /> Publish New Video Lesson
        </h3>
        <form onSubmit={handleAddVideo} className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <input
            type="text"
            name="title"
            value={newVideo.title}
            onChange={handleInputChange}
            placeholder="Lesson Title (e.g., 'Composting 101')"
            className="p-3 border border-gray-300 rounded-lg col-span-12 md:col-span-6 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 shadow-sm"
            required
          />
          <input
            type="url"
            name="url"
            value={newVideo.url}
            onChange={handleInputChange}
            placeholder="Video URL (YouTube/Vimeo)"
            className="p-3 border border-gray-300 rounded-lg col-span-12 md:col-span-4 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 shadow-sm"
            required
          />
          <input
            type="text"
            name="category"
            value={newVideo.category}
            onChange={handleInputChange}
            placeholder="Category (e.g., 'Advanced')"
            className="p-3 border border-gray-300 rounded-lg col-span-12 md:col-span-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 shadow-sm"
          />
          <textarea
            name="description"
            value={newVideo.description}
            onChange={handleInputChange}
            placeholder="Short Description of the video content"
            rows="2"
            className="p-3 border border-gray-300 rounded-lg col-span-12 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 shadow-sm"
            required
          ></textarea>
          <button
            type="submit"
            className="col-span-12 bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 transition duration-200 flex items-center justify-center shadow-lg transform hover:scale-[1.01] text-lg"
          >
            <FaVideo className="mr-3" /> Save and Publish Video Link
          </button>
        </form>
      </div>

      {/* VIDEO LIST SECTION */}
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FaBookOpen className="mr-3 text-purple-600 text-xl" /> Published Lessons ({videos.length})
      </h3>
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/4">Title & Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-2/4">Video Link</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {videos.map((video, index) => (
              <tr key={video.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                
                {/* Title & Description */}
                <td className="px-6 py-4 text-sm">
                  <div className="font-semibold text-gray-900">{video.title}</div>
                  <p className="text-xs text-gray-500 mt-1">{video.description}</p>
                </td>
                
                {/* Category Badge */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    {video.category || 'General'}
                  </span>
                </td>
                
                {/* Video Link Only */}
                <td className="px-6 py-4 text-sm">
                  {video.url ? (
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center text-sm truncate max-w-xs"
                    >
                      <FaExternalLinkAlt className="mr-2 text-xs" /> Watch on YouTube
                    </a>
                  ) : (
                    <span className="text-gray-500">No link provided</span>
                  )}
                </td>
                
                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex justify-center space-x-2">
                    <button 
                      className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50 transition duration-150 tooltip"
                      title="Edit Lesson"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => handleDeleteVideo(video.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition duration-150 tooltip"
                      title="Delete Lesson"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {videos.length === 0 && (
          <p className="p-6 text-center text-gray-500 text-lg font-medium">✨ No lessons published yet. Time to inspire your users!</p>
        )}
      </div>
    </div>
  );
};

export default LearningVideosManagement;
