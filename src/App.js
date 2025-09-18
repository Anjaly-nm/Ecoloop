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

// ✅ Admin Pages
import Adminpage from "./pages/Adminpage";
import WasteManagement from "./pages/WasteManagement"; 

// ✅ Collector Page
import Collector from "./pages/Collector";

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

          {/* Admin Routes */}
          <Route path="/adminpage" element={<Adminpage />} />
          <Route path="/admin/waste-management" element={<WasteManagement />} />

          {/* Collector Route */}
          <Route path="/collector" element={<Collector />} />
        </Routes>
      </Router>
    </Authprovider>
  );
}

export default App;
