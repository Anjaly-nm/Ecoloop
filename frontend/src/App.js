// ✅ App.js - EcoLoop
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
import Subscription from "./pages/Subscription";
import ApplicationOptions from "./pages/ApplicationOptions"; // ✅ Added new import
import SellerApply from "./pages/SellerApply"; // ✅ Added new import
import Applications from "./pages/Applications"; // ✅ Added new import
import SellerDashboard from "./pages/SellerDashboard"; // ✅ Added new import
import Shop from "./pages/MarketShop"; // ✅ Using MarketShop as Shop
import Products from "./pages/Products"; // ✅ Added new import
import MarketShop from "./pages/MarketShop"; // ✅ Added new import
import Events from "./pages/Events"; // ✅ Added new import
import DeliveryBoyApply from "./pages/DeliveryBoyApply"; // ✅ Added new import
import DeliveryDashboard from "./pages/DeliveryDashboard"; // ✅ Added new import
import LeaveApplication from "./pages/LeaveApplication"; // ✅ Added new import
import AdminLeaveApplications from "./pages/AdminLeaveApplications"; // ✅ Added new import
import ProductDetails from "./pages/ProductDetails"; // ✅ Added new import

// ✅ Admin Pages
import Adminpage from "./pages/Adminpage";
import WasteManagement from "./pages/WasteManagement";
import Category from "./pages/Category";
import LearningVideosManagement from './pages/LearningVideosManagement';
import UserManage from "./pages/UserManage";
import ShopManagement from "./pages/ShopManagement";
import SystemReports from "./pages/SystemReports";
import AssignDeliveryBoy from "./pages/AssignDeliveryBoy"; // ✅ Added new import
import SmartBinMonitor from "./pages/SmartBinMonitor"; // ✅ Added Smart Bin Monitor

// ✅ Collector Page
import Collector from "./pages/Collector";
import CollectorApply from "./pages/CollectorApply";
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
          <Route path="/application-options" element={<ApplicationOptions />} /> {/* ✅ Added new route */}
          <Route path="/seller-apply" element={<SellerApply />} /> {/* ✅ Added new route */}
          <Route path="/delivery-boy-apply" element={<DeliveryBoyApply />} /> {/* ✅ Added new route */}

          {/* Password Reset Routes */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* User Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wastes" element={<Wastes />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/UserLearningVideos" element={<UserLearningVideos />} />
          <Route path="/Predict" element={<Predict />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/shop" element={<Shop />} /> {/* ✅ Point shop route to Shop component */}
          <Route path="/market-shop" element={<MarketShop />} /> {/* ✅ Add route for MarketShop */}
          <Route path="/products" element={<Products />} /> {/* ✅ Added route for Products */}
          <Route path="/product-details/:id" element={<ProductDetails />} /> {/* ✅ Added new route */}
          <Route path="/events" element={<Events />} /> {/* ✅ Added new route for Events */}
          <Route path="/seller-dashboard" element={<SellerDashboard />} /> {/* ✅ Added new route */}
          <Route path="/delivery-dashboard" element={<DeliveryDashboard />} /> {/* ✅ Added new route for Delivery Dashboard */}
          <Route path="/leave-application" element={<LeaveApplication />} /> {/* ✅ Added new route for Leave Application */}
          <Route path="/admin/leave-applications" element={<AdminLeaveApplications />} /> {/* ✅ Added new route for Admin Leave Applications */}


          {/* Admin Routes */}
          <Route path="/adminpage" element={<Adminpage />} />
          <Route path="/admin/waste-management" element={<WasteManagement />} />
          <Route path="/admin/waste-management/category" element={<Category />} />
          <Route
            path="/admin/LearningvideosManagement"
            element={<LearningVideosManagement />}
          />
          <Route path="/admin/UserManage" element={<UserManage />} />
          <Route path="/admin/shop-management" element={<ShopManagement />} />
          <Route path="/admin/SystemReports" element={<SystemReports />} />
          <Route path="/admin/applications" element={<Applications />} /> {/* ✅ Added new route */}
          <Route path="/admin/assign-delivery-boy" element={<AssignDeliveryBoy />} /> {/* ✅ Added new route for Assign Delivery Boy */}
          <Route path="/admin/smart-bin-monitor" element={<SmartBinMonitor />} /> {/* ✅ Added Smart Bin Monitor route */}

          {/* Collector Route */}
          <Route path="/collector" element={<Collector />} />
          <Route path="/CollectorApply" element={<CollectorApply />} />
        </Routes>
      </Router>
    </Authprovider>
  );
}

export default App;