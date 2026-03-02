import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaCreditCard, FaCheckCircle, FaSpinner } from "react-icons/fa";

const Subscription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const pendingSubmission = location.state?.pendingSubmission || null;
  const [userId, setUserId] = useState("");
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscriptionId, setSubscriptionId] = useState(null);

  // Plan configurations
  const plans = [
    {
      id: "pay_now",
      name: "Pay Now",
      duration: "30 days",
      price: 299,
      description: "One-time payment for immediate access"
    },
    {
      id: "3_months",
      name: "3 Months",
      duration: "90 days",
      price: 799,
      description: "Best value for short-term users",
      savings: "Save ₹98"
    },
    {
      id: "6_months",
      name: "6 Months",
      duration: "180 days",
      price: 1499,
      description: "Great for regular users",
      savings: "Save ₹295"
    },
    {
      id: "1_year",
      name: "1 Year",
      duration: "365 days",
      price: 2499,
      description: "Best value - Maximum savings",
      savings: "Save ₹1089"
    }
  ];

  // Helper: create submission and redirect to view tab
  const createSubmissionAndRedirect = useCallback(async (uid, submission, shouldAlert = true) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/user/add`,
        {
          user_id: uid,
          category: submission.category,
          category_id: submission.category_id,
          scheduled_date: submission.scheduled_date
        },
        { headers: { token } }
      );
      if (shouldAlert) {
        alert("✅ Pickup requested successfully!");
      }
      navigate("/wastes?tab=view");
    } catch (err) {
      console.error("Failed to create pickup:", err);
      alert("Pickup creation failed. Please try again from Wastes.");
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  }, [token, navigate]);

  useEffect(() => {
    // Get user ID from token or localStorage
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/me`, {
          headers: { token }
        });
        setUserId(res.data.user?._id);
        // Also check active subscription
        const subRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/subscription/user`, {
          headers: { token }
        });
        setHasActiveSubscription(!!subRes.data?.has_active_subscription);

        // If there is a pending submission and subscription already active, create immediately and redirect
        if (pendingSubmission && subRes.data?.has_active_subscription) {
          await createSubmissionAndRedirect(res.data.user?._id, pendingSubmission);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        navigate("/login");
      }
    };

    if (token) {
      fetchUser();
    } else {
      navigate("/login");
    }
  }, [token, navigate, pendingSubmission, createSubmissionAndRedirect]);

  const handlePlanSelect = async (planId) => {
    if (!token) {
      alert("Please login to continue...");
      navigate("/login");
      return;
    }

    // If already subscribed, skip payment and just create submission (if any) then go to view
    if (hasActiveSubscription) {
      if (pendingSubmission && userId) {
        await createSubmissionAndRedirect(userId, pendingSubmission);
      } else {
        navigate("/wastes?tab=view");
      }
      return;
    }

    setLoading(true);
    setSelectedPlan(planId);

    try {
      // Create Razorpay order
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/subscription/create-order`,
        {
          plan_type: planId
        },
        {
          headers: { token }
        }
      );

      if (response.data.success) {
        setSubscriptionId(response.data.subscription_id);

        // Initialize Razorpay payment
        const options = {
          key: response.data.key_id,
          amount: response.data.amount,
          currency: response.data.currency,
          name: "EcoWaste Subscription",
          description: `Subscription Plan: ${plans.find(p => p.id === planId)?.name}`,
          order_id: response.data.order_id,
          handler: async function (response) {
            // Payment successful - verify payment
            await verifyPayment(response, planId);
          },
          prefill: {
            name: "User",
            email: "user@example.com"
          },
          theme: {
            color: "#4F46E5"
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setSelectedPlan(null);
              alert("Payment cancelled");
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        razorpay.on("payment.failed", function (response) {
          alert("Payment failed. Please try again.");
          setLoading(false);
          setSelectedPlan(null);
        });
      } else {
        alert("Failed to create order. Please try again.");
        setLoading(false);
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert(
        error.response?.data?.message ||
        "Failed to initiate payment. Please try again."
      );
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const verifyPayment = async (razorpayResponse, planId) => {
    setLoading(true);
    try {
      const verifyResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/subscription/verify-payment`,
        {
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          subscription_id: subscriptionId
        },
        {
          headers: { token }
        }
      );

      if (verifyResponse.data.success) {
        // If a standard pickup was staged, create it now
        if (pendingSubmission && userId) {
          await createSubmissionAndRedirect(userId, pendingSubmission, false);
          return;
        }

        alert("✅ Payment successful! Your subscription is now active.");
        // Redirect to view submissions page
        setTimeout(() => {
          navigate("/wastes?tab=view");
        }, 600);
      } else {
        alert("Payment verification failed. Please contact support.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      alert(
        error.response?.data?.message ||
        "Payment verification failed. Please contact support."
      );
      setLoading(false);
    }
  };

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


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Subscription Plan
          </h1>
          <p className="text-lg text-gray-600">
            Select a plan that works best for you and enjoy unlimited waste pickups
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all duration-300 hover:shadow-xl ${
                selectedPlan === plan.id
                  ? "border-indigo-500 scale-105"
                  : "border-gray-200 hover:border-indigo-300"
              }`}
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-extrabold text-indigo-600">
                    ₹{plan.price}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">{plan.duration}</p>
                </div>
                {plan.savings && (
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    {plan.savings}
                  </span>
                )}
                <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={loading || selectedPlan === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    loading && selectedPlan === plan.id
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {loading && selectedPlan === plan.id ? (
                    <span className="flex items-center justify-center">
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <FaCreditCard className="mr-2" />
                      Subscribe Now
                    </span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What's Included in Your Subscription
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <FaCheckCircle className="text-green-500 text-2xl mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Unlimited Pickups
                </h3>
                <p className="text-sm text-gray-600">
                  Schedule as many waste pickups as you need
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <FaCheckCircle className="text-green-500 text-2xl mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Priority Support
                </h3>
                <p className="text-sm text-gray-600">
                  Get faster response times and dedicated support
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <FaCheckCircle className="text-green-500 text-2xl mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  EcoPoints Rewards
                </h3>
                <p className="text-sm text-gray-600">
                  Earn points with every successful collection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/wastes")}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Back to Waste Management
          </button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;

