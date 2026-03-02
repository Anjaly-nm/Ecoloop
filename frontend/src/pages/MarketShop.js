import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaLeaf,
  FaShoppingCart,
  FaSearch,
  FaRecycle,
  FaBars,
  FaTimes,
  FaTruck,
  FaShieldAlt,
  FaHandsHelping,
  FaHeadset,
  FaArrowLeft,
  FaChevronRight,
  FaAward,
  FaSeedling,
  FaStar,
  FaImage
} from "react-icons/fa";

const MarketShop = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(3);

  // Categories with actual images from public/images
  const categories = [
    {
      id: 1,
      name: "Recycled Plastic Products",
      description: "Innovative items made from recycled plastics",
      icon: <FaRecycle className="text-3xl text-green-600" />,
      image: "/images/plastic.png" // Actual image from public/images
    },
    {
      id: 2,
      name: "Organic Compost & Fertilizers",
      description: "Natural nutrients for your garden",
      icon: <FaSeedling className="text-3xl text-green-600" />,
      image: "/images/fertilizer.jpg" // Actual image from public/images
    },
    {
      id: 3,
      name: "Recycled Paper Products",
      description: "Sustainable paper alternatives",
      icon: <FaRecycle className="text-3xl text-green-600" />,
      image: "/images/pap.png" // Actual image from public/images
    },
    {
      id: 4,
      name: "Eco-Friendly Household Items",
      description: "Green alternatives for everyday life",
      icon: <FaLeaf className="text-3xl text-green-600" />,
      image: "/images/ham.png" // Actual image from public/images
    }
  ];

  // Products with actual images from public/images
  const products = [
    {
      id: 1,
      name: "Recycled Plastic Water Bottle",
      category: "Recycled Plastic Products",
      price: 12.99,
      ecoBadge: "Recycled",
      rating: 4.8,
      image: "/images/water-bottle.jpg" // Actual image from public/images
    },
    {
      id: 2,
      name: "Organic Compost Fertilizer",
      category: "Organic Compost & Fertilizers",
      price: 24.99,
      ecoBadge: "Organic",
      rating: 4.9,
      image: "/images/fertilizer.jpg" // Actual image from public/images
    },
    {
      id: 3,
      name: "Recycled Notebook Set",
      category: "Recycled Paper Products",
      price: 15.99,
      ecoBadge: "Recycled",
      rating: 4.7,
      image: "/images/pap.png" // Actual image from public/images
    },
    {
      id: 4,
      name: "Bamboo Toothbrush Set",
      category: "Eco-Friendly Household Items",
      price: 8.99,
      ecoBadge: "Organic",
      rating: 4.6,
      image: "/images/toothbrush.png" // Actual image from public/images
    },
    {
      id: 5,
      name: "Recycled Plastic Storage Box",
      category: "Recycled Plastic Products",
      price: 19.99,
      ecoBadge: "Recycled",
      rating: 4.5,
      image: "/images/plastic.png" // Actual image from public/images
    },
    {
      id: 6,
      name: "Organic Plant Food",
      category: "Organic Compost & Fertilizers",
      price: 17.99,
      ecoBadge: "Organic",
      rating: 4.8,
      image: "/images/organic3.jpg" // Actual image from public/images
    }
  ];

  // Features data
  const features = [
    {
      icon: <FaTruck className="text-3xl text-green-600" />,
      title: "Eco Delivery",
      description: "Carbon-neutral shipping with biodegradable packaging"
    },
    {
      icon: <FaShieldAlt className="text-3xl text-green-600" />,
      title: "Secure Payments",
      description: "Safe transactions with encrypted payment processing"
    },
    {
      icon: <FaHandsHelping className="text-3xl text-green-600" />,
      title: "Recycling Support",
      description: "We help you recycle old items responsibly"
    },
    {
      icon: <FaHeadset className="text-3xl text-green-600" />,
      title: "24/7 Customer Service",
      description: "Expert support for all your eco-shopping needs"
    }
  ];

  const handleAddToCart = (productId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setCartCount(cartCount + 1);
    // In a real app, you would add the product to the cart
    console.log(`Added product ${productId} to cart`);
  };

  // Function to render category image with fallback
  const renderCategoryImage = (category) => {
    if (category.image) {
      return (
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/images/image.png";
          }}
        />
      );
    } else {
      return (
        <div className="w-full h-full bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center">
          <div className="text-center">
            <FaImage className="text-green-500 text-4xl mx-auto mb-2" />
            <span className="text-green-700 text-sm font-medium">No Image</span>
          </div>
        </div>
      );
    }
  };

  // Function to render product image with fallback
  const renderProductImage = (product) => {
    if (product.image) {
      return (
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/images/image.png";
          }}
        />
      );
    } else {
      return (
        <div className="w-full h-full bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center">
          <div className="text-center">
            <FaImage className="text-green-500 text-4xl mx-auto mb-2" />
            <span className="text-green-700 text-sm font-medium">No Image</span>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            {/* Logo and Back Button */}
            <div className="flex items-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center text-green-700 hover:text-green-900 mr-6 group transition-all duration-300"
              >
                <FaArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
              <div className="flex-shrink-0 flex items-center">
                <FaLeaf className="h-10 w-10 text-green-600 animate-pulse" />
                <span className="ml-3 text-2xl font-bold text-gray-900 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Ecoloop<span className="text-green-600">Market</span>
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button type="button" onClick={() => navigate('/')} className="text-gray-700 hover:text-green-700 font-medium transition-colors duration-300 relative group">
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button type="button" onClick={() => navigate('/market-shop')} className="text-gray-700 hover:text-green-700 font-medium transition-colors duration-300 relative group">
                Shop
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button type="button" onClick={() => { }} className="text-gray-700 hover:text-green-700 font-medium transition-colors duration-300 relative group">
                Categories
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button type="button" onClick={() => navigate('/about')} className="text-gray-700 hover:text-green-700 font-medium transition-colors duration-300 relative group">
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button type="button" onClick={() => navigate('/contact')} className="text-gray-700 hover:text-green-700 font-medium transition-colors duration-300 relative group">
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 transition-all duration-300 group-hover:w-full"></span>
              </button>
            </div>

            {/* Search and Cart */}
            <div className="flex items-center">
              <div className="hidden md:flex items-center bg-white border-2 border-green-100 rounded-full px-5 py-2.5 mr-6 transition-all hover:border-green-300 shadow-sm hover:shadow-md">
                <FaSearch className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search eco products..."
                  className="bg-transparent border-0 focus:ring-0 ml-3 w-48 placeholder-gray-400 focus:outline-none"
                />
              </div>

              <button className="relative p-3 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
                <FaShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-green-600 rounded-full animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center ml-6">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-700 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition-all"
                >
                  {isMenuOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-green-100 animate-fadeIn">
            <div className="px-4 pt-4 pb-6 space-y-2 bg-white">
              <button
                onClick={() => { navigate("/dashboard"); setIsMenuOpen(false); }}
                className="flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-green-50 transition-all duration-300"
              >
                <FaArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
              <button type="button" onClick={() => navigate('/')} className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 transition-all duration-300">Home</button>
              <button type="button" onClick={() => navigate('/market-shop')} className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 transition-all duration-300">Shop</button>
              <button type="button" onClick={() => { }} className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 transition-all duration-300">Categories</button>
              <button type="button" onClick={() => navigate('/about')} className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 transition-all duration-300">About</button>
              <button type="button" onClick={() => navigate('/contact')} className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 transition-all duration-300">Contact</button>
              <div className="px-4 py-3">
                <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                  <FaSearch className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search eco products..."
                    className="bg-transparent border-0 focus:ring-0 ml-2 w-full focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxkZWZzPgogICAgPHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCBMIDAgNDAgTCA0MCA0MCBaIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz4KPC9zdmc+')] opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40 flex flex-col items-center text-center">
          <div className="mb-6 animate-bounce">
            <FaLeaf className="h-16 w-16 text-green-200 mx-auto" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-fadeInDown">
            Sustainable Living Starts Here
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-green-100 max-w-3xl animate-fadeInUp">
            Discover our curated collection of recycled and organic products that help reduce waste while enhancing your lifestyle. Join the circular economy movement today.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-6 animate-fadeIn">
            <button
              onClick={() => {
                const token = localStorage.getItem("token");
                if (token) {
                  navigate('/products');
                } else {
                  navigate('/login?redirect=/products');
                }
              }}
              className="px-10 py-5 bg-white text-green-700 font-bold rounded-xl shadow-2xl hover:bg-gray-100 transition duration-300 transform hover:scale-105 text-lg flex items-center justify-center group"
            >
              Shop Eco Products
              <FaChevronRight className="ml-2 group-hover:translate-y-[-2px] transition-transform" />
            </button>
            <button className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-green-700 transition duration-300 text-lg flex items-center justify-center group">
              Learn More
              <FaChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 animate-fadeIn">Shop by Category</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fadeIn">
              Explore our sustainable product categories designed to help you live an eco-friendly lifestyle
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="bg-gradient-to-br from-white to-green-50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-green-100 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-52 overflow-hidden relative">
                  {renderCategoryImage(category)}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-8">
                  <div className="flex justify-center mb-6">
                    {category.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center group-hover:text-green-700 transition-colors">{category.name}</h3>
                  <p className="text-gray-600 text-center mb-6">{category.description}</p>
                  <button className="w-full py-3.5 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-teal-600 transition duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02]">
                    Explore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 animate-fadeIn">Featured Eco Products</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fadeIn">
              Handpicked sustainable items that combine quality with environmental responsibility
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  <div className="h-64 overflow-hidden">
                    {renderProductImage(product)}
                  </div>
                  <span className={`absolute top-4 left-4 px-3.5 py-1.5 rounded-full text-sm font-bold shadow-lg ${product.ecoBadge === "Recycled"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                    }`}>
                    {product.ecoBadge}
                  </span>
                  <div className="absolute top-4 right-4 flex items-center bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-md">
                    <FaStar className="text-yellow-400" />
                    <span className="ml-1 font-bold text-gray-800">{product.rating || "N/A"}</span>
                  </div>
                </div>
                <div className="p-7">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">{product.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{product.category}</p>
                    </div>
                    <div className="text-2xl font-bold text-green-700">₹{product.price.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="mt-6 w-full py-3.5 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-teal-600 transition duration-300 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    <FaShoppingCart className="mr-2" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16 animate-fadeIn">
            <button
              onClick={() => {
                const token = localStorage.getItem("token");
                if (token) {
                  navigate('/products');
                } else {
                  navigate('/login?redirect=/products');
                }
              }}
              className="px-10 py-4 bg-gradient-to-r from-white to-green-50 border-2 border-green-500 text-green-700 font-bold rounded-xl hover:from-green-50 hover:to-green-100 transition duration-300 shadow-lg hover:shadow-xl text-lg flex items-center justify-center mx-auto group"
            >
              View All Products
              <FaChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 animate-fadeIn">Why Choose Ecoloop Market?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fadeIn">
              We're committed to making sustainable shopping easy, rewarding, and impactful
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-8 bg-gradient-to-br from-green-50 to-white rounded-2xl hover:shadow-xl transition duration-300 border border-green-100 group hover:border-green-300 transform hover:-translate-y-2"
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors duration-300">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-700 transition-colors">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sustainability Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fadeInLeft">
              <h2 className="text-4xl font-bold mb-8">Our Commitment to Sustainability</h2>
              <p className="text-xl mb-8 text-green-100">
                At Ecoloop Market, we believe in the power of the circular economy to create a better world. Every purchase you make helps reduce waste, conserve resources, and support communities.
              </p>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white text-green-600 font-bold">
                      <FaAward />
                    </div>
                  </div>
                  <p className="ml-4 text-green-100 text-lg">
                    <span className="font-bold">Zero Waste Packaging:</span> All products are shipped in 100% recyclable or compostable materials
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white text-green-600 font-bold">
                      <FaAward />
                    </div>
                  </div>
                  <p className="ml-4 text-green-100 text-lg">
                    <span className="font-bold">Carbon Neutral Shipping:</span> We offset all shipping emissions through verified carbon credit programs
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white text-green-600 font-bold">
                      <FaAward />
                    </div>
                  </div>
                  <p className="ml-4 text-green-100 text-lg">
                    <span className="font-bold">Community Impact:</span> 5% of profits support local recycling initiatives and environmental education
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-10 animate-fadeInRight">
              <h3 className="text-3xl font-bold mb-8 text-center">Our Environmental Impact</h3>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xl">Plastic Waste Prevented</span>
                    <span className="text-xl font-bold">12,500 kg</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-4">
                    <div className="bg-white h-4 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xl">Trees Saved</span>
                    <span className="text-xl font-bold">8,200</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-4">
                    <div className="bg-white h-4 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xl">CO2 Reduction</span>
                    <span className="text-xl font-bold">15,600 kg</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-4">
                    <div className="bg-white h-4 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center mb-6">
                <FaLeaf className="h-10 w-10 text-green-500" />
                <span className="ml-3 text-3xl font-bold">Ecoloop<span className="text-green-500">Market</span></span>
              </div>
              <p className="text-gray-400 mb-6 text-lg">
                Your gateway to sustainable living. We connect conscious consumers with eco-friendly products that make a difference.
              </p>
              <div className="flex space-x-5">
                <button type="button" onClick={() => window.open('https://facebook.com', '_blank')} className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </button>
                <button type="button" onClick={() => window.open('https://instagram.com', '_blank')} className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </button>
                <button type="button" onClick={() => window.open('https://twitter.com', '_blank')} className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">About Ecoloop</h3>
              <ul className="space-y-4">
                <li><button type="button" onClick={() => { }} className="text-gray-400 hover:text-white text-lg transition-colors text-left">Our Story</button></li>
                <li><button type="button" onClick={() => { }} className="text-gray-400 hover:text-white text-lg transition-colors text-left">Sustainability Policy</button></li>
                <li><button type="button" onClick={() => { }} className="text-gray-400 hover:text-white text-lg transition-colors text-left">Recycling Process</button></li>
                <li><button type="button" onClick={() => { }} className="text-gray-400 hover:text-white text-lg transition-colors text-left">Careers</button></li>
                <li><button type="button" onClick={() => { }} className="text-gray-400 hover:text-white text-lg transition-colors text-left">Press</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">Partner With Us</h3>
              <ul className="space-y-4">
                <li><button type="button" onClick={() => navigate('/seller-apply')} className="text-gray-400 hover:text-white text-lg transition-colors text-left">Sell on Ecoloop</button></li>
                <li><button type="button" onClick={() => { }} className="text-gray-400 hover:text-white text-lg transition-colors text-left">Affiliate Program</button></li>
                <li><button type="button" onClick={() => { }} className="text-gray-400 hover:text-white text-lg transition-colors text-left">Wholesale</button></li>
                <li><button type="button" onClick={() => { }} className="text-gray-400 hover:text-white text-lg transition-colors text-left">Brand Partnerships</button></li>
                <li><button type="button" onClick={() => { }} className="text-gray-400 hover:text-white text-lg transition-colors text-left">Community Programs</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">Contact</h3>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start">
                  <svg className="flex-shrink-0 h-6 w-6 text-gray-400 mt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3 text-lg">123 Green Street, Eco City, EC 12345</span>
                </li>
                <li className="flex items-start">
                  <svg className="flex-shrink-0 h-6 w-6 text-gray-400 mt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span className="ml-3 text-lg">+1 (555) 123-4567</span>
                </li>
                <li className="flex items-start">
                  <svg className="flex-shrink-0 h-6 w-6 text-gray-400 mt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="ml-3 text-lg">support@ecoloopmarket.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-10 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-lg">© 2025 Ecoloop Market. All rights reserved.</p>
            <div className="mt-6 md:mt-0 flex space-x-8">
              <button type="button" onClick={() => navigate('/privacy-policy')} className="text-gray-400 hover:text-white text-lg transition-colors">Privacy Policy</button>
              <button type="button" onClick={() => navigate('/terms-of-service')} className="text-gray-400 hover:text-white text-lg transition-colors">Terms of Service</button>
              <button type="button" onClick={() => { }} className="text-gray-400 hover:text-white text-lg transition-colors">Cookie Policy</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketShop;