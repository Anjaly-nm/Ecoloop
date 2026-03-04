// AdminUserManagement.jsx (or UserManage.js)
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    UserPlus,
    Search,
    Trash2,
    ArrowLeft,
    Mail,
    Phone,
    ShieldCheck,
    UserCircle,
    MoreVertical,
    Filter,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

// --- CONSTANTS ---
const API_BASE_URL = 'http://localhost:4321/api/user';
const STATIC_BASE_URL = 'http://localhost:4321/';

const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const getAuthToken = () => localStorage.getItem('token');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        setMessage('');
        const token = getAuthToken();
        if (!token) {
            setError('Authentication required: Token not found.');
            setLoading(false);
            return;
        }
        try {
            const response = await axios.get(`${API_BASE_URL}/all`, { headers: { token: token } });
            setUsers(response.data);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError(err.response?.data?.message || 'Failed to sync user data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to remove ${user.name || 'this user'}?`)) return;
        setMessage('');
        try {
            const token = getAuthToken();
            await axios.delete(`${API_BASE_URL}/${user._id}`, { headers: { token: token } });
            setUsers(users.filter(u => u._id !== user._id));
            setMessage(`✅ Successfully removed ${user.name}`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(`❌ Error: ${err.response?.data?.message || 'Delete failed'}`);
        }
    };

    const handleBack = () => navigate('/Adminpage');

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleStyles = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'collector': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="mb-4">
                    <Users className="text-purple-600 w-12 h-12" />
                </motion.div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing Intelligence...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-slate-500 hover:text-purple-600 font-bold text-xs uppercase tracking-widest transition-colors mb-4 group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Core
                        </button>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tightest leading-tight flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                <Users className="text-purple-600" size={32} />
                            </div>
                            User Registry
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search identity..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 pr-6 py-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 w-full md:w-80 shadow-sm transition-all font-medium text-sm placeholder:text-slate-400"
                            />
                        </div>
                        <button className="p-3.5 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${message.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}
                        >
                            {message.startsWith('✅') ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {message}
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && (
                    <div className="mb-10 p-10 bg-white rounded-[2.5rem] border border-slate-200 text-center shadow-xl shadow-slate-200/50">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="text-rose-600" size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Sync Failure</h3>
                        <p className="text-slate-500 font-medium mb-8">{error}</p>
                        <button onClick={fetchUsers} className="bg-purple-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200">Retry Sync</button>
                    </div>
                )}

                {/* Users List */}
                {!error && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Identity</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Connect Info</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role Access</th>
                                        <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-20 text-center">
                                                <Users className="text-slate-200 w-16 h-16 mx-auto mb-4" />
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No identities found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <motion.tr
                                                layout
                                                key={user._id}
                                                className="hover:bg-slate-50/50 group transition-all duration-300"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <img
                                                                src={user.profilePicture
                                                                    ? `${STATIC_BASE_URL}${user.profilePicture}`
                                                                    : 'https://via.placeholder.com/100?text=U'}
                                                                alt={user.name}
                                                                className="h-12 w-12 rounded-2xl object-cover shadow-sm ring-2 ring-white group-hover:ring-purple-100 transition-all"
                                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100?text=U'; }}
                                                            />
                                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 leading-tight mb-0.5">{user.name || 'Anonymous'}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tightest">ID: ...{user._id?.slice(-8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-slate-600 font-medium text-xs">
                                                            <Mail size={12} className="text-slate-400" />
                                                            {user.email}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-400 font-medium text-[10px]">
                                                            <Phone size={12} />
                                                            {user.phone || 'No phone'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${getRoleStyles(user.role)}`}>
                                                        <ShieldCheck size={12} />
                                                        {user.role || 'User'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button className="p-2 text-slate-400 hover:text-purple-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 group">
                                                            <UserCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-rose-100"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default AdminUserManagement;
