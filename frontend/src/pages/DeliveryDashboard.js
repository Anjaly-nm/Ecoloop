import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaMapMarkerAlt, FaClock, FaWeight, FaPhone, FaUser, FaSignOutAlt, FaBars, FaTimes, FaBox, FaCheckCircle, FaRoad, FaRoute, FaCalendarAlt, FaCalendarCheck, FaLeaf, FaShoppingCart, FaChartLine, FaHeadset, FaEnvelope, FaComments, FaWallet, FaIdBadge, FaUserTie } from 'react-icons/fa';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Component for drawing routes
const Routing = ({ from, to, onDistance }) => {
  const map = useMap();
  const routingControlRef = React.useRef(null);

  // Lifecycle: Create control once and cleanup only on unmount
  useEffect(() => {
    if (!map) return;

    let routingControl;
    try {
      routingControl = L.Routing.control({
        waypoints: [],
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false,
        lineOptions: {
          styles: [{ color: '#10b981', weight: 4 }]
        },
        createMarker: () => null
      }).addTo(map);

      routingControl.on('routesfound', (e) => {
        const routes = e.routes;
        const dist = routes[0].summary.totalDistance / 1000;
        if (onDistance) onDistance(dist);
      });

      routingControlRef.current = routingControl;
    } catch (err) {
      console.error("Error creating routing control:", err);
    }

    return () => {
      if (routingControl && map) {
        try {
          routingControl.setWaypoints([]);
          map.removeControl(routingControl);
        } catch (e) {
          console.warn("Leaflet routing cleanup warning:", e);
        }
      }
      routingControlRef.current = null;
    };
  }, [map, onDistance]);

  // Updates: Only update waypoints when coordinates change
  useEffect(() => {
    if (routingControlRef.current && from && to) {
      try {
        routingControlRef.current.setWaypoints([
          L.latLng(from[0], from[1]),
          L.latLng(to[0], to[1])
        ]);
      } catch (err) {
        console.warn("Routing update warning:", err);
      }
    }
  }, [from, to]);

  return null;
};

// Component to handle map centering
const CenterOnTarget = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
};

// Component to handle map centering
const RecenterMap = ({ position, onComplete }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
      if (onComplete) onComplete();
    }
  }, [position, map, onComplete]);
  return null;
};

// Fix Leaflet's default marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showProfileView, setShowProfileView] = useState(false);
  const [showWeeklyAvailabilityModal, setShowWeeklyAvailabilityModal] = useState(false);
  const [showLeaveStatusModal, setShowLeaveStatusModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showContactSellerModal, setShowContactSellerModal] = useState(false);
  const [selectedSellerOrder, setSelectedSellerOrder] = useState(null);
  const [showContactAdminModal, setShowContactAdminModal] = useState(false); // New state for admin chat
  const [adminUser, setAdminUser] = useState(null); // New state for admin user data
  const [messageText, setMessageText] = useState("");
  const [chatMessages, setChatMessages] = useState([]); // Array of { sender: 'me' | 'seller', text: string, time: string }
  const [weeklyAvailability, setWeeklyAvailability] = useState({
    monday: { morning: false, afternoon: false, evening: false },
    tuesday: { morning: false, afternoon: false, evening: false },
    wednesday: { morning: false, afternoon: false, evening: false },
    thursday: { morning: false, afternoon: false, evening: false },
    friday: { morning: false, afternoon: false, evening: false },
    saturday: { morning: false, afternoon: false, evening: false },
    sunday: { morning: false, afternoon: false, evening: false }
  });
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [salarySummary, setSalarySummary] = useState(null);

  const [assignedWard, setAssignedWard] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
  const geocodingInProgress = useRef(false);

  const viewMyRoutes = () => {
    setActiveTab('in-transit');
    const inTransitDelivery = deliveries.find(d => d.status === 'in-transit' || d.status === 'shipped');
    if (inTransitDelivery) {
      setSelectedDeliveryId(inTransitDelivery.id);
      setShowMap(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setSidebarOpen(false);
  };
   
  const handleRoutingDistance = useCallback((dist) => {
    // Log distance or update state if needed in future
    console.log(`Route distance: ${dist.toFixed(2)} km`);
    if (selectedDeliveryId) {
      setDeliveries(prev => prev.map(d => 
        d.id === selectedDeliveryId ? { ...d, distance: `${dist.toFixed(1)} km` } : d
      ));
    }
  }, [selectedDeliveryId]);

  // Fetch deliveries from API
  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4321/api/orders/my-deliveries', {
        headers: {
          'token': token // Changed 'Authorization' to 'token' to match backend middleware
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Transform backend order data to match frontend delivery structure if needed
        const mappedDeliveries = (data.deliveries || []).map(order => ({
          id: order._id,
          orderId: order._id.slice(-6).toUpperCase(),
          status: order.status,
          seller: order.items?.[0]?.productId?.seller_id ? {
            _id: order.items[0].productId.seller_id._id, // Essential for chat
            name: order.items[0].productId.seller_id.name || 'Seller',
            phone: order.items[0].productId.seller_id.phone || 'N/A',
            email: order.items[0].productId.seller_id.email || 'N/A',
            organization: order.items[0].productId.seller_id.name || 'Organization' // Fallback to name as org is not distinct yet
          } : null,
          customerName: order.userId?.name || 'Guest',
          customerPhone: order.userId?.phone || 'N/A',
          houseNumber: order.userId?.houseNumber || order.shippingAddress?.houseNumber || '',
          pincode: order.shippingAddress?.pincode || '',
          customerAddress: (typeof order.shippingAddress === 'string' && order.shippingAddress.length > 5) 
            ? order.shippingAddress 
            : (order.shippingAddress?.address 
                ? `${order.shippingAddress.address}${order.shippingAddress.city ? ', ' + order.shippingAddress.city : ''}` 
                : (order.userId?.address || 'No address provided')),
          items: order.items?.map(i => i.productId?.name || 'Item') || [],
          weight: '2.5 kg', 
          priority: 'medium',
          distance: '...', // Will be updated by real routing
          scheduledTime: new Date(order.createdAt).toLocaleTimeString(),
          notes: order.userId?.wardNumber ? `Ward ${order.userId.wardNumber}` : '',
          coordinates: [9.5630, 76.7878], // Default to Kanjirappally center until geocoded
          isMockCoords: true
        }));
        setDeliveries(mappedDeliveries);
      } else {
        console.error('Failed to fetch deliveries');
        setDeliveries([]);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Ward Assignment
  const fetchWardAssignment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4321/api/user/my-ward-assignment', {
        headers: { 'token': token }
      });
      if (response.ok) {
        const data = await response.json();
        setAssignedWard(data.wardNumber);

        // Update user object in local storage with ward info if distinct
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && data.wardNumber) {
          user.assignedArea = `Ward ${data.wardNumber}`;
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
        }
      }
    } catch (error) {
      console.error("Error fetching ward assignment:", error);
    }
  };

  useEffect(() => {
    // Fetch user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user'));

    // Reset availability status to true (online) on login
    // This ensures delivery boys start as available when they log in
    const updatedUserData = {
      ...userData,
      isAvailable: true
    };

    setUser(updatedUserData);

    // Update localStorage to reflect the reset status
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    localStorage.setItem('deliveryBoyAvailability', JSON.stringify(true));

    // Load saved availability when component mounts
    const savedAvailability = localStorage.getItem('weeklyDeliveryAvailability');
    if (savedAvailability) {
      setWeeklyAvailability(JSON.parse(savedAvailability));
    }

    // Fetch deliveries from API
    fetchDeliveries();
    fetchWardAssignment(); // Fetch ward assignment

    // Fetch leave applications for this delivery person
    fetchLeaveApplications();
    fetchSalarySummary();

    // Geolocation for map
    let watchId = null;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Background geocoding for deliveries
  useEffect(() => {
    const geocodeDeliveries = async () => {
      // Find deliveries that still have mock coordinates
      const needsGeocoding = deliveries.filter(d => d.isMockCoords && d.customerAddress);
      
      if (needsGeocoding.length === 0 || geocodingInProgress.current) return;

      geocodingInProgress.current = true;
      
      for (const d of needsGeocoding) {
        try {
          // Smart Geocoding: Try to clean the address and fallback if needed
          const cleanAddress = (addr) => {
            return addr
              .replace(/\(H\)/gi, '') // Remove (H) for house
              .replace(/\(HO\)/gi, '') // Remove (HO)
              .replace(/House/gi, '')
              .split(',')
              .map(part => part.trim())
              .filter(part => part.length > 2)
              .join(', ');
          };

          const fullAddress = cleanAddress(d.customerAddress);
          const cityPart = d.customerAddress.split(',').pop().trim();
          
          // Try 1: Full cleaned address
          const variations = [
            [fullAddress, d.pincode, "Kerala, India"].filter(Boolean).join(", "),
            [d.customerAddress.split(',').slice(1).join(','), "Kerala, India"].filter(Boolean).join(", "), // Drop first part (often house name)
            [cityPart, "Kerala, India"].filter(Boolean).join(", ") // Fallback to city/town only
          ];

          let found = false;
          for (const queryStr of variations) {
            const query = encodeURIComponent(queryStr);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
              headers: { 'User-Agent': 'EcoLoopDashboard/1.0' }
            });
            const data = await response.json();
            
            if (data && data.length > 0) {
              const newCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
              const jitter = (Math.random() - 0.5) * 0.0001; 
              setDeliveries(prev => prev.map(item => 
                item.id === d.id ? { ...item, coordinates: [newCoords[0] + jitter, newCoords[1] + jitter], isMockCoords: false } : item
              ));
              console.log(`Geocoding SUCCESS for ${d.orderId} using query: ${queryStr}`);
              found = true;
              break;
            }
            // Small delay between trials within the loop if we have to try multiple queries
            await new Promise(r => setTimeout(r, 500));
          }

          if (!found) {
            console.log(`Geocoding FAILED for ${d.orderId} after all trials.`);
            setDeliveries(prev => prev.map(item => 
              item.id === d.id ? { ...item, isMockCoords: false } : item
            ));
          }
        } catch (err) {
          console.error("Geocoding exception for:", d.customerAddress, err);
          setDeliveries(prev => prev.map(item => 
            item.id === d.id ? { ...item, isMockCoords: false } : item
          ));
        }
        // Delay to respect Nominatim policy
        await new Promise(r => setTimeout(r, 1000));
      }
      geocodingInProgress.current = false;
    };

    if (deliveries.length > 0) {
      geocodeDeliveries();
    }
  }, [deliveries]);

  const fetchSalarySummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";
      console.log("Fetching salary summary from:", `${base}/api/salary/summary`);
      const response = await fetch(`${base}/api/salary/summary`, {
        headers: { 'token': token }
      });
      if (response.ok) {
        const result = await response.json();
        console.log("Salary summary updated:", result.data);
        setSalarySummary(result.data);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch salary summary:", errorData);
      }
    } catch (error) {
      console.error("Error fetching salary summary:", error);
    }
  };

  // Function to fetch leave applications for the current delivery person
  const fetchLeaveApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      // Fetch leave applications for this specific user
      const response = await fetch(`http://localhost:4321/api/leave-applications/user/${user.id || user._id}`, {
        headers: {
          'token': token // Changed Authorization to token
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLeaveApplications(data.applications || []);
      } else {
        console.error('Failed to fetch leave applications');
        setLeaveApplications([]);
      }
    } catch (error) {
      console.error('Error fetching leave applications:', error);
      setLeaveApplications([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('deliveryBoyAvailability');
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'in-transit':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'completed':
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const updateDeliveryStatus = async (deliveryId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";

      // Call API to update delivery status
      const response = await fetch(`${base}/api/orders/update-status/${deliveryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state on success
        setDeliveries(deliveries.map(delivery =>
          delivery.id === deliveryId ? { ...delivery, status: newStatus } : delivery
        ));

        // Refresh stats/analytics
        await fetchSalarySummary(); // Refresh salary summary immediately
        alert(`Delivery status updated to ${newStatus}`);
      } else {
        console.error('Failed to update status');
        alert('Failed to update status on server');
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert('Error connecting to server');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleProfileView = () => {
    setShowProfileView(!showProfileView);
  };

  const toggleWeeklyAvailabilityModal = () => {
    setShowWeeklyAvailabilityModal(!showWeeklyAvailabilityModal);
  };

  const toggleTimeSlot = (day, timeSlot) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [timeSlot]: !prev[day][timeSlot]
      }
    }));
  };

  const saveWeeklyAvailability = () => {
    // Save to localStorage
    localStorage.setItem('weeklyDeliveryAvailability', JSON.stringify(weeklyAvailability));

    // In a real app, you would also save to the backend
    // const response = await fetch('http://localhost:4321/api/delivery-boy/weekly-availability', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //   },
    //   body: JSON.stringify(weeklyAvailability)
    // });

    // Close the modal after saving
    setShowWeeklyAvailabilityModal(false);
  };

  const toggleAvailability = async () => {
    try {
      const newAvailability = !user?.isAvailable;

      // Update local state immediately for better UX
      const updatedUser = {
        ...user,
        isAvailable: newAvailability
      };
      setUser(updatedUser);

      // Save availability status to localStorage
      localStorage.setItem('deliveryBoyAvailability', JSON.stringify(newAvailability));

      // Also update the user data in localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Call API to update availability status
      // const response = await fetch('http://localhost:4321/api/delivery-boy/availability', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify({ isAvailable: newAvailability })
      // });

      // if (!response.ok) {
      //   // Revert local state if API call fails
      //   const revertedUser = {
      //     ...user,
      //     isAvailable: !newAvailability
      //   };
      //   setUser(revertedUser);
      //   localStorage.setItem('deliveryBoyAvailability', JSON.stringify(!newAvailability));
      //   localStorage.setItem('user', JSON.stringify(revertedUser));
      // }
    } catch (error) {
      console.error('Error updating availability:', error);
      // Revert local state on error
      const revertedUser = {
        ...user,
        isAvailable: !user?.isAvailable
      };
      setUser(revertedUser);
      localStorage.setItem('deliveryBoyAvailability', JSON.stringify(!user?.isAvailable));
      localStorage.setItem('user', JSON.stringify(revertedUser));
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    if (activeTab === 'all') return true;
    if (activeTab === 'in-transit') return delivery.status === 'in-transit' || delivery.status === 'shipped';
    if (activeTab === 'completed') return delivery.status === 'delivered' || delivery.status === 'completed';
    return delivery.status === activeTab;
  });

  const openContactSellerModal = (order) => {
    setSelectedSellerOrder(order);
    setShowContactSellerModal(true);
    fetchChatHistory(order.id); // order.id is used in this file, might need _id if it was mapped differently. 
    // Checking map logic: id: order._id ... SO id is correct.
  };

  const fetchChatHistory = useCallback(async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";
      const res = await axios.get(`${base}/api/messages/history/${orderId}`, { headers: { token } });
      const formattedMessages = (res.data.messages || []).map(msg => ({
        // Map backend message format to frontend format used in render
        sender: msg.sender._id === user?._id ? 'me' : 'seller',
        text: msg.text,
        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setChatMessages(formattedMessages);
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  }, [user?._id]);

  // Poll for messages when modal is open
  useEffect(() => {
    let interval;
    if (showContactSellerModal && selectedSellerOrder) {
      interval = setInterval(() => {
        fetchChatHistory(selectedSellerOrder.id);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [showContactSellerModal, selectedSellerOrder, fetchChatHistory]);

  const closeContactSellerModal = () => {
    setShowContactSellerModal(false);
    setSelectedSellerOrder(null);
    setMessageText("");
    setChatMessages([]); // Clear chat on close
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedSellerOrder) return;

    try {
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";

      // Need seller ID. In map logic: seller: { ... } but did we keep the ID?
      // In map: seller: order.items?.[0]?.productId?.seller_id ? { ... }
      // We didn't explicitly save 'id' in seller object in the map function earlier.
      // I need to check the map function at line ~1100.
      // Ah, wait. selectedSellerOrder is the mapped object.
      // Let's verify if we have seller ID. If not, I need to add it to the map function first.

      // Assuming I'll fix the map function to include seller._id:
      const payload = {
        recipientId: selectedSellerOrder.seller._id,
        orderId: selectedSellerOrder.id,
        text: messageText
      };

      await axios.post(`${base}/api/messages/send`, payload, { headers: { token } });

      setMessageText("");
      fetchChatHistory(selectedSellerOrder.id); // Refresh immediately
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message: " + (err.response?.data?.message || err.message));
    }
  };

  // --- Admin Chat Functions ---

  const fetchDirectChatHistory = useCallback(async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";
      const res = await axios.get(`${base}/api/messages/history/direct/${userId}`, { headers: { token } });
      const formattedMessages = (res.data.messages || []).map(msg => ({
        // Map backend message format to frontend format used in render
        sender: msg.sender._id === user?._id ? 'me' : 'admin',
        text: msg.text,
        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setChatMessages(formattedMessages);
    } catch (err) {
      console.error("Error fetching direct chat history:", err);
    }
  }, [user?._id]);

  const openContactAdminModal = async () => {
    // try to fetch admin if not present
    let targetAdmin = adminUser;

    // Always try to fetch fresh admin info
    try {
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";
      const res = await axios.get(`${base}/api/messages/admin`, { headers: { token } });
      targetAdmin = res.data.admin;
      setAdminUser(targetAdmin);
    } catch (e) {
      console.error(e);
      // If we have cached admin, use it, otherwise show error
      if (!targetAdmin) {
        alert("Could not load admin contact info.");
        return;
      }
    }

    if (targetAdmin) {
      setShowSupportModal(false);
      setShowContactAdminModal(true);
      fetchDirectChatHistory(targetAdmin._id);
    }
  };

  const closeContactAdminModal = () => {
    setShowContactAdminModal(false);
    setMessageText("");
    setChatMessages([]);
  };

  const handleSendAdminMessage = async () => {
    if (!messageText.trim() || !adminUser) return;

    try {
      const token = localStorage.getItem("token");
      const base = process.env.REACT_APP_API_URL || "http://localhost:4321";

      const payload = {
        recipientId: adminUser._id,
        orderId: null, // Direct message to admin
        text: messageText
      };

      await axios.post(`${base}/api/messages/send`, payload, { headers: { token } });

      setMessageText("");
      fetchDirectChatHistory(adminUser._id); // Refresh immediately
    } catch (err) {
      console.error("Error sending message to admin:", err);
      alert("Failed to send message: " + (err.response?.data?.message || err.message));
    }
  };

  // Poll for admin messages when modal is open
  useEffect(() => {
    let interval;
    if (showContactAdminModal && adminUser) {
      interval = setInterval(() => {
        fetchDirectChatHistory(adminUser._id);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [showContactAdminModal, adminUser, fetchDirectChatHistory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex font-sans">
      {/* Clean Left Sidebar - Fixed width with eco-green theme */}
      <div className={`fixed inset-y-0 left-0 z-50 w-52 bg-gradient-to-b from-green-700 to-emerald-800 shadow-xl border-r border-green-600 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between p-3 border-b border-green-600">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white rounded-lg">
              <FaLeaf className="text-green-700 text-sm" />
            </div>
            <h1 className="text-base font-bold text-white">EcoLoop</h1>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-white hover:text-green-200"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>
        <nav className="p-2 mt-3">
          <ul className="space-y-1">
            <li>
              <button onClick={() => { setActiveTab('all'); setSidebarOpen(false); }} className={`flex items-center gap-2 p-2 rounded text-sm transition-colors duration-200 w-full text-left ${activeTab === 'all' ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-600'}`}>
                <FaTruck className="text-white text-xs" /> Dashboard
              </button>
            </li>
            <li>
              <button type="button" onClick={viewMyRoutes} className={`flex items-center gap-2 p-2 rounded text-sm transition-colors duration-200 w-full text-left ${activeTab === 'in-transit' ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-600'}`}>
                <FaRoute className="text-green-200 text-xs" /> My Routes
              </button>
            </li>

            <li>
              <button type="button" onClick={() => { setActiveTab('pending'); setSidebarOpen(false); }} className={`flex items-center gap-2 p-2 rounded text-sm transition-colors duration-200 w-full text-left ${activeTab === 'pending' ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-600'}`}>
                <FaCalendarAlt className="text-green-200 text-xs" /> Schedule (Pending)
              </button>
            </li>
            <li>
              <button type="button" onClick={() => { setActiveTab('salary'); setSidebarOpen(false); }} className={`flex items-center gap-2 p-2 rounded text-sm transition-colors duration-200 w-full text-left ${activeTab === 'salary' ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-600'}`}>
                <FaWallet className="text-green-200 text-xs" /> My Earnings
              </button>
            </li>
            <li>
              <button type="button" onClick={() => navigate('/profile')} className="flex items-center gap-2 p-2 text-green-100 rounded text-sm hover:bg-green-600 transition-colors duration-200 w-full text-left">
                <FaUser className="text-green-200 text-xs" /> Profile
              </button>
            </li>
            <li>
              <button type="button" onClick={toggleWeeklyAvailabilityModal} className="flex items-center gap-2 p-2 text-green-100 rounded text-sm hover:bg-green-600 transition-colors duration-200 w-full text-left">
                <FaCalendarAlt className="text-green-200 text-xs" /> Weekly Availability
              </button>
            </li>
            <li>
              <a href="/leave-application" className="flex items-center gap-2 p-2 text-green-100 rounded text-sm hover:bg-green-600 transition-colors duration-200 w-full text-left">
                <FaCalendarAlt className="text-green-200 text-xs" /> Apply Leave
              </a>
            </li>
            <li>
              <button type="button" onClick={() => setShowLeaveStatusModal(true)} className="flex items-center gap-2 p-2 text-green-100 rounded text-sm hover:bg-green-600 transition-colors duration-200 w-full text-left">
                <FaCalendarCheck className="text-green-200 text-xs" /> My Leave Status
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setShowSupportModal(true)} className="flex items-center gap-2 p-2 text-green-100 rounded text-sm hover:bg-green-600 transition-colors duration-200 w-full text-left">
                <FaHeadset className="text-green-200 text-xs" /> Support & Help
              </button>
            </li>
            <li className="mt-4 pt-2 border-t border-green-600">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 p-2 text-red-200 rounded text-sm hover:bg-red-600 transition-colors duration-200 w-full text-left"
              >
                <FaSignOutAlt className="text-xs" /> Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Profile View Modal */}
      {showProfileView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleProfileView}></div>

          <div className="relative bg-white w-full max-w-xs rounded-[1.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Header / Cover */}
            <div className="h-24 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <button
                onClick={toggleProfileView}
                className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all z-10"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Profile Content */}
            <div className="px-4 pb-6">
              {/* Avatar */}
              <div className="relative -mt-10 mb-3 flex justify-center">
                <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg">
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-green-100 via-emerald-50 to-teal-50 flex items-center justify-center text-green-700 overflow-hidden border border-green-100/50">
                    <span className="text-2xl font-black tracking-tighter">
                      {user?.name?.charAt(0)?.toUpperCase() || 'D'}
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-1 right-[calc(50%-32px)] w-6 h-6 bg-white rounded-full p-0.5 shadow-md border-2 border-white">
                  <div className={`w-full h-full rounded-full ${user?.isAvailable ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-center`}>
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Name & Title */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight">{user?.name || 'Delivery Hero'}</h2>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[8px] font-bold rounded-full border border-green-100 uppercase tracking-widest">
                    Partner
                  </span>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[8px] font-bold rounded-full border border-amber-100 uppercase tracking-widest">
                    4.9⭐
                  </span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                <div className="bg-gray-50/80 p-2 rounded-xl text-center border border-gray-100">
                  <p className="text-base font-black text-gray-900 leading-none mb-0.5">
                    {deliveries.filter(d => d.status === 'delivered' || d.status === 'completed').length}
                  </p>
                  <p className="text-[7px] text-gray-400 font-extrabold uppercase tracking-wider">Done</p>
                </div>
                <div className="bg-gray-50/80 p-2 rounded-xl text-center border border-gray-100">
                  <p className="text-base font-black text-gray-900 leading-none mb-0.5">
                    {salarySummary?.earnings?.total || 0}
                  </p>
                  <p className="text-[7px] text-gray-400 font-extrabold uppercase tracking-wider">Earned</p>
                </div>
                <div className="bg-gray-50/80 p-2 rounded-xl text-center border border-gray-100">
                  <p className="text-base font-black text-gray-900 leading-none mb-0.5">124</p>
                  <p className="text-[7px] text-gray-400 font-extrabold uppercase tracking-wider">XP</p>
                </div>
              </div>

              {/* Info Sections */}
              <div className="space-y-2">
                <div className="px-3 py-2 rounded-xl border border-gray-100 flex items-center gap-2.5 hover:bg-gray-50/50 transition-colors">
                  <FaIdBadge className="text-blue-500" size={12} />
                  <p className="text-[10px] text-gray-900 font-bold truncate">{user?.deliveryBoyId || user?.id || 'N/A'}</p>
                </div>

                <div className="px-3 py-2 rounded-xl border border-gray-100 flex items-center gap-2.5 hover:bg-gray-50/50 transition-colors">
                  <FaPhone className="text-teal-500" size={11} />
                  <p className="text-[10px] text-gray-900 font-bold">{user?.phone || user?.phoneNumber || user?.contactNumber || 'N/A'}</p>
                </div>

                <div className="px-3 py-2 rounded-xl border border-gray-100 flex items-center gap-2.5 hover:bg-gray-50/50 transition-colors">
                  <FaMapMarkerAlt className="text-orange-500" size={11} />
                  <p className="text-[10px] text-gray-900 font-bold truncate">Ward {assignedWard || 'N/A'}</p>
                </div>

                <div className="mt-3 flex items-center justify-between p-3 bg-gray-900 rounded-2xl shadow-md">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user?.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-bold text-white text-[9px]">{user?.isAvailable ? 'Active' : 'Off'}</span>
                  </div>
                  <button
                    onClick={toggleAvailability}
                    className={`px-3 py-1 rounded-lg text-[8px] font-black transition-all ${user?.isAvailable ? 'bg-white text-green-700' : 'bg-white/10 text-white'}`}
                  >
                    {user?.isAvailable ? 'Go Off' : 'Go On'}
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-4 flex gap-1.5">
                <button
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black py-2 rounded-xl text-[10px] transition-all"
                  onClick={toggleProfileView}
                >
                  Close
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black py-2 rounded-xl text-[10px] shadow-sm transition-all flex items-center justify-center gap-1.5"
                  onClick={() => navigate('/profile')}
                >
                  <FaUserTie size={10} />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Availability Modal */}
      {showWeeklyAvailabilityModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={toggleWeeklyAvailabilityModal}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Weekly Availability
                      </h3>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600"
                        onClick={toggleWeeklyAvailabilityModal}
                      >
                        <FaTimes className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Select your availability for the upcoming week:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Monday</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleTimeSlot('monday', 'morning')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.monday.morning
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Morning
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('monday', 'afternoon')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.monday.afternoon
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Afternoon
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('monday', 'evening')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.monday.evening
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Evening
                            </button>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Tuesday</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleTimeSlot('tuesday', 'morning')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.tuesday.morning
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Morning
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('tuesday', 'afternoon')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.tuesday.afternoon
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Afternoon
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('tuesday', 'evening')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.tuesday.evening
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Evening
                            </button>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Wednesday</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleTimeSlot('wednesday', 'morning')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.wednesday.morning
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Morning
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('wednesday', 'afternoon')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.wednesday.afternoon
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Afternoon
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('wednesday', 'evening')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.wednesday.evening
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Evening
                            </button>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Thursday</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleTimeSlot('thursday', 'morning')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.thursday.morning
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Morning
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('thursday', 'afternoon')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.thursday.afternoon
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Afternoon
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('thursday', 'evening')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.thursday.evening
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Evening
                            </button>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Friday</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleTimeSlot('friday', 'morning')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.friday.morning
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Morning
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('friday', 'afternoon')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.friday.afternoon
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Afternoon
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('friday', 'evening')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.friday.evening
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Evening
                            </button>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Saturday</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleTimeSlot('saturday', 'morning')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.saturday.morning
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Morning
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('saturday', 'afternoon')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.saturday.afternoon
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Afternoon
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('saturday', 'evening')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.saturday.evening
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Evening
                            </button>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4 md:col-span-2">
                          <h4 className="font-medium text-gray-900 mb-2">Sunday</h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleTimeSlot('sunday', 'morning')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.sunday.morning
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Morning
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('sunday', 'afternoon')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.sunday.afternoon
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Afternoon
                            </button>
                            <button
                              onClick={() => toggleTimeSlot('sunday', 'evening')}
                              className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium ${weeklyAvailability.sunday.evening
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Evening
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={saveWeeklyAvailability}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={toggleWeeklyAvailabilityModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Status Modal */}
      {showLeaveStatusModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowLeaveStatusModal(false)}
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        My Leave Status
                      </h3>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => setShowLeaveStatusModal(false)}
                      >
                        <FaTimes className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="mt-4">
                      {leaveApplications.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 mb-4">
                            <FaCalendarCheck className="mx-auto h-12 w-12" />
                          </div>
                          <p className="text-gray-600 text-lg">No leave applications found</p>
                          <p className="text-gray-500 mt-2">You haven't applied for any leave yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-gray-600 mb-4">Your recent leave applications:</p>
                          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Dates</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Applied Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {leaveApplications.map((application) => (
                                  <tr key={application.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                      {new Date(application.startDate).toLocaleDateString()} - {new Date(application.endDate).toLocaleDateString()} ({Math.ceil((new Date(application.endDate) - new Date(application.startDate)) / (1000 * 60 * 60 * 24)) + 1} days)
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{application.leaveType}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${application.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {new Date(application.appliedDate).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowLeaveStatusModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Flex with no margin */}
      <div className="flex-1 w-full lg:w-[calc(100%-13rem)]">
        {/* Top Header - Minimal padding with eco theme */}
        <header className="bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm border-b border-green-100">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-green-100">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="lg:hidden text-green-700 p-1 rounded-lg hover:bg-green-50"
              >
                <FaBars className="text-sm" />
              </button>
              <div>
                <h1 className="text-base font-bold text-green-800 flex items-center gap-2">
                  <FaTruck className="text-green-600" /> Delivery Dashboard
                </h1>
                <p className="text-green-600 text-xs flex items-center gap-1">
                  <FaLeaf className="text-green-500" />
                  {assignedWard ? `Assigned Coverage: Ward ${assignedWard}` : 'No Ward Assigned'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <span className={`mr-2 px-2 py-1 rounded-full text-xs font-medium ${user?.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user?.isAvailable ? 'Available' : 'Unavailable'}
                </span>
                <button
                  onClick={toggleAvailability}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${user?.isAvailable ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user?.isAvailable ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
              <div className="text-right">
                <p className="text-green-800 font-medium text-xs">Welcome, {user?.name || 'Delivery Hero'}</p>
                <p className="text-green-600 text-xs flex items-center gap-1">
                  <FaLeaf className="text-green-500 text-xs" /> {user?.isAvailable ? 'Ready to serve' : 'Currently unavailable'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.charAt(0)?.toUpperCase() || 'D'}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content - Eco-friendly padding */}
        <main className="p-4 bg-gradient-to-br from-green-50 to-teal-50 min-h-screen">
          {/* Summary Statistic Cards - Eco-friendly theme */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm p-4 text-gray-800 border border-green-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-green-600 text-xs font-medium flex items-center gap-1">
                    <FaTruck className="text-green-500" /> Total Deliveries
                  </p>
                  <h3 className="text-xl font-bold mt-1">{deliveries?.length || 0}</h3>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaBox className="text-green-600 text-base" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-sm p-4 text-gray-800 border border-amber-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-amber-600 text-xs font-medium flex items-center gap-1">
                    <FaClock className="text-amber-500" /> Pending
                  </p>
                  <h3 className="text-xl font-bold mt-1">{deliveries?.filter(d => d.status === 'pending').length || 0}</h3>
                </div>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FaClock className="text-amber-600 text-base" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-sm p-4 text-gray-800 border border-emerald-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                    <FaCheckCircle className="text-emerald-500" /> Completed
                  </p>
                  <h3 className="text-xl font-bold mt-1">{deliveries?.filter(d => d.status === 'delivered' || d.status === 'completed').length || 0}</h3>
                </div>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <FaCheckCircle className="text-emerald-600 text-base" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl shadow-sm p-4 text-gray-800 border border-cyan-100 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-cyan-600 text-xs font-medium flex items-center gap-1">
                    <FaRoad className="text-cyan-500" /> Distance Covered
                  </p>
                  <h3 className="text-xl font-bold mt-1">
                    {deliveries?.reduce((sum, delivery) => sum + (parseFloat(delivery.distance) || 0), 0).toFixed(1) || '0.0'} km
                  </h3>
                </div>
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <FaRoad className="text-cyan-600 text-base" />
                </div>
              </div>
            </div>
          </div>

          {/* Salary Summary Card Section */}
          {activeTab === 'salary' && salarySummary && (
            <div className="bg-white rounded-xl shadow-md border border-green-500 ring-2 ring-green-100 p-5 mb-4 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaChartLine className="text-green-600 shadow-sm" />
                </div>
                <h2 className="text-lg font-bold text-green-800">Monthly Salary Summary</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Base Salary</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">₹{salarySummary.baseSalary.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Deliveries</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">{salarySummary.deliveriesCompleted}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Incentives</p>
                  <p className="text-lg font-bold text-amber-600 mt-1">₹{salarySummary.incentiveEarned.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Total Earnings</p>
                  <p className="text-xl font-black text-green-700 mt-1">₹{salarySummary.totalEarnings.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Credit Status</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${salarySummary.creditStatus === 'Credited' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {salarySummary.creditStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation & Map Toggle */}
          {activeTab !== 'salary' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white rounded-full shadow-sm p-1 inline-flex border border-green-100 overflow-hidden">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium ${activeTab === 'all' ? 'bg-green-500 text-white shadow-md' : 'text-green-600 hover:bg-green-50'}`}
                  >
                    <FaTruck className="inline mr-1" /> All Deliveries
                  </button>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium ${activeTab === 'pending' ? 'bg-amber-500 text-white shadow-md' : 'text-amber-600 hover:bg-amber-50'}`}
                  >
                    <FaClock className="inline mr-1" /> Pending
                  </button>
                  <button
                    onClick={viewMyRoutes}
                    className={`px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium ${activeTab === 'in-transit' ? 'bg-blue-500 text-white shadow-md' : 'text-blue-600 hover:bg-blue-50'}`}
                  >
                    <FaRoute className="inline mr-1" /> In-Transit
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium ${activeTab === 'completed' ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-600 hover:bg-emerald-50'}`}
                  >
                    <FaCheckCircle className="inline mr-1" /> Completed
                  </button>
                </div>

                <button
                  onClick={() => setShowMap(!showMap)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${showMap ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-green-700 border-green-200 hover:bg-green-50'}`}
                >
                  <FaMapMarkerAlt className={showMap ? 'text-white' : 'text-green-600'} />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </button>
              </div>

              {/* Deliveries Map View */}
              {showMap && (
                <div className="mb-6 h-[400px] w-full rounded-2xl overflow-hidden shadow-lg border-2 border-green-200 relative z-0">
                  <MapContainer center={currentPosition || [10.85, 76.27]} zoom={11} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Component to recenter map when currentPosition is first found */}
                    {!hasCentered && currentPosition && (
                      <RecenterMap
                        position={currentPosition}
                        onComplete={() => setHasCentered(true)}
                      />
                    )}

                    {/* Current User Position Marker */}
                    {currentPosition && (
                      <Marker
                        position={currentPosition}
                        icon={L.divIcon({
                          className: 'custom-user-icon',
                          html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
                          iconSize: [20, 20]
                        })}
                      >
                        <Popup>
                          <div className="text-sm font-bold text-blue-600">You are here</div>
                        </Popup>
                      </Marker>
                    )}

                    {filteredDeliveries.map((delivery) => (
                      delivery.coordinates && (
                        <Marker key={delivery.id} position={delivery.coordinates}>
                          <Popup>
                            <div className="p-2 min-w-[200px]">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-green-800 text-sm">#{delivery.orderId}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusColor(delivery.status)}`}>
                                  {delivery.status}
                                </span>
                              </div>
                              <p className="text-xs flex items-center gap-1 text-gray-700 mb-1">
                                <FaUser className="text-green-500 text-[10px]" /> {delivery.customerName}
                              </p>
                              <p className="text-xs flex items-center gap-1 text-gray-700 mb-2">
                                <FaMapMarkerAlt className="text-red-500 text-[10px]" /> {delivery.customerAddress}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => updateDeliveryStatus(delivery.id, delivery.status === 'pending' ? 'in-transit' : 'delivered')}
                                  className="flex-1 py-1 bg-green-600 text-white text-[10px] rounded hover:bg-green-700 transition-colors"
                                >
                                  Update Status
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedDeliveryId(delivery.id);
                                    setShowMap(true);
                                  }}
                                  className="flex-1 py-1 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-700 transition-colors"
                                >
                                  View Route
                                </button>
                                <a
                                  href={`tel:${delivery.customerPhone}`}
                                  className="p-1 px-2 border border-green-300 text-green-700 text-[10px] rounded hover:bg-green-50 transition-colors"
                                >
                                  Call
                                </a>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      )
                    ))}

                    {/* Draw route if selected */}
                    {currentPosition && selectedDeliveryId && (
                      <React.Fragment key={selectedDeliveryId}>
                        <Routing 
                          from={currentPosition} 
                          to={deliveries.find(d => d.id === selectedDeliveryId)?.coordinates} 
                          onDistance={handleRoutingDistance}
                        />
                        <CenterOnTarget position={deliveries.find(d => d.id === selectedDeliveryId)?.coordinates} />
                      </React.Fragment>
                    )}
                  </MapContainer>

                  {/* Floating Button to Go to Current Location */}
                  {/* Floating Buttons */}
                  <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
                    {selectedDeliveryId && (
                      <button
                        onClick={() => setSelectedDeliveryId(null)}
                        className="bg-red-500 p-3 rounded-full shadow-lg text-white hover:bg-red-600 transition-all flex items-center justify-center"
                        title="Clear Route"
                      >
                        <FaTimes />
                      </button>
                    )}
                    {currentPosition && (
                      <button
                        onClick={() => {
                          setHasCentered(false); // Reset to trigger RecenterMap again
                        }}
                        className="bg-white p-3 rounded-full shadow-lg border border-green-200 text-green-700 hover:bg-green-50 transition-all flex items-center justify-center"
                        title="My Location"
                      >
                        <FaMapMarkerAlt />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Deliveries Grid - Card-based UI with eco theme */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredDeliveries.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="inline-block p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                      <div className="mb-4 flex justify-center">
                        <div className="p-4 bg-green-100 rounded-full">
                          <FaTruck className="text-green-600 text-3xl mx-auto" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-green-800 mb-2">No deliveries found</h3>
                      <p className="text-green-600 text-sm max-w-md mx-auto">Check back later for new delivery assignments. Your eco-friendly journey continues!</p>
                    </div>
                  </div>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <div key={delivery.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-green-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-base font-bold text-green-800 flex items-center gap-2">
                              <FaShoppingCart className="text-green-600" /> #{delivery.orderId}
                            </h3>
                            <div className="flex gap-2 mt-2">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                                {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                              </span>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(delivery.priority)}`}>
                                {delivery.priority}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-green-700 flex items-center gap-1">
                              <FaClock className="text-green-500" /> {delivery.scheduledTime}
                            </p>
                            <p className="text-sm text-green-700 flex items-center gap-1 mt-1">
                              <FaRoad className="text-green-500" /> {delivery.distance === '...' && !delivery.isMockCoords && currentPosition 
                                ? (L.latLng(currentPosition[0], currentPosition[1]).distanceTo(L.latLng(delivery.coordinates[0], delivery.coordinates[1])) / 1000).toFixed(1) + ' km*'
                                : delivery.distance}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-start p-2 bg-green-50 rounded-lg border border-green-100">
                            <div className="p-1.5 bg-green-100 rounded mr-3 flex-shrink-0">
                              <FaUser className="text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-green-800 text-sm">{delivery.customerName}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-green-600 text-sm flex items-center gap-1">
                                  <FaPhone className="text-green-500 text-xs" /> {delivery.customerPhone}
                                </p>
                                <a href={`tel:${delivery.customerPhone}`} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 hover:bg-green-200">
                                  Call
                                </a>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start p-2 bg-green-50 rounded-lg border border-green-100">
                            <div className="p-1.5 bg-green-100 rounded mr-3 flex-shrink-0">
                              <FaMapMarkerAlt className="text-green-600" />
                            </div>
                            <p className="text-green-700 text-sm">{delivery.customerAddress}</p>
                          </div>

                          <div className="flex items-start p-2 bg-green-50 rounded-lg border border-green-100">
                            <div className="p-1.5 bg-green-100 rounded mr-3 flex-shrink-0">
                              <FaBox className="text-green-600" />
                            </div>
                            <div>
                              <p className="text-green-700 text-sm">{delivery.items.join(', ')}</p>
                              <p className="text-green-600 text-sm flex items-center gap-1 mt-1">
                                <FaWeight className="text-green-500 text-xs" /> {delivery.weight}
                              </p>
                            </div>
                          </div>

                          {delivery.notes && (
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                              <p className="text-sm text-amber-700 flex items-start gap-2">
                                <span className="font-medium text-amber-800">Notes:</span> {delivery.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-green-100">
                          <button className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors font-medium flex items-center gap-1">
                            <FaChartLine className="text-green-600" /> Details
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDeliveryId(delivery.id);
                              setShowMap(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`px-3 py-2 rounded-lg text-sm transition-colors font-medium flex items-center gap-1 ${
                              delivery.isMockCoords 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }`}
                            title={delivery.isMockCoords ? "Locating address..." : "View Route"}
                          >
                            <FaRoute className={delivery.isMockCoords ? 'text-gray-300' : 'text-emerald-600'} /> 
                            {delivery.isMockCoords ? 'Locating...' : 'View Route'}
                          </button>

                          {/* Contact Seller Button - New Feature */}
                          {delivery.seller && (
                            <button
                              onClick={() => openContactSellerModal(delivery)}
                              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors font-medium flex items-center gap-1"
                            >
                              <FaComments className="text-blue-600" /> Contact Seller
                            </button>
                          )}
                          <div className="flex space-x-2">
                            {delivery.status === 'pending' && (
                              <button
                                onClick={() => updateDeliveryStatus(delivery.id, 'in-transit')}
                                className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors font-medium flex items-center gap-1"
                              >
                                <FaRoute className="text-white" /> Start
                              </button>
                            )}
                            {delivery.status === 'in-transit' && (
                              <button
                                onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                                className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors font-medium flex items-center gap-1"
                              >
                                <FaCheckCircle className="text-white" /> Done
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Contact Seller Modal */}
      {showContactSellerModal && selectedSellerOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeContactSellerModal}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-bold text-gray-900 flex items-center gap-2">
                        <FaUser className="text-blue-500" /> Contact Seller
                      </h3>
                      <button onClick={closeContactSellerModal} className="text-gray-400 hover:text-gray-600">
                        <FaTimes className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-4">
                      {/* Seller Details */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <h4 className="font-semibold text-blue-800 mb-2">{selectedSellerOrder.seller.organization}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                          <FaUser className="text-blue-400" /> {selectedSellerOrder.seller.name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FaPhone className="text-blue-400" /> {selectedSellerOrder.seller.phone}
                        </div>
                        <a
                          href={`tel:${selectedSellerOrder.seller.phone}`}
                          className="mt-3 flex items-center justify-center gap-2 w-full py-2 px-4 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                        >
                          <FaPhone /> Call Seller
                        </a>
                      </div>

                      {/* Chat Area */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-2 border-b border-gray-200 text-xs font-semibold text-gray-500">
                          Order #{selectedSellerOrder.orderId} • {selectedSellerOrder.items.join(", ")}
                        </div>
                        <div className="h-64 overflow-y-auto p-3 bg-white space-y-3 flex flex-col">
                          {chatMessages.length === 0 ? (
                            <div className="text-center text-gray-400 my-auto text-sm">
                              Start a conversation with the seller...
                            </div>
                          ) : (
                            chatMessages.map((msg, index) => (
                              <div key={index} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.sender === 'me'
                                  ? 'bg-blue-600 text-white rounded-br-none'
                                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                  }`}>
                                  <p>{msg.text}</p>
                                  <p className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {msg.time}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Message Input */}
                        <div className="p-2 bg-gray-50 border-t border-gray-200 flex gap-2">
                          <input
                            type="text"
                            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <button
                            onClick={handleSendMessage}
                            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center h-9 w-9"
                          >
                            <FaEnvelope className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Admin Modal */}
      {showContactAdminModal && adminUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeContactAdminModal}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-bold text-gray-900 flex items-center gap-2">
                        <FaUser className="text-red-500" /> Contact Admin
                      </h3>
                      <button onClick={closeContactAdminModal} className="text-gray-400 hover:text-gray-600">
                        <FaTimes className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-4">
                      {/* Admin Details */}
                      <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
                        <h4 className="font-semibold text-red-800 mb-2">System Administrator</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                          <FaUser className="text-red-400" /> {adminUser.name}
                        </div>
                        {adminUser.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <FaPhone className="text-red-400" /> {adminUser.phone}
                          </div>
                        )}
                      </div>

                      {/* Chat Area */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-2 border-b border-gray-200 text-xs font-semibold text-gray-500">
                          Direct Support Chat
                        </div>
                        <div className="h-64 overflow-y-auto p-3 bg-white space-y-3 flex flex-col">
                          {chatMessages.length === 0 ? (
                            <div className="text-center text-gray-400 my-auto text-sm">
                              Start a conversation with the support team...
                            </div>
                          ) : (
                            chatMessages.map((msg, index) => (
                              <div key={index} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.sender === 'me'
                                  ? 'bg-blue-600 text-white rounded-br-none'
                                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                  }`}>
                                  <p>{msg.text}</p>
                                  <p className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {msg.time}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Message Input */}
                        <div className="p-2 bg-gray-50 border-t border-gray-200 flex gap-2">
                          <input
                            type="text"
                            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendAdminMessage()}
                          />
                          <button
                            onClick={handleSendAdminMessage}
                            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center h-9 w-9"
                          >
                            <FaEnvelope className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowSupportModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaHeadset className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Support & Communication</h3>
                      <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => setShowSupportModal(false)}>
                        <FaTimes className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div onClick={openContactAdminModal} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full text-blue-600"><FaUser /></div>
                          <div>
                            <h4 className="font-bold text-gray-800">Contact Admin</h4>
                            <p className="text-xs text-gray-500">For account issues and disputes</p>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          const targetOrder = deliveries.find(d =>
                            (d.status === 'in-transit' || d.status === 'pending') && d.seller
                          ) || deliveries.find(d => d.seller);

                          if (targetOrder) {
                            setShowSupportModal(false);
                            openContactSellerModal(targetOrder);
                          } else {
                            alert("No linked seller information found in your current deliveries.");
                          }
                        }}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-full text-green-600"><FaShoppingCart /></div>
                          <div>
                            <h4 className="font-bold text-gray-800">Contact Seller</h4>
                            <p className="text-xs text-gray-500">For order details and pickup info</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-full text-purple-600"><FaComments /></div>
                          <div>
                            <h4 className="font-bold text-gray-800">In-App Chat</h4>
                            <p className="text-xs text-gray-500">Chat with support team (Coming Soon)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setShowSupportModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;