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
    FaTruckMoving
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
        address: "",
        city: "",
        pincode: "",
        phone: ""
    });
    const [isProcessing, setIsProcessing] = useState(false);
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
                setProduct(response.data.product);
            }
        } catch (error) {
            console.error("Error fetching product:", error.response?.data || error.message);
        } finally {
            setLoading(false);
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
        alert("Added to cart!");
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

        if (paymentMethod === "cod") {
            handleCODPayment();
        } else {
            handleRazorpayPayment();
        }
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
                shippingAddress: `${shippingDetails.address}, ${shippingDetails.city}, ${shippingDetails.pincode}`,
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
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/products")}
                            className="p-2 hover:bg-emerald-50 rounded-full transition-colors text-emerald-700"
                        >
                            <FaArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <FaLeaf className="text-emerald-600 text-2xl" />
                            <span className="text-2xl font-black text-emerald-950 tracking-tighter uppercase">
                                EcoLoop Market
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

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-12 bg-white rounded-[3rem] shadow-xl overflow-hidden border border-emerald-50">
                    <div className="lg:w-1/2 bg-emerald-50 relative overflow-hidden group min-h-[500px]">
                        <img
                            src={product.image ? `http://localhost:4321/${product.image}` : "https://via.placeholder.com/600x600?text=Product+Image"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 to-transparent" />

                        {product.images && product.images.length > 1 && (
                            <div className="absolute bottom-8 left-8 flex gap-2">
                                {product.images.map((img, idx) => (
                                    <div key={idx} className="w-20 h-20 rounded-2xl border-2 border-white/50 overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition-transform bg-white">
                                        <img src={`http://localhost:4321/${img}`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="lg:w-1/2 p-8 lg:p-16">
                        <div className="flex justify-between items-start mb-8">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <FaCheckCircle />
                                {product.ecoCertification || "Certified Sustainable"}
                            </div>
                            <button
                                onClick={() => toggleWishlist(product)}
                                className={`p-3 rounded-2xl border transition-all active:scale-95 ${isWishlisted
                                    ? "bg-rose-50 border-rose-100 text-rose-500 shadow-sm"
                                    : "bg-white border-emerald-50 text-emerald-900 hover:bg-emerald-50"
                                    }`}
                            >
                                {isWishlisted ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
                            </button>
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-black text-emerald-950 mb-4 leading-tight tracking-tighter">
                            {product.name}
                        </h1>

                        <div className="flex items-center gap-6 mb-10">
                            <div className="flex items-center gap-1.5 text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                    <FaStar
                                        key={i}
                                        size={18}
                                        fill={i < Math.round(product.rating || 0) ? "currentColor" : "none"}
                                        className={i < Math.round(product.rating || 0) ? "" : "stroke-current"}
                                    />
                                ))}
                                <span className="text-sm font-black ml-2 text-emerald-950">
                                    {product.rating?.toFixed(1) || "0.0"} ({product.numReviews || 0} Reviews)
                                </span>
                            </div>
                            <div className="w-px h-6 bg-emerald-100" />
                            <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">{product.category}</span>
                        </div>

                        <div className="mb-12 text-emerald-900/70 leading-relaxed font-medium text-lg">
                            <p className="text-emerald-950/40 text-[10px] font-black uppercase tracking-widest mb-4">Product Story</p>
                            <p>{product.description || "Crafted with care for a better future."}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                            <div className="p-6 bg-[#fafdfb] rounded-[2.5rem] border border-emerald-100">
                                <div className="flex items-center gap-3 text-emerald-600 mb-3">
                                    <FaRecycle size={18} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Waste Reduced</span>
                                </div>
                                <p className="text-3xl font-black text-emerald-900">{product.wasteQuantity || "0"} {product.unit || "kg"}</p>
                                <p className="text-xs font-bold text-emerald-600/60 uppercase mt-2">{product.wasteType || "Recycled Content"}</p>
                            </div>
                            <div className="p-6 bg-[#fafdfb] rounded-[2.5rem] border border-emerald-100">
                                <div className="flex items-center gap-3 text-emerald-600 mb-3">
                                    <FaBox size={18} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">Production Yield</span>
                                </div>
                                <p className="text-3xl font-black text-emerald-900">{product.productOutputQuantity || "0"} Units</p>
                                <p className="text-xs font-bold text-emerald-600/60 uppercase mt-2">Sustainable Output</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-12">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                                    <FaAward size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest">EcoPoints</p>
                                    <p className="text-sm font-black text-emerald-900">
                                        {product.ecoPointsEligibility === "Yes" ? "Bonus Eligible" : "Standard Earn"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                                    <FaShoppingCart size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest">Inventory</p>
                                    <p className={`text-sm font-black ${product.stock > 0 ? "text-emerald-900" : "text-rose-500"}`}>
                                        {product.stock > 0 ? `${product.stock} units` : "Out of Stock"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6 pt-8 border-t border-emerald-50">
                            <div className="flex items-center bg-emerald-50 rounded-2xl p-1.5 border border-emerald-100">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-white rounded-xl text-emerald-900 transition-colors shadow-sm">
                                    <FaMinus size={12} />
                                </button>
                                <span className="px-6 font-black text-lg text-emerald-950">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-white rounded-xl text-emerald-900 transition-colors shadow-sm">
                                    <FaPlus size={12} />
                                </button>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <p className="text-[10px] font-black text-emerald-950/40 uppercase tracking-widest mb-1">Total Value</p>
                                <p className="text-4xl font-black text-emerald-800">₹{(product.price * quantity).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
                            <button
                                onClick={() => addToCart(product)}
                                className="px-8 py-5 bg-emerald-50 text-emerald-700 rounded-[2rem] font-black hover:bg-emerald-100 transition-all active:scale-95 text-sm uppercase tracking-widest flex items-center justify-center gap-3 flex-1"
                            >
                                <FaShoppingBag /> Add to Cart
                            </button>
                            <button
                                onClick={() => setShowCheckoutModal(true)}
                                className="px-10 py-5 bg-emerald-600 text-white rounded-[2rem] font-black hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all active:scale-95 text-sm uppercase tracking-widest flex items-center justify-center gap-3 flex-1"
                            >
                                <FaTruckMoving /> Buy Now
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-24 max-w-4xl mx-auto">
                    <h2 className="text-4xl font-black text-emerald-950 mb-12 tracking-tight uppercase flex items-center gap-4">
                        Community Voice
                        <span className="px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">{product.reviews?.length || 0}</span>
                    </h2>

                    <div className="p-10 bg-emerald-50 rounded-[3rem] mb-16 border border-emerald-100 shadow-inner">
                        <p className="text-[11px] font-black text-emerald-950/40 uppercase tracking-widest mb-8">Share your review</p>
                        <div className="flex gap-3 mb-8">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => setReviewRating(star)} className="focus:outline-none transition-transform active:scale-90">
                                    <FaStar size={32} className={star <= reviewRating ? "text-amber-500" : "text-emerald-200"} />
                                </button>
                            ))}
                        </div>
                        <textarea
                            placeholder="Tell us what you love..."
                            className="w-full p-8 bg-white rounded-[2.5rem] border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[160px] mb-8 font-medium text-lg shadow-sm"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                        />
                        <button
                            onClick={submitReview}
                            disabled={submittingReview}
                            className="px-12 py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-200 disabled:opacity-50"
                        >
                            {submittingReview ? "Processing..." : "Publish Review"}
                        </button>
                    </div>

                    <div className="space-y-12">
                        {product.reviews && product.reviews.length > 0 ? (
                            product.reviews.map((review, idx) => (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={idx} className="flex gap-8 pb-12 border-b border-emerald-100 last:border-0">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl font-black text-emerald-600 flex-shrink-0">
                                        {review.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h4 className="font-black text-xl text-emerald-950">{review.name}</h4>
                                                <div className="flex gap-1 text-amber-500 mt-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "stroke-current"} />
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-950/40 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-lg font-medium text-emerald-900/70 leading-relaxed italic">"{review.comment}"</p>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-emerald-200">
                                <FaLeaf size={40} className="mx-auto mb-6 text-emerald-100" />
                                <p className="text-lg font-bold text-emerald-950/40 uppercase tracking-widest">No reviews yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {showCheckoutModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-md" onClick={() => setShowCheckoutModal(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-8 border-b border-emerald-50 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-emerald-950 tracking-tight">Complete Your Order</h2>
                                <button onClick={() => setShowCheckoutModal(false)} className="p-2 hover:bg-emerald-50 rounded-full text-emerald-900 transition-colors">
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <section>
                                    <div className="flex items-center gap-2 mb-6 text-emerald-600">
                                        <FaMapMarkerAlt />
                                        <h3 className="font-black uppercase tracking-widest text-[10px]">Shipping Destination</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase text-emerald-950/40 block">Street Address</label>
                                            <input className="w-full px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 focus:ring-2 focus:ring-emerald-500 font-medium transition-all" value={shippingDetails.address} onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-emerald-950/40 block">City</label>
                                            <input className="w-full px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 focus:ring-2 focus:ring-emerald-500 font-medium transition-all" value={shippingDetails.city} onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-emerald-950/40 block">Pincode</label>
                                            <input className="w-full px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 focus:ring-2 focus:ring-emerald-500 font-medium transition-all" value={shippingDetails.pincode} onChange={(e) => setShippingDetails({ ...shippingDetails, pincode: e.target.value })} />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase text-emerald-950/40 block">Contact Phone</label>
                                            <input className="w-full px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 focus:ring-2 focus:ring-emerald-500 font-medium transition-all" value={shippingDetails.phone} onChange={(e) => setShippingDetails({ ...shippingDetails, phone: e.target.value })} />
                                        </div>
                                    </div>
                                </section>
                                <section>
                                    <div className="flex items-center gap-2 mb-6 text-emerald-600">
                                        <FaCreditCard />
                                        <h3 className="font-black uppercase tracking-widest text-[10px]">Payment Method</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setPaymentMethod("online")} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'online' ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-emerald-100 hover:border-emerald-200'}`}>
                                            <FaCreditCard size={24} className="text-emerald-600 mb-1" />
                                            <span className="font-black text-xs uppercase tracking-widest">Online Payment</span>
                                            <span className="text-[10px] text-emerald-950/40">Secure & Instant</span>
                                        </button>
                                        <button onClick={() => setPaymentMethod("cod")} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'cod' ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-emerald-100 hover:border-emerald-200'}`}>
                                            <FaMoneyBillWave size={24} className="text-emerald-600 mb-1" />
                                            <span className="font-black text-xs uppercase tracking-widest">Pay on Delivery</span>
                                            <span className="text-[10px] text-emerald-950/40">Offline Cash</span>
                                        </button>
                                    </div>
                                </section>
                                <section className="p-6 bg-emerald-950 rounded-[2rem] text-white">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Total Payable</p>
                                            <p className="text-3xl font-black">₹{(product.price * quantity).toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Quantity</p>
                                            <p className="font-bold">{quantity} Units</p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                            <div className="p-8 bg-emerald-50 border-t border-emerald-100">
                                <button disabled={isProcessing || !shippingDetails.address || !shippingDetails.phone} onClick={handleCheckout} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                                    {isProcessing ? "Processing..." : "Confirm Order"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductDetails;
