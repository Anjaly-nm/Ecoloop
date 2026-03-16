import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaLeaf,
    FaShoppingCart,
    FaSearch,
    FaHeart,
    FaArrowLeft,
    FaStar,
    FaFilter,
    FaShoppingBag,
    FaRegHeart,
    FaAward,
    FaTimes,
    FaCheckCircle,
    FaBox,
    FaRecycle,
    FaCreditCard,
    FaMoneyBillWave,
    FaTruckMoving,
    FaMapMarkerAlt,
    FaPhoneAlt,
    FaHome
} from "react-icons/fa";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const Products = () => {
    console.log("Products component rendered");
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [wishlist, setWishlist] = useState([]);
    const [cart, setCart] = useState([]);
    const [showCartModal, setShowCartModal] = useState(false);
    const [showWishlistModal, setShowWishlistModal] = useState(false);
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [myOrders, setMyOrders] = useState([]);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("online");
    const [shippingDetails, setShippingDetails] = useState({
        address: "",
        city: "",
        pincode: "",
        phone: ""
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const token = localStorage.getItem("token");

    // Categories derived from products
    const categories = ["All", ...new Set(products.map((p) => p.category))];

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchProducts();
        // Load wishlist and cart from localStorage
        const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
        const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
        setWishlist(savedWishlist);
        setCart(savedCart);
        fetchUser();
        fetchMyOrders();
    }, [navigate, token]);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const fetchUser = async () => {
        if (!token) return;
        try {
            const res = await axios.get("http://localhost:4321/api/user/me", {
                headers: { token }
            });
            if (res.data.success) {
                setShippingDetails(prev => ({
                    ...prev,
                    address: res.data.user.address || "",
                    phone: res.data.user.phone || ""
                }));
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    useEffect(() => {
        filterProducts();
    }, [products, searchQuery, selectedCategory]);

    const fetchMyOrders = async () => {
        if (!token) return;
        try {
            const response = await axios.get("http://localhost:4321/api/orders/my-orders", {
                headers: { token }
            });
            if (response.data.success) {
                setMyOrders(response.data.orders);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch("http://localhost:4321/api/product/all");
            const data = await response.json();
            if (data.success) {
                setProducts(data.products);
                setFilteredProducts(data.products);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterProducts = () => {
        let result = products;
        if (selectedCategory !== "All") {
            result = result.filter((p) => p.category === selectedCategory);
        }
        if (searchQuery) {
            result = result.filter((p) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setFilteredProducts(result);
    };

    const toggleWishlist = (product) => {
        const isWishlisted = wishlist.find((item) => item._id === product._id);
        let updatedWishlist;
        if (isWishlisted) {
            updatedWishlist = wishlist.filter((item) => item._id !== product._id);
        } else {
            updatedWishlist = [...wishlist, product];
        }
        setWishlist(updatedWishlist);
        localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    };

    const addToCart = (product) => {
        const existing = cart.find((item) => item._id === product._id);
        let updatedCart;
        if (existing) {
            updatedCart = cart.map((item) =>
                item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
            );
        } else {
            updatedCart = [...cart, { ...product, quantity: 1, productId: product._id }];
        }
        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
    };

    const handleCheckout = async () => {
        if (!token) {
            alert("Please login to continue checkout");
            navigate("/login");
            return;
        }

        if (paymentMethod === "cod") {
            handleCODPayment();
        } else {
            handleRazorpayPayment();
        }
    };

    const handleRazorpayPayment = async () => {
        setIsProcessing(true);
        const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

        try {
            // 1. Create Order on Backend
            const { data } = await axios.post("http://localhost:4321/api/orders/create-order", {
                amount: totalAmount,
                receipt: `eco_${Date.now()}`
            }, { headers: { token } });

            if (!data.success) throw new Error("Order creation failed");

            // 2. Initialize Razorpay
            const options = {
                key: data.key_id,
                amount: data.amount,
                currency: data.currency,
                name: "EcoLoop Market",
                description: "Sustainable Products Purchase",
                order_id: data.order_id,
                handler: async function (response) {
                    // 3. Verify Payment
                    const verifyRes = await axios.post("http://localhost:4321/api/orders/verify-payment", {
                        ...response
                    }, { headers: { token } });

                    if (verifyRes.data.success) {
                        saveOrderToDB("online", response.razorpay_payment_id);
                    } else {
                        alert("Payment verification failed");
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: "Customer",
                    contact: shippingDetails.phone
                },
                theme: { color: "#059669" },
                modal: { ondismiss: () => setIsProcessing(false) }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Razorpay Error:", error);
            alert("Payment initialization failed");
            setIsProcessing(false);
        }
    };

    const handleCODPayment = async () => {
        setIsProcessing(true);
        saveOrderToDB("cod", "COD_" + Date.now());
    };

    const saveOrderToDB = async (method, paymentId) => {
        const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

        try {
            const orderData = {
                items: cart.map(item => ({
                    productId: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image
                })),
                totalAmount,
                shippingAddress: {
                    address: shippingDetails.address,
                    city: shippingDetails.city,
                    pincode: shippingDetails.pincode,
                    phone: shippingDetails.phone || ''
                },
                paymentMethod: method,
                paymentId: paymentId,
                status: 'pending',
                deliveryStatus: 'pending'
            };

            const response = await axios.post("http://localhost:4321/api/orders/save-order", orderData, {
                headers: { token }
            });

            if (response.data.success) {
                alert("Order placed successfully! Eco-points will be added after delivery.");
                setCart([]);
                localStorage.removeItem("cart");
                setShowCheckoutModal(false);
                setShowCartModal(false);
                navigate("/dashboard");
            }
        } catch (error) {
            console.error("Save Order Error:", error);
            alert("Failed to save order");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafdfb] font-sans selection:bg-emerald-100 selection:text-emerald-900 relative overflow-hidden">
            {/* Rich Background Decor */}
            <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-gradient-to-l from-emerald-50/50 to-transparent rounded-full blur-[120px]" />
            <div className="absolute top-[20%] left-[-100px] -z-10 w-[400px] h-[400px] bg-gradient-to-tr from-green-50/50 to-transparent rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-[10%] -z-10 w-[500px] h-[500px] bg-gradient-to-t from-emerald-50/40 to-transparent rounded-full blur-[100px]" />

            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="p-2.5 hover:bg-emerald-50 rounded-xl transition-all text-emerald-700 flex items-center gap-2 group border border-emerald-50"
                            title="Back to Dashboard"
                        >
                            <FaArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="hidden sm:inline font-bold text-xs uppercase tracking-widest">Dashboard</span>
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="p-2.5 hover:bg-emerald-50 rounded-xl transition-all text-emerald-700 flex items-center gap-2 group border border-emerald-50"
                            title="Go to Home"
                        >
                            <FaHome size={18} />
                            <span className="hidden sm:inline font-bold text-xs uppercase tracking-widest">Home</span>
                        </button>
                        <div className="h-6 w-px bg-emerald-100 mx-1" />
                        <div className="flex items-center gap-2">
                            <FaLeaf className="text-emerald-600 text-2xl" />
                            <span className="text-2xl font-black text-emerald-950 tracking-tighter uppercase hidden lg:inline">
                                EcoMarket
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl mx-12 hidden md:block">
                        <div className="relative">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300" />
                            <input
                                type="text"
                                placeholder="Search sustainable products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 bg-emerald-50 rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowWishlistModal(true)}
                            className="relative p-2 text-emerald-950 hover:text-emerald-600 transition-colors"
                        >
                            <FaHeart size={22} />
                            {wishlist.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                    {wishlist.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setShowCartModal(true)}
                            className="relative p-2 text-emerald-950 hover:text-emerald-600 transition-colors"
                        >
                            <FaShoppingCart size={22} />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                    {cart.reduce((total, item) => total + item.quantity, 0)}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setShowOrdersModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all font-bold text-xs uppercase tracking-widest"
                        >
                            <FaBox size={14} />
                            <span className="hidden sm:inline">My Orders</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 sticky top-28">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                                    <FaFilter size={18} />
                                </div>
                                <h2 className="font-black text-emerald-950 uppercase tracking-tighter text-lg">Discovery</h2>
                            </div>

                            <div className="mb-8">
                                <h3 className="font-bold text-emerald-900 mb-4 text-sm">Categories</h3>
                                <div className="flex flex-col gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`text-left px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat
                                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                                                : "text-emerald-700 hover:bg-emerald-50"
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredProducts.map((product) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={product._id}
                                        className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-emerald-100 group"
                                    >
                                        <div className="relative aspect-square overflow-hidden bg-emerald-50">
                                            <img
                                                src={product.image ? `http://localhost:4321/${product.image}` : "https://via.placeholder.com/400x400?text=No+Image"}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                                                onClick={() => navigate(`/product-details/${product._id}`)}
                                            />
                                            <button
                                                onClick={() => toggleWishlist(product)}
                                                className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform hover:scale-110"
                                            >
                                                {wishlist.find((item) => item._id === product._id) ? (
                                                    <FaHeart />
                                                ) : (
                                                    <FaRegHeart />
                                                )}
                                            </button>
                                            <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                                                <span className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-full text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                                    {product.ecoCertification || "ECO-FRIENDLY"}
                                                </span>
                                                {product.ecoPointsEligibility === "Yes" && (
                                                    <span className="px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                                        Points Eligible
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-6 text-left">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3
                                                    className="font-black text-emerald-950 text-xl tracking-tight leading-tight cursor-pointer hover:text-emerald-600 transition-colors"
                                                    onClick={() => navigate(`/product-details/${product._id}`)}
                                                >
                                                    {product.name}
                                                </h3>
                                                <div className="flex items-center gap-1 text-amber-500">
                                                    <FaStar size={12} />
                                                    <span className="text-xs font-bold">{product.rating?.toFixed(1) || "0.0"}</span>
                                                    <span className="text-[10px] text-emerald-950/40 ml-1">({product.numReviews})</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-600 uppercase">
                                                    {product.seller_id?.name?.charAt(0) || "S"}
                                                </div>
                                                <p className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest">
                                                    Seller: <span className="text-emerald-600">{product.seller_id?.name || "Verified Eco Seller"}</span>
                                                </p>
                                            </div>
                                            <p className="text-emerald-900/60 text-sm mb-6 line-clamp-2">
                                                {product.description || "High-quality sustainable product carefully sourced for our eco-conscious community."}
                                            </p>

                                            <div className="flex items-center gap-3 mt-auto">
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-1">Price</p>
                                                    <p className="text-2xl font-black text-emerald-700">₹{product.price}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => addToCart(product)}
                                                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all active:scale-95"
                                                        title="Add to Cart"
                                                    >
                                                        <FaShoppingCart size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            addToCart(product);
                                                            setShowCheckoutModal(true);
                                                        }}
                                                        className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95 text-sm uppercase tracking-widest"
                                                    >
                                                        Buy
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[3rem] border border-emerald-100 shadow-sm">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaSearch className="text-emerald-300 text-3xl" />
                                </div>
                                <h3 className="text-xl font-black text-emerald-950 mb-2 tracking-tight">No Products Found</h3>
                                <p className="text-emerald-950/50 font-medium">
                                    We couldn't find any products matching your criteria. Try adjusting your filters.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Mini Cart Sidebar / Modal placeholder */}
            {/* Product Details Modal removed */}

            {/* Checkout Modal */}
            <AnimatePresence>
                {showCheckoutModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8"
                    >
                        <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-md" onClick={() => setShowCheckoutModal(false)} />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-emerald-50 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-emerald-950">Complete Your Order</h2>
                                <button onClick={() => setShowCheckoutModal(false)} className="p-2 hover:bg-emerald-50 rounded-full text-emerald-950">
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {/* Shipping Section */}
                                <section>
                                    <div className="flex items-center gap-2 mb-6 text-emerald-600">
                                        <FaMapMarkerAlt />
                                        <h3 className="font-black uppercase tracking-widest text-[10px]">Shipping Destination</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-black uppercase text-emerald-950/40 mb-2 block">Street Address</label>
                                            <input
                                                className="w-full px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                                                value={shippingDetails.address}
                                                onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-emerald-950/40 mb-2 block">City</label>
                                            <input
                                                className="w-full px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                                                value={shippingDetails.city}
                                                onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-emerald-950/40 mb-2 block">Pincode</label>
                                            <input
                                                className="w-full px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                                                value={shippingDetails.pincode}
                                                onChange={(e) => setShippingDetails({ ...shippingDetails, pincode: e.target.value })}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaPhoneAlt size={10} className="text-emerald-400" />
                                                <label className="text-[10px] font-black uppercase text-emerald-950/40 block">Contact Phone</label>
                                            </div>
                                            <input
                                                className="w-full px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                                                value={shippingDetails.phone}
                                                onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Payment Method */}
                                <section>
                                    <div className="flex items-center gap-2 mb-6 text-emerald-600">
                                        <FaCreditCard />
                                        <h3 className="font-black uppercase tracking-widest text-[10px]">Payment Method</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setPaymentMethod("online")}
                                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'online' ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-emerald-100 hover:border-emerald-200'}`}
                                        >
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                                                <FaCreditCard size={24} />
                                            </div>
                                            <span className="font-black text-xs uppercase tracking-widest">Online Payment</span>
                                            <span className="text-[10px] text-emerald-950/40">UPI, Card, NetBanking</span>
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod("cod")}
                                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'cod' ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-emerald-100 hover:border-emerald-200'}`}
                                        >
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                                                <FaMoneyBillWave size={24} />
                                            </div>
                                            <span className="font-black text-xs uppercase tracking-widest">Pay on Delivery</span>
                                            <span className="text-[10px] text-emerald-950/40">Offline Cash</span>
                                        </button>
                                    </div>
                                </section>

                                {/* Order Summary */}
                                <section className="p-6 bg-emerald-950 rounded-[2rem] text-white">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Total Payable</p>
                                            <p className="text-3xl font-black">₹{cart.reduce((total, item) => total + item.price * item.quantity, 0)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Items</p>
                                            <p className="font-bold">{cart.length} Products</p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="p-8 bg-emerald-50 border-t border-emerald-100">
                                <button
                                    disabled={isProcessing || !shippingDetails.address || !shippingDetails.phone}
                                    onClick={handleCheckout}
                                    className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FaTruckMoving />
                                            Confirm Order
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>


                {showCartModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-emerald-950/40 backdrop-blur-sm flex justify-end"
                        onClick={() => setShowCartModal(false)}
                    >
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-emerald-50 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-emerald-950 tracking-tight">Your Cart</h2>
                                <button
                                    onClick={() => setShowCartModal(false)}
                                    className="p-2 hover:bg-emerald-50 rounded-full text-emerald-950 transition-colors"
                                >
                                    <FaShoppingBag size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8">
                                {cart.length > 0 ? (
                                    <div className="space-y-6">
                                        {cart.map((item) => (
                                            <div key={item._id} className="flex gap-4 items-center">
                                                <div
                                                    className="w-20 h-20 bg-emerald-50 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={() => {
                                                        setShowCartModal(false);
                                                        navigate(`/product-details/${item._id}`);
                                                    }}
                                                >
                                                    <img
                                                        src={item.image ? `http://localhost:4321/${item.image}` : "https://via.placeholder.com/100x100"}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <h4
                                                        className="font-bold text-emerald-950 text-sm line-clamp-1 cursor-pointer hover:text-emerald-600 transition-colors"
                                                        onClick={() => {
                                                            setShowCartModal(false);
                                                            navigate(`/product-details/${item._id}`);
                                                        }}
                                                    >
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-emerald-600 font-black">₹{item.price}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-xs text-emerald-950/40 font-bold uppercase tracking-widest">Qty: {item.quantity}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setShowCartModal(false);
                                                            setShowCheckoutModal(true);
                                                        }}
                                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm"
                                                    >
                                                        Buy
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const newCart = cart.filter(c => c._id !== item._id);
                                                            setCart(newCart);
                                                            localStorage.setItem("cart", JSON.stringify(newCart));
                                                        }}
                                                        className="text-rose-400 hover:text-rose-600 text-[10px] font-bold uppercase tracking-widest"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 grayscale opacity-40">
                                        <FaShoppingCart size={64} className="mx-auto mb-6" />
                                        <p className="font-bold text-emerald-950">Your cart is empty</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-emerald-50 border-t border-emerald-100">
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-emerald-950/60 font-bold uppercase tracking-widest text-xs">Total Amount</span>
                                    <span className="text-3xl font-black text-emerald-900 font-sans">
                                        ₹{cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    disabled={cart.length === 0}
                                    onClick={() => {
                                        setShowCartModal(false);
                                        setShowCheckoutModal(true);
                                    }}
                                    className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                >
                                    Checkout Now
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showWishlistModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-emerald-950/40 backdrop-blur-sm flex justify-end"
                        onClick={() => setShowWishlistModal(false)}
                    >
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-emerald-50 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-emerald-950 tracking-tight">Your Wishlist</h2>
                                <button
                                    onClick={() => setShowWishlistModal(false)}
                                    className="p-2 hover:bg-emerald-50 rounded-full text-emerald-950 transition-colors"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8">
                                {wishlist.length > 0 ? (
                                    <div className="space-y-6">
                                        {wishlist.map((item) => (
                                            <div key={item._id} className="flex gap-4 items-center">
                                                <div className="w-20 h-20 bg-emerald-50 rounded-2xl overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={item.image ? `http://localhost:4321/${item.image}` : "https://via.placeholder.com/100x100"}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <h4 className="font-bold text-emerald-950 text-sm line-clamp-1">{item.name}</h4>
                                                    <p className="text-emerald-600 font-black">₹{item.price}</p>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => {
                                                            addToCart(item);
                                                            setShowWishlistModal(false);
                                                            setShowCartModal(true);
                                                        }}
                                                        className="text-emerald-600 text-xs font-bold uppercase tracking-widest hover:text-emerald-800"
                                                    >
                                                        Add to Cart
                                                    </button>
                                                    <button
                                                        onClick={() => toggleWishlist(item)}
                                                        className="text-rose-400 hover:text-rose-600 text-[10px] font-bold uppercase tracking-widest"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 grayscale opacity-40">
                                        <FaHeart size={64} className="mx-auto mb-6 text-emerald-100" />
                                        <p className="font-bold text-emerald-950">Your wishlist is empty</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-emerald-50 border-t border-emerald-100">
                                <button
                                    onClick={() => setShowWishlistModal(false)}
                                    className="w-full py-5 bg-emerald-950 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-100 hover:bg-black transition-all active:scale-95"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showOrdersModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-emerald-950/40 backdrop-blur-sm flex justify-end"
                        onClick={() => setShowOrdersModal(false)}
                    >
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-2xl bg-[#fafdfb] h-full shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 bg-white border-b border-emerald-50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-emerald-950 tracking-tight">Purchase History</h2>
                                    <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-widest mt-1">Track your eco-impact</p>
                                </div>
                                <button
                                    onClick={() => setShowOrdersModal(false)}
                                    className="p-3 hover:bg-emerald-50 rounded-2xl text-emerald-950 transition-colors"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {myOrders.length > 0 ? (
                                    myOrders.map((order) => (
                                        <div key={order._id} className="bg-white rounded-[2rem] border border-emerald-50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div className="p-6 border-b border-emerald-50 bg-[#fafdfb] flex justify-between items-center">
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-1">Order ID</p>
                                                    <p className="text-xs font-bold text-emerald-900">#{order._id.slice(-8).toUpperCase()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                                        order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {order.status === 'assigned' ? 'confirmed' : order.status}
                                                    </span>
                                                    <p className="text-[10px] font-medium text-emerald-950/40 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex gap-4 items-center">
                                                        <div className="w-12 h-12 bg-emerald-50 rounded-xl overflow-hidden flex-shrink-0 border border-emerald-100">
                                                            <img
                                                                src={item.productId?.image ? `http://localhost:4321/${item.productId.image}` : "https://via.placeholder.com/50x50"}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-bold text-emerald-950 line-clamp-1">{item.productId?.name || item.name}</h4>
                                                            <p className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest">Quantity: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Shipping Progress */}
                                            <div className="px-6 py-6 bg-emerald-50/30 border-t border-emerald-50">
                                                <div className="flex justify-between mb-8 relative">
                                                    {/* Progress Line */}
                                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-emerald-100 -translate-y-1/2 -z-0" />
                                                    <div
                                                        className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 transition-all duration-500"
                                                        style={{
                                                            width: order.status === 'delivered' ? '100%' :
                                                                order.status === 'shipped' ? '66%' :
                                                                    (order.status === 'confirmed' || order.status === 'assigned') ? '33%' : '0%'
                                                        }}
                                                    />

                                                    {['Placed', 'Confirmed', 'Shipped', 'Delivered'].map((step, i) => {
                                                        const isActive =
                                                            (i === 0) ||
                                                            (i === 1 && ['confirmed', 'assigned', 'shipped', 'delivered'].includes(order.status)) ||
                                                            (i === 2 && ['shipped', 'delivered'].includes(order.status)) ||
                                                            (i === 3 && order.status === 'delivered');

                                                        return (
                                                            <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                                                                <div className={`w-3 h-3 rounded-full border-2 ${isActive ? 'bg-emerald-500 border-white shadow-sm ring-2 ring-emerald-100' : 'bg-white border-emerald-100'}`} />
                                                                <span className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? 'text-emerald-700' : 'text-emerald-900/20'}`}>{step}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-1">Payment Method</p>
                                                        <p className="text-[10px] font-bold text-emerald-900 uppercase">{order.paymentMethod}</p>
                                                    </div>
                                                    {order.status === 'delivered' && (
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Delivered At</p>
                                                            <p className="text-[10px] font-bold text-emerald-900">
                                                                {new Date(order.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 grayscale opacity-40">
                                        <FaBox size={64} className="mx-auto mb-6 text-emerald-100" />
                                        <p className="font-bold text-emerald-950">No orders found yet</p>
                                        <button
                                            onClick={() => setShowOrdersModal(false)}
                                            className="mt-4 text-emerald-600 text-xs font-black uppercase tracking-widest hover:underline"
                                        >
                                            Start Shopping
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Products;
