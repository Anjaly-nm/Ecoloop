import React from "react";
import { useNavigate } from "react-router-dom";
// 1. Import new icon: FaBookOpen (or another suitable icon)
import { 
  FaSignOutAlt, 
  FaTachometerAlt, 
  FaTrashAlt, 
  FaStore, 
  FaChartLine, 
  FaUsers, 
  FaLeaf,
  FaSeedling,
  FaBookOpen // New icon imported
} from "react-icons/fa";
// NOTE: Replaced external CSS with Tailwind CSS utility classes

const AdminPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  // --- Helper Components for Cleanliness ---

  // Component for Sidebar Links (now uses a button and handles navigation)
  const SidebarItem = ({ icon: Icon, label, path }) => (
    <li className="mb-2">
      <button
        onClick={() => navigate(path)}
        // Professional sidebar styling - CHANGED: indigo-700 to emerald-600
        className="flex items-center w-full p-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-emerald-600 hover:text-white transition duration-200 text-left"
      >
        <Icon className="mr-3 text-lg" />
        {label}
      </button>
    </li>
  );

  // Component for Dashboard Cards (now handles navigation)
  const DashboardCard = ({ icon: Icon, title, path, iconColor }) => (
    <div
      onClick={() => navigate(path)}
      // Modern card styling with hover effects and distinct icon background
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col items-center justify-center text-center h-40"
    >
        <div className={`p-3 mb-3 rounded-full ${iconColor.replace('text', 'bg-opacity-10 text')}`}>
            <Icon className={`text-3xl ${iconColor}`} />
        </div>
      <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
    </div>
  );
  // ----------------------------------------

  return (
    <div className="flex h-screen bg-gray-100 font-sans antialiased">
      
      {/* Sidebar - Dark, Professional Look (bg-gray-800/900 is standard for admin panels) */}
      <aside className="w-64 bg-gray-900 shadow-2xl flex flex-col p-5">
        <h1 className="text-2xl font-bold text-white mb-10 border-b border-gray-700 pb-4">
          {/* CHANGED: text-indigo-500 to text-green-500 */}
          <span className="text-green-500">Eco</span>Admin
        </h1>
        
        <nav className="flex flex-col gap-1 flex-grow">
          <ul className="space-y-1">
            {/* Using buttons/SidebarItem for professional SPA navigation */}
            <SidebarItem icon={FaTachometerAlt} label="Dashboard" path="/Adminpage" />
            <SidebarItem icon={FaTrashAlt} label="Waste Management" path="/admin/waste-management" />
            
            {/* 2. Add the new Sidebar Item for Learning Videos */}
            <SidebarItem 
              icon={FaBookOpen} 
              label="Learning Videos" 
              path="/admin/learningvideosManagement" // Define the route path
            />
            <SidebarItem icon={FaStore} label="profile" path="/admin/Profile" />
            <SidebarItem icon={FaStore} label="Sellers & Shop" path="/admin/shop-management" />
            <SidebarItem icon={FaChartLine} label="System Reports" path="/admin/reports" />
          </ul>
        </nav>
        
        {/* Logout Button in Sidebar Footer */}
        <button
          onClick={handleLogout}
          // Kept red for a strong "Exit/Danger" action
          className="flex items-center justify-center gap-2 p-3 mt-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-200"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        
        {/* Header/Greeting - Clean and informative */}
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-300">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 font-medium bg-white p-2 rounded-lg shadow-sm">Hello, Administrator</span>
          </div>
        </header>

        {/* Welcome Card - CHANGED: indigo gradient to a teal/emerald gradient */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl p-6 shadow-xl mb-8">
          <h3 className="text-2xl font-semibold mb-2">Welcome Back, EcoLoop Admin 👋</h3>
          <p className="text-teal-200">
            Quickly manage waste submissions, user accounts, and shop listings to keep the system efficient.
          </p>
        </div>

        {/* Quick Access Cards Grid */}
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Access</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <DashboardCard
            icon={FaTrashAlt}
            title="Waste Management"
            path="/admin/waste-management"
            iconColor="text-yellow-600"
          />

          <DashboardCard
            icon={FaUsers}
            title="Users Management"
            path="/admin/UserManage"
            iconColor="text-blue-600"
          />
          
          {/* 3. Add the new Dashboard Card for Learning Videos */}
          <DashboardCard
            icon={FaBookOpen}
            title="Learning Videos"
            path="/admin/LearningvideosManagement" // Use the same route path
            iconColor="text-purple-600" // Use a distinct color (purple works well for learning/knowledge)
          />

          <DashboardCard
            icon={FaStore}
            title="Sellers & Shop"
            path="/admin/shop-management"
            iconColor="text-yellow-600"
          />
          
          <DashboardCard
            icon={FaChartLine}
            title="System Reports"
            path="/admin/reports"
            iconColor="text-red-600"
          />

          <DashboardCard
            icon={FaLeaf}
            title="Ecopoints"
            path="/admin/Ecopints"
            iconColor="text-green-700"
          />

          <DashboardCard
            icon={FaUsers}
            title="ward & users"
            iconColor="text-grey-600"
          />

          <DashboardCard
            icon={FaSeedling}
            title="Eco products"
            iconColor="text-orange-600"
          />

        </div>
      </main>
    </div>
  );
};

export default AdminPage;