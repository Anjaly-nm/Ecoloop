// AdminUserManagement.jsx (or UserManage.js)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- CONSTANTS (UNCHANGED) ---
const API_BASE_URL = 'http://localhost:4321/api/user'; 
const STATIC_BASE_URL = 'http://localhost:4321/'; 

const AdminUserManagement = () => {
    // --- STATE & UTILS (UNCHANGED) ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); 
    const navigate = useNavigate();

    const getAuthToken = () => {
        return localStorage.getItem('token'); 
    };

    // --- FETCH USERS (useCallback - UNCHANGED) ---
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        setMessage('');
        const token = getAuthToken();
        if (!token) {
            setError('Authentication required: Token not found. Please log in as admin.');
            setLoading(false);
            return;
        }
        try {
            const response = await axios.get(`${API_BASE_URL}/all`, { headers: { token: token } });
            setUsers(response.data); 
        } catch (err) {
            console.error("Error fetching users:", err);
            const errorMessage = err.response?.data?.message || 'Failed to fetch users. Server may be offline.';
            setError(`API Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, []); 

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]); 

    // --- HANDLERS (UNCHANGED) ---
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('🚨 WARNING: Delete this user? This action is irreversible.')) return;
        setMessage('');
        try {
            const token = getAuthToken();
            const response = await axios.delete(`${API_BASE_URL}/${userId}`, { headers: { token: token } });
            setUsers(users.filter(user => user._id !== userId)); 
            setMessage(`✅ ${response.data.message}`);
        } catch (err) {
            console.error('Error deleting user:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete user. Server error.';
            setMessage(`❌ ${errorMessage}`);
        }
    };
    
    const handleBack = () => {
    console.log("Navigating back to admin dashboard...");
    // Path to your Admin Dashboard route
    navigate('/Adminpage'); 

    // Alternatively, to go back one step in browser history:
    // navigate(-1);
};
    // --- RENDER LOGIC (UNCHANGED) ---
    if (loading) {
        return <p className="loading-state">Loading user data...</p>;
    }
    if (error) {
        return <p className="status-message error">{error}</p>;
    }

    return (
        <div className="admin-user-management">
            
            {/* --- Dedicated Header Container --- */}
            <div className="dashboard-header">
                {/* Back Button Aligned Left */}
                <button 
                    onClick={handleBack} 
                    className="back-button"
                >
                    &larr; Back to Dashboard
                </button>
                
                {/* Title Aligned Right/Center */}
                <h2 className="dashboard-title">
                    👥 User Management Dashboard
                </h2>
            </div>
            
            {message && (
                <p className={`status-message ${message.startsWith('✅') ? 'success' : 'error'} mb-4 p-3 rounded-lg text-sm font-medium`}>
                    {message}
                </p>
            )}
            
            {/* --- Table Section --- */}
            {users.length === 0 ? (
                <p className="no-users">No users found in the system.</p>
            ) : (
                <div className="table-wrapper">
                    <table className="user-table min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                {/* Use specific CSS classes to control column widths */}
                                <th className="col-profile px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                                <th className="col-name px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="col-email px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="col-phone px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone No.</th>
                                <th className="col-role px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="col-action px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(user => (
                                <tr key={user._id} className="hover:bg-gray-50 transition duration-150">
                                    <td className="col-profile px-6 py-4 whitespace-nowrap">
                                        <img 
                                            src={user.profilePicture 
                                                  ? `${STATIC_BASE_URL}${user.profilePicture}` 
                                                  : 'https://via.placeholder.com/40?text=U'} 
                                            alt={user.name || 'User Profile'} 
                                            className="profile-img h-10 w-10 rounded-full border-2 border-gray-200 object-cover" 
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/40?text=U'; }} 
                                        />
                                    </td>
                                    <td className="col-name px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name || 'N/A'}</td>
                                    <td className="col-email px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td> 
                                    <td className="col-phone px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.phone || 'N/A'}</td> 
                                    <td className="col-role px-6 py-4 whitespace-nowrap">
                                        <span className={`role-badge role-${user.role ? user.role.toLowerCase() : 'user'} inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold`}>
                                            {user.role || 'User'}
                                        </span>
                                    </td>
                                    <td className="col-action px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button 
                                            onClick={() => handleDeleteUser(user._id)} 
                                            className="btn-delete px-4 py-2 rounded-lg text-white font-medium text-sm transition duration-150 ease-in-out shadow-md hover:shadow-lg"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            <style jsx global>{`
                /* GLOBAL BODY STYLE: Forces clean Mint Green background and removes unwanted images/margins */
                html, body {
                    background-color: #ecfdf5 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    min-height: 100vh;
                    overflow-x: hidden;
                    background-image: none !important;
                }

                /* --- Component Styles --- */
                .admin-user-management { 
                    width: 96%; 
                    max-width: 1400px; 
                    margin: 0 auto 40px auto; 
                    padding: 0; 
                    background-color: transparent; 
                    border-radius: 12px; 
                    box-shadow: none; 
                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    color: #374151;
                }

                /* --- HEADER STYLES --- */
                .dashboard-header {
                    background-color: #ffffff; 
                    padding: 24px;
                    border-top-left-radius: 12px;
                    border-top-right-radius: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0; 
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); 
                }

                .dashboard-title {
                    font-size: 1.5rem; 
                    font-weight: 700;
                    color: #1f2937; 
                    margin: 0;
                    padding: 0;
                }

                /* --- TABLE WRAPPER (The Fix Area) --- */
                .table-wrapper {
                    background-color: #ffffff; 
                    border-bottom-left-radius: 12px; 
                    border-bottom-right-radius: 12px; 
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); 
                    border-top: 1px solid #e5e7eb; 
                    max-height: 70vh; 
                    overflow-y: auto; /* This introduces the scrollbar */
                }

                .user-table {
                    /* --- FIX 1: Use fixed layout to force columns to respect total width --- */
                    table-layout: fixed; 
                    width: 100%;
                    border-collapse: collapse;
                    background-color: #ffffff;
                }

                /* --- FIX 2: Define specific column widths to ensure correct spanning --- */
                .col-profile { width: 8%; } /* Smallest for image */
                .col-name { width: 18%; }
                .col-email { width: 25%; } /* Widest for email */
                .col-phone { width: 15%; }
                .col-role { width: 12%; }
                .col-action { width: 15%; } /* Ensure action button fits well */
                
                /* Other Styles (Buttons, Badges) remain unchanged */
                .back-button {
                    background-color: transparent;
                    color: #10b981; 
                    border: 1px solid #10b981;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    transition: all 0.2s;
                    text-decoration: none; 
                    display: flex;
                    align-items: center;
                }
                .back-button:hover {
                    background-color: #d1fae5; 
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .btn-delete { 
                    background-color: #ef4444; 
                    color: white; 
                    padding: 8px 16px; 
                    border: none;
                }
                .btn-delete:hover {
                    background-color: #dc2626; 
                }
                
                .role-admin { background-color: #fee2e2; color: #b91c1c; } 
                .role-collector { background-color: #d1fae5; color: #065f46; } 
                .role-user { background-color: #dbeafe; color: #1e40af; } 
            `}</style>
        </div>
    );
};

export default AdminUserManagement;