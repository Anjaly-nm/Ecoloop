import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Calendar, MapPin, User, ChevronLeft, ChevronRight, Star, Leaf, TreePine, Sprout, Globe } from "lucide-react";

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // First get the current user's info
        let currentUserId = null;
        try {
          const userResponse = await axios.get(
            `${process.env.REACT_APP_API_URL || "http://localhost:4321"}/api/user/me`,
            { headers: { token } }
          );
          currentUserId = userResponse.data.user._id;
        } catch (userError) {
          console.error('Error fetching user info:', userError);
        }
        
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL || "http://localhost:4321"}/api/events/all`,
          { headers: { token } }
        );

        if (response.data.success) {
          // Filter upcoming events and sort by date
          // Also determine registration status for current user
          const upcoming = response.data.events
            .filter(event => new Date(event.date) >= new Date())
            .map(event => ({
              ...event,
              isRegistered: currentUserId ? event.attendees?.includes(currentUserId) : false
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          
          setEvents(upcoming);
          
          // Update local storage for registered events
          if (currentUserId) {
            const tokenHash = btoa(token).substring(0, 10);
            const userRegistrationKey = `eventRegistrations_${tokenHash}`;
            const registeredEventIds = upcoming
              .filter(event => event.isRegistered)
              .map(event => event._id);
            localStorage.setItem(userRegistrationKey, JSON.stringify(registeredEventIds));
            

          }
        } else {
          console.error('Failed to fetch events:', response.data.message);
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const handleRegisterEvent = async (eventId, eventTitle) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ show: true, message: 'Please log in to register for events', type: 'error' });
        return;
      }
      
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || "http://localhost:4321"}/api/events/register/${eventId}`,
        {},
        { headers: { token } }
      );
      
      if (response.data.success) {
        // Update local storage and refresh the events to update the UI
        const token = localStorage.getItem('token');
        if (token) {
          const tokenHash = btoa(token).substring(0, 10);
          const userRegistrationKey = `eventRegistrations_${tokenHash}`;
          
          // Get current registered events and add the new one
          const currentRegistrations = JSON.parse(localStorage.getItem(userRegistrationKey) || '[]');
          const updatedRegistrations = [...new Set([...currentRegistrations, eventId])];
          localStorage.setItem(userRegistrationKey, JSON.stringify(updatedRegistrations));
        }
        
        // Refresh the events to update the UI immediately
        fetchEvents();
        setNotification({ show: true, message: `Successfully registered for event: ${eventTitle}!`, type: 'success' });
      } else {
        // Show the exact error message as requested in a notification box
        setNotification({ show: true, message: `Registration failed: ${response.data.message}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      setNotification({ show: true, message: `Registration failed: ${error.response?.data?.message || error.message}`, type: 'error' });
    }
  };

  const handleViewAllEvents = () => {
    navigate('/waste-management'); // Navigate to waste management where admin can manage events
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification({ show: false, message: '', type: '' })}
              className="ml-2 text-white hover:text-gray-200 focus:outline-none"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 shadow-2xl">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors backdrop-blur-sm bg-white/10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center">
                <div className="relative">
                  <Leaf className="h-10 w-10 text-lime-300 mr-3 absolute -top-2 -left-2 opacity-50" />
                  <Calendar className="h-10 w-10 text-white mr-3 relative z-10" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">EcoLoop Events</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/profile')}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm bg-white/10"
              >
                <User className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-10">
          <div className="relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-3xl shadow-2xl p-8 md:p-12 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <TreePine className="h-8 w-8 mr-3 text-lime-300" />
                <h1 className="text-4xl md:text-5xl font-bold">Community Events</h1>
              </div>
              <p className="text-green-100 text-xl max-w-2xl">Join us for upcoming community events and make a difference! Connect with fellow eco-warriors and participate in meaningful environmental activities.</p>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Upcoming Events</h2>
              <p className="text-gray-600">Discover and register for events happening in your community</p>
            </div>
            <button 
              onClick={handleViewAllEvents}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
            >
              View All Events
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <div key={event._id} className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
                  <div className="p-7">
                    <div className="flex items-start justify-between mb-5">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-700 transition-colors">{event.title}</h3>
                      <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                        event.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed">{event.description}</p>
                    
                    <div className="space-y-3 mb-7">
                      <div className="flex items-center text-gray-700">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 mr-3 flex-shrink-0">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Date & Time</p>
                          <p className="text-sm text-gray-600">
                            {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-gray-700">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mr-3 flex-shrink-0">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Location</p>
                          <p className="text-sm text-gray-600">{event.location}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-gray-700">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-100 text-teal-600 mr-3 flex-shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Organizer</p>
                          <p className="text-sm text-gray-600">{event.organizer}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-gray-700">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-lime-100 text-lime-600 mr-3 flex-shrink-0">
                          <Star className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Category</p>
                          <p className="text-sm text-gray-600">{event.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                        </div>
                      </div>
                    </div>

                    {event.status !== 'cancelled' && !event.isRegistered && (
                      <button
                        onClick={() => handleRegisterEvent(event._id, event.title)}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Sprout className="h-5 w-5" />
                          Register for Event
                        </div>
                      </button>
                    )}
                    
                    {event.isRegistered && (
                      <div className="w-full py-4 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 font-bold rounded-2xl text-center flex items-center justify-center gap-2">
                        <Leaf className="h-5 w-5" />
                        ✓ Registered
                      </div>
                    )}
                    
                    {event.status === 'cancelled' && (
                      <div className="w-full py-4 bg-gradient-to-r from-red-100 to-pink-100 text-red-800 font-bold rounded-2xl text-center">
                        ❌ Cancelled
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 text-green-500 mb-6">
                <Globe className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No Upcoming Events</h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto">Check back later for new community events. Our team is constantly organizing new activities!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Events;