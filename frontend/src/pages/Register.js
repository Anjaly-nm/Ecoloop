import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, Home, Map, Upload, ArrowRight, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import '../styles/register.css';

// NOTE: Set your API URL here
const API_URL = 'http://localhost:4321/api/user/register';

// 🔑 HARDCODED DEFAULT ROLE
const DEFAULT_ROLE = 'user';

const Registration = () => {
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        houseNumber: '',
        ward: '' // Sent as 'wardNumber' to the backend
    });
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setProfilePictureFile(e.target.files[0]);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMsg(''); // Clear previous errors
        setIsLoading(true);

        // --- VALIDATION ---
        const nameRegex = /^[A-Za-z\s]+$/;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com)$/;
        const passwordRegex = /^.{6,8}$/;
        const phoneRegex = /^\d{10}$/;

        if (!formData.name || !formData.username || !formData.email || !formData.password || !formData.phone || !formData.address || !formData.houseNumber.trim() || !formData.ward.trim()) {
            setErrorMsg('Please fill all required fields, including House Number and Ward.');
            setIsLoading(false);
            return;
        }

        if (!nameRegex.test(formData.name)) {
            setErrorMsg('Name should contain only letters and spaces.');
            setIsLoading(false);
            return;
        }

        if (!emailRegex.test(formData.email)) {
            setErrorMsg('Please provide a valid email (gmail, yahoo, outlook).');
            setIsLoading(false);
            return;
        }

        if (!passwordRegex.test(formData.password)) {
            setErrorMsg('Password must be 6 to 8 characters long.');
            setIsLoading(false);
            return;
        }

        if (!phoneRegex.test(formData.phone)) {
            setErrorMsg('Phone number must be exactly 10 digits.');
            setIsLoading(false);
            return;
        }

        // --- END VALIDATION ---

        // 2. Prepare FormData for submission
        const data = new FormData();

        // Append all text fields
        for (const key in formData) {
            // Rename 'ward' to 'wardNumber' for the backend
            if (key === 'ward') {
                data.append('wardNumber', formData[key]);
            } else {
                data.append(key, formData[key]);
            }
        }

        // 🔑 Append the hardcoded default role
        data.append('role', DEFAULT_ROLE);

        // Append the file
        if (profilePictureFile) {
            data.append('profilePicture', profilePictureFile);
        }

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                body: data,
            });

            const responseData = await res.json();

            if (res.ok) {
                alert(`Registration successful! Your username is: ${responseData.username || formData.username}`);
                // Reset form fields
                setFormData({
                    name: '', username: '', email: '', password: '', phone: '', address: '',
                    houseNumber: '', ward: ''
                });
                setProfilePictureFile(null); // Reset file state
            } else {
                setErrorMsg(responseData.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Error connecting to server:', err);
            setErrorMsg('Error connecting to server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-image" style={{ backgroundImage: "url('/images/y2.jpg')" }}>
                <div className="register-image-content">
                    <h1>Join the Green Revolution</h1>
                    <p>Be part of a community dedicated to a cleaner, greener, and more sustainable future. Every action counts.</p>
                    
                    <ul className="features-list">
                        <li>
                            <div className="circle-check"><Check size={16} /></div>
                            Eco-friendly waste tracking
                        </li>
                        <li>
                            <div className="circle-check"><Check size={16} /></div>
                            Earn rewards for recycling
                        </li>
                        <li>
                            <div className="circle-check"><Check size={16} /></div>
                            Real-time collector updates
                        </li>
                    </ul>
                </div>
            </div>

            <div className="register-form-container">
                <form className="register-form" onSubmit={handleRegister}>
                    <h2>Create <span>Account</span></h2>
                    <p className="form-subtitle">Enter your details to get started with EcoLoop</p>

                    {errorMsg && (
                        <div className="error-message">
                            <AlertCircle size={18} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <div className="form-grid">
                        <div className="form-group full-width">
                            <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
                            <User className="input-icon" />
                        </div>

                        <div className="form-group">
                            <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
                            <User className="input-icon" />
                        </div>

                        <div className="form-group">
                            <input type="tel" name="phone" placeholder="Phone Number (10 digits)" value={formData.phone} onChange={handleChange} maxLength="10" required />
                            <Phone className="input-icon" />
                        </div>

                        <div className="form-group full-width">
                            <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
                            <Mail className="input-icon" />
                        </div>

                        <div className="form-group full-width">
                            <input type="password" name="password" placeholder="Password (6-8 chars)" value={formData.password} onChange={handleChange} required />
                            <Lock className="input-icon" />
                        </div>

                        <div className="form-group full-width">
                            <input type="text" name="address" placeholder="Full Address" value={formData.address} onChange={handleChange} required />
                            <MapPin className="input-icon" />
                        </div>

                        <div className="form-group">
                            <input type="text" name="houseNumber" placeholder="House No." value={formData.houseNumber} onChange={handleChange} required />
                            <Home className="input-icon" />
                        </div>

                        <div className="form-group">
                            <input type="text" name="ward" placeholder="Ward No." value={formData.ward} onChange={handleChange} required />
                            <Map className="input-icon" />
                        </div>

                        <div className="form-group full-width">
                            <div className="file-upload-wrapper">
                                <label htmlFor="profilePicture">
                                    {profilePictureFile ? <ImageIcon className="file-icon" /> : <Upload className="file-icon" />}
                                    <span>{profilePictureFile ? profilePictureFile.name : 'Upload Profile Picture (Optional)'}</span>
                                </label>
                                <input type="file" id="profilePicture" name="profilePicture" onChange={handleFileChange} accept="image/*" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-register" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                        {!isLoading && <ArrowRight size={20} />}
                    </button>

                    <p className="login-link">
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Registration;