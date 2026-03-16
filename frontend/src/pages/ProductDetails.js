import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    FaLeaf,
    FaShoppingCart,
    FaHeart,
    FaRegHeart,
    FaStar,
    FaRegStar,
    FaArrowLeft,
    FaRecycle,
    FaBox,
    FaAward,
    FaCheckCircle,
    FaPlus,
    FaMinus,
    FaShoppingBag,
    FaTimes,
    FaMapMarkerAlt,
    FaPhoneAlt,
    FaCreditCard,
    FaMoneyBillWave,
    FaTruckMoving,
    FaUser,
    FaMobileAlt,
    FaCoins,
    FaClock,
    FaHome
} from "react-icons/fa";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [wishlist, setWishlist] = useState([]);
    const [cart, setCart] = useState([]);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("online");
    const [shippingDetails, setShippingDetails] = useState({
        fullName: "",
        address: "",
        city: "",
        pincode: "",
        phone: ""
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState("description");
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
    const [isZoomed, setIsZoomed] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchProduct();
        fetchUser();
        const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
        const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
        setWishlist(savedWishlist);
        setCart(savedCart);
    }, [id, token, navigate]);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            const rzpScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
            if (rzpScript) document.body.removeChild(rzpScript);
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
                    fullName: res.data.user.name || "",
                    address: res.data.user.address || "",
                    phone: res.data.user.phone || ""
                }));
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    const fetchProduct = async () => {
        try {
            const response = await axios.get(`http://localhost:4321/api/product/${id}`);
            if (response.data.success) {
                const currentProduct = response.data.product;
                setProduct(currentProduct);
                setSelectedImage(currentProduct.image);
                fetchRelatedProducts(currentProduct.category, currentProduct._id);
            }
        } catch (error) {
            console.error("Error fetching product:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedProducts = async (category, currentId) => {
        try {
            const response = await axios.get("http://localhost:4321/api/product/all");
            if (response.data.success) {
                const filtered = response.data.products
                    .filter(p => p.category === category && p._id !== currentId)
                    .slice(0, 4);
                setRelatedProducts(filtered);
            }
        } catch (error) {
            console.error("Error fetching related products:", error);
        }
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
                item._id === product._id ? { ...item, quantity: item.quantity + quantity } : item
            );
        } else {
            updatedCart = [...cart, { ...product, quantity: quantity, productId: product._id }];
        }
        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));

        // Show a nice notification instead of a raw alert if possible, 
        // but keeping it functional for now as per current logic.
        alert("Added to cart!");
    };

    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.pageX - left - window.scrollX) / width) * 100;
        const y = ((e.pageY - top - window.scrollY) / height) * 100;
        setZoomPos({ x, y });
    };

    const submitReview = async () => {
        if (!token) {
            alert("Please login to submit a review");
            navigate("/login");
            return;
        }

        if (!reviewComment.trim()) {
            alert("Please add a comment");
            return;
        }

        setSubmittingReview(true);
        try {
            const response = await axios.post(`http://localhost:4321/api/product/${id}/reviews`, {
                rating: reviewRating,
                comment: reviewComment
            }, {
                headers: { token }
            });

            if (response.data.success) {
                alert("Review submitted successfully!");
                setReviewComment("");
                setReviewRating(5);
                fetchProduct();
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            alert(error.response?.data?.message || "Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleCheckout = async () => {
        if (!token) {
            alert("Please login to continue checkout");
            navigate("/login");
            return;
        }

        if (!shippingDetails.fullName || !shippingDetails.address || !shippingDetails.city || !shippingDetails.pincode || !shippingDetails.phone) {
            alert("Please fill in all shipping details");
            return;
        }

        if (paymentMethod === "cod") {
            handleCODPayment();
        } else if (paymentMethod === "ecopoints") {
            handleEcoPointsPayment();
        } else {
            handleRazorpayPayment();
        }
    };

    const handleEcoPointsPayment = async () => {
        setIsProcessing(true);
        // Assuming backend handles ecopoints reduction in save-order
        saveOrderToDB("ecopoints", "ECO_" + Date.now());
    };

    const handleRazorpayPayment = async () => {
        setIsProcessing(true);
        const totalAmount = product.price * quantity;

        try {
            const { data } = await axios.post("http://localhost:4321/api/orders/create-order", {
                amount: totalAmount,
                receipt: `eco_${Date.now()}`
            }, { headers: { token } });

            if (!data.success) throw new Error("Order creation failed");

            const options = {
                key: data.key_id,
                amount: data.amount,
                currency: data.currency,
                name: "EcoLoop Market",
                description: "Sustainable Products Purchase",
                order_id: data.order_id,
                handler: async function (response) {
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
        const totalAmount = product.price * quantity;

        try {
            const orderData = {
                items: [{
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    quantity: quantity,
                    image: product.image
                }],
                totalAmount,
                shippingAddress: `${shippingDetails.fullName}, ${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.pincode}`,
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
                setShowCheckoutModal(false);
                navigate("/dashboard");
            }
        } catch (error) {
            console.error("Save Order Error:", error);
            alert("Failed to save order");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafdfb]">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafdfb] p-6 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-6">
                    <FaRegStar size={40} />
                </div>
                <h2 className="text-3xl font-black text-emerald-950 mb-2">Product Not Found</h2>
                <p className="text-emerald-900/60 mb-8 max-w-md">
                    The product you're looking for might have been removed or the link is incorrect.
                </p>
                <button
                    onClick={() => navigate("/products")}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                >
                    Explore Other Products
                </button>
            </div>
        );
    }

    const isWishlisted = wishlist.find(item => item._id === product._id);

    return (
        <div className="min-h-screen bg-[#fafdfb] font-sans selection:bg-emerald-100 selection:text-emerald-900 relative overflow-x-hidden">
            {/* Rich Background Decor */}
            <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-gradient-to-l from-emerald-50/50 to-transparent rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-[-100px] -z-10 w-[400px] h-[400px] bg-gradient-to-tr from-green-50/50 to-transparent rounded-full blur-[100px]" />

            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate("/products")}
                            className="p-2.5 hover:bg-emerald-50 rounded-xl transition-all text-emerald-700 flex items-center gap-2 group border border-emerald-50"
                            title="Back to Products"
                        >
                            <FaArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="hidden sm:inline font-bold text-xs uppercase tracking-widest">Products</span>
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

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/products")}
                            className="text-emerald-950 hover:text-emerald-600 font-bold text-sm uppercase tracking-widest hidden md:block"
                        >
                            Products
                        </button>
                        <div className="relative p-2 text-emerald-950">
                            <FaShoppingCart size={22} />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                                    {cart.reduce((total, item) => total + item.quantity, 0)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-10">
                <div className="flex flex-col lg:flex-row bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 overflow-hidden border border-emerald-50/50">
                    {/* Product Image Section with Zoom */}
                    <div className="lg:w-1/2 bg-[#f8fbfa] relative flex flex-col items-center justify-center p-6 lg:p-12 border-r border-emerald-50/30">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative w-full aspect-square bg-white rounded-3xl shadow-xl shadow-emerald-900/5 overflow-hidden cursor-zoom-in group"
                            onMouseMove={handleMouseMove}
                            onMouseEnter={() => setIsZoomed(true)}
                            onMouseLeave={() => setIsZoomed(false)}
                        >
                            <img
                                src={selectedImage ? `http://localhost:4321/${selectedImage}` : "https://via.placeholder.com/600x600?text=Product+Image"}
                                alt={product.name}
                                className={`w-full h-full object-contain p-8 transition-transform duration-200 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                                style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                            />

                            {/* Zoom Indicator */}
                            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <FaPlus className="text-emerald-600 text-xs" />
                            </div>
                        </motion.div>

                        {/* Thumbnail Gallery Switcher */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-4 mt-8 w-full overflow-x-auto pb-2 scrollbar-hide">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(img)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-2xl bg-white border-2 overflow-hidden transition-all ${selectedImage === img ? "border-emerald-600 shadow-md scale-105" : "border-emerald-50 hover:border-emerald-200"}`}
                                    >
                                        <img
                                            src={`http://localhost:4321/${img}`}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="w-full h-full object-contain p-2"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Sustainability Badge Floating */}
                        <div className="absolute top-8 left-8 z-20">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-full flex items-center gap-2 shadow-lg shadow-emerald-200"
                            >
                                <FaLeaf className="text-sm" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Eco Certified</span>
                            </motion.div>
                        </div>
                    </div>

                    <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col">
                        <div className="mb-2">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">{product.category}</span>
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <h1 className="text-3xl lg:text-4xl font-black text-emerald-950 tracking-tighter leading-none">
                                {product.name}
                            </h1>
                            <button
                                onClick={() => toggleWishlist(product)}
                                className={`p-3.5 rounded-2xl shadow-sm transition-all active:scale-95 ${isWishlisted
                                    ? "bg-rose-50 text-rose-500 shadow-rose-100"
                                    : "bg-emerald-50 text-emerald-900 border border-emerald-100 hover:bg-emerald-100"
                                    }`}
                            >
                                {isWishlisted ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex items-center gap-1 text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                    <FaStar
                                        key={i}
                                        size={16}
                                        fill={i < Math.round(product.rating || 0) ? "currentColor" : "none"}
                                        className={i < Math.round(product.rating || 0) ? "" : "stroke-current"}
                                    />
                                ))}
                            </div>
                            <span className="text-xs font-bold text-emerald-950">{product.rating?.toFixed(1) || "0.0"}</span>
                            <div className="w-1 h-1 bg-emerald-200 rounded-full" />
                            <span className="text-xs font-medium text-emerald-900/60 ">{product.numReviews || 0} Customer Reviews</span>
                        </div>

                        <div className="mb-8">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-emerald-900">₹{product.price}</span>
                                {product.oldPrice && <span className="text-lg text-emerald-950/20 line-through font-bold">₹{product.oldPrice}</span>}
                            </div>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Free Shipping on Sustainability</p>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                                <div className="flex items-center gap-3 text-emerald-700 mb-3">
                                    <FaAward className="text-lg" />
                                    <span className="text-sm font-black uppercase tracking-widest">Sustainability Impact</span>
                                </div>
                                <p className="text-sm text-emerald-900/70 leading-relaxed italic">
                                    "{product.description ? product.description.substring(0, 100) + "..." : "Positive impact on our planet with every purchase."}"
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <div className="p-4 bg-white rounded-2xl border border-emerald-50 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <FaRecycle size={14} />
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-950/40 mb-1">Waste Diverted</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-emerald-900">{product.wasteQuantity || "0"}</span>
                                    <span className="text-[8px] font-black text-emerald-600/60 uppercase">{product.unit || "kg"}</span>
                                </div>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-emerald-50 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <FaBox size={14} />
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-950/40 mb-1">Carbon Saved</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-emerald-900">~12.4</span>
                                    <span className="text-[8px] font-black text-emerald-600/60 uppercase">kg</span>
                                </div>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-emerald-50 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <FaLeaf size={14} />
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-wider text-emerald-950/40 mb-1">Eco Score</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-emerald-900">A+</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 mb-8 mt-2">
                            <div className="flex items-center bg-emerald-50/50 rounded-2xl p-1 border border-emerald-100/50">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 bg-white hover:bg-emerald-600 hover:text-white rounded-xl text-emerald-950 transition-all shadow-sm">
                                    <FaMinus size={10} />
                                </button>
                                <span className="px-6 font-black text-base text-emerald-950">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="p-3 bg-white hover:bg-emerald-600 hover:text-white rounded-xl text-emerald-950 transition-all shadow-sm">
                                    <FaPlus size={10} />
                                </button>
                            </div>
                            <div className="text-xs font-bold text-emerald-950/40">
                                {product.stock > 0 ? (
                                    <span className="text-emerald-600 flex items-center gap-1">
                                        <FaCheckCircle /> {product.stock} units in stock
                                    </span>
                                ) : (
                                    <span className="text-rose-500">Out of Stock</span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => addToCart(product)}
                                className="px-8 py-4.5 bg-white text-emerald-700 rounded-2xl font-black hover:bg-emerald-50 transition-all active:scale-95 text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 flex-1 border-2 border-emerald-100 shadow-sm"
                            >
                                <FaShoppingBag /> Add to Cart
                            </button>
                            <button
                                onClick={() => setShowCheckoutModal(true)}
                                className="px-10 py-4.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl font-black hover:from-emerald-700 hover:to-emerald-800 shadow-xl shadow-emerald-200/50 transition-all active:scale-95 text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 flex-1"
                            >
                                <FaTruckMoving /> Express Checkout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Product Detail Tabs */}
                <div className="mt-16 bg-white rounded-[2.5rem] border border-emerald-50/50 shadow-xl shadow-emerald-900/5 overflow-hidden">
                    <div className="flex border-b border-emerald-50 overflow-x-auto scrollbar-hide">
                        {['description', 'impact', 'instructions', 'reviews'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-10 py-6 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${activeTab === tab ? "text-emerald-700 bg-emerald-50/30" : "text-emerald-950/40 hover:text-emerald-900 hover:bg-emerald-50/10"}`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-10">
                        <AnimatePresence mode="wait">
                            {activeTab === 'description' && (
                                <motion.div key="desc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="prose prose-emerald max-w-none">
                                    <h3 className="text-xl font-black text-emerald-950 mb-4 tracking-tight">Crafted for Sustainability</h3>
                                    <p className="text-emerald-900/70 leading-relaxed text-base">
                                        {product.description || "Every detail of this product has been considered to minimize environmental impact while maximizing utility and style. We believe that choosing sustainable doesn't mean compromising on quality."}
                                    </p>
                                    <ul className="mt-6 space-y-3">
                                        <li className="flex items-center gap-3 text-sm font-medium text-emerald-900/60">
                                            <FaCheckCircle className="text-emerald-600" /> Ethically sourced materials
                                        </li>
                                        <li className="flex items-center gap-3 text-sm font-medium text-emerald-900/60">
                                            <FaCheckCircle className="text-emerald-600" /> 100% Recyclable packaging
                                        </li>
                                        <li className="flex items-center gap-3 text-sm font-medium text-emerald-900/60">
                                            <FaCheckCircle className="text-emerald-600" /> Built to last a lifetime
                                        </li>
                                    </ul>
                                </motion.div>
                            )}

                            {activeTab === 'impact' && (
                                <motion.div key="impact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                                            <FaRecycle className="text-3xl text-emerald-600 mb-4" />
                                            <h4 className="text-lg font-black text-emerald-950 mb-2">Circular Economy</h4>
                                            <p className="text-sm text-emerald-900/60 leading-relaxed">
                                                This product uses {product.wasteQuantity || "0"}{product.unit || "kg"} of {product.wasteType || "recycled materials"}, effectively diverting waste from landfills and participating in the global circular economy transition.
                                            </p>
                                        </div>
                                        <div className="p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100/50">
                                            <FaLeaf className="text-3xl text-emerald-600 mb-4" />
                                            <h4 className="text-lg font-black text-emerald-950 mb-2">Low Carbon Footprint</h4>
                                            <p className="text-sm text-emerald-900/60 leading-relaxed">
                                                By optimizing our supply chain and using local materials, we've reduced the carbon emission of this product by approximately 40% compared to traditional alternatives.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'instructions' && (
                                <motion.div key="instr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl">
                                    <h3 className="text-xl font-black text-emerald-950 mb-6 tracking-tight">Care & Usage Guide</h3>
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-black text-emerald-700 flex-shrink-0">1</div>
                                            <p className="text-sm text-emerald-900/60 leading-relaxed">Clean with a soft, damp cloth. Avoid harsh chemicals that can degrade eco-materials.</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-black text-emerald-700 flex-shrink-0">2</div>
                                            <p className="text-sm text-emerald-900/60 leading-relaxed">Keep in a dry environment to ensure maximum longevity of the recycled fibers.</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-black text-emerald-700 flex-shrink-0">3</div>
                                            <p className="text-sm text-emerald-900/60 leading-relaxed">When the product finally reaches the end of its life, it is 100% recyclable through our return program.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'reviews' && (
                                <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    {/* Review Submission */}
                                    <div className="mb-12 p-8 bg-emerald-50/30 rounded-3xl border border-dotted border-emerald-200">
                                        <p className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-4">How was your eco-experience?</p>
                                        <div className="flex gap-2 mb-6">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button key={star} onClick={() => setReviewRating(star)} className="focus:outline-none transition-transform active:scale-90 group">
                                                    <FaStar size={20} className={star <= reviewRating ? "text-amber-400 drop-shadow-sm" : "text-emerald-100 group-hover:text-emerald-200"} />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            placeholder="Tell the community about your sustainable choice..."
                                            className="w-full p-6 bg-white rounded-2xl border-2 border-transparent focus:border-emerald-500/10 focus:outline-none min-h-[100px] mb-4 font-medium text-sm transition-all shadow-sm"
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={submitReview}
                                                disabled={submittingReview}
                                                className="px-8 py-3.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-200/50 disabled:opacity-50"
                                            >
                                                {submittingReview ? "Processing..." : "Post Review"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        {product.reviews && product.reviews.length > 0 ? (
                                            product.reviews.map((review, idx) => (
                                                <div key={idx} className="flex gap-6 pb-8 border-b border-emerald-50 last:border-0 last:pb-0">
                                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-lg font-black text-emerald-600 flex-shrink-0">
                                                        {review.name?.charAt(0)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="font-black text-sm text-emerald-950">{review.name}</h4>
                                                            <span className="text-[10px] font-bold text-emerald-950/30">
                                                                {new Date(review.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-1 text-amber-500 mb-3">
                                                            {[...Array(5)].map((_, i) => (
                                                                <FaStar key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "stroke-current"} />
                                                            ))}
                                                        </div>
                                                        <p className="text-sm font-medium text-emerald-900/70 leading-relaxed italic">"{review.comment}"</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 opacity-30">
                                                <FaLeaf size={30} className="mx-auto mb-4" />
                                                <p className="text-sm font-black uppercase tracking-widest">Growth starts here. Be the first to review.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div className="mt-20">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-emerald-950 tracking-tight leading-none">Similar Eco-Choices</h2>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">Because you care for the planet</p>
                            </div>
                            <button onClick={() => navigate("/products")} className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 hover:text-emerald-900 transition-colors">
                                View all products
                            </button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((rel) => (
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    key={rel._id}
                                    onClick={() => navigate(`/product/${rel._id}`)}
                                    className="bg-white rounded-[2rem] border border-emerald-50 p-4 shadow-lg shadow-emerald-900/5 cursor-pointer group"
                                >
                                    <div className="aspect-square bg-[#f8fbfa] rounded-3xl mb-4 overflow-hidden p-6 relative">
                                        <img
                                            src={rel.image ? `http://localhost:4321/${rel.image}` : "https://via.placeholder.com/200"}
                                            alt={rel.name}
                                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-[8px] font-black uppercase tracking-widest text-emerald-700 shadow-sm">
                                            {rel.category}
                                        </div>
                                    </div>
                                    <div className="px-2">
                                        <h3 className="text-sm font-black text-emerald-950 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">{rel.name}</h3>
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-black text-emerald-900">₹{rel.price}</span>
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FaArrowLeft className="rotate-180 text-xs" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <AnimatePresence>
                {showCheckoutModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-md" onClick={() => setShowCheckoutModal(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-6xl bg-[#fafdfb] rounded-[3rem] shadow-[0_32px_120px_-20px_rgba(5,150,105,0.3)] overflow-hidden flex flex-col max-h-[95vh] border border-white/40"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-emerald-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                                        <FaCheckCircle size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-emerald-950 tracking-tight">Secure Checkout</h2>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mt-1">EcoLoop Sustainability Protocol</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowCheckoutModal(false)} className="p-3 hover:bg-emerald-50 rounded-full text-emerald-900 transition-all active:scale-90">
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                    {/* Left Side: Shipping Form */}
                                    <div className="lg:col-span-7 space-y-10">
                                        <section>
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                                    <FaMapMarkerAlt size={14} />
                                                </div>
                                                <h3 className="font-black uppercase tracking-[0.2em] text-[11px] text-emerald-950">Shipping Destination</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-emerald-950/40 ml-4 tracking-widest">Full Name</label>
                                                    <div className="relative group">
                                                        <FaUser className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-200 group-focus-within:text-emerald-500 transition-colors" />
                                                        <input
                                                            className="w-full pl-14 pr-6 py-4.5 bg-white border-2 border-emerald-50 rounded-2xl focus:border-emerald-500/20 focus:outline-none font-bold text-emerald-950 transition-all shadow-sm"
                                                            value={shippingDetails.fullName}
                                                            onChange={(e) => setShippingDetails({ ...shippingDetails, fullName: e.target.value })}
                                                            placeholder="Anjaly NM"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-emerald-950/40 ml-4 tracking-widest">Street Address</label>
                                                    <input
                                                        className="w-full px-6 py-4.5 bg-white border-2 border-emerald-50 rounded-2xl focus:border-emerald-500/20 focus:outline-none font-bold text-emerald-950 transition-all shadow-sm"
                                                        value={shippingDetails.address}
                                                        onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                                                        placeholder="Building, street, and area..."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-emerald-950/40 ml-4 tracking-widest">City</label>
                                                    <input
                                                        className="w-full px-6 py-4.5 bg-white border-2 border-emerald-50 rounded-2xl focus:border-emerald-500/20 focus:outline-none font-bold text-emerald-950 transition-all shadow-sm"
                                                        value={shippingDetails.city}
                                                        onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                                                        placeholder="City"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-emerald-950/40 ml-4 tracking-widest">Postal Code</label>
                                                    <input
                                                        className="w-full px-6 py-4.5 bg-white border-2 border-emerald-50 rounded-2xl focus:border-emerald-500/20 focus:outline-none font-bold text-emerald-950 transition-all shadow-sm"
                                                        value={shippingDetails.pincode}
                                                        onChange={(e) => setShippingDetails({ ...shippingDetails, pincode: e.target.value })}
                                                        placeholder="Pincode"
                                                    />
                                                </div>

                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-emerald-950/40 ml-4 tracking-widest">Contact Phone</label>
                                                    <div className="relative group">
                                                        <FaPhoneAlt size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-200 group-focus-within:text-emerald-500 transition-colors" />
                                                        <input
                                                            className="w-full pl-14 pr-6 py-4.5 bg-white border-2 border-emerald-50 rounded-2xl focus:border-emerald-500/20 focus:outline-none font-bold text-emerald-950 transition-all shadow-sm"
                                                            value={shippingDetails.phone}
                                                            onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                                                            placeholder="Phone Number"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section>
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                                    <FaMoneyBillWave size={14} />
                                                </div>
                                                <h3 className="font-black uppercase tracking-[0.2em] text-[11px] text-emerald-950">Payment Intelligence</h3>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <button
                                                    onClick={() => setPaymentMethod("cod")}
                                                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 group active:scale-95 ${paymentMethod === 'cod' ? 'border-emerald-500 bg-white shadow-xl shadow-emerald-500/10' : 'border-transparent bg-white hover:border-emerald-100 shadow-sm'}`}
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-all ${paymentMethod === 'cod' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                                                        <FaMoneyBillWave size={20} />
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="font-black text-[10px] uppercase tracking-widest block text-emerald-950">COD</span>
                                                        <span className="text-[8px] text-emerald-900/40 uppercase font-bold mt-0.5 block">Doorstep Pay</span>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => setPaymentMethod("online")}
                                                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 group active:scale-95 ${paymentMethod === 'online' ? 'border-emerald-500 bg-white shadow-xl shadow-emerald-500/10' : 'border-transparent bg-white hover:border-emerald-100 shadow-sm'}`}
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-all ${paymentMethod === 'online' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                                                        <FaMobileAlt size={20} />
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="font-black text-[10px] uppercase tracking-widest block text-emerald-950">UPI / Pay</span>
                                                        <span className="text-[8px] text-emerald-900/40 uppercase font-bold mt-0.5 block">Digital Safe</span>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() => setPaymentMethod("ecopoints")}
                                                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 group active:scale-95 ${paymentMethod === 'ecopoints' ? 'border-emerald-500 bg-white shadow-xl shadow-emerald-500/10' : 'border-transparent bg-white hover:border-emerald-100 shadow-sm'}`}
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-all ${paymentMethod === 'ecopoints' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                                                        <FaCoins size={20} />
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="font-black text-[10px] uppercase tracking-widest block text-emerald-950">EcoPoints</span>
                                                        <span className="text-[8px] text-emerald-900/40 uppercase font-bold mt-0.5 block">Redeem Points</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </section>

                                        <section className="bg-emerald-900 text-white p-8 rounded-[2.5rem] shadow-xl shadow-emerald-900/20 relative overflow-hidden">
                                            <FaLeaf className="absolute -right-6 -bottom-6 text-emerald-800 text-[120px] rotate-12 opacity-50" />
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-800/50 flex items-center justify-center border border-emerald-700">
                                                        <FaTruckMoving size={12} className="text-emerald-400" />
                                                    </div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Green Logistics</h4>
                                                </div>
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div>
                                                        <p className="text-xl font-black tracking-tight mb-1">EcoLoop Green Delivery</p>
                                                        <p className="text-emerald-400/60 text-xs font-bold flex items-center gap-2">
                                                            <FaClock /> Estimated Arrival: 3-5 Working Days
                                                        </p>
                                                    </div>
                                                    <div className="px-5 py-3 bg-emerald-800/80 rounded-2xl border border-emerald-700/50 backdrop-blur-sm shadow-inner shadow-black/20">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-emerald-300 mb-1">Delivery Status</p>
                                                        <p className="text-xs font-black flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                                            Carbon Optimized
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Right Side: Order Summary Card */}
                                    <div className="lg:col-span-5">
                                        <div className="sticky top-0 space-y-8">
                                            <div className="bg-white rounded-[3rem] p-8 lg:p-10 border border-emerald-50 shadow-2xl shadow-emerald-900/5 border-b-8 border-b-emerald-600">
                                                <h3 className="text-xl font-black text-emerald-950 mb-8 tracking-tighter flex items-center gap-3">
                                                    Order Basket
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">{quantity} Items</span>
                                                </h3>

                                                <div className="space-y-6 mb-10 pb-8 border-b border-dotted border-emerald-100">
                                                    <div className="flex gap-6 items-center">
                                                        <div className="w-24 h-24 bg-emerald-50 rounded-2xl p-4 flex-shrink-0 relative">
                                                            <img
                                                                src={product.image ? `http://localhost:4321/${product.image}` : "https://via.placeholder.com/100"}
                                                                alt={product.name}
                                                                className="w-full h-full object-contain"
                                                            />
                                                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md">
                                                                {quantity}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">{product.category}</p>
                                                            <h4 className="text-lg font-black text-emerald-950 leading-tight mb-2">{product.name}</h4>
                                                            <div className="flex justify-between items-baseline">
                                                                <p className="text-xs font-bold text-emerald-900/40">Unit Price: ₹{product.price}</p>
                                                                <p className="text-lg font-black text-emerald-900">₹{(product.price * quantity).toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 mb-10">
                                                    <div className="flex justify-between text-xs font-bold text-emerald-950/40 uppercase tracking-widest px-2">
                                                        <span>Subtotal</span>
                                                        <span className="text-emerald-950">₹{(product.price * quantity).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs font-bold text-emerald-950/40 uppercase tracking-widest px-2">
                                                        <span>Eco-Shipping</span>
                                                        <span className="text-emerald-600">FREE</span>
                                                    </div>
                                                    <div className="pt-4 mt-4 border-t border-emerald-50 flex justify-between items-baseline px-2">
                                                        <span className="text-sm font-black text-emerald-950/60 uppercase tracking-widest">Grand Total</span>
                                                        <span className="text-4xl font-black text-emerald-900 tracking-tighter">₹{(product.price * quantity).toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleCheckout}
                                                    disabled={isProcessing}
                                                    className="w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-emerald-200 hover:shadow-emerald-300 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                                                >
                                                    {isProcessing ? (
                                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            Complete Safe Purchase
                                                            <FaTruckMoving className="group-hover:translate-x-1 transition-transform" size={16} />
                                                        </>
                                                    )}
                                                </button>

                                                <p className="text-[9px] text-center font-bold text-emerald-900/30 uppercase tracking-[0.2em] mt-6 flex items-center justify-center gap-2">
                                                    <FaLeaf className="text-emerald-500/30" />
                                                    EcoLoop Secure Payment Gateway
                                                </p>
                                            </div>

                                            {/* Sustainability Impact Summary Card */}
                                            <div className="bg-gradient-to-br from-white to-emerald-50 p-8 rounded-[3rem] border border-emerald-100 shadow-xl shadow-emerald-900/5 group hover:shadow-emerald-500/10 transition-all">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                                        <FaRecycle size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-emerald-950 tracking-tight">Eco-Impact Summary</h4>
                                                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Positive Choice Factor</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-white rounded-2xl border border-emerald-100 group-hover:scale-[1.02] transition-transform">
                                                        <p className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest mb-1">Waste Refined</p>
                                                        <p className="text-lg font-black text-emerald-900 flex items-baseline gap-1">
                                                            {product.wasteQuantity || "0"}
                                                            <span className="text-[9px] text-emerald-600 uppercase">{product.unit || "kg"}</span>
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-white rounded-2xl border border-emerald-100 group-hover:scale-[1.02] transition-transform delay-75">
                                                        <p className="text-[8px] font-black text-emerald-900/40 uppercase tracking-widest mb-1">Carbon Mitigated</p>
                                                        <p className="text-lg font-black text-emerald-900 flex items-baseline gap-1">
                                                            ~12.4
                                                            <span className="text-[9px] text-emerald-600 uppercase">kg</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-6 p-4 bg-emerald-600 rounded-2xl text-white flex items-center justify-between shadow-lg shadow-emerald-200">
                                                    <div className="flex items-center gap-3">
                                                        <FaAward className="text-emerald-300" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Eco-Score Rank</span>
                                                    </div>
                                                    <span className="text-xl font-black italic tracking-tighter">A++ CLASS</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductDetails;
