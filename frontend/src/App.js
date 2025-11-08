import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ✅ User Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import About from "./pages/About";
import Registration from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Wastes from "./pages/Wastes";
import Profile from "./pages/Profile"; // ✅ Added
import UserLearningVideos from "./pages/UserLearningVideos";  
import Predict from "./pages/Predict";


// ✅ Admin Pages
import Adminpage from "./pages/Adminpage";
import WasteManagement from "./pages/WasteManagement"; 
import Category from "./pages/Category";
import LearningVideosManagement from './pages/LearningVideosManagement';
import UserManage from "./pages/UserManage";  


// ✅ Collector Page
import Collector from "./pages/Collector";
import CollectorApply from"./pages/CollectorApply";
// ✅ Password Pages
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// ✅ Auth Provider
import Authprovider from "./Authprovider";

function App() {
  return (
    <Authprovider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/about" element={<About />} />

          {/* Password Reset Routes */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* User Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wastes" element={<Wastes />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/UserLearningVideos" element={<UserLearningVideos />} />
          <Route path="/Predict" element={<Predict />} />

          
          {/* Admin Routes */}
          <Route path="/adminpage" element={<Adminpage />} />
          <Route path="/admin/waste-management" element={<WasteManagement />} />
          <Route path="/admin/waste-management/category" element={<Category/>} />
           <Route 
          path="/admin/LearningvideosManagement" 
          element={<LearningVideosManagement />} 
        />
         <Route path="/admin/UserManage" element={<UserManage />} />

          {/* Collector Route */}
          <Route path="/collector" element={<Collector />} />
          <Route path="/CollectorApply" element={<CollectorApply />} />
        </Routes>
      </Router>
    </Authprovider>
  );
}

export default App;
