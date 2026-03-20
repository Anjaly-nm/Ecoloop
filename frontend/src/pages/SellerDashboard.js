import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaPlus, FaEdit, FaTrash, FaImage, FaBox, FaStore, FaChartBar, 
  FaShoppingCart, FaUsers, FaUser, FaTimes, FaCamera, 
  FaExclamationTriangle, FaComments, FaArrowLeft, FaShoppingBag, 
  FaCalendarAlt, FaRecycle, FaIndustry, FaGlobe, FaChartLine, 
  FaBell, FaClock, FaLeaf, FaGem, FaTrophy, FaArrowUp, 
  FaArrowDown 
} from "react-icons/fa";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Recycling Data State
  const [recyclingData, setRecyclingData] = useState([]);
  const [showRecyclingForm, setShowRecyclingForm] = useState(false);
  const [editingRecycling, setEditingRecycling] = useState(null);
  const [recyclingForm, setRecyclingForm] = useState({
    month: "",
    totalWasteCollected: "",
    wasteBreakdown: [{ wasteType: "", quantity: "" }],
    recycledProducts: [{ itemName: "", quantity: "" }]
  });
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
        
        // Fetch recycling data
        fetchRecyclingData();

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, extractCustomersFromOrders]);

  const fetchRecyclingData = async () => {
    try {
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";
      const res = await axios.get(`${base}/api/recycling/my-data`, { headers: { token } });
      setRecyclingData(res.data.data || []);
    } catch (err) {
      console.error("Error fetching recycling data:", err);
    }
  };

  const handleRecyclingInputChange = (e) => {
    const { name, value } = e.target;
    // Basic validation: month is text, others are numbers
    if (name !== 'month') {
      if (value !== "" && isNaN(value)) return;
    }
    setRecyclingForm({ ...recyclingForm, [name]: value });
  };

  const handleRecyclingSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";

      // Validation
      if (!recyclingForm.month) return alert("Please select a month");
      if (!recyclingForm.totalWasteCollected || isNaN(recyclingForm.totalWasteCollected)) return alert("Please enter a valid total waste collected amount");

      const payload = {
        month: recyclingForm.month,
        totalWasteCollected: Number(recyclingForm.totalWasteCollected),
        wasteBreakdown: recyclingForm.wasteBreakdown
          .filter(wb => wb.wasteType && wb.wasteType.trim() !== "")
          .map(wb => ({
            wasteType: wb.wasteType,
            quantity: Number(wb.quantity) || 0
          })),
        recycledProducts: recyclingForm.recycledProducts
          .filter(p => p.itemName && p.itemName.trim() !== "")
          .map(p => ({
            itemName: p.itemName,
            quantity: Number(p.quantity) || 0
          }))
      };

      if (editingRecycling) {
        await axios.put(`${base}/api/recycling/update/${editingRecycling._id}`, payload, { headers: { token } });
        alert("Recycling data updated successfully!");
      } else {
        await axios.post(`${base}/api/recycling/add`, payload, { headers: { token } });
        alert("Recycling data added successfully!");
      }

      setShowRecyclingForm(false);
      setEditingRecycling(null);
      setRecyclingForm({
        month: "",
        totalWasteCollected: "",
        wasteBreakdown: [{ wasteType: "", quantity: "" }],
        recycledProducts: [{ itemName: "", quantity: "" }]
      });
      fetchRecyclingData();
    } catch (err) {
      console.error("Error saving recycling data:", err);
      alert("Failed to save data");
    }
  };

  const handleEditRecycling = (item) => {
    setEditingRecycling(item);
    setRecyclingForm({
      month: item.month,
      totalWasteCollected: item.totalWasteCollected.toString(),
      wasteBreakdown: item.wasteBreakdown?.length > 0
        ? item.wasteBreakdown.map(wb => ({ wasteType: wb.wasteType, quantity: wb.quantity.toString() }))
        : [{ wasteType: "", quantity: "" }],
      recycledProducts: item.recycledProducts?.length > 0
        ? item.recycledProducts.map(p => ({ itemName: p.itemName, quantity: p.quantity.toString() }))
        : [{ itemName: "", quantity: "" }]
    });
    setShowRecyclingForm(true);
  };

  const addWasteBreakdown = () => {
    setRecyclingForm({
      ...recyclingForm,
      wasteBreakdown: [...recyclingForm.wasteBreakdown, { wasteType: "", quantity: "" }]
    });
  };

  const updateWasteBreakdown = (idx, field, value) => {
    if (field === 'quantity' && value !== "" && isNaN(value)) return;
    const newBreakdown = [...recyclingForm.wasteBreakdown];
    newBreakdown[idx] = { ...newBreakdown[idx], [field]: value };
    setRecyclingForm({ ...recyclingForm, wasteBreakdown: newBreakdown });
  };

  const removeWasteBreakdown = (idx) => {
    const newBreakdown = [...recyclingForm.wasteBreakdown];
    newBreakdown.splice(idx, 1);
    setRecyclingForm({ ...recyclingForm, wasteBreakdown: newBreakdown });
  };

  const addRecycledProduct = () => {
    setRecyclingForm({
      ...recyclingForm,
      recycledProducts: [...recyclingForm.recycledProducts, { itemName: "", quantity: "" }]
    });
  };

  const updateRecycledProduct = (idx, field, value) => {
    if (field === 'quantity' && value !== "" && isNaN(value)) return;
    const newProds = [...recyclingForm.recycledProducts];
    newProds[idx] = { ...newProds[idx], [field]: value };
    setRecyclingForm({ ...recyclingForm, recycledProducts: newProds });
  };

  const removeRecycledProduct = (idx) => {
    const newProds = [...recyclingForm.recycledProducts];
    newProds.splice(idx, 1);
    setRecyclingForm({ ...recyclingForm, recycledProducts: newProds });
  };

  const handleDeleteRecycling = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";
      await axios.delete(`${base}/api/recycling/delete/${id}`, { headers: { token } });
      alert("Entry deleted successfully!");
      fetchRecyclingData();
    } catch (err) {
      console.error("Error deleting recycling data:", err);
    }
  };

  const calculateTotalStock = () => {
    const stockMap = {};
    recyclingData.forEach(entry => {
      entry.recycledProducts?.forEach(prod => {
        if (prod.itemName && prod.itemName.trim() !== "") {
          stockMap[prod.itemName] = (stockMap[prod.itemName] || 0) + (prod.quantity || 0);
        }
      });
    });
    return stockMap;
  };

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

  // Handle edit product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || "",
      wasteType: product.wasteType || "",
      wasteQuantity: product.wasteQuantity || "",
      productOutputQuantity: product.productOutputQuantity || "",
      unit: product.unit || "pieces",
      ecoPointsEligibility: product.ecoPointsEligibility || "No",
      ecoCertification: product.ecoCertification || "None",
      images: [] // Reset images for update unless user picks new ones
    });
    setShowAddProductForm(true);
  };

  // Handle delete product
  const handleDeleteProduct = async (productId) => {
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
        alert("Product deleted successfully!");

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
    <div className="flex min-h-screen bg-[#F9FAFB] font-sans text-gray-800 antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col fixed inset-y-0 z-40">
        <div className="p-6 border-b border-gray-50 bg-gradient-to-br from-green-50/30 to-white">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-green-600 to-teal-500 p-2.5 rounded-2xl text-white shadow-xl shadow-green-100 ring-4 ring-green-50">
              <FaStore className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight leading-tight">EcoLoop</h1>
              <p className="text-[10px] text-green-600 font-black uppercase tracking-[0.2em]">Seller Hub</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto pt-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
            { id: 'products', label: 'Inventory', icon: FaBox },
            { id: 'orders', label: 'Orders', icon: FaShoppingCart },
            { id: 'recycling', label: 'Recycling', icon: FaRecycle },
            { id: 'analytics', label: 'Insights', icon: FaChartBar },
            { id: 'customers', label: 'Customers', icon: FaUsers },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                ? "bg-green-600 text-white shadow-lg shadow-green-200" 
                : "text-gray-500 hover:bg-gray-50 hover:text-green-600 hover:pl-5"
              }`}
            >
              <item.icon className={`text-lg transition-transform duration-300 ${activeTab === item.id ? "scale-110" : "group-hover:scale-110"}`} />
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
              {activeTab === item.id && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-inner animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-50">

          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm group"
          >
            <FaArrowLeft className="text-lg group-hover:-translate-x-1 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 px-8 flex justify-between items-center transition-all">
          <div className="flex flex-col">
            <h2 className="text-gray-900 font-black text-xl tracking-tight capitalize">{activeTab.replace("-", " ")}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
              Welcome back, {profileData?.name || 'Seller'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4">
              <button 
                onClick={refreshAllData}
                className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-green-50 hover:text-green-600 transition-all border border-transparent hover:border-green-100"
                title="Refresh Analytics"
              >
                <FaChartLine className="text-lg" />
              </button>
              <button 
                onClick={() => { setShowMessagesModal(true); fetchConversations(); }}
                className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100 relative"
                title="Messages"
              >
                <FaComments className="text-lg" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-1 ring-red-400" />
              </button>
              <button className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-yellow-50 hover:text-yellow-600 transition-all border border-transparent hover:border-yellow-100 relative" title="Notifications">
                <FaBell className="text-lg" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full border-2 border-white" />
              </button>
            </div>

            <div className="h-8 w-px bg-gray-100 mx-2" />

            <button
              onClick={handleProfileClick}
              className="group flex items-center gap-3 p-1.5 pl-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-green-100 hover:bg-green-50 transition-all"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-gray-900 leading-none">{profileData?.name || 'Account'}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{profileData?.ecoPoints || '0'} Points</p>
              </div>
              <div className="relative">
                {profileData?.profilePicture ? (
                  <img
                    src={getImageUrl(profileData.profilePicture)}
                    alt="Profile"
                    className="w-10 h-10 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-green-600 shadow-sm border border-green-50">
                    <FaUser className="text-lg" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
              </div>
            </button>
          </div>
        </header>

        {/* Content Section */}
        <main className="flex-1 p-8 space-y-10 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">


              {/* Stats Cards Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { label: "Total Revenue", value: formatCurrency(orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0)), trend: "+12.4%", up: true, icon: FaGem, color: "blue", bg: "bg-blue-500" },
                  { label: "Active Orders", value: orders.filter(o => ['pending', 'confirmed', 'ready', 'assigned', 'shipped', 'in-transit', 'processing'].includes(o.status?.toLowerCase())).length, trend: "Pending Processing", up: true, icon: FaClock, color: "teal", bg: "bg-teal-500" },
                  { label: "Total Waste Processed", value: `${recyclingData.reduce((acc, curr) => acc + (curr.totalWasteCollected || 0), 0)} Kg`, trend: "+28%", up: true, icon: FaRecycle, color: "green", bg: "bg-green-500" },
                  { label: "Customer Rating", value: "4.9/5", trend: "from 118 reviews", up: true, icon: FaTrophy, color: "orange", bg: "bg-orange-500" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                    <div className="relative z-10">
                      <div className={`p-4 rounded-2xl ${stat.bg} text-white w-fit mb-6 shadow-lg transition-transform duration-500`}>
                        <stat.icon className="text-xl" />
                      </div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <h3 className="text-4xl font-black text-gray-900 tracking-tighter mb-2 group-hover:scale-105 transition-transform origin-left">{stat.value}</h3>
                      <div className="flex items-center gap-1.5 font-black text-[10px] tracking-wide">
                        <span className={stat.up ? "text-green-600" : "text-red-500"}>
                          {stat.up ? <FaArrowUp className="inline mb-1" /> : <FaArrowDown className="inline mb-1" />} {stat.trend}
                        </span>
                        <span className="text-gray-400">vs last month</span>
                      </div>
                    </div>
                    {/* Background blob */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full translate-x-10 -translate-y-10 group-hover:bg-green-50 transition-colors duration-500" />
                  </div>
                ))}
              </div>

              {/* Eco Impact Highlights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="space-y-8">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 tracking-tight">Eco Contribution Tracking</h4>
                        <p className="text-sm text-gray-500 mt-1">Environmental impact metrics calculated from your validated recycling logs.</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-green-100">
                        <FaLeaf className="text-xs" /> verified partner
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6">
                      <div className="p-6 rounded-[1.5rem] bg-gray-50/50 border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all group">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 group-hover:text-green-600">CO2 Reduced</p>
                         <h5 className="text-3xl font-black text-gray-900 tracking-tighter">845 <span className="text-xs font-bold text-gray-400">Kg</span></h5>
                      </div>
                      <div className="p-6 rounded-[1.5rem] bg-gray-50/50 border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all group">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 group-hover:text-green-600">Trees Saved</p>
                         <h5 className="text-3xl font-black text-gray-900 tracking-tighter">42 <span className="text-xs font-bold text-gray-400">units</span></h5>
                      </div>
                      <div className="p-6 rounded-[1.5rem] bg-gray-50/50 border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all group">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 group-hover:text-green-600">Impact Score</p>
                         <h5 className="text-3xl font-black text-gray-900 tracking-tighter">74 <span className="text-xs font-bold text-gray-400">%</span></h5>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-xl text-gray-900">Certification</h4>
                      <FaGlobe className="text-green-200 text-xl" />
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed font-medium">Earn 'Eco-Pioneer' at 1000kg. Only 158kg remaining to reach the next milestone.</p>
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                       <span className="text-gray-400">Progress</span>
                       <span className="text-green-600">84.2%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                       <div className="bg-green-500 h-full transition-all duration-1000 relative" style={{ width: '84.2%' }}>
                         <div className="absolute inset-0 bg-white/20 animate-pulse" />
                       </div>
                    </div>
                  </div>
                  
                  <button onClick={() => setActiveTab('recycling')} className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all shadow-lg shadow-gray-100 active:scale-95">
                    View Benchmarks
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
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
                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Details</th>
                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Financials</th>
                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory</th>
                        <th scope="col" className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {products.map((product) => (
                        <tr key={product._id} className="group hover:bg-green-50/20 transition-all duration-300 border-b border-gray-50 last:border-0">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              <div className="relative group/img h-14 w-14 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 shadow-sm group-hover:shadow-md transition-all">
                                {product.images && product.images.length > 0 ? (
                                  <img src={getImageUrl(product.images[0])} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-gray-300">
                                    <FaImage className="text-xl" />
                                  </div>
                                )}
                              </div>
                              <div className="overflow-hidden max-w-[200px]">
                                <h4 className="text-sm font-black text-gray-900 truncate tracking-tight">{product.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold truncate mt-0.5">ID: {product._id.slice(-8).toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-gray-200/50">
                              {product.category || "General"}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-gray-900">{formatCurrency(product.price)}</span>
                              <span className="text-[9px] text-green-600 font-bold uppercase tracking-tighter">Gross Margin: High</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 w-12 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${product.stock < 10 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }} />
                              </div>
                              <span className={`text-xs font-black ${product.stock < 10 ? 'text-orange-600' : 'text-gray-900'}`}>
                                {product.stock} <span className="text-[10px] text-gray-400 font-bold">qty</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                              product.status === "active"
                                ? "bg-green-50 text-green-700 border-green-100 shadow-sm shadow-green-100/50"
                                : "bg-gray-50 text-gray-400 border-gray-100"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${product.status === "active" ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                              {product.status || "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="p-2.5 bg-white text-gray-500 hover:text-blue-600 rounded-xl border border-gray-100 hover:border-blue-100 shadow-sm transition-all"
                                title="Edit Listing"
                              >
                                <FaEdit className="text-sm" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product._id)}
                                className="p-2.5 bg-white text-gray-500 hover:text-red-500 rounded-xl border border-gray-100 hover:border-red-100 shadow-sm transition-all"
                                title="Delete Listing"
                              >
                                <FaTrash className="text-sm" />
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

        {/* Recycling Tab */}
        {activeTab === "recycling" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Recycling Data Entry</h2>
                <p className="text-sm text-gray-500 mt-1">Track your waste collection and recycling progress</p>
              </div>
              <button
                onClick={() => {
                  setShowRecyclingForm(true);
                  setEditingRecycling(null);
                  setRecyclingForm({
                    month: "",
                    totalWasteCollected: "",
                    wasteBreakdown: [{ wasteType: "", quantity: "" }],
                    recycledProducts: [{ itemName: "", quantity: "" }]
                  });
                }}
                className="inline-flex items-center px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg transition-all duration-200 font-semibold active:scale-95"
              >
                <FaPlus className="mr-2" />
                Add Entry
              </button>
            </div>

            {/* Stock Overview Cards */}
            {recyclingData.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(calculateTotalStock()).map(([name, qty]) => (
                  <div key={name} className="bg-gradient-to-br from-green-50 to-white p-5 rounded-2xl border border-green-100 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">{name}</p>
                        <h4 className="text-2xl font-black text-gray-900">{qty}</h4>
                        <p className="text-[10px] text-gray-400 mt-1">Total Available Stock</p>
                      </div>
                      <div className="p-2 bg-green-100/50 rounded-lg">
                        <FaShoppingBag className="text-green-600 text-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recyclingData.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Month</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Total Waste (items)</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Waste Breakdown</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Recycled Products</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {recyclingData.map((item) => (
                        <tr key={item._id} className="hover:bg-green-50/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.month}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{item.totalWasteCollected}</td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {item.wasteBreakdown?.map((wb, i) => (
                              <div key={i}>{wb.wasteType}: {wb.quantity}</div>
                            ))}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {item.recycledProducts?.map((p, i) => (
                              <div key={i}>{p.itemName}: {p.quantity}</div>
                            ))}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleEditRecycling(item)} className="text-blue-600 hover:text-blue-800 mr-3"><FaEdit /></button>
                            <button onClick={() => handleDeleteRecycling(item._id)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                <FaChartBar className="mx-auto text-gray-300 text-4xl mb-4" />
                <h3 className="text-lg font-bold">No data entries yet</h3>
                <p className="text-gray-500">Start tracking your recycling metrics today.</p>
              </div>
            )}
          </div>
        )}
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

      {/* Recycling Data Modal Redesigned */}
      {showRecyclingForm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gradient-to-r from-green-50/50 to-white">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  {editingRecycling ? "Edit Entry" : "Add Recycling Data"}
                </h3>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mt-1">Sustainability Reporting</p>
              </div>
              <button 
                onClick={() => setShowRecyclingForm(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all duration-200 group"
              >
                <FaTimes className="text-xl group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <form id="recyclingForm" onSubmit={handleRecyclingSubmit} className="space-y-8">
                
                {/* Section 1: Basic Information */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <FaCalendarAlt />
                    </div>
                    <h4 className="font-bold text-gray-800">Basic Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-2 ml-1">Reporting Month</label>
                      <select
                        name="month"
                        value={recyclingForm.month}
                        onChange={handleRecyclingInputChange}
                        required
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-medium text-gray-700"
                      >
                        <option value="">Select Month</option>
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-2 ml-1">Total Waste Collected</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="totalWasteCollected"
                          value={recyclingForm.totalWasteCollected}
                          onChange={handleRecyclingInputChange}
                          required
                          placeholder="e.g. 1200"
                          className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-bold text-gray-900"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">Items</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Waste Type Breakdown (Redesigned with Dropdown/Manual) */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                        <FaRecycle />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">Waste Type Breakdown</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Quantities in Kg/Items</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={addWasteBreakdown} 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100 hover:bg-green-100 transition-all font-bold text-sm"
                    >
                      <FaPlus />
                      Add Waste
                    </button>
                  </div>

                  <div className="space-y-4">
                    {recyclingForm.wasteBreakdown.map((wb, idx) => (
                      <div key={idx} className="group relative grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/20 p-6 rounded-2xl border border-gray-50 hover:bg-white hover:border-green-100 transition-all">
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type of Waste</label>
                          <div className="flex flex-col gap-2">
                            <select 
                              value={['Paper', 'Plastic', 'Organic'].includes(wb.wasteType) ? wb.wasteType : (wb.wasteType === "" ? "" : "Other")}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "Other") updateWasteBreakdown(idx, 'wasteType', "");
                                else updateWasteBreakdown(idx, 'wasteType', val);
                              }}
                              className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold text-gray-700"
                            >
                              <option value="">Select Category</option>
                              <option value="Plastic">Plastic</option>
                              <option value="Paper">Paper</option>
                              <option value="Organic">Organic</option>
                              <option value="Other">Custom Type...</option>
                            </select>
                            
                            {(!['Paper', 'Plastic', 'Organic'].includes(wb.wasteType) || (wb.wasteType === "" && recyclingForm.wasteBreakdown[idx].wasteType === "Other")) && (
                              <input 
                                type="text"
                                value={wb.wasteType}
                                onChange={(e) => updateWasteBreakdown(idx, 'wasteType', e.target.value)}
                                placeholder="Enter custom type"
                                className="w-full p-3 bg-green-50/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold animate-in slide-in-from-top-2 duration-200"
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Quantity</label>
                            <input 
                              type="text" 
                              value={wb.quantity} 
                              onChange={(e) => updateWasteBreakdown(idx, 'quantity', e.target.value)} 
                              className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold" 
                              placeholder="0"
                            />
                          </div>
                          {recyclingForm.wasteBreakdown.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeWasteBreakdown(idx)}
                              className="p-3 bg-white text-red-500 rounded-xl border border-gray-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Recycled Products dynamic list */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <FaIndustry />
                      </div>
                      <h4 className="font-bold text-gray-800">Recycled Products & Stock</h4>
                    </div>
                    <button 
                      type="button" 
                      onClick={addRecycledProduct} 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100 hover:bg-green-100 transition-all font-bold text-sm"
                    >
                      <FaPlus />
                      Add Product
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {recyclingForm.recycledProducts.map((prod, idx) => (
                      <div key={idx} className="group relative grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:border-green-100">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Product Name</label>
                          <input 
                            type="text" 
                            value={prod.itemName} 
                            onChange={(e) => updateRecycledProduct(idx, 'itemName', e.target.value)} 
                            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all placeholder:text-gray-300 font-bold" 
                            placeholder="e.g. Eco Bricks"
                          />
                        </div>
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Quantity Created</label>
                            <input 
                              type="text" 
                              value={prod.quantity} 
                              onChange={(e) => updateRecycledProduct(idx, 'quantity', e.target.value)} 
                              className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold" 
                              placeholder="0"
                            />
                          </div>
                          {recyclingForm.recycledProducts.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeRecycledProduct(idx)}
                              className="p-3 bg-white text-red-500 rounded-xl border border-gray-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-50 flex gap-4 bg-gray-50/30">
              <button
                type="button"
                onClick={() => setShowRecyclingForm(false)}
                className="flex-1 py-4 px-6 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white hover:border-gray-300 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="recyclingForm"
                className="flex-[2] py-4 px-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-green-200 active:scale-95"
              >
                {editingRecycling ? "Update Entry" : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
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
        )}

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrder && (
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
        )}

      {/* Customer Details Modal */}
      {showCustomerDetailsModal && selectedCustomer && (
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
    </div>
  );
};

export default SellerDashboard;