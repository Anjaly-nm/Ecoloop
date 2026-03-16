import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaImage, FaBox, FaStore, FaChartBar, FaShoppingCart, FaUsers, FaUser, FaTimes, FaCamera, FaExclamationTriangle, FaComments, FaArrowLeft } from "react-icons/fa";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Track all orders to identify customers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderFilter, setOrderFilter] = useState("new"); // Filter for orders: "new" or "all"
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    description: "",
    wasteType: "",
    wasteQuantity: "",
    productOutputQuantity: "",
    stock: "",
    unit: "",
    price: "",
    ecoPointsEligibility: "no",
    images: [],
    ecoCertification: "Eco-Friendly",
    purpose: "",
    usageInstructions: "",
    environmentalBenefits: "",
    wasteReduced: "",
    co2Saved: "",
    image: null
  });


  // Order details modal state
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Customer details modal state
  const [showCustomerDetailsModal, setShowCustomerDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Profile state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);


  const [editingProfile, setEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({});
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Chat/Messages State
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [conversations, setConversations] = useState([]); // List of active chats
  const [selectedConversation, setSelectedConversation] = useState(null); // Currently open chat
  const [chatMessages, setChatMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [refreshChatInterval, setRefreshChatInterval] = useState(null); // To clear interval on close

  // Effect to update customers when orders change
  const extractCustomersFromOrders = React.useCallback((orders) => {
    const customerMap = {};

    orders.forEach(order => {
      // Ensure userId exists and has an _id (populated)
      if (order.userId && order.userId._id) {
        const customerId = typeof order.userId._id === 'object' ? order.userId._id.toString() : order.userId._id;

        if (!customerMap[customerId]) {
          // Calculate total orders and total spent for this customer
          // Use string comparison for IDs to be safe
          const customerOrders = orders.filter(o => {
            if (!o.userId || !o.userId._id) return false;
            const oId = typeof o.userId._id === 'object' ? o.userId._id.toString() : o.userId._id;
            return oId === customerId;
          });

          const totalOrders = customerOrders.length;
          const totalSpent = customerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

          customerMap[customerId] = {
            id: customerId,
            name: order.userId.name || 'Unknown',
            email: order.userId.email || 'No Email',
            phone: order.userId.phone || 'No Phone',
            address: order.userId.address || (order.shippingAddress && order.shippingAddress.address),
            houseNumber: order.userId.houseNumber,
            wardNumber: order.userId.wardNumber,
            totalOrders: totalOrders,
            totalSpent: totalSpent,
            lastOrderDate: customerOrders.reduce((latest, o) => {
              const orderDate = new Date(o.createdAt);
              return orderDate > latest ? orderDate : latest;
            }, new Date(0)),
          };
        }
      }
    });

    // Convert to array and sort by last order date (most recent first)
    return Object.values(customerMap).sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));
  }, []);

  // Function to refresh orders
  const refreshOrders = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";

      console.log('Refreshing seller orders from:', `${base}/api/orders/seller`);
      console.log('Token being used for refresh:', token ? 'Available' : 'Missing');

      const ordersRes = await axios.get(`${base}/api/orders/seller`, {
        headers: { token }
      });

      console.log('Refresh orders API response:', ordersRes.data);
      const refreshedOrders = ordersRes.data.orders || [];
      setOrders(refreshedOrders);
      setAllOrders(refreshedOrders); // Update all orders

      // Update customers based on refreshed orders
      const updatedCustomers = extractCustomersFromOrders(refreshedOrders);
      setCustomers(updatedCustomers);

    } catch (err) {
      console.error("Error refreshing orders:", err);
      console.error("Refresh error response:", err.response);
      // Keep existing orders and customers if refresh fails
    }
  }, [extractCustomersFromOrders]);

  // Effect to update customers when orders change
  useEffect(() => {
    console.log('Orders state updated:', orders);
    if (orders && orders.length > 0) {
      const updatedCustomers = extractCustomersFromOrders(orders);
      setCustomers(updatedCustomers);
    }
  }, [orders, extractCustomersFromOrders]); // Only run when orders change

  // Refetch orders when switching to 'orders' or 'customers' tab
  // Refetch orders when switching to 'orders' or 'customers' tab
  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'customers') {
      refreshOrders();
    }
  }, [activeTab, refreshOrders]);

  // Chat Functions
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";
      const res = await axios.get(`${base}/api/messages/conversations`, { headers: { token } });
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const fetchChatHistory = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";
      const res = await axios.get(`${base}/api/messages/history/${orderId}`, { headers: { token } });
      setChatMessages(res.data.messages || []);
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  };

  const sendSellerMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;
    try {
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";

      const payload = {
        recipientId: selectedConversation.otherUser._id,
        orderId: selectedConversation.order._id,
        text: messageText
      };

      await axios.post(`${base}/api/messages/send`, payload, { headers: { token } });

      setMessageText("");
      fetchChatHistory(selectedConversation.order._id); // Refresh immediately
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    }
  };

  // Poll for new messages when a conversation is open
  useEffect(() => {
    let interval;
    if (showMessagesModal && selectedConversation) {
      // Create interval
      interval = setInterval(() => {
        fetchChatHistory(selectedConversation.order._id);
      }, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(interval);
  }, [showMessagesModal, selectedConversation]);

  // Fetch conversations periodically when modal is open but no chat selected
  useEffect(() => {
    let interval;
    if (showMessagesModal && !selectedConversation) {
      fetchConversations(); // Initial fetch
      interval = setInterval(fetchConversations, 5000);
    }
    return () => clearInterval(interval);
  }, [showMessagesModal, selectedConversation]);

  // Fetch seller's data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const base = process.env.REACT_APP_API_URL || "http://localhost:4321";

        // Fetch products
        const productsRes = await axios.get(`${base}/api/product/my-products`, {
          headers: { token }
        });
        setProducts(productsRes.data.products || []);

        // Fetch orders for this seller
        try {
          // Debug logs
          console.log('Fetching seller orders from:', `${base}/api/orders/seller`);

          const ordersRes = await axios.get(`${base}/api/orders/seller`, {
            headers: { token }
          });

          console.log('Orders API response raw:', ordersRes);
          console.log('Orders API response data:', ordersRes.data);
          console.log('Data keys:', Object.keys(ordersRes.data));
          console.log('Is orders array?', Array.isArray(ordersRes.data.orders));
          console.log('Orders length:', ordersRes.data.orders ? ordersRes.data.orders.length : 'undefined');

          const fetchedOrders = ordersRes.data.orders || [];
          setOrders(fetchedOrders);
          setAllOrders(fetchedOrders);

          // Extract unique customers from orders
          const uniqueCustomers = extractCustomersFromOrders(fetchedOrders);
          setCustomers(uniqueCustomers);

        } catch (ordersErr) {
          console.error("Error fetching seller orders:", ordersErr);

          if (ordersErr.response && ordersErr.response.status === 401) {
            // Token expired or invalid
            alert("Your session has expired. Please login again.");
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          // Alert for other errors to make them visible to the user
          alert(`Failed to load orders: ${ordersErr.response?.data?.message || ordersErr.message}`);

          setOrders([]);
          setCustomers([]);
        }

        // Initialize empty array for customers
        setCustomers([]);

        // Fetch profile data
        fetchProfileData();

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, extractCustomersFromOrders]);

  // Function to extract unique customers from orders
  // Moved outside component (or to useCallback) to avoid dependency cycle
  // But since it doesn't depend on state, we can keep it stable or just define inside useCallback.
  // Actually, let's keep it here but memoized.




  // Function to refresh all data
  const refreshAllData = async () => {
    try {
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";

      // Fetch products
      const productsRes = await axios.get(`${base}/api/product/my-products`, {
        headers: { token }
      });
      setProducts(productsRes.data.products || []);

      // Fetch orders for this seller
      await refreshOrders();

      // Fetch profile data
      fetchProfileData();

      alert("Data refreshed successfully!");
    } catch (err) {
      console.error("Error refreshing data:", err);
      alert("Failed to refresh data. Please try again.");
    }
  };

  // Fetch seller profile data
  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      setProfileError("");
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";

      const res = await axios.get(`${base}/api/user/me`, {
        headers: { token }
      });

      if (res.data && res.data.user) {
        setProfileData(res.data.user);
        setProfileFormData(res.data.user);

        // Force a re-render by updating a dummy state
        setProfileLoading(prev => !prev);
        setProfileLoading(prev => !prev);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      // More detailed error message
      const errorMessage = err.response?.data?.message || err.message || "Failed to load profile data. Please try again later.";
      setProfileError(errorMessage);
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  // Handle profile icon click
  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Handle profile form input change
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData({ ...profileFormData, [name]: value });
  };

  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    console.log('Selected profile picture file:', file);
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
        console.log('Profile picture preview set');
      };
      reader.readAsDataURL(file);
      console.log('Profile picture file state set');
    } else {
      console.log('No file selected');
    }
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    try {
      setProfileLoading(true);
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";

      // First, get the current user's ID
      const meRes = await axios.get(`${base}/api/user/me`, {
        headers: { token }
      });

      const userId = meRes.data.user._id;

      // Prepare form data for profile update
      const formData = new FormData();
      formData.append('name', profileFormData.name || '');
      formData.append('email', profileFormData.email || '');
      formData.append('phone', profileFormData.phone || '');
      formData.append('address', profileFormData.address || '');
      formData.append('houseNumber', profileFormData.houseNumber || '');
      formData.append('wardNumber', profileFormData.wardNumber || '');

      // Debug: Log profile picture file
      console.log('Profile picture file:', profilePictureFile);

      // Append profile picture if a new one was selected
      if (profilePictureFile) {
        console.log('Appending profile picture to form data');
        formData.append('profilePicture', profilePictureFile);
      } else {
        console.log('No profile picture file to append');
      }

      // Debug: Log FormData contents
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      // Debug: Log request details
      console.log('Sending profile update request to:', `${base}/api/user/profile/${userId}`);

      // Update profile with profile picture
      const updateRes = await axios.put(`${base}/api/user/profile/${userId}`, formData, {
        headers: {
          'token': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Debug: Log the response to see what we're getting
      console.log('Profile update response:', updateRes.data);

      // Update local profile data
      if (updateRes.data && updateRes.data.user) {
        setProfileData(updateRes.data.user);
        setProfileFormData(updateRes.data.user);
      }
      // Show success message
      alert("Profile updated successfully!");

      // Refresh profile data immediately
      await fetchProfileData();

      // Small delay to ensure DOM updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Close the modal and reset states after data is updated
      setEditingProfile(false);
      setProfilePictureFile(null);
      setProfilePicturePreview(null);

      // Trigger a re-render of the main dashboard
      setActiveTab(prev => prev);

      // Debug: Log the updated profile data
      console.log('Updated profile data:', profileData);
    } catch (err) {
      console.error("Error updating profile:", err);
      // More detailed error message
      const errorMessage = err.response?.data?.message || err.message || "Failed to update profile. Please try again.";
      console.error("Profile update error details:", {
        message: errorMessage,
        status: err.response?.status,
        data: err.response?.data,
        requestUrl: err.config?.url,
        requestBody: err.config?.data
      });
      alert(`Failed to update profile: ${errorMessage}`);
    } finally {
      setProfileLoading(false);
    }
  };



  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm({
      ...productForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle multiple image uploads
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setProductForm({ ...productForm, images: files });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      // Core fields
      formData.append("name", productForm.name || "");
      formData.append("description", productForm.description || "");
      formData.append("price", productForm.price || 0);
      formData.append("stock", productForm.stock || 0);
      formData.append("category", productForm.category || "");

      // Additional fields (ensure exact case match with backend)
      formData.append("wasteType", productForm.wasteType || "");
      formData.append("wasteQuantity", productForm.wasteQuantity || 0);
      formData.append("productOutputQuantity", productForm.productOutputQuantity || 0);
      formData.append("unit", productForm.unit || "pieces");
      formData.append("ecoPointsEligibility", productForm.ecoPointsEligibility || "No");
      formData.append("ecoCertification", productForm.ecoCertification || "None");

      // If we are editing, we might want to preserve status, but usually backend handles it or it's separate
      // formData.append("status", productForm.status || "active");

      // Append multiple images
      if (productForm.images && productForm.images.length > 0) {
        Array.from(productForm.images).forEach((file) => {
          formData.append("images", file);
        });
      }

      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";
      console.log('Submitting product to:', base);

      if (editingProduct) {
        // Update existing product
        console.log('Updating product:', editingProduct._id);
        const res = await axios.put(`${base}/api/product/${editingProduct._id}`, formData, {
          headers: {
            token,
            "Content-Type": "multipart/form-data"
          }
        });
        console.log('Update response:', res.data);
      } else {
        // Create new product
        console.log('Creating new product');
        const res = await axios.post(`${base}/api/product/create`, formData, {
          headers: {
            token,
            "Content-Type": "multipart/form-data"
          }
        });
        console.log('Create response:', res.data);
      }

      // Reset form and refresh products
      setShowAddProductForm(false);
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: "",
        stock: "",
        category: "",
        wasteType: "",
        wasteQuantity: "",
        productOutputQuantity: "",
        unit: "pieces",
        ecoPointsEligibility: "No",
        ecoCertification: "None",
        images: []
      });

      // Refresh products
      const res = await axios.get(`${base}/api/product/my-products`, {
        headers: { token }
      });
      setProducts(res.data.products || []);
      alert("Product saved successfully!");

    } catch (err) {
      console.error("Error saving product:", err);
      // Enhanced error logging
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
        alert(`Failed to save product: ${err.response.data.message || err.message}`);
      } else {
        alert(`Failed to save product: ${err.message}`);
      }
    }
  };

  // Handle delete product
  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const token = localStorage.getItem("token");
        const base = process.env.REACT_APP_API_URL || "http://localhost:4321";

        await axios.delete(`${base}/api/product/${productId}`, {
          headers: { token }
        });

        // Refresh products
        const res = await axios.get(`${base}/api/product/my-products`, {
          headers: { token }
        });
        setProducts(res.data.products || []);

      } catch (err) {
        console.error("Error deleting product:", err);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  // Handle order status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";

      const res = await axios.put(`${base}/api/orders/update-status/${orderId}`,
        { status: newStatus },
        { headers: { token } }
      );

      // Refresh orders to reflect the change
      await refreshOrders();
      alert(res.data.message);
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update order status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const base = process.env.REACT_APP_API_URL || "http://localhost:4321";
    // If the image path is already a full URL, return it as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Normalize the path - ensure it starts with '/' and uses forward slashes
    let normalizedPath = imagePath;
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
    // Replace backslashes with forward slashes
    normalizedPath = normalizedPath.replace(/\\/g, '/');
    // Otherwise, prepend the base URL
    const fullUrl = `${base}${normalizedPath}`;
    return fullUrl;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans text-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-green-600 to-teal-500 p-2 rounded-lg text-white shadow-lg shadow-green-200">
                <FaStore className="text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">Seller Dashboard</h1>
                <p className="text-xs text-gray-500 font-medium">Manage your eco-friendly business</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setShowMessagesModal(true);
                  fetchConversations();
                }}
                className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 relative"
                title="Messages"
              >
                <FaComments className="text-xl" />
                {/* Optional: Add badge for unread messages here */}
              </button>

              <button
                onClick={handleProfileClick}
                className="group p-1 rounded-full hover:bg-gray-100 transition-all duration-200 relative ring-2 ring-transparent hover:ring-green-100"
                title="View Profile"
              >
                {profileData && profileData.profilePicture ? (
                  <img
                    src={getImageUrl(profileData.profilePicture)}
                    alt={profileData.name}
                    className="w-10 h-10 rounded-full object-cover shadow-md group-hover:shadow-lg transition-transform group-hover:scale-105"
                    style={{ display: 'block' }}
                    onError={(e) => {
                      console.error('Profile image failed to load:', e.target.src);
                      console.error('Profile picture data:', profileData.profilePicture);
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 group-hover:text-green-600 group-hover:bg-green-50 transition-colors">
                    <FaUser className="text-lg" />
                  </div>
                )}
              </button>

              <div className="h-8 w-px bg-gray-200 mx-2"></div>

              <button
                onClick={refreshAllData}
                className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow active:scale-95"
              >
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl transition-all duration-200 text-sm font-semibold active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Products</p>
                <h3 className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{products.length}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <FaBox className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Active Products</p>
                <h3 className="text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                  {products.filter(p => p.status === "active").length}
                </h3>
              </div>
              <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
                <FaStore className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
                <h3 className="text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{orders.length}</h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                <FaShoppingCart className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Customers</p>
                <h3 className="text-3xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">{customers.length}</h3>
              </div>
              <div className="p-3 bg-yellow-50 rounded-xl group-hover:bg-yellow-100 transition-colors">
                <FaUsers className="text-yellow-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {/* Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-8 sticky top-24 z-20 backdrop-blur-sm bg-white/90">
          <nav className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            {['products', 'orders', 'customers', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2.5 px-6 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === tab
                  ? "bg-white text-green-700 shadow-md ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">My Products</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your inventory and product listings</p>
              </div>
              <button
                onClick={() => {
                  setShowAddProductForm(true);
                  setEditingProduct(null);
                  setProductForm({
                    name: "",
                    description: "",
                    price: "",
                    stock: "",
                    category: "",
                    image: null
                  });
                }}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-200 transition-all duration-200 font-semibold active:scale-95"
              >
                <FaPlus className="mr-2" />
                Add Product
              </button>
            </div>

            {/* Products Table */}
            {products.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Stock
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {products.map((product) => (
                        <tr key={product._id} className="hover:bg-green-50/30 transition-colors duration-150 group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 relative">
                                {product.image ? (
                                  <img
                                    src={getImageUrl(product.image)}
                                    alt={product.name}
                                    className="h-12 w-12 rounded-xl object-cover shadow-sm group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "https://placehold.co/48x48?text=No+Image";
                                    }}
                                  />
                                ) : (
                                  <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 shadow-inner">
                                    <FaImage />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">{product.name}</div>
                                <div className="text-xs text-gray-500 line-clamp-1 max-w-xs mt-0.5">{product.description || "No description"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {product.category || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900 font-mono">₹{product.price}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{product.stock} units</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${product.status === "active"
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-red-50 text-red-700 border-red-100"
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-2 mt-1.5 ${product.status === "active" ? "bg-green-500" : "bg-red-500"}`}></span>
                              {product.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                  setProductForm({
                                    name: product.name,
                                    description: product.description || "",
                                    price: product.price.toString(),
                                    stock: product.stock.toString(),
                                    category: product.category || "",
                                    image: null
                                  });
                                  setShowAddProductForm(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(product._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                <div className="mx-auto h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <FaBox className="text-gray-300 text-4xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No products yet</h3>
                <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                  Get started by creating your first product listing to start selling.
                </p>
                <div className="mt-8">
                  <button
                    onClick={() => {
                      setShowAddProductForm(true);
                      setEditingProduct(null);
                      setProductForm({
                        name: "",
                        description: "",
                        price: "",
                        stock: "",
                        category: "",
                        image: null
                      });
                    }}
                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-200 transition-all font-semibold"
                  >
                    <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                    Add Product
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Order Management</h2>
                <p className="text-sm text-gray-500 mt-1">Track and manage customer orders</p>
              </div>
              <button
                onClick={refreshOrders}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 shadow-sm text-sm font-semibold rounded-xl text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-all duration-200"
              >
                Refresh Orders
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setOrderFilter("new")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${orderFilter === "new"
                  ? "bg-green-600 text-white shadow-lg shadow-green-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
              >
                New Orders
              </button>
              <button
                onClick={() => setOrderFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${orderFilter === "all"
                  ? "bg-green-600 text-white shadow-lg shadow-green-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
              >
                All Orders
              </button>
              <button
                onClick={() => setOrderFilter("completed")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${orderFilter === "completed"
                  ? "bg-green-600 text-white shadow-lg shadow-green-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
              >
                Completed
              </button>
            </div>


            {orders.filter(order =>
              orderFilter === "all" ||
              (orderFilter === "new" && (order.status === "pending" || order.status === "confirmed")) ||
              (orderFilter === "completed" && (order.status === "delivered" || order.status === "Delivered" || order.status === "completed" || (order.deliveryStatus && (order.deliveryStatus === 'delivered' || order.deliveryStatus === 'Delivered'))))
            ).length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Item
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Delivery
                        </th>
                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {orders
                        .filter(order =>
                          orderFilter === "all" ||
                          (orderFilter === "new" && (order.status === "pending" || order.status === "confirmed")) ||
                          (orderFilter === "completed" && (order.status === "delivered" || order.status === "Delivered" || order.status === "completed" || (order.deliveryStatus && (order.deliveryStatus === 'delivered' || order.deliveryStatus === 'Delivered'))))
                        )
                        .map((order) => (
                          <tr key={order._id} className="hover:bg-green-50/30 transition-colors duration-150 group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 relative">
                                  {order.items && order.items[0] && order.items[0].productId && order.items[0].productId.image ? (
                                    <img
                                      src={getImageUrl(order.items[0].productId.image)}
                                      alt={order.items[0].productId.name}
                                      className="h-10 w-10 rounded-lg object-cover shadow-sm"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://placehold.co/40x40?text=No+Image";
                                      }}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                      <FaImage />
                                    </div>
                                  )}
                                  {order.items && order.items.length > 1 && (
                                    <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                                      +{order.items.length - 1}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">
                              #{order._id.substring(0, 8)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{order.userId ? order.userId.name : 'Unknown'}</div>
                              <div className="text-xs text-gray-500">{order.userId ? order.userId.email : ''}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                              {formatCurrency(order.totalAmount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${order.status === "delivered" || order.status === "Delivered"
                                ? "bg-green-50 text-green-700 border-green-100"
                                : order.status === "confirmed"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                                  : order.status === "shipped"
                                    ? "bg-blue-50 text-blue-700 border-blue-100"
                                    : order.status === "ready"
                                      ? "bg-orange-50 text-orange-700 border-orange-100"
                                      : order.status === "assigned"
                                        ? "bg-purple-50 text-purple-700 border-purple-100"
                                        : order.status === "cancelled"
                                          ? "bg-red-50 text-red-700 border-red-100"
                                          : "bg-gray-50 text-gray-700 border-gray-100"
                                }`}>
                                {order.status || 'pending'}
                              </span>

                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">
                                {order.deliveryBoyId ? order.deliveryBoyId.name : <span className="text-gray-400 italic">Unassigned</span>}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {
                                  (order.status === 'delivered' || order.status === 'Delivered' || order.status === 'completed') ? 'Delivered' :
                                    order.status === 'in-transit' ? 'In Transit' :
                                      (order.deliveryStatus && order.deliveryStatus !== 'pending') ? order.deliveryStatus :
                                        order.deliveryBoyId ? 'Assigned' :
                                          'Pending'
                                }
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    // Show order details modal
                                    setSelectedOrder(order);
                                    setShowOrderDetailsModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-semibold"
                                  title={order.deliveryBoyId ? `Assigned to: ${order.deliveryBoyId.name}` : "View Details"}
                                >
                                  Details
                                </button>
                                {/* Ready for Delivery Button */}
                                {(order.status === 'pending' || order.status === 'confirmed') && (
                                  <button
                                    onClick={() => handleStatusUpdate(order._id, 'ready')}
                                    className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-semibold border border-transparent hover:border-green-200"
                                    title="Mark as Ready for Delivery"
                                  >
                                    Mark Ready
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                <div className="mx-auto h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <FaShoppingCart className="text-gray-300 text-4xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {orderFilter === "new" ? "No new orders" : "No orders found"}
                </h3>
                <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                  {orderFilter === "new"
                    ? "Great job! You've caught up with all your pending orders."
                    : "Orders will appear here once customers purchase your products."}
                </p>
              </div>
            )}
          </div>
        )
        }

        {/* Customers Tab */}
        {
          activeTab === "customers" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Management</h2>
                  <p className="text-sm text-gray-500 mt-1">View and manage your customer relationships</p>
                </div>
                <button
                  onClick={refreshOrders} // Refresh to get updated customer data
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 shadow-sm text-sm font-semibold rounded-xl text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-all duration-200"
                >
                  Refresh Customers
                </button>
              </div>

              {customers.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Customer
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Contact
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Total Orders
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Total Spent
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Last Order
                          </th>
                          <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {customers.map((customer) => (
                          <tr key={customer.id} className="hover:bg-green-50/30 transition-colors duration-150 group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-green-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                  {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-bold text-gray-900">{customer.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{customer.email}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{customer.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {customer.totalOrders} orders
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900 font-mono">{formatCurrency(customer.totalSpent)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{new Date(customer.lastOrderDate).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    // Show customer details modal
                                    setSelectedCustomer(customer);
                                    setShowCustomerDetailsModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-semibold"
                                >
                                  Profile
                                </button>
                                <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                  <FaUser />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                  <div className="mx-auto h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <FaUsers className="text-gray-300 text-4xl" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No customers yet</h3>
                  <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                    Your customers will appear here once they start purchasing your products.
                  </p>
                </div>
              )}
            </div>
          )
        }

        {/* Analytics Tab */}
        {
          activeTab === "analytics" && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Sales Analytics</h2>

              {/* Analytics Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="text-sm text-blue-800 font-medium">Total Revenue</div>
                  <div className="text-2xl font-bold text-blue-900">{formatCurrency(orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0))}</div>
                  <div className="text-xs text-blue-600 mt-1">from {orders.length} orders</div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="text-sm text-green-800 font-medium">Total Orders</div>
                  <div className="text-2xl font-bold text-green-900">{orders.length}</div>
                  <div className="text-xs text-green-600 mt-1">lifetime</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <div className="text-sm text-purple-800 font-medium">Total Customers</div>
                  <div className="text-2xl font-bold text-purple-900">{customers.length}</div>
                  <div className="text-xs text-purple-600 mt-1">unique buyers</div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <div className="text-sm text-yellow-800 font-medium">Avg. Order Value</div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {formatCurrency(orders.length > 0 ? orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length : 0)}
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">per order</div>
                </div>
              </div>

              {/* Monthly Sales Chart Placeholder */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Sales Trend</h3>
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <FaChartBar className="mx-auto text-gray-400 text-4xl mb-2" />
                    <p className="text-gray-600">Sales trend visualization</p>
                    <p className="text-sm text-gray-500 mt-1">Based on your orders data</p>
                  </div>
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {products.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Product</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Category</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Price</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Stock</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {products.slice(0, 5).map((product) => (
                            <tr key={product._id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8">
                                    {product.image ? (
                                      <img
                                        src={getImageUrl(product.image)}
                                        alt={product.name}
                                        className="h-8 w-8 rounded-md object-cover"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = "https://placehold.co/32x32?text=No+Image";
                                        }}
                                      />
                                    ) : (
                                      <div className="h-8 w-8 bg-gray-200 rounded-md flex items-center justify-center">
                                        <FaImage className="text-gray-400 text-sm" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{product.category || "Uncategorized"}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{formatCurrency(product.price)}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{product.stock}</td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                  }`}>
                                  {product.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">No products available</div>
                  )}
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {orders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Order ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Customer</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orders.slice(0, 5).map((order) => (
                            <tr key={order._id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{order._id?.substring(0, 8)}...</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{order.userId?.name || 'N/A'}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{formatCurrency(order.totalAmount)}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === "delivered"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "confirmed"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : order.status === "shipped"
                                      ? "bg-blue-100 text-blue-800"
                                      : order.status === "cancelled"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                  }`}>
                                  {order.status || 'pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">No orders available</div>
                  )}
                </div>
              </div>
            </div>
          )
        }
      </main >

      {/* Add/Edit Product Modal */}
      {
        showAddProductForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      {editingProduct ? "Edit Product" : "Add New Product"}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Basic Info Section */}
                      <div className="border-b pb-4 mb-4">
                        <h4 className="text-md font-semibold text-green-700 mb-2">Product Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Product Name</label>
                            <input
                              type="text"
                              name="name"
                              value={productForm.name}
                              onChange={handleInputChange}
                              required
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Product Category</label>
                            <input
                              type="text"
                              name="category"
                              value={productForm.category}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700">Product Description</label>
                          <textarea
                            name="description"
                            value={productForm.description}
                            onChange={handleInputChange}
                            rows="3"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          ></textarea>
                        </div>
                      </div>

                      {/* Waste Configuration Section */}
                      <div className="border-b pb-4 mb-4">
                        <h4 className="text-md font-semibold text-green-700 mb-2">Waste & Output Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Waste Type Used</label>
                            <input
                              type="text"
                              name="wasteType"
                              value={productForm.wasteType}
                              onChange={handleInputChange}
                              placeholder="e.g. Plastic, Paper"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Waste Quantity Used (kg)</label>
                            <input
                              type="number"
                              name="wasteQuantity"
                              value={productForm.wasteQuantity}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Product Output Quantity</label>
                            <input
                              type="number"
                              name="productOutputQuantity"
                              value={productForm.productOutputQuantity}
                              onChange={handleInputChange}
                              min="0"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Unit</label>
                            <select
                              name="unit"
                              value={productForm.unit}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            >
                              <option value="pieces">Pieces</option>
                              <option value="kg">kg</option>
                              <option value="liters">Liters</option>
                              <option value="meters">Meters</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Stock Section */}
                      <div className="border-b pb-4 mb-4">
                        <h4 className="text-md font-semibold text-green-700 mb-2">Pricing & Inventory</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Price per unit (₹)</label>
                            <input
                              type="number"
                              name="price"
                              value={productForm.price}
                              onChange={handleInputChange}
                              required
                              min="0"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Available Stock</label>
                            <input
                              type="number"
                              name="stock"
                              value={productForm.stock}
                              onChange={handleInputChange}
                              required
                              min="0"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">EcoPoints Eligibility</label>
                            <select
                              name="ecoPointsEligibility"
                              value={productForm.ecoPointsEligibility}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            >
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Eco Certification Tag</label>
                            <select
                              name="ecoCertification"
                              value={productForm.ecoCertification}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            >
                              <option value="None">None</option>
                              <option value="Recycled">Recycled</option>
                              <option value="Organic">Organic</option>
                              <option value="Eco-Friendly">Eco-Friendly</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Media Section */}
                      <div>
                        <h4 className="text-md font-semibold text-green-700 mb-2">Upload Media</h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Product Images (2-5)</label>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                              <FaImage className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                                >
                                  <span>Upload files</span>
                                  <input id="file-upload" name="image" type="file" className="sr-only" onChange={handleImagesChange} multiple accept="image/*" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                              {productForm.images && productForm.images.length > 0 && (
                                <p className="text-sm text-green-600 mt-2">{productForm.images.length} file(s) selected</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddProductForm(false);
                            setEditingProduct(null);
                          }}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-3"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          {editingProduct ? "Update Product" : "Add Product"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Profile Modal */}
      {
        showProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FaTimes className="text-2xl" />
                  </button>
                </div>

                {profileLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : profileError ? (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FaExclamationTriangle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{profileError}</p>
                      </div>
                    </div>
                  </div>
                ) : profileData ? (
                  <div>
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative cursor-pointer group" onClick={() => setEditingProfile(true)}>
                        {(profileData && profileData.profilePicture) ? (
                          <img
                            src={getImageUrl(profileData.profilePicture)}
                            alt={profileData.name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-green-100 group-hover:border-green-300 transition-colors duration-200"
                            onError={(e) => {
                              console.error('Profile image failed to load:', e.target.src);
                              e.target.onerror = null;
                              e.target.src = "https://placehold.co/100x100?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center border-4 border-green-50 group-hover:border-green-300 transition-colors duration-200">
                            <FaUser className="text-green-600 text-3xl" />
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2 border-2 border-white group-hover:bg-green-600 transition-colors duration-200">
                          <FaCamera className="text-white text-sm" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                          <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">Click to edit</span>
                        </div>
                      </div>
                      <h3 className="mt-4 text-xl font-bold text-gray-900">{profileData.name}</h3>
                      <p className="text-gray-600">{profileData.email}</p>
                      <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {profileData.role}
                      </span>
                    </div>

                    {editingProfile ? (
                      <form>
                        <div className="space-y-4">
                          {/* Profile Picture Upload */}
                          <div className="flex flex-col items-center mb-6">
                            <div className="relative mb-4 group">
                              {profilePicturePreview || (profileFormData && profileFormData.profilePicture) ? (
                                <img
                                  src={profilePicturePreview || getImageUrl(profileFormData.profilePicture)}
                                  alt="Profile Preview"
                                  className="w-24 h-24 rounded-full object-cover border-4 border-green-100 group-hover:border-green-300 transition-colors duration-200"
                                />
                              ) : (
                                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center border-4 border-green-50 group-hover:border-green-300 transition-colors duration-200">
                                  <FaUser className="text-green-600 text-3xl" />
                                </div>
                              )}
                              {profilePictureFile && (
                                <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">New photo</span>
                                </div>
                              )}

                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 items-center">
                              <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition relative">
                                <FaCamera className="mr-2" />
                                Change Photo
                                <input
                                  type="file"
                                  name="profilePicture"
                                  accept="image/*"
                                  onChange={handleProfilePictureChange}
                                  className="hidden"
                                />
                                {profilePictureFile && (
                                  <span className="absolute -top-2 -right-2 flex h-5 w-5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500 text-white text-xs items-center justify-center">✓</span>
                                  </span>
                                )}
                              </label>
                              {profilePictureFile && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProfilePictureFile(null);
                                    setProfilePicturePreview(null);
                                  }}
                                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                  <FaTimes className="mr-1" /> Cancel
                                </button>
                              )}
                            </div>
                          </div>
                          {/* Profile Form Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                              <input
                                type="text"
                                name="name"
                                id="name"
                                value={profileFormData.name}
                                onChange={handleProfileInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                              <input
                                type="text"
                                name="username"
                                id="username"
                                value={profileFormData.username}
                                onChange={handleProfileInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                              <input
                                type="email"
                                name="email"
                                id="email"
                                value={profileFormData.email}
                                onChange={handleProfileInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                              <input
                                type="text"
                                name="phone"
                                id="phone"
                                value={profileFormData.phone}
                                onChange={handleProfileInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                            <input
                              type="text"
                              name="address"
                              id="address"
                              value={profileFormData.address}
                              onChange={handleProfileInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700">House Number</label>
                              <input
                                type="text"
                                name="houseNumber"
                                id="houseNumber"
                                value={profileFormData.houseNumber}
                                onChange={handleProfileInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label htmlFor="wardNumber" className="block text-sm font-medium text-gray-700">Ward Number</label>
                              <input
                                type="text"
                                name="wardNumber"
                                id="wardNumber"
                                value={profileFormData.wardNumber}
                                onChange={handleProfileInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setEditingProfile(false)}
                              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveProfile}
                              disabled={profileLoading}
                              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              {profileLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-500">Name</h4>
                            <p className="mt-1 text-sm text-gray-900">{profileData.name}</p>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-500">Username</h4>
                            <p className="mt-1 text-sm text-gray-900">{profileData.username}</p>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                            <p className="mt-1 text-sm text-gray-900">{profileData.phone}</p>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-500">Eco Points</h4>
                            <p className="mt-1 text-sm text-gray-900">{profileData.ecoPoints || 0} points</p>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-500">Address</h4>
                          <p className="mt-1 text-sm text-gray-900">{profileData.address}</p>
                        </div>

                        {(profileData.houseNumber || profileData.wardNumber) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profileData.houseNumber && (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500">House Number</h4>
                                <p className="mt-1 text-sm text-gray-900">{profileData.houseNumber}</p>
                              </div>
                            )}

                            {profileData.wardNumber && (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500">Ward Number</h4>
                                <p className="mt-1 text-sm text-gray-900">{profileData.wardNumber}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-end pt-4">
                          <button
                            onClick={() => setEditingProfile(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <FaEdit className="mr-2" />
                            Edit Profile
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )
      }

      {/* Order Details Modal */}
      {
        showOrderDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                  <button
                    onClick={() => setShowOrderDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FaTimes className="text-2xl" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order ID:</span>
                        <span className="font-medium">{selectedOrder._id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Boy:</span>
                        <span className="font-medium">{selectedOrder.deliveryBoyId ? selectedOrder.deliveryBoyId.name : 'Not Assigned'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${selectedOrder.status === "delivered" || selectedOrder.status === "completed"
                          ? "text-green-600"
                          : selectedOrder.status === "confirmed"
                            ? "text-yellow-600"
                            : selectedOrder.status === "shipped"
                              ? "text-blue-600"
                              : selectedOrder.status === "cancelled"
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}>
                          {selectedOrder.status || 'pending'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium">{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium">{selectedOrder.paymentMethod || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <span className="font-medium text-green-600">{selectedOrder.paymentStatus || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-medium">{selectedOrder.transactionId || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Address</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{selectedOrder.userId?.name || 'N/A'}</p>
                      <p>{selectedOrder.shippingAddress?.address || selectedOrder.userId?.address || 'N/A'}</p>
                      <p>{selectedOrder.shippingAddress?.city || selectedOrder.userId?.city || 'N/A'}, {selectedOrder.shippingAddress?.state || selectedOrder.userId?.state || 'N/A'} {selectedOrder.shippingAddress?.zipCode || selectedOrder.userId?.zipCode || 'N/A'}</p>
                      <p>Phone: {selectedOrder.userId?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Delivery Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Status:</span>
                        <span className="font-medium">
                          {
                            (selectedOrder.status === 'delivered' || selectedOrder.status === 'Delivered' || selectedOrder.status === 'completed') ? 'Delivered' :
                              (selectedOrder.deliveryStatus && selectedOrder.deliveryStatus !== 'pending') ? selectedOrder.deliveryStatus :
                                selectedOrder.deliveryBoyId ? 'Assigned' :
                                  'Pending'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Boy:</span>
                        <span className="font-medium">{selectedOrder.deliveryBoyId ? selectedOrder.deliveryBoyId.name : 'Not Assigned'}</span>
                      </div>
                      {selectedOrder.deliveryBoyId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contact:</span>
                          <span className="font-medium">{selectedOrder.deliveryBoyId.phone || 'N/A'}</span>
                        </div>
                      )}
                      {selectedOrder.status === 'delivered' && selectedOrder.updatedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivered At:</span>
                          <span className="font-medium">{new Date(selectedOrder.updatedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items && selectedOrder.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {item.productId?.image ? (
                                    <img
                                      src={getImageUrl(item.productId.image)}
                                      alt={item.productId.name}
                                      className="h-10 w-10 rounded-md object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://placehold.co/40x40?text=No+Image";
                                      }}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                                      <FaImage className="text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{item.productId?.name || item.name}</div>
                                  <div className="text-sm text-gray-500">SKU: {item.productId?.sku || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(item.price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowOrderDetailsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Customer Details Modal */}
      {
        showCustomerDetailsModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
                  <button
                    onClick={() => setShowCustomerDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FaTimes className="text-2xl" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedCustomer.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedCustomer.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedCustomer.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Orders:</span>
                        <span className="font-medium">{selectedCustomer.totalOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Spent:</span>
                        <span className="font-medium">{formatCurrency(selectedCustomer.totalSpent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Order:</span>
                        <span className="font-medium">{new Date(selectedCustomer.lastOrderDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Address</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-gray-900 font-medium">{selectedCustomer.address || 'Address not available'}</p>
                      {selectedCustomer.houseNumber && <p className="text-gray-600 text-sm">House No: {selectedCustomer.houseNumber}</p>}
                      {selectedCustomer.wardNumber && <p className="text-gray-600 text-sm">Ward No: {selectedCustomer.wardNumber}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowCustomerDetailsModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      {/* Messages Modal */}
      {showMessagesModal && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl flex overflow-hidden">
            {/* Sidebar: Conversations List */}
            <div className={`w-full md:w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                <h3 className="font-bold text-gray-800">Messages</h3>
                <button onClick={() => setShowMessagesModal(false)} className="md:hidden text-gray-500">
                  <FaTimes />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center p-4 text-gray-500 text-sm">No active conversations</div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.order._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-3 rounded-xl cursor-pointer transition-colors ${selectedConversation?.order._id === conv.order._id ? 'bg-blue-100 border-blue-200' : 'bg-white hover:bg-gray-100 border border-transparent'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold shrink-0">
                          {conv.otherUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-semibold text-gray-900 truncate">{conv.otherUser.name}</h4>
                          <p className="text-xs text-gray-500 truncate">Order #{conv.order._id.slice(-6).toUpperCase()}</p>
                          {conv.lastMessage && (
                            <p className="text-xs text-gray-400 truncate mt-1">{conv.lastMessage.text}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main: Chat Window */}
            <div className={`w-full md:w-2/3 flex flex-col bg-white ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm z-10">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedConversation(null)} className="md:hidden p-2 -ml-2 text-gray-600">
                        <FaArrowLeft className="text-lg" />
                      </button>
                      <div>
                        <h3 className="font-bold text-gray-800">{selectedConversation.otherUser.name}</h3>
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          Order #{selectedConversation.order._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setShowMessagesModal(false)} className="text-gray-400 hover:text-red-500 p-2">
                      <FaTimes className="text-xl" />
                    </button>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {chatMessages.length === 0 ? (
                      <div className="text-center my-auto text-gray-400">No messages yet. Start the conversation!</div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender._id === profileData?._id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${msg.sender._id === profileData?._id
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                            }`}>
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-[10px] mt-1 text-right ${msg.sender._id === profileData?._id ? 'text-blue-100' : 'text-gray-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendSellerMessage();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!messageText.trim()}
                        className="bg-blue-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="text-lg">➤</span>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/30">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FaComments className="text-4xl text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a conversation</h3>
                  <p>Choose a chat from the left to view messages</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;