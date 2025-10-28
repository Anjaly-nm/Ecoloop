import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Re-imported axios
import { ShoppingBag, Recycle, User, LogOut, Menu, X, ArrowRight, BookOpen } from "lucide-react"; 

// NOTE: Ensure Tailwind CSS is configured in your project for these classes to work!

const Dashboard = () => {
  const navigate = useNavigate();
  // FIXED: Reinstated setUsername to use the API response
  const [username, setUsername] = useState("Eco-Warrior"); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- Theme Colors for Professional Look (Refined) ---
  const PRIMARY_COLOR = "text-emerald-600"; // Slightly brighter Forest Green
  const PRIMARY_BG_LIGHT = "bg-emerald-50"; // Lightest green background

  // --- Utility Functions ---

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // If you want to redirect immediately
      // navigate("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        // FIXED: Actual API call re-enabled to fetch the logged-in user's name
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/user/me`,
          { headers: { token } }
        );
        setUsername(res.data.user?.name || "User Name"); // Use actual user name
      } catch (err) {
        console.error("Error fetching user:", err.response?.data || err);
        // Fallback for failed authentication
        localStorage.removeItem("token");
        // navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // --- Navigation Items with Lucide Icons (Added 'Learn') ---
  const navItems = [
    { name: "Shop", path: "/shop", icon: ShoppingBag, color: "text-blue-500", hoverBg: "hover:bg-blue-50" },
    { name: "Waste Gallery", path: "/wastes", icon: Recycle, color: "text-green-500", hoverBg: "hover:bg-green-50" },
    { name: "Profile", path: "/profile", icon: User, color: "text-indigo-500", hoverBg: "hover:bg-indigo-50" },
    { name: "Learn", path: "/learn", icon: BookOpen, color: "text-yellow-600", hoverBg: "hover:bg-yellow-50" },
  ];

  // Card Data with specific color schemes
  const cards = [
    { 
      name: "Shop Recycled Goods", 
      path: "/shop", 
      icon: ShoppingBag, 
      color: "text-blue-600",
      description: "Redeem your points for sustainable, high-quality products.",
      buttonText: "Explore Market",
      bgGradient: "bg-gradient-to-tr from-blue-500 to-cyan-500", 
      iconBg: "bg-blue-100",
    },
    { 
      name: "Manage Waste Submissions", 
      path: "/wastes", 
      icon: Recycle, 
      color: "text-green-600",
      description: "View submitted waste items, track collection status, and check guidelines.",
      buttonText: "View Gallery",
      bgGradient: "bg-gradient-to-tr from-green-500 to-emerald-500", 
      iconBg: "bg-green-100",
    },
    { 
      name: "Review Your Profile", 
      path: "/profile", 
      icon: User, 
      color: "text-indigo-600",
      description: "Check your EcoPoints balance, track history, and manage personal data.",
      buttonText: "My Profile",
      bgGradient: "bg-gradient-to-tr from-indigo-500 to-purple-500", 
      iconBg: "bg-indigo-100",
    },
    { 
      name: "Educational Videos", 
      path: "/UserLearningVideos", 
      icon: BookOpen, 
      color: "text-yellow-600",
      description: "Expand your knowledge on recycling, sustainability, and eco-friendly living.",
      buttonText: "Start Learning",
      bgGradient: "bg-gradient-to-tr from-yellow-500 to-orange-500", 
      iconBg: "bg-yellow-100",
    },
  ];

  // ------------------------------------------------------------------
  // Tailwind Styling Applied for Professional Aesthetic
  // ------------------------------------------------------------------
  return (
    <div className={`min-h-screen ${PRIMARY_BG_LIGHT} font-sans`}>

      {/* 1. Navigation Bar (Navbar) - Elevated & Clean */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-xl sticky top-0 z-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo/Site Name - Professional Font */}
            <div className="flex items-center">
              <span className={`text-3xl font-extrabold ${PRIMARY_COLOR} tracking-tighter`}>
                EcoLoop
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 ${item.hoverBg} transition duration-150 transform hover:scale-105`}
                >
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <span>{item.name}</span>
                </button>
              ))}
              
              {/* Logout Button - Distinct but elegant */}
              <button
                onClick={handleLogout}
                className="ml-4 flex items-center space-x-2 px-5 py-2 rounded-full text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-md transition duration-150 transform hover:scale-[1.03]"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none transition"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMenuOpen && (
          <div className="sm:hidden border-t border-gray-200">
            <div className="pt-2 pb-3 px-2 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl text-base font-medium ${item.color} ${item.hoverBg} transition`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl text-base font-medium text-red-600 bg-red-50 hover:bg-red-100 mt-2"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>
      
      {/* 2. Main Dashboard Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Welcome Card/Banner - REDUCED SIZE & DEPTH */}
        <div className={`p-6 md:p-8 rounded-2xl shadow-lg mb-8 
                        bg-gradient-to-r from-emerald-500 to-green-600 
                        transform skew-y-0 text-white`}>
          {/* Reduced font size from 4xl/5xl to 3xl/4xl */}
          <h2 className={`text-3xl lg:text-4xl font-extrabold mb-1 tracking-tight`}>
            Welcome back, {username}! 
          </h2>
          {/* Reduced font size from xl to lg */}
          <p className="text-lg font-light text-green-100">
            Your contributions are driving a cleaner, greener future.
          </p>
        </div>

        {/* Action Cards Grid - Vibrant and Interactive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {cards.map((card) => (
            <div 
              key={card.name}
              className="group bg-white p-6 rounded-3xl shadow-xl border border-gray-100 
                         hover:shadow-2xl hover:scale-[1.03] transition duration-300 ease-in-out 
                         flex flex-col justify-between"
            >
              <div>
                <div className={`p-3 rounded-xl inline-block mb-4 ${card.iconBg}`}>
                   <card.icon className={`h-8 w-8 ${card.color}`} />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">{card.name}</h3>
                <p className="text-gray-500 mb-6 text-sm">{card.description}</p>
              </div>

              <button 
                className={`w-full py-3 ${card.bgGradient} text-white font-bold rounded-xl 
                            shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 
                            transform group-hover:scale-[1.01]`}
                onClick={() => navigate(card.path)}
              >
                <span>{card.buttonText}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ))}

        </div>

      </main>
    </div>
  );
};

export default Dashboard;