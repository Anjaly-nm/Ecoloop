import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaTruck,
  FaCheck,
  FaTimes,
  FaArrowLeft,
  FaSearch,
  FaBoxOpen,
  FaMapMarkerAlt,
  FaUser,
  FaClipboardList,
  FaInfoCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AssignDeliveryBoy = () => {
  const navigate = useNavigate();
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wardAssignments, setWardAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch delivery boys, orders, and existing ward assignments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch delivery boys
        const deliveryBoysResponse = await axios.get('http://localhost:4321/api/user/delivery-boys', {
          headers: { token }
        });
        setDeliveryBoys(Array.isArray(deliveryBoysResponse.data) ? deliveryBoysResponse.data : []);

        // Fetch orders (for reference list)
        const ordersResponse = await axios.get('http://localhost:4321/api/orders/pending-delivery', {
          headers: { token }
        });
        setOrders(ordersResponse.data.orders || []);

        // Fetch existing ward assignments
        const assignmentsResponse = await axios.get('http://localhost:4321/api/user/delivery-boy-assignments', {
          headers: { token }
        });
        setWardAssignments(assignmentsResponse.data || []);

        setError('');
      } catch (err) {
        setError('Failed to fetch data: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter orders based on search term and status
  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    const orderNumber = order._id?.toString() || '';
    const customerName = order.userId?.name?.toLowerCase() || '';
    const matchesSearch = orderNumber.includes(searchTerm.toLowerCase()) ||
      customerName.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) : [];

  // Extract unique wards from orders
  const availableWards = [...new Set(filteredOrders
    .map(order => order.userId?.wardNumber)
    .filter(ward => ward !== undefined && ward !== null)
  )].sort((a, b) => a - b);

  // Get current assignment for selected ward
  const currentWardAssignment = wardAssignments.find(a => a.wardNumber === selectedWard);

  // Handle assignment (Ward -> Delivery Boy)
  const handleAssign = async () => {
    if (!selectedDeliveryBoy || !selectedWard) {
      setError('Please select both a delivery boy and a ward');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post('http://localhost:4321/api/user/assign-delivery-boy', {
        wardNumber: selectedWard,
        deliveryBoyId: selectedDeliveryBoy
      }, {
        headers: { token }
      });

      // Update local assignments state
      const newAssignment = response.data.assignment;
      setWardAssignments(prev => {
        // Remove old assignment for this ward if exists
        const filtered = prev.filter(a => a.wardNumber !== String(selectedWard));
        return [...filtered, newAssignment];
      });

      // Optional: Update displayed orders locally if needed? 
      // The backend auto-assigns logic happens on 'ready' status update, 
      // but purely for visual consistency, we assume new orders will pick up this rule.

      setSelectedDeliveryBoy('');
      setSelectedWard('');
      setError('');
      alert(`Successfully assigned Delivery Boy to Ward ${selectedWard}!`);
    } catch (err) {
      setError('Failed to assign delivery boy: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOrderSelect = (wardNumber) => {
    if (!wardNumber) return;
    const wardStr = wardNumber.toString();
    setSelectedWard(wardStr === selectedWard ? '' : wardStr);

    // Auto-scroll to top on mobile when selecting
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/shop-management')}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                title="Back to Shop Management"
              >
                <FaArrowLeft />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                    <FaTruck />
                  </span>
                  Logistics Command Center
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Manage ward-based delivery assignments</p>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-500">
              {orders.filter(o => o.status === 'pending').length} Pending Orders
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg shadow-sm flex items-start gap-3 animate-fade-in">
            <FaTimes className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Panel: Controls & Assignment (Sticky on Desktop) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
                <FaClipboardList className="text-emerald-500" />
                Ward Assignment Rule
              </h2>

              <div className="space-y-6">

                {/* 1. Select Ward FIRST (Logic Flip) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    1. Select Ward
                  </label>
                  <div className="relative">
                    <select
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer hover:border-gray-300"
                    >
                      <option value="">Choose ward...</option>
                      {availableWards.map(ward => (
                        <option key={ward} value={ward}>
                          Ward {ward}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                      <FaMapMarkerAlt />
                    </div>
                  </div>

                  {/* Show Current Assignment Info */}
                  {selectedWard && (
                    <div className="mt-3 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg flex items-start gap-2 border border-blue-100">
                      <FaInfoCircle className="mt-0.5" />
                      <div>
                        {currentWardAssignment ? (
                          <>
                            <span className="font-semibold">Current:</span> Assigned to
                            <span className="font-bold ml-1">{currentWardAssignment.deliveryBoyId?.name || 'Unknown'}</span>
                          </>
                        ) : (
                          <span>No delivery boy currently assigned to Ward {selectedWard}.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Select Partner */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    2. Assign Delivery Partner
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDeliveryBoy}
                      onChange={(e) => setSelectedDeliveryBoy(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer hover:border-gray-300"
                    >
                      <option value="">Choose partner...</option>
                      {deliveryBoys.map(boy => (
                        <option key={boy._id} value={boy._id}>
                          {boy.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                      <FaUser />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleAssign}
                    disabled={!selectedDeliveryBoy || !selectedWard}
                    className="w-full bg-emerald-600 text-white py-3.5 px-4 rounded-xl font-medium shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 transform hover:-translate-y-0.5 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none flex items-center justify-center gap-2"
                  >
                    <span>Update Assignment</span>
                    <FaCheck />
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-3">
                    Orders becoming 'Ready' in Ward {selectedWard || '...'} will be auto-assigned to this partner.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Orders List */}
          <div className="lg:col-span-8 space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-24 z-10 lg:static">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Order ID or Customer Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-100 text-gray-700 placeholder-gray-400"
                  />
                </div>
                <div className="sm:w-48 flex-shrink-0">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-100 text-gray-700 cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="ready">Ready</option>
                    <option value="assigned">Assigned</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaBoxOpen className="text-gray-300 text-3xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredOrders.map(order => {
                  const isSelected = selectedWard === order.userId?.wardNumber?.toString();
                  // Find assignment for this order's ward
                  const orderWardAssignment = wardAssignments.find(a => a.wardNumber === String(order.userId?.wardNumber));

                  return (
                    <div
                      key={order._id}
                      onClick={() => handleOrderSelect(order.userId?.wardNumber)}
                      className={`group bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden relative
                        ${isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-lg transform scale-[1.01]'
                          : 'border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200'
                        }`}
                    >
                      {/* Selection Indicator Stripe */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1.5 transition-colors duration-200 
                        ${isSelected ? 'bg-emerald-500' : 'bg-transparent group-hover:bg-emerald-200'}`}
                      />

                      <div className="p-5 pl-7">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-mono text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                #{order._id?.slice(-6).toUpperCase()}
                              </span>
                              <h3 className="font-bold text-gray-900 text-lg">
                                {order.userId?.name || 'Guest User'}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <FaMapMarkerAlt className="text-gray-400" />
                              <span>{order.shippingAddress?.address || 'No address provided'}</span>
                              <span className="text-gray-300">•</span>
                              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">
                                Ward {order.userId?.wardNumber || 'N/A'}
                              </span>
                              {/* Show assignment badge if ward has rule */}
                              {orderWardAssignment && (
                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 border border-blue-100">
                                  <FaClipboardList className="text-[10px]" />
                                  Rule: {orderWardAssignment.deliveryBoyId?.name}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              order.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                order.status === 'ready' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                  order.status === 'assigned' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-gray-100 text-gray-600 border-gray-200'
                              }`}>
                              {order.status}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                              {new Date().toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {/* Placeholder avatars for items - purely visual */}
                              {[...Array(Math.min(3, order.items?.length || 0))].map((_, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] text-gray-500 font-bold">
                                  <FaBoxOpen />
                                </div>
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-600 ml-2">
                              {order.items?.length || 0} Items
                            </span>
                          </div>

                          {order.status === 'assigned' ? (
                            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-xs font-medium text-emerald-700">
                                Assigned to {order.deliveryBoyName || 'Partner'}
                              </span>
                            </div>
                          ) : (
                            <button className={`text-sm font-medium transition-colors ${isSelected ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-500'
                              }`}>
                              {isSelected ? 'Ward Selected' : 'Click to Select Ward'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignDeliveryBoy;