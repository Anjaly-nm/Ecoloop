import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { FaStore, FaUsers, FaBox, FaSync, FaSearch, FaFilter, FaArrowLeft, FaEllipsisV, FaLeaf, FaChartLine } from 'react-icons/fa';

const ShopManagement = () => {
  const [activeTab, setActiveTab] = useState('sellers');
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productsWithSellers, setProductsWithSellers] = useState({}); // Cache for product-seller mappings
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Loading states for individual sections
  const [sellersLoading, setSellersLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Refs for debouncing
  const searchTimeoutRef = useRef(null);

  // Function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const base = process.env.REACT_APP_API_URL || "http://localhost:4321";
    // If the image path is already a full URL, return it as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Otherwise, prepend the base URL
    return `${base}${imagePath}`;
  };

  // Fetch data for the active tab only
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      try {
        // Load only the data needed for the active tab initially
        if (activeTab === 'sellers') {
          await fetchSellers();
        } else if (activeTab === 'products') {
          await fetchProducts();
        } else {
          await fetchOrders();
        }
      } catch (err) {
        setError('Initial load failed: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    initialLoad();
  }, []);

  // Memoize fetch functions to prevent unnecessary re-renders
  const fetchSellers = useCallback(async () => {
    try {
      setSellersLoading(true);
      const token = localStorage.getItem('token');

      // Check if we have a token
      if (!token) {
        setError('Authentication required: Please log in as admin');
        setSellersLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:4321/api/user/sellers', {
        headers: {
          token: token
        }
      });

      // Process seller data to ensure proper field names
      const processedSellers = response.data.map(seller => ({
        ...seller,
        name: seller.name || (seller.firstName ? (seller.firstName + ' ' + (seller.lastName || '')) : 'Unknown Seller'),
        organization: seller.organization || seller.shopName || seller.businessName || 'N/A',
        businessType: seller.businessType || seller.shopType || seller.role || 'Seller',
        email: seller.email || 'N/A',
        phone: seller.phone || seller.phoneNumber || 'N/A',
        username: seller.username || seller.email?.split('@')[0] || 'unknown',
        profilePicture: seller.profilePicture || seller.avatar || null,
        ecoPoints: seller.ecoPoints || seller.points || 0,
        createdAt: seller.createdAt || seller.joinedDate || new Date().toISOString()
      }));

      setSellers(processedSellers);
      setError('');
    } catch (err) {
      setError('Failed to fetch sellers: ' + (err.response?.data?.message || err.message));
    } finally {
      setSellersLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const response = await axios.get('http://localhost:4321/api/product/all');
      setProducts(response.data.products);
      setError('');
    } catch (err) {
      setError('Failed to fetch products: ' + (err.response?.data?.message || err.message));
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Optimized fetchOrders function to avoid nested Promise.all
  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const token = localStorage.getItem('token');

      // Check if we have a token
      if (!token) {
        setError('Authentication required: Please log in as admin');
        setOrdersLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:4321/api/orders/all', {
        headers: {
          token: token
        }
      });

      // Pre-fetch all unique product IDs to minimize API calls
      const uniqueProductIds = new Set();
      response.data.orders.forEach(order => {
        order.items.forEach(item => {
          uniqueProductIds.add(item.productId);
        });
      });

      // Batch fetch product information
      const productPromises = [];
      const productFetchCache = {};

      for (const productId of uniqueProductIds) {
        if (productsWithSellers[productId]) {
          productFetchCache[productId] = productsWithSellers[productId];
        } else {
          productPromises.push(
            axios.get(`http://localhost:4321/api/product/${productId}`)
              .then(res => ({ productId, data: res.data }))
              .catch(err => ({
                productId,
                data: { seller_id: { name: 'N/A', organization: 'N/A' }, sellerName: 'N/A', organization: 'N/A' }
              }))
          );
        }
      }

      // Execute all pending product fetches
      const productResults = await Promise.all(productPromises);
      productResults.forEach(result => {
        const { productId, data } = result;
        const sellerInfo = {
          name: data.seller_id?.name || data.sellerName || 'N/A',
          organization: data.seller_id?.organization || data.organization || 'N/A'
        };

        productFetchCache[productId] = sellerInfo;

        // Update cache
        setProductsWithSellers(prev => ({
          ...prev,
          [productId]: sellerInfo
        }));
      });

      // Build the enhanced orders
      const enhancedOrders = response.data.orders.map(order => {
        const enhancedItems = order.items.map(item => {
          // Check cache first
          let sellerInfo = productsWithSellers[item.productId] || productFetchCache[item.productId];

          if (!sellerInfo) {
            sellerInfo = { name: 'N/A', organization: 'N/A' };
          }

          return {
            ...item,
            sellerInfo
          };
        });

        return {
          ...order,
          items: enhancedItems
        };
      });

      setOrders(enhancedOrders);
      setError('');
    } catch (err) {
      setError('Failed to fetch orders: ' + (err.response?.data?.message || err.message));
    } finally {
      setOrdersLoading(false);
    }
  }, [productsWithSellers]);

  // Handle tab change - fetch data only when tab is switched
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);

    // Only fetch data if it's not already loaded
    if (tab === 'sellers' && sellers.length === 0) {
      fetchSellers();
    } else if (tab === 'products' && products.length === 0) {
      fetchProducts();
    } else if (tab === 'orders' && orders.length === 0) {
      fetchOrders();
    }
  }, [sellers.length, products.length, orders.length, fetchSellers, fetchProducts, fetchOrders]);

  const handleRefresh = useCallback(() => {
    if (activeTab === 'sellers') {
      fetchSellers();
    } else if (activeTab === 'products') {
      fetchProducts();
    } else {
      fetchOrders();
    }
  }, [activeTab, fetchSellers, fetchProducts, fetchOrders]);

  // Debounced search handler
  const handleSearchChange = useCallback((e) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setSearchTerm(e.target.value);
  }, []);

  // Memoized filtered data to prevent recalculation on every render
  const filteredSellers = useMemo(() => {
    if (!searchTerm) return sellers;
    return sellers.filter(seller =>
      seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sellers, searchTerm]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.seller_id?.name && product.seller_id.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.seller_id?.username && product.seller_id.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    return orders.filter(order =>
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userId?.name && order.userId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.userId?.email && order.userId.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const handleBack = () => {
    window.history.back();
  };

  // Calculate stats once to prevent recalculation
  const stats = useMemo(() => ({
    totalSellers: sellers.length,
    activeShops: sellers.filter(s => s.status !== 'inactive').length,
    totalProducts: products.length,
    totalOrders: orders.length,
  }), [sellers, products, orders]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-50 to-gray-100 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <FaStore className="text-gray-800 text-xl mr-2" />
            <h1 className="text-gray-800 text-lg font-bold">EcoLoop Admin</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-600 hover:text-gray-800"
          >
            <FaEllipsisV />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => handleTabChange('sellers')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${activeTab === 'sellers'
                    ? 'bg-blue-100 text-blue-800 shadow'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  }`}
              >
                <FaUsers className="mr-3" />
                <span>Sellers</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('products')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${activeTab === 'products'
                    ? 'bg-blue-100 text-blue-800 shadow'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  }`}
              >
                <FaBox className="mr-3" />
                <span>Products</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTabChange('orders')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${activeTab === 'orders'
                    ? 'bg-blue-100 text-blue-800 shadow'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  }`}
              >
                <FaBox className="mr-3" />
                <span>Orders</span>
              </button>
            </li>
            <li>
              <a href="/admin/SystemReports" className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors duration-200">
                <FaChartLine className="mr-3" />
                <span>Analytics</span>
              </a>
            </li>
            <li>
              <a href="/settings" className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors duration-200">
                <FaBox className="mr-3" />
                <span>Settings</span>
              </a>
            </li>
            <li>
              <a href="/admin/assign-delivery-boy" className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors duration-200">
                <FaUsers className="mr-3" />
                <span>Delivery Boy Assign</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm lg:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Shop Management</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-100"
            >
              <FaEllipsisV />
            </button>
          </div>
        </header>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {/* Header */}
          <div className="mb-6 hidden lg:block">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <button
                  onClick={handleBack}
                  className="flex items-center text-gray-600 hover:text-green-600 mb-1"
                >
                  <FaArrowLeft className="mr-1" /> Back
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Sellers & Shop Management</h1>
                <p className="text-gray-600 text-sm mt-1">Manage sellers and their products in the marketplace</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleRefresh}
                  className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm text-sm"
                >
                  <FaSync className="mr-1" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl shadow-md p-4 text-gray-800 border border-blue-100">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FaUsers className="text-white text-xl" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-600">Total Sellers</h3>
                  <p className="text-xl font-bold text-blue-700">{stats.totalSellers}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl shadow-md p-4 text-gray-800 border border-green-100">
              <div className="flex items-center">
                <div className="p-2 bg-green-500 rounded-lg">
                  <FaStore className="text-white text-xl" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-600">Active Shops</h3>
                  <p className="text-xl font-bold text-green-700">
                    {stats.activeShops}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl shadow-md p-4 text-gray-800 border border-purple-100">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <FaBox className="text-white text-xl" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-600">Total Products</h3>
                  <p className="text-xl font-bold text-purple-700">{stats.totalProducts}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl shadow-md p-4 text-gray-800 border border-yellow-100">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-500 rounded-lg">
                  <FaBox className="text-white text-xl" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
                  <p className="text-xl font-bold text-yellow-700">{stats.totalOrders}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap -mb-px">
                <button
                  onClick={() => handleTabChange('sellers')}
                  className={`flex-1 md:flex-none py-4 px-5 text-center font-medium text-sm transition-all duration-200 ${activeTab === 'sellers'
                      ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <FaUsers className="mr-2 text-base" />
                    <span className="font-medium">Sellers</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('products')}
                  className={`flex-1 md:flex-none py-4 px-5 text-center font-medium text-sm transition-all duration-200 ${activeTab === 'products'
                      ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <FaBox className="mr-2 text-base" />
                    <span className="font-medium">Products</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('orders')}
                  className={`flex-1 md:flex-none py-4 px-5 text-center font-medium text-sm transition-all duration-200 ${activeTab === 'orders'
                      ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <FaBox className="mr-2 text-base" />
                    <span className="font-medium">Orders</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search sellers or products..."
                  className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-200 bg-white"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleRefresh}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition duration-200 shadow-md text-sm"
                >
                  <FaSync className="mr-1" />
                  <span className="text-sm">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl p-5 mb-8 shadow-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-red-800">Error</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {(sellersLoading || productsLoading || ordersLoading) && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-500"></div>
            </div>
          )}

          {/* Sellers Tab */}
          {activeTab === 'sellers' && !sellersLoading && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Seller
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Organization
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Eco Points
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSellers.length > 0 ? (
                      filteredSellers.map((seller) => (
                        <tr key={seller._id} className="hover:bg-blue-50 transition-colors duration-150">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {seller.profilePicture ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover border border-blue-200"
                                    src={getImageUrl(seller.profilePicture)}
                                    alt={seller.name}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div
                                  className="bg-gradient-to-br from-blue-100 to-blue-200 border border-dashed border-blue-300 rounded-full w-10 h-10 flex items-center justify-center"
                                  style={{ display: seller.profilePicture ? 'none' : 'flex' }}
                                >
                                  <FaUsers className="text-blue-600 text-sm" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{seller.name}</div>
                                <div className="text-xs text-gray-500">@{seller.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {seller.organization || seller.shopName || seller.businessName || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {seller.businessType || seller.shopType || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{seller.email}</div>
                            <div className="text-xs text-gray-500">{seller.phone}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {seller.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">
                            <span className="inline-flex items-center">
                              <FaLeaf className="text-green-500 mr-1 text-xs" />
                              {seller.ecoPoints || 0} pts
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {new Date(seller.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FaUsers className="text-gray-300 text-4xl mb-3" />
                            <h3 className="text-base font-medium text-gray-900 mb-1">No sellers found</h3>
                            <p className="text-sm text-gray-500">
                              {searchTerm ? 'No sellers match your search criteria.' : 'There are currently no sellers in the system.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && !productsLoading && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Seller
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Stock
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr key={product._id} className="hover:bg-blue-50 transition-colors duration-150">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {product.image ? (
                                  <img
                                    className="h-10 w-10 rounded-md object-cover border border-blue-200"
                                    src={getImageUrl(product.image)}
                                    alt={product.name}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div
                                  className="bg-gradient-to-br from-blue-100 to-blue-200 border border-dashed border-blue-300 rounded-md w-10 h-10 flex items-center justify-center"
                                  style={{ display: product.image ? 'none' : 'flex' }}
                                >
                                  <FaBox className="text-blue-600 text-sm" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-xs text-gray-500">{product.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {product.seller_id?.name || 'Unknown Seller'}
                            </div>
                            <div className="text-xs text-gray-500">
                              @{product.seller_id?.username || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{product.price}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            <span className="inline-flex items-center">
                              {product.stock} <span className="ml-1 text-gray-500">units</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${product.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {product.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FaBox className="text-gray-300 text-4xl mb-3" />
                            <h3 className="text-base font-medium text-gray-900 mb-1">No products found</h3>
                            <p className="text-sm text-gray-500">
                              {searchTerm ? 'No products match your search criteria.' : 'There are currently no products in the system.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && !ordersLoading && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Seller
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Products
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Total
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-blue-50 transition-colors duration-150">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{order._id?.substring(0, 8)}...</div>
                            <div className="text-xs text-gray-500">{order.paymentId?.substring(0, 8) || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {order.userId?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.userId?.email || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {order.items && order.items.length > 0 ?
                                (() => {
                                  // Get unique seller names from all items in the order
                                  const sellerNames = [...new Set(order.items.map(item =>
                                    item.sellerInfo?.name || 'N/A'
                                  ))];
                                  return sellerNames.length === 1 ?
                                    sellerNames[0] :
                                    `${sellerNames.length} sellers`;
                                })()
                                : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.items && order.items.length > 0 ?
                                (() => {
                                  // Get unique organizations from all items in the order
                                  const organizations = [...new Set(order.items.map(item =>
                                    item.sellerInfo?.organization || 'N/A'
                                  ))];
                                  return organizations.length === 1 ?
                                    organizations[0] :
                                    'Multiple organizations';
                                })()
                                : 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs text-gray-700">
                              {order.items?.length > 0 ? `${order.items.length} items` : '0 items'}
                            </div>
                            {order.items && order.items.slice(0, 2).map((item, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                {item.name} (x{item.quantity})
                              </div>
                            ))}
                            {order.items && order.items.length > 2 && (
                              <div className="text-xs text-gray-500">+{order.items.length - 2} more</div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{order.totalAmount || 0}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${order.status === 'delivered' || order.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'pending' || order.status === 'confirmed'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : order.status === 'shipped'
                                    ? 'bg-blue-100 text-blue-800'
                                    : order.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                              }`}>
                              {order.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FaBox className="text-gray-300 text-4xl mb-3" />
                            <h3 className="text-base font-medium text-gray-900 mb-1">No orders found</h3>
                            <p className="text-sm text-gray-500">
                              {searchTerm ? 'No orders match your search criteria.' : 'There are currently no orders in the system.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default ShopManagement;