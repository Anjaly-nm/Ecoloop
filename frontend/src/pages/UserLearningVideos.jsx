import React, { useState, useEffect, useMemo } from "react";
import { FaBookReader, FaYoutube, FaTag, FaFilter, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const UserLearningVideos = () => {
  const navigate = useNavigate();
  // 1. State for videos, loaded from localStorage
  const [allVideos, setAllVideos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Load videos from local storage on component mount
  useEffect(() => {
    const savedVideos = localStorage.getItem("videos");
    if (savedVideos) {
      setAllVideos(JSON.parse(savedVideos));
    }
  }, []);

  // 2. Memoized list of unique categories and filtered videos
  const categories = useMemo(() => {
    const uniqueCategories = new Set(allVideos.map(v => v.category || 'General').filter(Boolean));
    return ["All", ...Array.from(uniqueCategories)];
  }, [allVideos]);

  const filteredVideos = useMemo(() => {
    if (selectedCategory === "All") {
      return allVideos;
    }
    return allVideos.filter(video => (video.category || 'General') === selectedCategory);
  }, [allVideos, selectedCategory]);


  // Helper function to determine badge color based on category
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Beginner': return 'bg-blue-100 text-blue-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      case 'DIY Projects': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="flex-1 p-10 overflow-y-auto bg-gray-50 min-h-screen">

      {/* HEADER */}
      <header className="bg-white rounded-lg p-6 shadow-xl mb-10 border-t-4 border-emerald-600">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <FaBookReader className="mr-3 text-emerald-600 text-3xl" />
            Your Learning Center
          </h2>
          <span className="text-sm font-semibold text-emerald-600 border border-emerald-200 bg-emerald-50 px-4 py-2 rounded-full">
            Total Lessons: {allVideos.length}
          </span>
        </div>
        <p className="mt-2 text-gray-600">Explore videos curated to help you on your sustainable journey.</p>
      </header>

      {/* FILTER/CATEGORY NAVIGATION */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-8 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FaFilter className="mr-3 text-purple-600 text-xl" /> Filter by Topic
        </h3>
        <div className="flex flex-wrap gap-3">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition duration-200 shadow-sm
                ${selectedCategory === category
                  ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                }`
              }
            >
              <FaTag className="inline mr-2 text-xs" /> {category}
            </button>
          ))}
        </div>
      </div>

      {/* VIDEO GRID */}
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FaYoutube className="mr-3 text-red-600 text-xl" /> {selectedCategory} Lessons ({filteredVideos.length})
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredVideos.map(video => (
          <div 
            key={video.id} 
            className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 hover:shadow-purple-300/50 transition duration-300 transform hover:-translate-y-1"
          >
            <div className="p-6">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getCategoryColor(video.category || 'General')} mb-3 inline-block`}>
                {video.category || 'General'}
              </span>
              <h4 className="text-xl font-bold text-gray-900 mb-2 truncate" title={video.title}>
                {video.title}
              </h4>
              <p className="text-sm text-gray-600 h-12 overflow-hidden">
                {video.description}
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 border-t flex justify-end">
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150"
              >
                <FaYoutube className="mr-2 text-lg" /> Watch Lesson
              </a>
            </div>
          </div>
        ))}
        
        {filteredVideos.length === 0 && (
          <div className="col-span-full p-10 bg-white rounded-xl shadow-lg text-center">
            <p className="text-gray-500 text-lg font-medium">
              No videos found in the **{selectedCategory}** category.
            </p>
          </div>
        )}

      </div>
      
      {/* Optional: Back Button for navigation */}
      <div className="mt-10 pt-5 border-t border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition duration-200 shadow-lg flex items-center"
          title="Go Back"
        >
          <FaArrowLeft className="text-lg mr-2" /> Back
        </button>
      </div>
    </div>
  );
};

export default UserLearningVideos;